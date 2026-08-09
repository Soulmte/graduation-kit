# graduation-kit

毕业设计一件套 agent skills。一条命令装好从需求到答辩的全流程能力：需求定义、数据库设计、接口设计、代码生成、代码审查、UI 风格选型、论文写作与配图绘制。

支持任何读取 `.agents/skills/` 的 agent（Zed、Claude Code 等）。

需要 Node.js 18+；跑起脚手架还需要 MySQL 8，以及对应后端的运行时（JDK 17 / Node.js / Python 3.10+）。

## 快速开始

在你打算放项目的父目录下：

```bash
npx graduation-kit create
```

分步向导会依次问你项目名、后端、前端、数据库名和 MySQL 密码，跑完得到一个可直接开发的项目：

```
my-graduation-project/
├── .agents/skills/     六个毕设 skill
├── backend/            你选的后端
├── frontend/           你选的前端
├── docs/scaffold_db.sql
└── uploads/
```

参数给全就跳过提问，适合写进脚本：

```bash
npx graduation-kit create my-app --be springboot --fe react
npx graduation-kit create demo --be express --fe vue-antd,wxapp --db lib_db
```

生成后先导入 `docs/scaffold_db.sql` 建库，再按终端给出的启动提示分别跑后端和前端。内置账号 `admin / 123456`（管理员）和 `test / 123456`（普通用户）。

最后**新开一个 agent 会话**，skill 才会被加载。不需要重启编辑器。

## 只装 skill

项目已经有了、只想要这套 skill：

```bash
# 装到当前项目
npx graduation-kit install

# 装到全局，所有项目可用
npx graduation-kit install -g

# 只要论文那一个
npx graduation-kit install --only thesis-writer
```

安装时会询问是否一并装上三个上游增强包。它们已随包内置，无需联网。

升级包之后重装要加 `-f`，否则遇到已存在的目录会直接跳过，你会以为装上了新版其实还是旧的。

## 命令

```bash
npx graduation-kit create [名称]     向导：脚手架 + SQL + skills
npx graduation-kit install [选项]   只安装 skills
npx graduation-kit list             列出包内 skill
npx graduation-kit uninstall        移除已安装的 skill
npx graduation-kit doctor           校验 frontmatter 规范
```

通用选项

| 选项 | 说明 |
|---|---|
| `-d, --dir <path>` | 指定工作目录（默认当前目录） |
| `-f, --force` | 覆盖已存在的 skill |
| `-y, --with-upstream` | 直接带上三个上游增强，不询问 |
| `--no-upstream` | 只装六个核心 skill |

`install` 专属

| 选项 | 说明 |
|---|---|
| `-g, --global` | 装到 `~/.agents/skills/` |
| `-o, --only <a,b>` | 只处理指定 skill，跳过上游询问 |

`create` 专属

| 选项 | 说明 |
|---|---|
| `--be <id>` | 后端，只能一个 |
| `--fe <a,b>` | 前端，可多个逗号分隔 |
| `--db <name>` | 数据库名（默认 `scaffold_db`） |
| `--db-pass <pwd>` | MySQL root 密码 |
| `--no-skills` | 不装 skills，只要脚手架 |
| `--list` | 列出可选脚手架 |

## 可选脚手架

后端选一个，三者接口完全一致（同一套 27 条接口、同一套错误码），前端可以无感对接任意一个：

| `--be` | 技术栈 | 端口 |
|---|---|---|
| `springboot` | Java 17 + MyBatis-Plus | 8080 |
| `express` | Node.js + mysql2 | 8081 |
| `flask` | Python + PyMySQL | 8082 |

前端可多选，多选时落成 `frontend-<名>/`：

| `--fe` | 技术栈 |
|---|---|
| `react` | React 18 + 自研组件 |
| `vue-elementplus` | Vue 3 + Element Plus |
| `vue-antd` | Vue 3 + Ant Design Vue |
| `vue-naive` | Vue 3 + Naive UI（含暗色模式） |
| `uniapp` | uni-app 跨端（H5 / 小程序 / App） |
| `wxapp` | 微信小程序原生 |

每个脚手架都带 13 个成品页面（登录注册、用户管理、公告管理、日志管理、仪表盘、个人中心等），可直接当作你业务模块的模仿对象。

## 仓库结构

