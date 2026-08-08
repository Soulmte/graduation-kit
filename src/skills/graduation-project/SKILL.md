---
name: graduation-project
description: 毕业设计全流程开发编排 skill。用户说做毕设、开发毕业设计、写毕设代码、毕设项目、基于脚手架开发、给了毕设题目要开工时使用。覆盖五阶段工作流：需求访谈与功能边界确认、数据库建表、接口设计、前端风格与设计系统选型、模块化代码生成、逐模块代码审查、交付自检。配套 6 后端 + 6 前端多技术栈脚手架（Spring Boot / Vue / React 等），站在导师视角把关代码质量与命名规范，并按需调用 feature-forge、database-designer、api-designer、code-reviewer、impeccable 协同工作。也用于毕设进度规划、技术选型纠结、脚手架改造、答辩前代码检查。
---

# graduation-project

毕业设计代码生成专用 skill，配套本项目的多技术栈脚手架：**6 个后端 + 6 个 Web/小程序前端 + 2 个客户端**（pyqt 桌面端 / rn 原生 APP）。**站在导师视角，确保代码质量过关。**

---

## 0. 什么时候激活本 skill

以下任一信号出现时自动加载：

- 用户明确说"做毕设"、"开发毕业设计"、"写毕业设计代码"
- 用户提供了毕设题目，要求基于脚手架开发
- 用户提到脚手架改造、答辩前代码检查、毕设进度规划
- 用户提到"毕业设计/毕设/毕业论文+代码"等上下文词

---

## 1. 文件索引（按用途查）

本 skill 一共 1 份主文件 + 5 份规范，**严格分工不重叠**：

| 需求 | 打开哪个文件 | 核心产出 |
|------|-------------|---------|
| 不确定整体开发流程怎么走 | 本文件 §2 | 五阶段工作流 |
| 不知道代码怎么写才规范（Web 前端 + 后端）| `code-standards.md` | API 层 / Store 层 / 组件层 / 路由 / 样式规范 |
| 项目用的是 uniapp 或 wxapp | `crossplatform-standards.md` | 跨端目录 / 状态管理 / 请求封装差异 |
| 不知道怎么敲定需求 | `requirement-workflow.md` | 需求模板 + 确认流程 + 功能清单 |
| 不知道怎么选前端风格 | `style-integration.md` | ui-ux-pro-max + taste-skill + 避免深色方案 |
| 写完代码不确定质量 | `self-check.md` | 9 项自检清单 |

**`code-standards.md` 与 `crossplatform-standards.md` 二选一，按前端技术栈定。** 跨端项目仍需回读 `code-standards.md` 的 §0.3（接口协议）、§8（注释）、§9（命名）三节。

**需要配合的其他 skill**（不在本目录，单独调用）：

| skill | 什么时候调 |
|-------|-----------|
| `feature-forge` | 阶段 1：需求访谈与功能边界 |
| `database-designer` | 阶段 1 后：新增表的 DDL |
| `api-designer` | 阶段 1 后：新增接口的路径与参数 |
| `code-reviewer` | 阶段 2：每个模块生成完后审查 |
| `impeccable` | 可选：需要更深的前端工程打磨时 |
| `thesis-writer` | 代码完成后：写论文与绘制插图 |

---

## 1.5 项目结构约定（全局基准，其他文档均引用此处）

实际开发时从脚手架抽一个后端 + 一个前端到新项目，**统一命名为 `backend/` 与 `frontend/`**：

```
<毕设项目>/
├── .agents/skills/        本套 skill（npx graduation-kit install 装入）
├── backend/               抽出的后端（内部结构看 §7.1）
├── frontend/              抽出的前端（内部结构看 §7.2）
├── docs/
│   └── scaffold_db.sql    建表脚本，新增表追加到这里
├── uploads/               上传文件落盘目录
└── 需求确认单.md         阶段 1 的产出
```

多前端并行时用 `frontend-<技术栈>/`，如 `frontend-react/`、`frontend-vue/`。

### 从脚手架抽出后必改的一处配置

