# graduation-kit

毕业设计一件套：一条命令生成完整项目（后端 + 前端 + 数据库 + 文档），附赠从需求到答辩的 AI Agent Skills。

## 快速开始

### 方式 1：在线生成器（推荐）

打开网页填表单，下载 zip 解压即用：

**在线生成器**: https://d295bv.gicp.fun/ （⚠️ 更新后网址可能变化）

填写项目名、选择技术栈（后端/前端）、配置数据库，点击生成即可下载。解压后：

```bash
# 1. 导入数据库
mysql -uroot -p < docs/你的库名.sql

# 2. 启动后端（以 Spring Boot 为例）
cd backend
mvn spring-boot:run

# 3. 启动前端（另开终端）
cd frontend
npm install && npm run dev

# 4. 浏览器访问前端地址，用 admin/123456 登录
```

### 方式 2：命令行生成

需要 Node.js 18+：

```bash
npx graduation-kit create

# 或指定参数跳过交互
npx graduation-kit create my-project --be springboot --fe vue-antd --db my_db

# 生成后直接导入本地 MySQL，并声明项目使用 Redis
npx graduation-kit create my-project --be springboot --fe vue-antd --db my_db \
  --db-pass 123456 --import-db --redis
```

创建时会问两件事：

- **是否直接导入本地 MySQL**（交互默认是，非交互加 `--import-db`）。密码沿用 `--db-pass`，地址/用户/端口可用 `--db-host` / `--db-user` / `--db-port` 覆盖。没装 `mysql` 客户端或连不上时会继续生成项目，并打印手动导入命令与排查提示。
- **是否使用 Redis**（`--redis`）。选了会检测 `redis-cli`、`redis-server` 与 6379 端口；环境齐全就确认可用，没装就按当前系统打印安装/启动命令，检测结果写进项目里的 `docs/redis.md`。Redis 有密码时交互模式会追问，非交互用 `--redis-pass`。

项目根会生成 `package-delivery.bat`，双击即可打交付包。

## 技术栈选项

**后端（选一个）**：

| 选项 | 技术栈 | 端口 |
|---|---|---|
| `springboot` | Java 17 + MyBatis-Plus | 8080 |
| `express` | Node.js + mysql2 | 8081 |
| `flask` | Python + PyMySQL | 8082 |
| `go` | Go + database/sql | 8084 |
| `dotnet` | .NET 10 + MySql.Data | 8085 |

**前端（可多选）**：

| 选项 | 技术栈 | 端口 |
|---|---|---|
| `react` | React 18 + 自研组件 | 5176 |
| `vue-elementplus` | Vue 3 + Element Plus | 5175 |
| `vue-antd` | Vue 3 + Ant Design Vue | 5174 |
| `vue-naive` | Vue 3 + Naive UI | 5177 |
| `uniapp` | uni-app 跨端 | - |
| `taro` | Taro 4 + Vue 3（H5 / 微信小程序） | 10086 |
| `wxapp` | 微信小程序原生 | - |

**推荐组合**：`springboot` + `vue-antd`（企业级主流，面试认可度高）

## 内置功能

生成的项目已包含：

- ✅ **用户管理**：注册、登录、JWT 认证、角色权限
- ✅ **公告管理**：增删改查、富文本编辑
- ✅ **操作日志**：自动记录关键操作
- ✅ **文件上传**：头像、图片上传
- ✅ **仪表盘**：数据统计、图表展示
- ✅ **个人中心**：修改密码、更新资料

## 可选模板

### `clean`（默认）
干净脚手架，只包含上述基础功能。

### `trade`（交易系统）
额外包含：商家入驻、商品管理、购物车、订单流程、支付退款。

```bash
npx graduation-kit create my-shop --template trade --db shop_db
```

### `booking`（预约系统）
额外包含：服务机构、服务项目、时段排班、预约管理、到店核销、评价系统。

```bash
npx graduation-kit create my-booking --template booking --db booking_db
```

### `agent`（AI 智能体）
额外包含：大模型配置、拖拽编排智能体、知识库检索、流式对话。需自备 API Key（DeepSeek / Ollama）。

