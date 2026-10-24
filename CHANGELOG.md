# 更新日志

本项目的版本号遵循语义化版本。npm 上每个版本对应仓库中的同名 tag。

## 1.6.2

### 修复

- **`update` 仍不补装 `literature-review`**：1.6.1 用 manifest 的 version 判断是否需要补装，
  但早期版本会把 version 写成新版却漏装文件，结果版本号对得上就永远跳过。
  改成**看磁盘上到底有没有**这个 skill，只要缺、且对应的 `thesis-writer` 已安装，就补上。
- `uninstall` 现在会同步写回安装记录，避免下次 `update` 把刚删掉的 skill 装回来。

## 1.6.1

### 修复

- **老用户 `update` 补不上新增的核心 skill**。以前只按安装记录里那批 skill 重装，
  1.5.x 升上来的用户永远拿不到 `literature-review`；现在按 `CORE_ADDED_IN` 记录
  逐版补装，并在输出里明确列出新增项。用 `--only` 装单个 skill 的不会被一口气装满。
- README 补充 npx 缓存提示：`npx graduation-kit` 会复用 `~/.npm/_npx` 里的旧版本，
  升级要写 `npx graduation-kit@latest update`。

## 1.6.0

### 新增

- **`literature-review` skill**：专管文献的真实检索与核验。按 Crossref / OpenAlex /
  Semantic Scholar / PubMed / arXiv / CNKI 等真实源检索，逐条核对标题、作者、年份、DOI，
  产出 `docs/thesis/refs-source.json`；配套 `verify-refs.mjs` 联网复核（DOI 解析、标题相似度、
  年份比对、链接可达性），查不到就判失败。随核心 skill 一起安装，是 `thesis-writer` 的前置依赖。
- **引用硬约束**：全文 ≥ 22 条；英文 ≥ 6 条且附中文译名；中文 ≥ 15 条；`scope` 为
  `domain`（主题/业务）与 `tech`（技术）的各 ≥ 5 条；一句只引一条、一条只引一次、
  正文首现编号严格 `1 → 2 → … → N`。`check-refs.mjs` 全部纳入校验，配额可在
  `refs-source.json` 里用 `minReferences` / `minEnglish` / `minChinese` / `minPerScope` 覆盖。
- **检索不到就报缺**：不够配额时写 `docs/thesis/refs-gaps.md`，列出缺口与下一轮检索关键词，
  禁止用不相关文献凑数。
- `triggers.yaml` 增加 `literature-review` 路由（找文献 / 核实文献真假），并补了 3 条回归用例。

### 变更

- **skill 自动串联**：`triggers.yaml` 新增 `pipelines`（build / thesis / defense），命中入口后
  按链路自己往下跑，不再要求用户把步骤拆开。说“写论文”就直接走
  `literature-review` → `thesis-writer` → 两个校验脚本 → 转 Word；说“做毕设”就一路跑到
  需求、建表、接口、风格、代码、审查、论文。只有需求确认单、风格方案、文献补不齐三处停下来问。
- `graduation-project` 新增「阶段 0 之前：自动编排」：跨 skill 的硬约束不能跳，收尾主动衔接论文。
- `thesis-writer` 新增「自动编排」小节：文献不自备就先去补，表结构/接口从代码里读，不反问用户。
- `literature-review` 补齐后直接交回调用方，不再等用户发下一步指令。
- `thesis-writer`：铁律第 1 条改为“真实检索 + 配额硬性”，引用规则拆成
  「检索核验」与「标注校验」两步，文件索引补上 `literature-review`。
- 核心 skill 从 6 个增加到 7 个，`create` / `install` 默认一并安装。
- `scripts/test-check-refs.mjs` 的合规用例改为按 22 条配额生成，并新增配额、顺序、`scope` 四类反例。

### 移动端脚手架（react-native）