脚手架里后端在 `backends/<名>/`，距仓库根两层，所以上传目录写的是 `../../uploads`。
抽到新项目后后端只剩 `backend/` 一层，**这个路径必须改成 `../uploads`**，
否则头像上传会写到项目外面去，浏览器里图片 404。三个后端各自的位置：

| 后端 | 文件 | 配置项 |
|------|------|--------|
| springboot | `src/main/resources/application.yml` | `app.upload.path` |
| express | `.env` | `UPLOAD_DIR` |
| flask | `.env` | `UPLOAD_DIR` |

其他配置（端口、数据库连接、JWT 密钥、前端 `VITE_API_BASE_URL`）与目录层级无关，
抽出后不用动。只有改了数据库密码或换了后端端口才需要跟着调。

### 写任何代码前先探测结构

用户的目录可能与上图不完全一致（也可能直接在脚手架仓库里开发，那里是 `backends/<名>/` 与 `frontends/<名>/`）。**不要假设，先跑一次探测**：

```bash
ls
```

按看到的结果确定两个变量，后续全程用它们：

| 变量 | 含义 | 典型取值 |
|------|------|---------|
| `<BE>` | 后端根目录 | `backend/`；脚手架仓库里是 `backends/springboot/` 等 |
| `<FE>` | 前端根目录 | `frontend/`；脚手架仓库里是 `frontends/react/` 等 |

探测时还要确认两件事，它们决定了后续所有路径：

1. **后端是哪个技术栈** —— 有 `pom.xml` 是 Spring Boot；有 `src/app.js` 是 Express；有 `app.py` 是 Flask
2. **前端是哪个技术栈** —— 看 `package.json` 的 `dependencies`：有 `react` / `ant-design-vue` / `element-plus` / `naive-ui`；有 `pages.json` 是 uniapp；有 `app.json` + `.wxml` 是 wxapp

确认完再往下走。本文档与 `code-standards.md`、`self-check.md` 里出现的 `<BE>` / `<FE>` 均指代这两个探测结果。

---

## 2. 工作流（核心五阶段）

### 阶段 0：项目初始化

```
1. 用户提供毕设题目
2. 🧠 调用 feature-forge skill → 题目分析 + 用户角色定义
3. 读 style-integration.md §1 → 根据题目确定产品类型
4. 确定技术栈组合（前端框架 + 后端语言）
5. 输出：项目概览卡片（题目 / 技术栈 / 端口分配）
```

**输出格式**：

```
┌──────────────────────────────────────┐
│  毕设题目：XXX                           │
│  前端：Vue 3 + Element Plus (5175)        │
│  后端：Spring Boot (8080)                │
│  数据库：MySQL scaffold_db               │
│  产品类型：XXX（用于风格选型）             │
└──────────────────────────────────────┘
```

**端口分配**（固定，不要自己改）：

| 后端 | 端口 | | 前端 | 端口 |
|------|------|---|------|------|
| springboot | 8080 | | vue-antd | 5174 |
| express | 8081 | | vue-elementplus | 5175 |
| flask | 8082 | | react | 5176 |
| | | | vue-naive | 5177 |

前端的 `baseURL` 已指向对应后端并含 `/api` 前缀。**换后端时只需改前端的 `baseURL` 一处**，三个后端的接口路径与响应格式完全一致，不需要改业务代码。

**硬性约束**（下列路径指**脚手架仓库**里的源目录，抽到新项目后重命名为 `backend/` / `frontend/`，见 §1.5）：
- 后端从脚手架已有的 6 个中选：`springboot` / `express` / `flask` / `fastapi` / `go` / `dotnet`
- Web 前端从 `frontends/` 的 6 个中选：`react` / `vue-antd` / `vue-elementplus` / `vue-naive` / `uniapp` / `wxapp`
- 微信小程序需求 → `frontends/wxapp/`（原生）或 `frontends/uniapp/`（跨端）
- 原生 APP / 桌面端需求 → `clients/rn/`（React Native）或 `clients/pyqt/`（PyQt 桌面端）
- **不创建新技术栈目录**，在现有目录内新增/修改文件

