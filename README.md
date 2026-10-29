# graduation-kit

毕业设计一件套：一条命令生成完整项目（后端 + 前端 + 数据库 + 文档），再配一套**能自己串起来的 AI Agent Skills**——说一句"帮我做毕设"或"写第三章"，从需求、建表、接口、代码、审查到论文和文献，按顺序自己往下跑。

## 3 分钟上手

### 第 1 步：生成项目

需要 Node.js 18+。

```bash
npx graduation-kit create

# 跳过交互，直接指定技术栈
npx graduation-kit create my-project --be springboot --fe vue-antd --db my_db

# 顺便导入本地 MySQL，并声明项目用 Redis
npx graduation-kit create my-project --be springboot --fe vue-antd --db my_db \
  --db-pass 123456 --import-db --redis
```

生成后跑起来：

```bash
mysql -uroot -p < docs/你的库名.sql        # 没自动导入时手动导入
cd backend  && mvn spring-boot:run         # 端口 8080
cd frontend && npm install && npm run dev   # 另开终端
```

浏览器打开前端地址，用 `admin / 123456` 登录。

创建时只会问两件与项目有关的事：**要不要直接导入本地 MySQL**、**用不用 Redis**（选了会检测环境，结果写进 `docs/redis.md`）。项目根会生成 `package-delivery.bat`，双击即可打交付包。

### 第 2 步：装 Skills

需要支持 `.agents/skills/` 的编辑器（Zed、Cursor 等）。

```bash
install-skills.bat        # Windows：双击，或命令行运行
bash install-skills.sh    # macOS / Linux
```

等价的命令行写法：

```bash
npx graduation-kit install        # 只装进当前项目
npx graduation-kit install -g     # 装到全局，所有项目可用
```

`create` 会顺带装一遍：全局已装齐 7 个核心 skill 就不再重复装，项目里已有也不覆盖。需要强制装一份加 `--local-skills`，需要覆盖加 `--force-skills`，不装加 `--no-skills`。

### 第 3 步：新建会话，直接说要干什么

不用点名 skill，也不用自己拆步骤。

| 你说 | 它自己往下做的事 | 停下来问你的地方 |
|---|---|---|
| 我毕设题目是图书馆管理系统，帮我开工 | 需求确认 → 建表 → 接口 → 风格 → 代码 → 逐模块审查 | 需求确认单、风格方案 |
| 写第三章 | 补文献 → 写正文 → 引用校验 → 转 Word | 章节范围没给、文献补不齐 |
| 答辩前帮我看看 | 代码审查 → 项目自检 → 论文引用复核 | 无 |
| 帮我找文献 | 真实检索 → 逐条核验 → 写出 `refs-source.json` | 配额补不齐时报缺口 |

## Skills 怎么用

### 一句话触发，剩下的自己串

命中入口后，skill 会按 `triggers.yaml` 的 `pipelines` 自己往下走，不需要你一步步点名：

| 入口 | 自动链路 |
|---|---|
| 做毕设 / 开工 / 加模块 | `feature-forge` → `database-designer` → `api-designer` → `impeccable` → `graduation-project` → `code-reviewer` → `thesis-writer` |
| 写论文 / 写第X章 / 写摘要 | `literature-review`（缺文献先补）→ `thesis-writer` → `verify-refs` → `check-refs` → 转 Word |
| 答辩前 | `code-reviewer` → `graduation-project` 自检 → `thesis-writer` 引用复核 |

跨 skill 的硬约束也不能跳：没建表不写实体，没接口清单不写前端 API，没过 `code-reviewer` 不算这一模块完成，没全绿的文献清单不写带引用的章节。

### 只在这三处停下来问你

1. **需求确认单**——功能边界要你点头，确认前不写业务代码。
2. **风格方案**——给你 2–3 个对比卡片选一个，之后配色锁定。
3. **文献补不齐**——按 22 条的硬配额报缺口，给出下一轮检索关键词，不会拿不相关的文献凑数。