- **`create` 可以选择 `--fe react-native`**：复制 `clients/react-native/`，按所选后端写入 `.env`
  （`EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_STATIC_BASE_URL`），开发端口固定 8090。
  生成的 README、启动提示、FAQ 都跟着带上了 Expo Go 与真机 IP 说明。
- 目录从 `clients/rn` 改为 `clients/react-native`，页面只保留 `src/app/` 一套路由目录。
- 升级到 Expo SDK 58 / RN 0.88，组件库从 React Native Paper 换成 HeroUI Native，样式改用 Uniwind。
- 新增 `src/theme/`（`tokens.css` / `typography.css` / `layout.css` / `tabbar.css`），
  导航栏、全局排版、底部 Tab 的样式全部抽成 CSS。
- 内置 Noto Sans SC（400/700），字形不跟随手机系统字体；关掉 `allowFontScaling` 防止超大字号挤坏版式。
- 「我的」改为用户中心导航页，个人资料 / 修改密码 / 用户协议 / 隐私政策 / 关于应用均为二级页。
- 新增统一 `showToast()` 与 `ConfirmDialog`，不再用系统 `Alert`。
- 头像上传改用 `expo-file-system` 的 `File.upload`，绕开 RN 对 FormData 文件的限制。
- 新增 `useKeyboardAwareScroll`，表单页键盘弹出时自动把输入框滚到键盘上方。

## 1.5.1

### 新增

- 新增 **`package`（别名 `deliver`）交付打包命令**：只把前端、后端、文档、上传目录和
  本地数据库打进 zip，去掉 `node_modules`、`target`、`dist`、`unpackage`、`__pycache__`、
  `bin`/`obj`、`.git`、`.agents` 与日志。
- 数据库优先用本机 `mysqldump` 全量导出（结构 + 数据 + `CREATE DATABASE` + `USE`），
  客户导入即可迁移；没装客户端或连不上库时退回 `docs/` 建表脚本并明确告警。
  支持 `--db-file` 指定现成 SQL、`--no-db` 只打代码、`--out` 指定输出路径。
- 打包内置零依赖 ZIP 写入器，不新增运行依赖；Windows 下会自动扫 `C:/Program Files/MySQL`、
  `D:/mysql`、XAMPP、phpStudy 等常见 `mysqldump` 安装位置。
- 数据库导出文件旁附 `database/README.txt`，写明导入命令与 utf8mb4 字符集要求；
  同时把原 `docs/` 里的脚手架 SQL 移出交付包，避免客户导错文件。
- **创建时可直接导入本地 MySQL**：交互向导默认询问，非交互加 `--import-db`。
  沿用 `--db-pass`，地址/用户/端口可用 `--db-host` / `--db-user` / `--db-port` 覆盖；
  没装客户端或连接失败时继续生成项目，并给出针对性的排查提示。
- **创建时可选 Redis**：`--redis` 会检测 `redis-cli`、`redis-server` 与端口连通性；
  环境可用就确认版本，未就绪就按 Windows / macOS / Linux 给出安装与启动命令，
  并把连接信息、检测结果和安装步骤写入 `docs/redis.md`。
- **项目根自动生成 `package-delivery.bat`**：双击即可调用 `graduation-kit package .`，
  优先用全局 CLI，找不到再走 `npx`，支持继续传入 `--no-db` 等参数。
- **重写生成项目的 README**：补上环境要求、分步使用说明、前后端常用命令，
  以及 `package` / `install` / `update` / `verify` / `doctor` 等命令速查；
  uni-app 的运行方式改为 HBuilderX，不再给出不存在的 npm 命令。
- **生成的文档与代码全部跟随所选技术栈**：环境要求、启动命令、常用命令、
  常见问题、目录说明、关于页技术栈标签、前端配置注释都不再硬编码 Express / 8080-8082。

### 调整

- **`create` 增加 skills 冲突校验**：全局 `~/.agents/skills/` 已装齐 6 个核心 skill 时，
  默认不再往新项目里重复装一份；项目内已有 skills 时也不覆盖。
  需要项目内独立一份用 `--local-skills`，需要覆盖已有用 `--force-skills`，不装用 `--no-skills`。