**成熟度提醒**：`backends/` 里的 `springboot` / `express` / `flask` 与 `frontends/` 里的 `react` / `vue-antd` / `vue-elementplus` 已经过完整修复与联调验证，**优先推荐从这几个里选**。其余目录可用但未逐项验证，选它们时要多花时间对齐接口与字段命名。

### 阶段 1：需求确认 ⚠️ 必须得到用户肯定

```
1. 🧠 调用 feature-forge skill → 完整需求访谈 + 功能模块清单
2. 🧠 如需新增数据表 → 调用 database-designer skill 生成建表 SQL
3. 🧠 如需新增 API → 调用 api-designer skill 设计接口路径和参数
4. 与用户逐模块讨论功能需求
5. 生成「功能需求确认单」
6. 等待用户明确回复"确认"或"可以"或"没问题"
7. 用户确认前，禁止写任何业务代码
```

**功能需求确认单格式**：

```
模块1：用户管理
  □ 注册（是否需要邮箱验证？验证码？）
  □ 登录（JWT，默认实现）
  □ 个人信息维护（头像上传？）
  □ 管理员：用户 CRUD + 批量操作
  □ 权限：admin / user 两级

模块2：XXX（核心业务）
  □ 功能点1
  □ 功能点2
  ...

模块3：公告/内容管理
  □ 基础 CRUD
  □ 是否需要富文本？

模块4：操作日志
  □ 自动记录（默认）
  □ 是否需要查询/筛选界面？

模块5：文件上传
  □ 单文件 / 批量
  □ 类型限制（图片/文档/视频？）
```

**确认信号识别**：用户回复"确认"/"可以"/"没问题"/"就这些"/"开始吧"/"OK"→ 进入阶段 1.5。其他回复 → 继续讨论。

### 阶段 1.5：前端风格选型 ⚠️ 必须在写代码之前

```
1. 读 style-integration.md §2 → 多 skill 对比选型流程
2. 根据毕设题目确定产品类型关键词
3. 🎨 调用 ui-ux-pro-max skill → 获取设计系统推荐（主方案）
4. 🎨 读取 taste-skill 子技能（minimalist/soft/brutalist）→ 获取备选风格（见 style-integration.md §2.0）
5. 给用户展示 2-3 个方案对比卡片
6. 输出选定的设计系统卡片（配色/字体/风格/效果）
7. 与用户确认风格方案
```

**关键约束**：
- **禁止深色方案**：毕业设计默认浅色主题，dashboard 类可接受深色侧边栏但不接受全深色
- **配色控制在 5 色以内**：主色 + 辅色 + CTA + 背景 + 文字
- **避免 AI 味配色**：禁止紫色渐变、粉紫渐变、霓虹色系
- 选型完成后锁定配色变量，全程不换

### 阶段 2：代码生成（按模块推进）

```
0. 读目标前端的 5 个核心文件（code-standards.md §0 必读清单）→ 理解现有风格
1. 读代码规范 → Web 前端读 code-standards.md；uniapp/wxapp 读 crossplatform-standards.md
2. 按模块顺序生成：基础层 → 用户模块 → 核心业务 → 公告 → 日志 → 文件
3. 每个模块生成完 → 🧠 调用 code-reviewer skill 审查 → 立即自检（阶段 3）
4. 一个模块通过审查 → 才能进入下一个模块
```

**Step 0 必读的 5 个文件**（在写任何代码之前执行）：