其余环节（表名、字段、接口路径、目录结构、编号顺序）自己定，不再反问。

### 只想改一小块也直接说

| 你说 | 只加载 |
|---|---|
| 给订单表加个索引 | `database-designer` |
| 这个接口返回结构不对 | `api-designer` |
| 这段代码导师会不会挑刺 | `code-reviewer` |
| 界面太乱，重新排版 | `impeccable` |
| 参考文献是不是编的 | `literature-review` |

局部改动不会被升级成整条链，但说完会提醒你影响了哪些下游产物（比如改了表结构，要同步实体、接口和论文的数据字典）。

### 论文与文献的硬性规则

- 文献只能来自真实检索（Crossref / OpenAlex / Semantic Scholar / PubMed / arXiv / CNKI），`verify-refs.mjs` 会联网核验，查不到的 DOI 直接判失败
- 配额：**≥ 22 条，英文 ≥ 6，中文 ≥ 15，主题类与技术类各 ≥ 5**
- 正文 **一句只引一条、一条只引一次**，编号按出现顺序**严格 `1 → 2 → … → N`**
- 引用必须撑住那句话的观点，不能给空话挂引用
- 检索不到就如实报缺，写进 `docs/thesis/refs-gaps.md`，不编造

### 装在哪、会不会误触发

默认（不带 `-g`）是**项目级**，装进 `<项目>/.agents/skills/`，其他项目看不到。`install-skills.bat` / `.sh` 带的是 `-g`，图省事，代价是全局可见。

全局安装时做了两层软隔离：7 个毕设 skill 的 `description` 开头声明"非毕设项目不要加载"，`triggers.yaml` 的 `scope` 门禁要求先判断项目类型。**要硬隔离**就二选一：

```bash
npx graduation-kit uninstall -g                                  # 从全局移除，只装进毕设项目
npx graduation-kit install -g --only impeccable                  # 全局只留通用 skill
```

### 升级

```bash
npx graduation-kit@latest update        # 项目内，按安装记录更新
npx graduation-kit@latest update -g     # 全局
npx graduation-kit@latest install -g --reinstall   # 不比对内容，强制重拷
```

> `update` 会用包内版本覆盖本地改动，不做备份。
>
> **一定要加 `@latest`**：`npx graduation-kit` 会复用 `~/.npm/_npx` 里的旧版本，
> 哪怕 npm 上已经更新了，拿到的还是上次那个，结果就是每条都显示“本地已是同一份”。
> 仍不对就先清缓存：`npx clear-npx-cache`。

安装时会在 `.agents/skills/.graduation-kit.json` 写版本标记：本地版本落后时 CLI 警告、agent 加载 skill 时直接停用；注册表有新版时 `create` 会拒绝执行。跳过检查加 `--skip-version-check`。

### 画论文图之前先复制模板

`thesis-writer` 里的绘图模板是只读的，先复制到工作目录再改：

```bash
node .agents/skills/thesis-writer/reference/copy-template.mjs
# → docs/thesis/figure-kit/
```

之后所有改图、校验、导出都在 `figure-kit/` 里做，升级 skill 不会冲掉你的图。

## 技术栈

**后端（选一个）**

| 选项 | 技术栈 | 端口 |
|---|---|---|
| `springboot` | Java 17 + MyBatis-Plus | 8080 |
| `springboot-wxapp` | Java 17 + MyBatis-Plus（小程序专用，带微信登录与 `openid`） | 8080 |
| `express` | Node.js + mysql2 | 8081 |
| `flask` | Python + PyMySQL | 8082 |
| `go` | Gin + database/sql | 8084 |
| `dotnet` | ASP.NET Core + MySql.Data | 8085 |

**前端（可多选）**