- **前端静态资源改为二级分类目录**：`static/tab/` 放导航图标，`static/avatar/` 放默认头像，
  Web 前端统一为 `src/assets/images/` 与 `src/assets/icons/`。
  新增 `utils/assets.js`（taro 为 `src/assets/index.js`）集中登记路径，页面不再写死 `/static/xxx.png`。
- 清理三个 Web 前端与 demo 模板中从未被引用的 `hero.png`、`vite.svg`、`vue.svg`、
  `logo.svg`、`empty.svg`、`default-avatar.png` 残留文件。
- `smoke` 增加静态资源目录与交付包结构校验。

## 1.5.0

### 新增

- 新增 **Taro 4 + Vue 3 移动端脚手架**（`--fe taro`），支持 H5 与微信小程序。
  包含登录/注册（图形验证码）、首页、公告列表与详情、个人中心、资料编辑、
  头像上传，接口路径与 `{code, message, data}` 协议与其余前端一致。
- Taro 版使用 Webpack5 + Sass、`@/` 别名、Vue 3 `reactive` 单例 Store，
  不依赖 Pinia 与 Vue Router；tabBar 图标随脚手架分发。
- **uniapp / taro 的底部导航改为自绘 `components/TabBar.vue`**，移除原生 tabBar 配置，
  样式、图标与安全区留白完全可控，页面用 `reLaunch` 切换。
- **移动端新增通用页面**：设置页、独立修改密码页、关于我们、用户协议/隐私政策、
  消息中心（含全部/未读筛选、全部已读、消息详情）。消息与设置开关目前为前端 mock，
  已读状态存本地缓存，接后端时只换数据源。
- 移动端视觉统一：修改密码入口放到「我的」，所有表单 input 统一为搜索框同款白底胶囊；
  关于页去掉蓝紫渐变，改为全局白卡 + 主色点缀。

### 重构

- **三个移动端脚手架的样式改为分层复用**：设计变量、mixin、公共类、页面样式分开存放。
  uniapp 的变量与 mixin 放在 `uni.scss`（会被整份注入每个样式块），公共类在 `common/styles/common.scss`；
  taro 为 `src/styles/`（`config/index.js` 的 `sass.resource` 注入），wxapp 为 `styles/common.wxss`（CSS 变量）。
  页面只写自己特有的布局，不再逐页复制 `.container` `.card` `.btn-primary` `.input`
  `.form-item` 等公共块；wxapp 的 wxml 内联样式同时换成工具类。
- **三个移动端脚手架增加尺寸与溢出硬约束**：`page` / `.container` 禁止横向溢出，
  全局 `box-sizing: border-box` 与 `max-width: 100%`，图片不撑破容器，长文本自动断行，
  flex 文本子项 `min-width: 0`，tabBar 底部留白包含安全区，弹窗和按钮限制最大宽度。
- **TabBar / NavBar 自带等高占位块**：挂载后测量固定栏真实高度写回占位块，
  图标、字号或安全区变化时页面留白自动跟随，页面不再手写 `padding-top` / `padding-bottom`。

### 修复

- CI 的 Thesis converter 任务补装 `PyYAML`，修复 frontmatter 校验步骤 `ModuleNotFoundError: No module named 'yaml'`。
- 公告列表的搜索增加明确的「搜索」按钮（H5 上只靠键盘回车很容易没反应），
  并在搜索时清空旧列表、重置分页，避免出现「点了搜索但列表没变化」。
- uniapp 的 H5 不再使用 `/api` 代理：项目根的 `api/` 源码目录会与代理前缀冲突，
  浏览器把 `@/api/notice` 请求成 `/api/notice.js` 时被转发到后端，导致页面动态导入 404。
  H5 改为直连后端（CORS 已开启）。