| # | 文件 | 看什么 | 为什么 |
|---|------|--------|--------|
| 1 | Vue 三版：`<FE>/src/router/index.js`；React：`<FE>/src/App.jsx` | 路由表结构、守卫写法、路径别名 | 新增路由时保持格式一致。**React 没有 `router/` 目录** |
| 2 | `<FE>/src/stores/user.js`（Vue）或 `<FE>/src/stores/userStore.js`（React） | Store API 风格（Zustand 或 Pinia setup 写法） | Pinia 有两种写法，脚手架用的是哪套 |
| 3 | Vue 三版：`<FE>/src/api/request.js`；React：`<FE>/src/utils/request.js` | 拦截器逻辑、token 注入方式、进度条方案 | React 读 localStorage，Vue 读 Store。**位置不同** |
| 4 | `<FE>/src/views/admin/UserManage.vue` 或 `.jsx` | 页面骨架：Card→Toolbar→Table→Modal | 新增页面照这个结构写 |
| 5 | `<FE>/src/styles/` 下的全局样式文件 | 已有 CSS 变量名、class 命名约定 | 用已有变量，不重复定义 |

选了 uniapp / wxapp 时**去掉 `src/`**，改读：`<FE>/api/request.js`、`<FE>/store/`（uniapp，单数）或 `<FE>/utils/`（wxapp）、`<FE>/pages.json`（uniapp 路由）或 `<FE>/app.json`（wxapp 路由）、`<FE>/pages/` 下任一现有页面。

**模块生成顺序**（不可打乱）：

| 序号 | 模块 | 端 | 内容 | 依赖 |
|------|------|-----|------|------|
| 1 | 基础层 | 两端共用 | 路由、Store、request 封装、布局 | 无 |
| 2 | 用户模块 | 用户端+管理端 | 登录、注册、个人中心（用户端风格） | 基础层 |
| 3 | 核心业务 | 用户端+管理端 | 用户毕设题目对应的核心功能 | 用户模块 |
| 4 | 公告/内容 | 用户端+管理端 | CRUD 展示 + 详情页（用户端风格） | 基础层 |
| 5 | 操作日志 | 管理端 | 日志查看/筛选（只读，管理端 Table 风格） | 用户模块 |
| 6 | 文件上传 | 两端共用 | 头像/附件上传 | 基础层 |

**⚠️ 第 2-4 模块涉及用户端页面时，必须按 `code-standards.md §5.4` 写独立的详情页和用户端表单，不能复用管理端的 Table+Modal 风格。**

### 阶段 3：自检（每个模块生成后立即执行）

```
1. 读 self-check.md → 9 项检查清单
2. 逐项对照检查
3. 通过：标记 ✅，进入下一模块
4. 不通过：修复后重新自检
```

**自检 9 项速查**：

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | 文件结构 | 符合脚手架目录约定，用户端有独立详情页路由 |
| 2 | API 封装 | 走 request.js + api/ 目录 |
| 3 | Store 使用 | token/userInfo 走 Store，不裸调 localStorage |
| 4 | 组件拆分 | 页面含内联弹窗 ≤ 350 行，共享组件 ≤ 200 行 |
| 5 | 注释量 | 无带 `@param` 的完整 JSDoc，无步骤编号注释 |
| 6 | 引入来源 | Ant Design / Element Plus / Naive UI，不混用 |
| 7 | 路由守卫 | 需要登录的页面有 token 检查 |
| 8 | 样式规范 | 全局样式在 styles/，页面内样式用 scoped，用户端有 h1-h3 层级 |
| 9 | 框架一致性 | Vue 用 @/ 别名 + Store 读 token，React 用相对路径 + localStorage |

### 阶段 4：收尾

```
1. 确认所有模块前后端联通
2. 新增表补上种子数据（`user` / `notice` 已有，不要重复插）
3. 输出运行说明（模版见下方）
```

**运行说明模版**。按用户实际选的后端取对应那一行，删掉其他的：

```bash
# 1. 建库（只跑一次）
mysql -u root -p < docs/scaffold_db.sql

# 2. 启后端（三选一）
cd backend && mvn spring-boot:run                    # Spring Boot，8080，需 JDK 21
cd backend && npm install && npm run dev             # Express，8081
cd backend && pip install -r requirements.txt && python app.py   # Flask，8082

# 3. 启前端（另开一个终端）
cd frontend && npm install && npm run dev
```