```bash
npx graduation-kit create rent-agent --template agent --db agent_db
```

## 交付打包

项目开发完要发给客户（不是上线部署）时，用 `package` 打一个干净包：

```bash
npx graduation-kit package ./my-project
# → my-project-delivery.zip
```

项目根已经带了 `package-delivery.bat`，双击等价于上面的命令，也可以在后面接参数（如 `package-delivery.bat --no-db`）。

包内只有源码和本地库：

- `backend/`、`frontend-*/`、`docs/`、`uploads/`、`README.md`
- `database/<库名>.sql`：本地库的**结构 + 数据**全量导出，文件里自带 `CREATE DATABASE` 与 `USE`，客户直接导入即可
- `database/README.txt`：导入步骤与字符集说明

会被排除：`node_modules`、`target`、`dist`、`unpackage`、`__pycache__`、`bin`/`obj`、`.git`、`.agents`、编辑器目录、日志。

数据库连接信息默认从 `backend/.env` 或 `application.yml` 读，命令行参数可覆盖：

```bash
npx graduation-kit package ./my-project --db-pass 123456 --db-port 3306
npx graduation-kit package ./my-project --db-file ./backup.sql   # 直接用已导出的 SQL
npx graduation-kit package ./my-project --no-db                  # 只打代码
npx graduation-kit package ./my-project --out ./交付包.zip
```

没装 MySQL 客户端或连不上库时，会退回 `docs/` 里的建表脚本并明确告警（此时不包含本地开发新增的数据）。

## Agent Skills（可选）

生成项目后可安装 AI 辅助工具（需支持 `.agents/skills/` 的编辑器，如 Zed、Cursor）：

**Windows**：双击 `install-skills.bat`  
**Mac/Linux**：运行 `bash install-skills.sh`

`create` 会先检查 skills 的现状：全局 `~/.agents/skills/` 已装齐 6 个核心 skill 时，默认不再往新项目里重复装一份；项目内已有 skills 时也不覆盖。需要在项目内单独装一份加 `--local-skills`，需要覆盖项目内已有的加 `--force-skills`，什么都不装加 `--no-skills`。

包含 6 个 Skills：

- `graduation-project` - 五阶段全流程编排
- `thesis-writer` - 论文写作、文献引用、插图绘制、自动截图、Markdown 转 Word
- `feature-forge` - 需求访谈、功能边界划分
- `database-designer` - 建表设计、ER 图、索引优化
- `api-designer` - RESTful 接口设计、错误码规范
- `code-reviewer` - 代码审查、安全检查

安装后新建 Agent 会话，直接说需求即可（如"我毕设题目是图书馆管理系统，帮我开工"）。

### 关键词触发（按需加载）

技能不会一上来就全加载。安装时会在 `.agents/skills/` 下落两张表：

| 文件 | 体积 | 什么时候读 |
|---|---|---|
| `triggers.yaml` | 约 1.4k tokens | 进入毕设流程时读一次，决定加载哪个 skill |
| `triggers.scenes.yaml` | 约 2.1k tokens | 只在两个 skill 拿不准时才读 |

常驻开销不变：编辑器只把每个 skill 的 `name` + `description` 放进上下文，
触发词不堆在 frontmatter 里，避免重复占 token。

- 强关键词命中 1 个即激活；弱关键词需命中 2 个，或配合“毕设/论文”等领域词
- `not_for` 命中时一律不激活，比如“写论文”不会拉起 `graduation-project`
- 多个 skill 同时命中时按 `priority` 串行，不一次性读完整套

比如同是“毕设”两个字：说“帮我开工/加个模块”走 `graduation-project`；
说“写第三章/画 ER 图”走 `thesis-writer`；说“界面太乱”走 `impeccable`。

中英文都支持：`review code`、`design API`、`add endpoint`、`write thesis`、
`create table` 同样能命中对应 skill。

### 更新门禁

安装时会在 `.agents/skills/.graduation-kit.json` 写入版本标记。CLI 与 agent 都会检查：