| 选项 | 技术栈 | 端口 |
|---|---|---|
| `react` | React 18 + 自研组件 | 5176 |
| `vue-antd` | Vue 3 + Ant Design Vue | 5174 |
| `vue-elementplus` | Vue 3 + Element Plus | 5175 |
| `vue-naive` | Vue 3 + Naive UI（含暗色模式） | 5177 |
| `react-native` | React Native · Expo SDK 58 + HeroUI Native（手机 App，Expo Go 扫码调试） | 8090 |
| `uniapp` | uni-app 跨端（H5 / 小程序 / App） | - |
| `taro` | Taro 4 + Vue 3（H5 / 微信小程序） | 10086 |
| `wxapp` | 微信小程序原生 + TDesign | - |

推荐 `springboot` + `vue-antd`。查看全部选项：`npx graduation-kit create --list`。

`springboot-wxapp` 只配**原生小程序**（`--fe wxapp`）：多一个 `openid` 字段和 `POST /api/user/wxLogin`，建库脚本自动用 `scaffold_db_wxapp.sql`。
创建时会问 AppID / AppSecret 并直接写进 `backend/src/main/resources/application.yml` 和小程序的 `project.config.json`（也可用 `--appid` / `--secret` 提前给）：

```bash
npx graduation-kit create mini --be springboot-wxapp --fe wxapp --db wxapp_db --appid wx1234567890abcdef --secret 你的AppSecret
```

`react-native` 会把后端地址写进项目根的 `.env`，开发端口固定 8090（避开 express 的 8081）。真机调试时把 `.env` 里的 `localhost` 改成电脑局域网 IP。

## 模板

生成的项目默认带注册登录、JWT、角色权限、用户管理、公告、操作日志、文件上传、个人中心和数据看板。

| 模板 | 额外包含 |
|---|---|
| `clean`（默认） | 只有上面这些基础功能 |
| `trade` | 商家入驻、商品管理、购物车、订单流程、支付退款 |
| `booking` | 服务机构、服务项目、时段排班、预约管理、到店核销、评价 |
| `agent` | 大模型配置、拖拽编排智能体、知识库检索、流式对话（需自备 API Key） |

```bash
npx graduation-kit create my-shop --template trade --db shop_db
```

## 打包交给老师 / 客户

```bash
npx graduation-kit package ./my-project
# → my-project-delivery.zip
```

包里是源码 + `database/<库名>.sql`（结构 + 数据，自带 `CREATE DATABASE`）、`docs/`、`uploads/` 和导入说明；自动排除 `node_modules`、`target`、`dist`、`.agents`、日志等。没装 `mysqldump` 或连不上库时会退回 `docs/` 里的建表脚本并告警。

## 常见问题

**后端报数据库连接失败** — 确认 SQL 已导入，密码与 `backend/.env`（或 `application.yml`）一致。

**前端头像 404** — 头像是走后端 `/uploads` 的，先确认后端已启动。

**小程序真机请求失败** — 手机访问不了 `localhost`，把 `config/index.js` 里的 `LAN_HOST` 改成电脑局域网 IP。

**升级后还是旧版本** — 跑 `npx graduation-kit@latest update`；仍不行就先 `npx clear-npx-cache`。

## 命令速查

```bash
npx graduation-kit create [名称]     # 生成项目（向导）
npx graduation-kit create --list     # 列出后端 / 前端 / 模板
npx graduation-kit install [-g]      # 装 skills（项目级 / 全局）
npx graduation-kit update [-g]       # 更新 skills
npx graduation-kit uninstall [-g]    # 移除 skills
npx graduation-kit verify [目录]     # 校验项目结构
npx graduation-kit package [目录]    # 打交付包
npx graduation-kit diagnose          # 诊断环境
npx graduation-kit doctor            # 校验 skill frontmatter（开发者）
npx graduation-kit list              # 列出包内 skill
```

## 仓库与许可

- GitHub：https://github.com/Soulmte/graduation-kit
- Gitee：https://gitee.com/rain-drops/graduation-kit
- MIT License，第三方组件归属见 `NOTICE.md`