还要告知用户三件事：前端访问地址（看 `npm run dev` 输出的端口）、
默认账号 `admin` / `123456`（管理员）与 `test` / `123456`（普通用户）、
以及 `.env` 或 `application.yml` 里的数据库密码要改成自己本机的。
后端不启就直接开前端会全面报网络错误，这是最常见的“页面打不开”原因。

---

## 3. 核心硬性约束（跨所有阶段生效）

以下规则任何场景都适用。如果某文件内的要求和下列决策类约束冲突，以下列为准；但具体阀值与执行细节（行数上限、检查项数、代码模板）以 `code-standards.md` 和 `self-check.md` 为准，那里才是实施口径。

### 3.1 代码风格（不可商量）

- **禁止完整 JSDoc**：不要带 `@param` / `@returns` / `@description` 标签的注释块。单行的块注释标函数用途是允许的（`api/*.js` 就这么写）
- **禁止步骤编号注释**：不要 `// 1. 获取用户信息  // 2. 校验密码`
- **禁止废话注释**：`const token = localStorage.getItem('token')  // 获取 token`
- **允许的行内注释**：仅在非显而易见的逻辑处写一行短注释，如 `// 登录/注册从 body 读用户名`
- **禁止 console.log**：提交前全部清除（后端标了 `dev only` 的调试输出不在此列）
- **禁止 debugger**：零容忍
- **禁止无用 import**：每个 import 都必须被使用
- **禁止 React 和 Vue 代码风格混用**：选定了哪个框架就全用该框架的语法（`@/` vs 相对路径、Store 读写方式、request.js 401 处理）

### 3.2 文件行数上限

| 文件类型 | 上限 | 超过上限时的处理 |
|----------|------|----------------|
| 页面组件（views/） | 350 行 | 含内联弹窗时的上限；不含弹窗应 ≤ 300 行 |
| 可复用组件（components/） | 200 行 | |
| API 文件（api/） | 60 行 | |
| Store 文件（stores/） | 80 行 | |
| 工具函数（utils/） | 100 行 | |
| 样式文件（styles/） | 200 行 | |

超过上限且非弹窗逻辑导致 → 拆分。弹窗逻辑导致 → 可接受（脚手架页面通常 250-300 行含内联弹窗）。

### 3.3 组件引入来源

| 前端 | 组件库 | 图标库 | 注意事项 |
|------|--------|--------|---------|
| React | Ant Design 5 | @ant-design/icons | 相对路径导入 |
| Vue+Antd | Ant Design Vue 4 | @ant-design/icons-vue | @/ 别名导入 |
| Vue+ElementPlus | Element Plus 2 | @element-plus/icons-vue | @/ 别名导入 |
| Vue+NaiveUI | Naive UI | N 组件内置图标 | @/ 别名，需 setup 内 useMessage |
| uni-app | uni-ui / 内置组件 | - | rpx 单位，不能用 HTML 标签 |
| wxapp | WeUI / 内置组件 | - | rpx 单位，module.exports |

**禁止混用**：用了 Ant Design Vue 就不要引入 Element Plus 的组件。

### 3.4 前端 API 调用规范

所有前端 API 调用必须：
- 通过 `utils/request.js`（或 `api/request.js`）封装的 axios 实例
- API 函数统一放在 `api/` 目录下，按模块分文件
- 组件中通过 `import { xxx } from '../../api/user'` 引入
- **禁止**在组件中直接写 `axios.post(...)` 或 `fetch(...)`

### 3.5 状态管理规范

| 前端 | Store 方案 | 存储内容 |
|------|-----------|---------|
| React | Zustand | token, userInfo |
| Vue 三版 | Pinia（Composition 写法） | token, userInfo |
| uni-app | `store/` 下自定义（单数目录） | token, userInfo |
| wxapp | `app.js` 的 globalData + 本地缓存 | token, userInfo |

- token 和 userInfo **必须**走 Store，**禁止**组件内直接读写 localStorage
- login/logout 操作封装在 Store 的 action 中
- 组件通过 Store 获取登录状态，不自己判断