| 检查 | 行为 |
|---|---|
| 注册表有新版 CLI | `create` **拒绝执行**，提示 `npx graduation-kit@latest create` |
| 本地 skills 版本落后 | CLI 警告；agent 加载 skill 时直接停用 |
| 无法联网查版本 | 不拦（当作已是最新） |

```json
{ "name": "graduation-kit", "version": "1.3.0", "skills": ["..."] }
```

跳过检查：加 `--skip-version-check`，或设环境变量 `GRADUATION_KIT_SKIP_UPDATE=1`。
查看版本：`npx graduation-kit -v`。

### 会影响其他项目吗？

**全局安装（`-g`）会影响。** 装到 `~/.agents/skills/` 后，所有项目都能看到这几个 skill 的
`description`，agent 可能误选。目前做了两层**软隔离**：

- 6 个毕设专用 skill 的 `description` 开头声明“仅用于毕业设计项目，非毕设项目不要加载”
- `triggers.yaml` 的 `scope` 门禁要求先判断项目类型，判断不了先问

但这是提示，不是强制。**要硬隔离，二选一：**

```bash
# 方式一（推荐）：从全局移除，只装进毕设项目
npx graduation-kit uninstall -g
npx graduation-kit install -d D:/my-graduation-project

# 方式二：只装不会误触发的通用能力
npx graduation-kit install -g --only impeccable
```

默认的 `install`（不带 `-g`）就是**项目级**，装进 `<项目>/.agents/skills/`，
其他项目看不到。`install-skills.bat` / `install-skills.sh` 带的是 `-g`，
图省事方便，代价就是全局可见。

`impeccable` 是通用前端设计 skill，不属于毕设专用，装全局不会影响其他项目。

### 绘图模板先复制再用

`thesis-writer` 里的绘图模板是只读的。画图前先复制到项目工作目录：

```bash
node .agents/skills/thesis-writer/reference/copy-template.mjs
# → docs/thesis/figure-kit/
```

所有改图、跑校验、导出都在 `figure-kit/` 里做，升级 skill 不会冲掉你的图。

## 常见问题

**Q: 启动后端报数据库连接失败？**  
A: 确保已导入 SQL 文件，并检查 `backend/.env` 或 `application.yml` 中的数据库密码是否正确。

**Q: 前端头像图片 404？**  
A: 头像路径通过 Vite 代理转发到后端，确保后端已启动。

**Q: 小程序真机调试请求失败？**  
A: 手机访问不了 `localhost`，需修改 `config/index.js` 中的 `LAN_HOST` 为电脑局域网 IP。

**Q: 端口被占用？**  
A: 修改后端配置文件（`.env` 或 `application.yml`）和前端 `.env.development` 中的端口号。

**Q: 升级后还是旧版本？**
A: 直接跑更新命令：`npx graduation-kit@latest update`（全局安装加 `-g`）。它会按安装记录更新当初装的那批 skill，已是最新的会自动跳过。若拉到的仍是旧版，先清 npx 缓存：`npx clear-npx-cache` 或改用 `npx graduation-kit@latest`。

## 其他命令

```bash
# 列出可选技术栈
npx graduation-kit create --list

# 只安装 Skills（不生成项目）
npx graduation-kit install

# 更新已安装的 skills（项目内，按安装记录更新）
npx graduation-kit update

# 安装到全局（所有项目可用）
npx graduation-kit install -g

# 更新全局 skills
npx graduation-kit update -g

# 注意：update 会用包内版本覆盖本地改动，不做备份

# 忽略内容比对，强制重拷一遍
npx graduation-kit install -g --reinstall

# 验证项目完整性
npx graduation-kit verify

# 打包发给客户（含本地数据库）
npx graduation-kit package ./my-project

# 跑触发路由回归（开发者）
npm run eval

# 跑引用校验器自测（开发者）
npm run refs

# 诊断系统环境
npx graduation-kit diagnose
```

## 仓库地址

- GitHub: https://github.com/Soulmte/graduation-kit
- Gitee: https://gitee.com/rain-drops/graduation-kit

## 许可

MIT License