```
graduation-kit/
├── bin/                    CLI 入口
│   ├── cli.js              命令分发、install / uninstall / list / doctor
│   ├── create.js           create 向导与非交互生成
│   ├── scaffold.js         脚手架清单、拷贝、端口与库名改写
│   └── prompt.js           无依赖的终端交互（text / select / multiselect）
├── src/
│   ├── skills/             七个 skill 源文件
│   │   ├── graduation-project/
│   │   ├── thesis-writer/      含绘图引擎与 docx 转换脚本
│   │   ├── feature-forge/
│   │   ├── database-designer/
│   │   ├── api-designer/
│   │   ├── code-reviewer/
│   │   └── impeccable/
│   ├── scaffolds/          脚手架源码
│   │   ├── backends/       springboot / express / flask
│   │   ├── frontends/      react / vue-×3 / uniapp / wxapp
│   │   ├── clients/        pyqt / react-native
│   │   ├── docs/           scaffold_db.sql
│   │   └── uploads/        预置头像等静态文件
│   └── vendor/             上游组件（随包内置，无需联网）
├── NOTICE.md               第三方许可
└── LICENSE
```

`bin/` 是安装器，`src/skills/` 是发给 agent 读的提示词，`src/scaffolds/` 是会被拷进你项目的真实代码。三者互不依赖：只想要 skill 就用 `install`，只想要脚手架就 `create --no-skills`。

## 包含内容

### 核心 skill（默认全装）

| skill | 用途 |
|---|---|
| `graduation-project` | 全流程编排。五阶段工作流，站在导师视角把关代码质量 |
| `thesis-writer` | 论文正文与摘要、八类论文插图绘制、Markdown 转 Word |
| `feature-forge` | 需求访谈、功能边界、MVP 范围、EARS 需求描述 |
| `database-designer` | 建表 DDL、ER 关系、索引设计、数据字典 |
| `api-designer` | RESTful 接口设计、统一响应协议、错误码规范 |
| `code-reviewer` | 分层规范、安全问题、命名一致性分级审查 |

### 上游增强（安装时询问）

| 组件 | 落地位置 | 许可 |
|---|---|---|
| `impeccable` | 独立 skill | Apache-2.0 |
| `ui-ux-pro-max` | `graduation-project/vendor/` | MIT |
| `taste-skill` | `graduation-project/vendor/` | MIT |

不装上游也能用：`graduation-project` 会回退到 `style-integration.md` 的内置配色速查表。

## 怎么用

skill 不靠命令调用，直接跟 agent 说你要干什么就行，它会自己匹配。几个典型说法：

| 你说 | 会走 |
|---|---|
| 「我毕设题目是图书馆管理系统，帮我开工」 | `graduation-project` 五阶段全流程 |
| 「题目太宽了，不知道做哪些功能」 | `feature-forge` 需求访谈与 MVP 划边 |
| 「帮我设计图书借还的表」 | `database-designer` 出 DDL |
| 「加一个借书记录接口」 | `api-designer` |
| 「帮我审一下这个模块的代码」 | `code-reviewer` 分级问题清单 |
| 「写论文第四章」、「画一张系统架构图」 | `thesis-writer` |

推荐的开发顺序：先拿 `feature-forge` 把功能边界定下来，再 `database-designer` 建表，接着 `api-designer` 定接口，然后让 `graduation-project` 逐模块生代码，每写完一个用 `code-reviewer` 过一遍。论文可以边写代码边积累。

论文插图是一套浏览器里的 Canvas 绘图工具，支持八类图（架构图、ER 图、用例图、流程图、时序图、功能模块图、技术栈图、对比图），输出符合学位论文规范的黑白线稿。拖动标签前记得先点「编辑模式」，否则点不动不是坏了；保存只写浏览器缓存，要点「导出代码」粘回数据文件才算落盘。

## 开发

```bash
npm test                              # 校验所有 skill 的 frontmatter
node bin/cli.js install --dir /tmp/x  # 装到临时目录试跑
```

绘图引擎的回归测试：

```bash
cd src/skills/thesis-writer/reference/examples
node verify.js && node verify-editor.js && node audit.js
```

## 常见问题

**装完了 agent 没反应** —— 新开一个会话。已经开着的会话不会重新扫 skill 目录。

**升级后还是旧版** —— 重装要加 `-f`。不加的话已存在的目录会被整个跳过，只打一行警告。

**`--only` 为什么没装上游** —— 这是有意的：指定了 `--only` 就只装你点名的，不会再问上游。想要 `impeccable` 就把它一并写进 `--only`。

**数据库连不上** —— `create` 时密码留空的话需要自己到 `backend` 配置里补。另外记得先导入 `docs/scaffold_db.sql`。

**前端头像图片 404** —— 头像路径用 `/uploads/xxx.jpg` 靠 vite 代理转到后端，这是既定设计。确保后端已启动，不要自己拼绝对地址。

**论文转 Word 后章节串位** —— 转换脚本按单独一行的 `---` 分割章节，所以正文里不能出现分割线。图片需要自己手动插，脚本不管图。

## 许可

MIT。vendored 的第三方组件另有许可，见 [NOTICE.md](NOTICE.md)。