**唯一例外**：`request.js` 拦截器不属于组件层。React 版在拦截器里读写 `localStorage` 是脚手架既定写法（Zustand 在模块作用域取 store 会拿不到最新值），Vue 版则走 `useUserStore()`。具体见 `code-standards.md` §2。除此之外的任何位置都不得直读 localStorage。

### 3.6 导师视角硬性红线

以下任一触发，导师直接打回：

1. **功能不完整**：需求确认单里的功能点缺了任何一个
2. **代码看不懂**：变量名用拼音、单字母变量、函数名和实际逻辑不符
3. **AI 味太重**：每行都注释、步骤编号注释、带 `@param` 的完整 JSDoc 满天飞
4. **深色主题**：全站深色方案（毕设答辩投影仪看不清暗色内容）
5. **配色花哨**：超过 5 种主题色、渐变背景、霓虹效果
6. **组件混用**：同一页面用了两个不同组件库的组件
7. **React/Vue 模式混用**：Vue 项目用了 React 风格的相对路径导入或 localStorage 直读 token
8. **凭空造代码**：没读脚手架现有文件就写代码，结果风格完全不对

---

## 4. 与前端 skills 的协作

### 4.1 调用时机

阶段 1.5 调用本 skill 目录下的 `vendor/ui-ux-pro-max` 设计资源完成风格选型。若需更深的前端工程打磨，转给 `impeccable` skill。

### 4.2 调用方式

路径相对于本 skill 目录（项目级：`<项目>/.agents/skills/graduation-project/`；全局：`~/.agents/skills/graduation-project/`）。`vendor/` 不存在时直接用 `style-integration.md` §5 的内置配色速查表。

```bash
python3 vendor/ui-ux-pro-max/scripts/search.py "<产品类型关键词>" --design-system -p "<项目名称>"
```

示例：
```bash
python3 vendor/ui-ux-pro-max/scripts/search.py "education learning management" --design-system -p "在线学习平台"
```

### 4.3 选型约束覆盖

ui-ux-pro-max 可能会推荐深色方案，**必须覆盖**：
- 如果推荐了 Dark Mode / OLED Dark → 改为同风格的浅色版本
- 背景色必须为浅色（`#fff` / `#f5f5f5` / `#fafafa` 系）
- 如果推荐了 AI-Native UI（通常是紫色系）→ 改为主流浅色企业风格

详细规范见 `style-integration.md`。

---

## 5. 自检机制

每次生成完一个模块，必须运行自检。完整清单见 `self-check.md`。

**快速自检命令**（生成完立即执行）：

1. 检查文件行数 → `wc -l` 不超过 §3.2 的上限
2. 检查禁用词 → 搜索 `console.log` / `debugger` / `TODO`
3. 检查注释量 → 搜索 `@param` / `@returns` / `// 1.` / `// 2.`（**不要搜 `/**`**，它会命中 `api/*.js` 里合法的单行块注释）
4. 检查 import 来源 → 确保组件库不混用
5. 检查字段命名 → 搜索 `create_time` / `update_time`，前端不应出现下划线字段（后端出口已统一转驼峰）

---

## 6. 常见问题速查

### Q1: 用户没给具体功能，只说"帮我做毕设"

→ 按 `requirement-workflow.md §2` 的需求访谈模板逐项询问用户，不要自己编需求。

### Q2: 用户说"随便"、"你看着办"

→ 给出 2-3 个具体选项让用户选（带上每个选项的代价与效果差异），不要替用户做决定。

### Q3: 用户要求的风格和毕设题目不匹配

→ 提醒用户但不强制。比如"在线医疗平台用霓虹色可能不太合适，建议用浅蓝/浅绿医疗风"。用户坚持就用用户的方案。

### Q4: 后端代码需要改吗？

→ 脚手架已有的四个模块（用户/公告/日志/文件）**不需要改**。只有新增业务模块（订单、课程等）时才动后端。

新增一个业务模块要动的文件（以 Spring Boot / Express / Flask 为例，顺序从下往上）：