- `copyTree` 跳过 `node_modules`、`unpackage`、`dist`、`build` 等目录，
  生成项目不再携带带绝对路径的旧 Vite 缓存。
- smoke 增加全部前端的生成与端口改写校验；CI 增加 Taro H5 与微信小程序构建。

### 文档

- `crossplatform-standards.md` 补充 Taro 章节（目录、页面配置、生命周期、事件、构建）。
- 前端数量与选型说明更新为 7 个。

## 1.4.2

### 修复

- 修正 `description` 里未转义的英文冒号。它会让编辑器按 YAML 解析 frontmatter 时失败，
  表现为 `Invalid YAML frontmatter`、skill 无法加载。
- `doctor` 新增检查：frontmatter 单行值里出现 `: ` 直接报错；CI 增加真实 YAML 解析。

## 1.4.1

### 新增

- `graduation-kit update` / `update -g`：按 `.graduation-kit.json` 的安装记录更新
  当初装过的那批 skill，不再需要记 `install -f`。
- 版本门禁与升级提示统一改为 `npx graduation-kit update`。

### 注意

- `update` 会用包内版本覆盖本地改动，不做备份；改过 skill 需要保留时先自行复制。

## 1.4.0

### 新增

- **参考文献自动化**：论文可检索并引用近五年中英文文献，正文必须带 `[n]` 标注；
  英文文献必须附中文译名。引用来源、原文摘录与链接记录在 `docs/thesis/refs-source.json`。
- **引用校验脚本** `reference/check-refs.mjs`：检查序号连续性、是否重复引用、
  一句话多引用、近五年限制、英文文献译名与来源证据。
- **系统截图自动化** `reference/screenshot.mjs`：用本机 Chrome/Edge 登录并逐页截图，
  输出到 `docs/thesis/images/`，支持视口、缩放、等待时间与单页重拍。
- **Word 自动嵌图**：转换器把图注上方的图片按版心宽度等比缩放后插入，
  不再需要手动插图。
- **触发评测** `npm run eval`：34 条中英文固定 prompt 回归路由表，
  防止改关键词时把别的 skill 顶掉。
- **GitHub Actions**：Node 18/20/22 跑 `doctor`、触发评测、脚手架 smoke，
  另有一条 Python job 校验转换器能嵌入图片。

### 变更

- **中英文关键词**：`triggers.yaml` 与各 skill 的 `description` 补充英文触发词，
  `review code`、`design API`、`add endpoint`、`write thesis` 等可直接命中。
- **路由优先级**：有 `strong` 命中的 skill 优先于只有 `weak` 的，
  避免 `graduation-project` 靠"毕设"这个弱词抢走所有子任务。
- 论文不再禁止参考文献，改为强制可追溯引用。

## 1.3.1

### 修复

- 安装到共享 skills 目录时，`.graduation-kit.json` 不再把其他工具安装的
  skill（如 chakra-ui-*、find-skills）记为本工具管理。

## 1.3.0

### 新增

- **更新门禁**：安装时写入 `.agents/skills/.graduation-kit.json`；
  npm 有新版本时 `create` 拒绝执行，本地 skills 过期时给出升级命令。
- `npx graduation-kit -v` 输出当前版本。
- `--skip-version-check` 与 `GRADUATION_KIT_SKIP_UPDATE=1` 可跳过门禁。
- 离线时门禁自动放行，不阻塞命令。

## 1.2.0

### 新增

- **关键词触发路由** `triggers.yaml` 与按需加载的 `triggers.scenes.yaml`。
- **范围门禁**：6 个毕设专用 skill 在 `description` 开头声明适用范围，
  非毕设项目不应加载。
- **绘图工作副本** `reference/copy-template.mjs`：先把模板复制到
  `docs/thesis/figure-kit/` 再编辑，`--force` 保留已改的 `data/`。
- `doctor` 校验触发路由覆盖率与版本一致性。

## 1.1.6

- 修复 npm 打包时把嵌套 `node_modules` 带入发布包。
