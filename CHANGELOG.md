# 更新日志

本项目的版本号遵循语义化版本。npm 上每个版本对应仓库中的同名 tag。

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