| 层 | Spring Boot | Express | Flask |
|-----|------------|---------|-------|
| 建表 | `docs/scaffold_db.sql` | 同 | 同 |
| 实体 | `entity/Xxx.java` | 无（无实体类） | 无 |
| 数据访问 | `mapper/XxxMapper.java` | 写在 service 里 | 写在 service 里 |
| 业务 | `service/XxxService.java` + `service/impl/XxxServiceImpl.java` | `src/services/xxxService.js` | `services/xxx_service.py` |
| 入参 | `dto/XxxQuery.java` | 无（controller 里解构） | 无（controller 里 `data.get()`） |
| 控制器 | `controller/XxxController.java` | `src/controllers/xxxController.js` | `controllers/xxx_controller.py` |
| 路由注册 | 无（`@RequestMapping` 自动） | `src/routes/xxxRoutes.js` + `src/app.js` 挂载 | `controllers/` 里建蓝图 + `app.py` 注册 |

**Express 和 Flask 最容易漏的是最后一步**：路由文件建了但没在 `app.js` / `app.py` 里挂载，接口会直接 404。Spring Boot 不存在这个问题。

具体代码模板看 `api-designer` §2，目录位置看本文件 §7.1。

### Q5: 用户想同时用多个前端

→ 不建议。毕设聚焦一个前端 + 一个后端即可。多前端并行是项目亮点，可以在论文中作为"可扩展性"提及。

### Q6: 现有脚手架的功能和毕设需求不完全匹配

→ 在现有脚手架基础上**扩展**，不复写已有功能。比如脚手架已有用户管理，就在上面加业务模块；不要删掉已有的用户管理重写。

---

## 7. 目录约定（以脚手架真实结构为准）

本节描述的是 `<BE>` / `<FE>` **内部**的结构（两个变量的含义见 §1.5）。在现有目录内开发，不创建新的顶级目录。**三个后端的内部结构各不相同，写代码前先 `ls <BE>` 看一眼**，不要套用其他后端的分层名。

### 7.1 后端

**Spring Boot**（`<BE>/src/main/java/com/example/`）：

```
com/example/
├── Application.java
├── common/            横切层，新增业务不动这里
│   ├── annotation/    @Log 与 @RequireAdmin
│   ├── aspect/        LogAspect
│   ├── config/        Jackson / MybatisPlus / Web 配置
│   ├── exception/     BusinessException + 全局异常处理
│   ├── interceptor/   JwtInterceptor
│   ├── result/        Result / ResultCode
│   └── util/          JwtUtil / UserContext
├── controller/        ← 新增控制器（单数，不是 controllers）
├── dto/               ← 新增请求参数对象（Query / DTO）
├── entity/            ← 新增实体类（不叫 models）
├── mapper/            ← 新增 MyBatis-Plus Mapper（不叫 dao）
└── service/           ← 接口放此，实现放 service/impl/
    └── impl/
```

**Express**（`<BE>/src/`，注意有 `src/` 一层）：

```
src/
├── app.js
├── config/            database / jwt / cors / server / upload
├── controllers/       ← 新增控制器（复数）
├── middleware/        auth / errorHandler / logger / requestLogger
├── routes/            ← 新增路由（叫 routes，不是 routers）
├── services/          ← 新增业务层，**SQL 写在这里**
└── utils/             response.js
```

**Flask**（`<BE>/`，**没有 `src/`**，包直接在后端根下）：

```
<BE>/
├── app.py
├── config.py
├── controllers/       ← 新增蓝图
├── middleware/        auth / logger / request_logger
├── services/          ← 新增业务层，**SQL 写在这里**
└── utils/             response.py / database.py
```

三个后端都**没有 `models/`、`routers/`、`dao/` 目录**。Express 与 Flask 也**没有实体类**，数据库访问直接在 service 层手写 SQL。

### 7.2 前端

**React / Vue 三版**（`<FE>/src/`）：

```
src/
├── api/                   ← 新增 API 文件（按模块）
├── components/            ← 新增公共组件
├── layouts/               UserLayout / AdminLayout
├── stores/                ← 修改/新增 Store
├── styles/                ← 修改/新增样式
└── views/
    ├── admin/             ← 管理端页面
    └── user/              ← 用户端页面
```

四个项目的**差异点，不要弄错**：

| 项目 | `request.js` 位置 | 路由定义 | 导入方式 |
|------|------------------|---------|---------|
| react | `src/utils/request.js` | **无 `router/` 目录**，路由写在 `src/App.jsx` | 相对路径 `../../api/user` |
| vue-antd | `src/api/request.js` | `src/router/index.js` | `@/` 别名 |
| vue-elementplus | `src/api/request.js` | `src/router/index.js` | `@/` 别名，额外有 `src/constants/` |
| vue-naive | `src/api/request.js` | `src/router/index.js` | `@/` 别名 |

**uni-app / wxapp 没有 `src/` 目录**，目录直接摊在 `<FE>/` 下，结构完全不同：

```
uniapp 版 <FE>/               wxapp 版 <FE>/
├── api/                        ├── api/
├── components/                 ├── config/
├── config/                     ├── pages/          ← 页面四件套
├── pages/          ← 页面      ├── static/
├── static/                     ├── utils/
├── store/          ← 单数      ├── app.js / app.json / app.wxss
└── pages.json      ← 路由配置   └── project.config.json
```

注意 uniapp 的 Store 目录是 **`store/`（单数）**，与 Vue 三版的 `stores/` 不同；页面放 `pages/` 而非 `views/`；路由靠 `pages.json` 声明而不是 Vue Router。**写自检命令时不要拼 `<FE>/src/`**，会直接返空导致假通过。

选了跨端项目时，**完整的目录、状态管理、请求封装、页面命名差异全在 `crossplatform-standards.md`**，写代码前先读那份。

### 7.3 项目根目录

见 §1.5 的结构约定。两个要点：

- **建表 SQL 放 `docs/scaffold_db.sql`**，新增表追加到末尾 INSERT 之前
- **`uploads/` 在项目根**，不在 `<BE>/` 内。三个后端的上传配置默认指向上一层的 `uploads/`，抽出后端时这个目录别忘了建（或改 `<BE>` 里的 `UPLOAD_DIR` 配置）

---

## 8. 给 AI 的最后叮嘱

1. **先读规范再动笔**。每个阶段都有对应的文件清单（见 §1），别跳过。
2. **需求不确认不开工**。阶段 1 的用户确认是不可逾越的红线。
3. **配色不选型不写 UI**。阶段 1.5 的风格选型必须在任何 `.vue` / `.jsx` 之前完成。
4. **每个模块都要自检**。`self-check.md` 的 9 项检查走一遍再交下一模块。
5. **代码要像人写的**。禁止过度注释、禁止 AI 味变量名、禁止炫技代码。
6. **深色主题是红线**。毕设答辩用投影仪，深色看不清。背景必须是浅色。
7. **简洁优先**。一个功能能用 10 行写完就不要写 30 行。简单 = 好维护 = 高分。
8. **站在导师角度想**：这份代码拿到答辩现场，导师会问什么问题？提前把坑填了。
9. **脚手架已有功能不要重写**。用户管理、公告 CRUD、日志记录、文件上传 → 脚手架都已实现，直接在基础上扩展业务。
10. **一次只做一个模块**。不要试图并行写多个模块，模块之间有依赖关系，按顺序来。
11. **生成代码前先读脚手架**。`code-standards.md §0` 的 5 个必读文件，读完再动笔。不看脚手架就写 = 风格必歪。
12. **React 和 Vue 代码不能混**。Vue 项目用 `@/` 别名 + `useUserStore()` 读 token + `<script setup>`，React 项目用相对路径 + `localStorage` 读 token + JSX。选好了就一套到底。
13. **弹窗默认内联**。add/edit Modal 写在页面文件里，不要去建 `UserEditModal.vue`。只有多页面共用的弹窗才需要独立文件。
