# 代码规范（脚手架风格）

本文件定义：**基于脚手架项目的代码编写规范**，确保生成的代码与现有脚手架风格一致。

> 前置阅读：本文件只规定代码怎么写。阶段流程看 `SKILL.md §2`，自检清单看 `self-check.md`。
>
> **适用范围**：react / vue-antd / vue-elementplus / vue-naive 四个 Web 前端。项目用的是 **uniapp 或 wxapp 时请读 `crossplatform-standards.md`**，那两个的目录结构、状态管理、请求封装与本文件完全不同。但 §0.3（接口协议）、§8（注释）、§9（命名）两边通用。

---

## 0. 写代码之前：必读清单

在创建任何文件之前，**必须先读取目标前端的以下 5 个文件**，确保生成的代码风格完全一致。React 和 Vue 的路径不一样，别读错：

| # | React 路径 | Vue 三版路径 | 看什么 |
|---|---|---|--------|
| 1 | `<FE>/src/App.jsx` | `<FE>/src/router/index.js` | 路由表结构、守卫写法、路径别名 |
| 2 | `<FE>/src/stores/userStore.js` | `<FE>/src/stores/user.js` | Store API 风格、action 命名 |
| 3 | `<FE>/src/utils/request.js` | `<FE>/src/api/request.js` | 拦截器写法、token 注入方式、进度条方案 |
| 4 | `<FE>/src/views/admin/UserManage.jsx` | `<FE>/src/views/admin/UserManage.vue` | 页面结构模板：Card→Toolbar→Table→Modal |
| 5 | `<FE>/src/styles/global.css` | 同左 | 已有 CSS 变量、class 命名约定 |

跨端项目（uniapp / wxapp）目录结构完全不同，**改读 `crossplatform-standards.md`**。

---

### 0.1 速查表

| 层级 | React | Vue 三版 | 关键差异 |
|------|-------|-----|---------|
| API 层 | `api/user.js` ← 相对路径导入 | `api/user.js` ← `@/` 别名导入 | 导入路径风格不同 |
| Store 层 | `stores/userStore.js`（Zustand）| `stores/user.js`（Pinia setup 写法）| API 完全不同 |
| 路由层 | `App.jsx` 内 Routes + 组件守卫 | `router/index.js` + `beforeEach` | 守卫机制不同 |
| 组件层 | `views/` + `components/` | `views/` + `components/` | JSX vs SFC |
| 样式层 | `styles/global.css` | `styles/global.css` + `<style scoped>` | Vue 多 scoped |
| request | `utils/request.js` | `api/request.js` | 位置不同 |
| Token 注入 | 拦截器读 `localStorage.getItem('token')` | 拦截器读 `useUserStore().token` | 来源不同 |
| 清登录态 | `useUserStore.getState().logout()` | `useUserStore().logout()` | Zustand 非组件内要 `.getState()` |

### 0.2 导入路径规范（按框架分）

| 框架 | 路径风格 | 示例 |
|------|---------|------|
| React | 相对路径 | `import { login } from '../../api/user'` |
| Vue-Antd | `@/` 别名 | `import { login } from '@/api/user'` |
| Vue-ElementPlus | `@/` 别名 | `import { login } from '@/api/user'` |
| Vue-Naive | `@/` 别名 | `import { login } from '@/api/user'` |

**`@/` 指向 `src/`**。写 Vue 代码时一律用 `@/`，写 React 代码时一律用相对路径。

**一个例外**：Vue 的 `api/*.js` 引 `request` 用的是同目录相对路径 `'./request'`，不是 `'@/api/request'`。四个现成 API 文件都这么写，跟着保持。

**已实测的基准线**（`src/` 全目录）：react 相对路径 36 次 / `@/` **0** 次；vue 三版 `@/` 31–34 次 / 相对路径（`../`）**0** 次。两边零交叉。

注意：react 的 `vite.config.js` 里**其实配了 `@` 别名**（`alias: { "@": ./src }`），写 `@/` 不会报错。但整个项目一行都没用，**这是风格统一问题而非技术限制**——跟着现有风格用相对路径，不要两种混着写。

### 0.3 脚手架已有 API 路径（新增接口必须遵守此协议）

```
POST   /api/user/login          → { code:200, data:{ token, userInfo } }
POST   /api/user/register       → { code:200, message:"注册成功" }
POST   /api/user/pageQuery      → { code:200, data:{ records, total } }
GET    /api/user/listAll        → { code:200, data:[...] }
GET    /api/user/getById/:id    → { code:200, data:{...} }
PUT    /api/user/update         → { code:200, message:"更新成功" }
PUT    /api/user/updatePassword → { code:200, message:"密码修改成功" }
DELETE /api/user/deleteById/:id → { code:200, message:"删除成功" }
DELETE /api/user/deleteBatch    → { code:200, message:"批量删除成功" }

POST   /api/notice/add          → { code:200 }
POST   /api/notice/pageQuery    → { code:200, data:{ records, total } }
GET    /api/notice/listAll      → { code:200, data:[...] }
GET    /api/notice/getById/:id  → { code:200, data:{...} }
PUT    /api/notice/update       → { code:200 }
DELETE /api/notice/deleteById/:id → { code:200 }
DELETE /api/notice/deleteBatch  → { code:200 }

POST   /api/log/pageQuery       → { code:200, data:{ records, total } }
GET    /api/log/listAll         → { code:200, data:[...] }
GET    /api/log/getById/:id     → { code:200, data:{...} }
DELETE /api/log/deleteById/:id  → { code:200 }
DELETE /api/log/deleteBatch     → { code:200 }

POST   /api/file/upload         → { code:200, data:{ url, fileName } }
POST   /api/file/uploadBatch    → { code:200, data:[{ url, fileName }] }
DELETE /api/file/delete         → { code:200 }

GET    /api/health              → { code:200, data:"ok" }
```

上面 27 条已校对 **springboot / express / flask 三个后端，路径与方法完全一致**，换后端不需要改前端。

统一响应格式：`{ code: number, message?: string, data?: any }`
- `code === 200` → 成功
- `code !== 200` → 业务异常
- **HTTP 状态码一律 200**，只有 Token 失效用 HTTP 401

完整业务码（三后端 `ResultCode` 已对齐）：

| code | 含义 | code | 含义 |
|---|---|---|---|
| 200 | 成功 | 1001 | 登录失败 |
| 400 | 参数错误 | 1002 | 用户名已存在 |
| 403 | 权限不足 | 1004 | 原密码错误 |
| 404 | 资源不存在 | 2001 | 数据已存在 |
| 500 | 服务器错误 | 2002 | 数据不存在 |

**403 / 404 是业务码不是 HTTP 状态码**。权限拦截返回的是 HTTP 200 + `code:403`，前端在响应拦截器里统一弹错误提示。新增业务码从 **1005** 起（1003 空号不占用）。

---

## 1. API 层规范

### 1.1 文件结构

`<FE>/src/api/` 下已有四个文件：`user.js`、`notice.js`、`log.js`、`file.js`，**直接复用不要重写**。新增业务模块按 `<module>.js` 建一个新文件。

`request` 的位置分两种：react 在 `src/utils/request.js`，vue 三版在 `src/api/request.js`。

### 1.2 写 API 文件的规范

**范本就是脚手架的 `api/user.js`**，9 个导出函数覆盖了全部写法。新建模块时复制它改名字最快。

写法要点：

- **一个函数一个接口**，用 `export const` 箭头函数，函数体只有一行 `return request.method(...)`
- **函数名 = 动作 + 模块名**：`pageQueryUser`、`getUserById`、`deleteUserBatch`。登录注册这类全局唯一的动作可以省略模块名（`login`、`register`）
- **路径省略 `/api` 前缀**，因为 `baseURL` 已经是 `/api`。写 `'/user/login'` 而不是 `'/api/user/login'`
- **导入 request 的路径**：react 用 `'../utils/request'`，vue 用 `'./request'`（同目录，**不是 `@/api/request'`**）
- **参数风格**：字段少且固定的直接传形参（`login(username, password)`），查询条件多的传对象（`pageQueryUser(query)`）
- **路径参数用模板串拼进 URL**：`` request.get(`/user/getById/${id}`) ``
- **DELETE 传数组要包一层 `config`**：`request.delete('/user/deleteBatch', { data: ids })`。axios 的 delete 第二个参数是 config 不是 body，直接传数组发不出去
- **不写 try-catch**，错误由 request 拦截器统一处理
- **不碰 token**，拦截器统一注入
- **不做 `.then()` 二次加工**，原样 return 给页面
- **注释**：每个函数上面一行块注释标用途（`/** 用户注册 */`）是脚手架风格，跟着写。禁的是带 `@param` / `@returns` 标签的完整 JSDoc（见 §8）

---

## 2. request.js 规范

**四个前端的 request 都已写好，不要重写。** 需要加逻辑时往现有拦截器里补，不要新建文件。

### 2.1 四版差异对照

| 项目 | 文件位置 | token 来源 | 提示组件 | 进度条 | 401 跳转 | 防抖 |
|---|---|---|---|---|---|---|
| react | `utils/request.js` | `localStorage.getItem('token')` | `message`（antd） | NProgress | `window.location.href` | 有 |
| vue-antd | `api/request.js` | `useUserStore().token` | `message`（ant-design-vue） | NProgress | `router.push` | 有 |
| vue-elementplus | `api/request.js` | `useUserStore().token` | `ElMessage` | NProgress | `router.push` | 有 |
| vue-naive | `api/request.js` | `useUserStore().token` | `window.$message` | `window.$loadingBar` | `router.push` | 无 |

naive 版用 `window.$message` 是因为 Naive UI 的 `useMessage()` 必须在 setup 内调用，拦截器里拿不到。它包了一个 `notifyError()`，取不到 `window.$message` 时降级到 `console.error`。

**react 版在拦截器里直读 localStorage 是故意的**——在非组件上下文读 Zustand 要写 `getState()`，直读更直白。这不违反 §3.4 的 Store 规则，那条管的是组件。

### 2.2 不能破坏的四个设计

1. **两个 401 分支都要留，且调同一个清理函数**。响应回调里的 `res.code === 401` 是未携带 token 的情况（后端返 HTTP 200 + body 401）；error 回调里的 `error.response?.status === 401` 是 token 无效或过期（后端返 HTTP 401）。两处各写一套清理逻辑，迟早出现"弹了提示但没跳登录"的半死状态

2. **`res.code === 401` 必须判在 `res.code !== 200` 之前**。顺序反了 401 会被后面那个分支接走，只弹提示不清 token，用户卡在页面上反复失败

3. **`redirecting` 防抖标志不要删**。页面同时发几个请求都 401 时，没它会弹好几条提示并反复跳转。vue 版在 `router.push().finally()` 里重置，**不要改成同步重置**——跳转未完成就重置等于防抖失效

4. **清理走 Store 的 `logout()`**，不要在拦截器里手写 `localStorage.removeItem`。后者会造成 store 内存状态与本地存储不一致

### 2.3 通用规则

- **baseURL 统一 `/api`**，走 vite proxy，真实后端地址在 `vite.config.js` 读 `VITE_API_BASE_URL`（默认 `http://localhost:8080`）。不要改成完整 URL 或环境变量拼接
- **`/uploads` 也配了代理**。头像、附件直接用后端返回的 `/uploads/xxx.jpg` 相对路径，不要拼 `http://localhost:8080`（那会在部署时失效）
- **换后端只改 `.env` 里的 `VITE_API_BASE_URL`**，Spring Boot 8080 / Express 8081 / Flask 8082，不用动任何业务代码
- **timeout 10000ms**
- **进度条不增不删**，各版保持原样。naive 版没有 `redirecting` 防抖也是现状，`$loadingBar` 本身有去重，不必专门补
- **错误提示走组件库的 message**，不用 `alert()`
- **业务码不在拦截器里分支处理**。403 / 404 / 1001 这些都走 `res.code !== 200` 的统一弹提示，页面只需 `try/catch` 或不管
- **成功响应返回的是 `res` 不是 `res.data`**。拦截器已剥掉 axios 的外层，页面里写 `res.data.records` 取列表、`res.data.total` 取总数


---

## 3. Store 层规范

**四个前端的 Store 都已写好，直接复用。** 范本是 `stores/userStore.js`（react）或 `stores/user.js`（vue）。

### 3.1 两种技术栈的写法

| | React | Vue 三版 |
|---|---|---|
| 库 | Zustand | Pinia |
| 文件名 | `stores/userStore.js` | `stores/user.js` |
| 定义方式 | `create((set) => ({ ... }))` | `defineStore('user', () => { ... })`（**Setup Store 风格**，不是 Options） |
| 状态声明 | 对象字面量属性 | `ref()`，读写要 `.value` |
| 改状态 | `set({ token, userInfo })` | `token.value = ...` |
| 组件读取 | `useUserStore(state => state.token)` | `userStore.token` |
| 暴露方式 | 对象里的都能访问 | 必须写进 `return {}` 才能访问 |

Vue 的 Setup Store 里**不要用 `this`**。

### 3.2 只有三个 action，名字四版统一

| 方法 | 作用 | 何时调 |
|---|---|---|
| `login(username, password)` | 调登录接口 + 写 token/userInfo + 同步 localStorage | 登录页 |
| `logout()` | 清空两个状态 + 清 localStorage | 退出按钮、request 拦截器 401 |
| `updateUserInfo(info)` | 只更新 userInfo + 同步 localStorage | 改完个人资料后 |

**是 `updateUserInfo` 不是 `setUserInfo`**，写错会报 undefined。

**改完个人资料必须调 `updateUserInfo`**，否则顶部头像和昵称不刷新、要刷页面才变——这是很容易被导师当场撞到的 bug。

### 3.3 使用规则

- **只存 `token` 和 `userInfo` 两个状态**，业务数据不进 Store，页面自己用局部状态管
- **localStorage 同步写在 action 内部**，组件不感知。初始值也从 localStorage 读（`localStorage.getItem('token') || ''`）
- **组件里不直接读 localStorage**，一律走 Store。两处例外：Store 自身初始化，以及 react 的 `utils/request.js` 拦截器
- **不新建额外 Store**。除非有购物车、订单这种独立大模块，一个 user store 够用
- **不引入持久化插件**。四个前端都是手写 `localStorage.setItem`，不要装 `pinia-plugin-persistedstate` 或用 zustand 的 `persist`，多一层抽象反而难调

---

## 4. 路由规范

### 4.1 路由定义在哪

| 项目 | 位置 | 组件加载 |
|---|---|---|
| react | `src/App.jsx`（**没有 `router/` 目录**） | 顶部直接 import，不用 `lazy()` |
| vue 三版 | `src/router/index.js` | 懒加载 `() => import('@/views/...')` |

React 新增页面要改两处：文件顶部加 import，`<Routes>` 里加 `<Route>`。

### 4.2 两种守卫机制

**React——守卫是组件**，`ProtectedRoute` 和 `AdminRoute` 定义在 `App.jsx` 底部：

- `ProtectedRoute` 只查 token，没有就 `<Navigate to="/login" replace />`
- `AdminRoute` 先查 token，再查 `userInfo?.role !== 'admin'`，不是管理员踢到 `/user/home`
- 用法：需登录的页面用 `<ProtectedRoute>` 包住 element。管理端是**整个 AdminLayout 包一次**，子路由不必逐个包
- 两个守卫都用**单字段 selector**（`useUserStore((state) => state.token)`），不要一次取整个 store，否则任何字段变化都触发重渲染
- 用 `<Navigate>` 重定向而非 `useEffect` 里跳转，避免登录前页面闪帧

**Vue——守卫是全局钩子**，`router.beforeEach` 里读路由 `meta`：

- 路由上标 `meta: { requiresAuth: true }` 表示需登录，`meta: { requiresAdmin: true }` 表示需管理员
- `beforeEach` 里先判 `to.meta.requiresAuth && !userStore.token` → `next('/login')`；再判 `to.meta.requiresAdmin && userStore.userInfo?.role !== 'admin'` → `next('/user/home')`；都过了 `next()`
- 管理端的两个 meta 标在 `/admin` 父路由上，子路由继承，不用重复标
- **新增需登录的页面必须同步加 meta**。光添路由不加 meta 就是开放页

### 4.3 通用规则

- 嵌套路由：`/user` 和 `/admin` 分别对应 UserLayout 和 AdminLayout
- 404 兜底必须有：Vue 用 `/:pathMatch(.*)*`，React 用 `path="*"`
- 路由路径用 kebab-case：`/user/order-history` 而非 `/user/orderHistory`
- 详情页用路径参数：`notice/:id`，页面里用 `useParams()`（React）或 `route.params.id`（Vue）读
- 新增路由追加到已有路由表，不要重写整个文件

**前端守卫只是菜单级屏蔽，不是安全边界。** 用户改本地 `userInfo.role` 就能绕过路由，真正的权限校验在后端（`@RequireAdmin` / `adminMiddleware` / `admin_required`），越权接口会返 `code:403`。答辩被问到权限设计时这么答。


**两个存在但未被使用的东西，不要误判为缺陷**：

1. **`meta.title` 定义了却没人消费** —— 三个 Vue 项目全局搜 `document.title` 与 `meta.title` 的读取，结果都是 0。它目前只是路由说明。想让浏览器标签页跟着变，在 `beforeEach` 里加一行 `document.title = to.meta.title || '系统名'` 即可——**这是个不错的细节分**，但不加也不算错
2. **`/user` 下只有 `profile` 带 `requiresAuth`** —— 首页、公告列表、公告详情都是开放页，未登录可浏览。这是故意的设计，不要给整个 `/user` 加上鉴权

---

## 5. 页面组件规范

### 5.1 管理后台页面的四段结构

所有管理端页面都是同一个骨架，从外到内四层：

1. **最外一层 Card**，`title` 放模块名，`extra` 放顶部操作按钮（添加、批量删除）
2. **toolbar 区**，紧贴在表格上方，放搜索框、下拉筛选、搜索按钮
3. **Table 区**，带 `loading`、`rowSelection`（批量操作）、`pagination`
4. **Modal 区**，页面专属的新增/编辑弹窗，**内联在页面文件里**不抽组件。涉及头像的放 `AvatarUpload`，表单用 `layout="vertical"` + 双列 grid

Vue 版第五段是 `<style scoped>`。React 版没有样式段，样式写在 `styles/admin.css` 里。

### 5.2 写页面前先读一个同类页面

**不要照文档里的模板写页面，直接读脚手架里最接近的那个页面文件，照它的写法改。**

脚手架每个前端都带 13 个成品页面，覆盖了毕设会遇到的全部页面类型。按你要写的东西挑一个当范本（行数为 react 版，Vue 三版因含模板与样式段普遍多 0–50%）：

| 你要写的页面 | 读这个文件 | react 行数 | 里面有什么 |
|---|---|---|---|
| 管理端列表页（增删改查全套） | `views/admin/UserManage.*` | 350 | 搜索筛选 + 表格 + 批量删除 + 内联新增/编辑弹窗 + 头像上传 |
| 管理端列表页（带富文本） | `views/admin/NoticeManage.*` | 264 | 同上 + 富文本编辑器 |
| 管理端只读列表页 | `views/admin/LogManage.*` | 264 | 搜索 + 表格 + 批量删除，无编辑弹窗 |
| 管理端图表页 | `views/admin/Dashboard.*` | 164 | 统计卡片 + ECharts 图表 |
| 管理端信息展示页（无表格）| `views/admin/SystemStatus.*` | 164 | 描述列表 + 进度条，纯展示无交互 |
| 个人资料页（改信息 + 改密码）| `views/admin/Profile.*` | 258 | 详情/编辑双态切换 + 修改密码弹窗 |
| 用户端首页 | `views/user/Home.*` | 59 | Banner + 统计卡片 + 内容区 |
| 用户端列表页 | `views/user/Notice.*` | 81 | 卡片列表（**不是表格**）+ 分页 |
| 用户端详情页 | `views/user/NoticeDetail.*` | 69 | 返回按钮 + 描述列表 + 正文 |
| 登录/注册页 | `views/Login.*` / `views/Register.*` | 92 / 133 | 表单校验 + 验证码组件 |
| 404 页 | `views/NotFound.*` | 33 | 最短的一个，看基础结构 |

**为什么不给完整代码模板**：脚手架会改。比如 `UserManage.jsx` 现在有 `useCallback`、`Alert` 提示条、`ResizableTitle` 可拖拽列宽、`GENDER_OPTIONS` 常量提取——这些都是后来加的，写死在文档里的模板必然滞后。**读真实文件永远不会过期。**

### 5.2.2 两处故意的重复，不要重构

以下两组文件内容高度重叠，**这是故意的，不是缺陷**。审查代码时不要报为重复代码，也不要自作主张抽公共组件：

1. **`admin/Profile.*` 与 `user/Profile.*`** —— 四个前端都是两份几乎逐字相同的文件（vue-elementplus 完全一致，其余三版仅差 1–2 行）。两端共用同一个 `PUT /api/user/update` 接口，但分属不同路由与 Layout（`/admin/profile` 在 AdminLayout 内，`/user/profile` 在 UserLayout 内）。抽成公共组件反而要多传一堆 props 区分两套视觉，**保持两份更好改**
2. **`Dashboard.*` 与 `SystemStatus.*`** —— 行数相同且都是统计展示页，但前者是业务数据图表，后者是运行环境信息，职责不同

你新增业务模块时同样适用：**两个页面长得像不是重构的理由**，除非它们真的会一起变。毕设阶段过度抽象反而难给导师解释。

### 5.2.1 读的时候重点看这六处

| # | 看什么 | 为什么 |
|---|---|---|
| 1 | import 段 | 哪些组件从哪个库来、API 函数怎么引、路径用相对还是 `@/` |
| 2 | 状态声明段 | 分页/筛选/弹窗状态的命名习惯（`pageNum` `loading` `editing` `modalVisible`） |
| 3 | `fetchList` 函数 | 请求怎么发、`res.data.records` 怎么取、`loading` 怎么收尾 |
| 4 | 表格 columns 定义 | 序号列算法、Tag 用法、操作列 `fixed: 'right'` |
| 5 | 弹窗部分 | add 和 edit 怎么共用一个弹窗（靠 `editing` 是否为 null 区分） |
| 6 | 样式段 | 用了哪些约定 class（见 §7.4），有没有 scoped |

**新增业务模块时，正确做法是复制整个页面文件再改**，比从零写快，也不会漏掉 loading、批量选择这些容易忘的细节。

---

### 5.3 页面规则（React + Vue 通用）

- **Card 包裹**：管理后台页面一律用 `<Card title="...">` / `<a-card>` / `<el-card>` / `<n-card>` 包裹
- **toolbar 筛选区**：固定在表格上方，用 `class="toolbar"`，flex 横向排列
- **Table**：必须带 `loading`、`rowSelection`（批量操作）、`pagination`
- **pagination 字段名**：用 `pageNum` + `pageSize`（脚手架后端用的是这两个字段）
- **Modal 编辑弹窗**：页面专属的 add/edit 弹窗**内联在页面文件中**，不拆成独立组件。只有被多个页面共享的弹窗才需要抽出
- **Form 双列布局**：弹窗内表单用 `display:grid; grid-template-columns:1fr 1fr; gap:0 16px` 双列布局
- **错误处理**：由 request 拦截器统一处理，组件中不需要 `message.error`（删除/提交成功的提示除外）
- **表格操作列**：固定在最右（`fixed: 'right'`），使用 `class="table-actions"` 包装按钮
- **序号列**：通过 `(pageNum - 1) * pageSize + index + 1` 计算，不用后端返回的 id

---

### 5.4 用户端 vs 管理端：两套视觉语言

**用户端页面和管理端页面长得一模一样是毕设常见扣分点。** 用户端页面需要有独立的视觉语言，让导师一眼看出"这是给普通用户用的"。

### 5.4.1 两套设计体系对比

| 维度 | 管理端页面 | 用户端页面 |
|------|----------|----------|
| 页面结构 | Card → Toolbar → Table → Modal | Hero/Banner → 统计卡片 → 内容区 → 表单卡片 |
| 数据展示 | **Table 表格**（行+列，批量操作） | **卡片/列表**（每条数据独立成卡，或描述列表） |
| 表单布局 | **双列 grid 紧凑排列** | **单列堆叠**（字段少）或**分区卡片**（字段多） |
| 标题层级 | 无 h1-h3 层级，Card title 就是标题 | **h1 页面大标题 → h2 分区标题 → h3 子区块** |
| 颜色运用 | 表格内 Tag 区分角色/状态 | **关键数据用主色大字**，次要数据灰色小字，状态用彩色 Badge |
| 操作按钮 | 表格行内按钮 + 顶部批量按钮 | 页面底部单个主按钮，或卡片右上角小按钮 |
| 最大宽度 | 无限制（表格横向滚动） | **max-width: 720-900px** 居中 |
| 典型场景 | 用户管理、日志管理、公告管理 | 首页仪表盘、个人信息、业务详情、用户端表单 |

### 5.4.2 用户端页面从上到下的结构

范本是 `views/user/Home.*`（59 行）和 `views/user/NoticeDetail.*`（69 行），直接读。

结构顺序：

1. **Banner / Hero 区** —— 用脚手架已有的 `.banner` class（渐变底 + 白字），里面 `<h1>` 放页面大标题、`<p>` 放副标题
2. **统计卡片区**（可选）—— 横排 3–4 个卡片，放数量类指标
3. **内容区** —— 每个分区一个 Card，Card 内顶部一行 `<h2>` 分区标题
4. **表单区**（如果有）—— 单列堆叠，限宽居中

### 5.4.3 详情页规范

**详情页是独立路由的只读页，不是 Modal。** 范本 `views/user/NoticeDetail.*`。

| 规则 | 说明 |
|---|---|
| 独立路由 | `/user/notice/:id` 这种形式，不要用弹窗代替 |
| 左上角有返回 | Vue 用 `router.back()`，React 用 `navigate(-1)` |
| h1 是数据标题 | 放数据本身的名称（公告标题、用户名），不是"详情页"三个字 |
| h2 分区标题 | 每个 Card 内一个，用 `user.css` 里的 `.section-title` |
| 只读数据用 Descriptions | antd 系 `<a-descriptions>` / `<Descriptions>`，ElementPlus `<el-descriptions>`，Naive 用 `<n-descriptions>`。**不要用 Table** |
| 状态用彩色 Tag | 通过/待审/拒绝 → green/blue/red，不要写成纯文字 |
| 富文本正文 | 用 `v-html` / `dangerouslySetInnerHTML`，外层套脚手架的 `.rich-content` class |

### 5.4.4 用户端表单规范

按字段数量决定布局：

- **≤ 5 个字段**：单列堆叠（`layout="vertical"`），`max-width: 480px` 居中
- **6–10 个字段**：分 2–3 个 Card，每个 Card 3–5 个字段，各自单列堆叠
- **> 10 个字段**：分步骤（Steps），每步一个 Card

与管理端的区别：

| | 管理端 | 用户端 |
|---|---|---|
| 布局 | 弹窗内双列 grid `1fr 1fr` | 单列堆叠，`max-width: 480–600px` |
| 按钮 | 弹窗底部 `okText="保存"` | 页面底部 `size="large"` + `block` 通栏 |
| 分区 | 无，一个弹窗一个 Form | 多个 Card 分区，每区带 `<h2>` |
| 输入框 | 默认尺寸 | `size="large"` |
| 占位提示 | 简短（"请输入用户名"） | 更友好（"请输入你的昵称"） |

### 5.4.5 标题与颜色的层级

**用脚手架已有的 class 和变量，不要自己造。** 用户端的标题与文字 class 分两处：公共的在 `global.css`，用户端专用的在 `user.css`。

| 用途 | class | 定义在 |
|---|---|---|
| 页面大标题（管理端）| `.page-title` | `global.css` |
| Banner 内标题 | `.banner` 里的 `h1` | `global.css` |
| 次要文字 | `.text-sub` | `global.css` |
| 更淡的说明文字 | `.text-mute` | `global.css` |
| 两行截断 | `.text-ellipsis-2` | `global.css` |
| 富文本正文容器 | `.rich-content` | `global.css` |
| 详情页外层 | `.detail-page` | `user.css` |
| 详情页大标题 / 副标题 | `.detail-title` / `.detail-subtitle` | `user.css` |
| 详情页分区容器 / 分区标题 | `.detail-section` / `.section-title` | `user.css` |
| 主色强调文字 | `.text-primary` | `user.css` |
| 用户端置灰文字 | `.text-muted` | `user.css` |

注意 `global.css` 是 `.text-mute`，`user.css` 是 `.text-muted`（多一个 d），**两个名字都存在且各自生效**，写用户端页面时用哪个都行但要与同页面保持一致。

数据重要性靶三档区分：

1. **最核心**（编号、金额、状态）—— `.text-primary`，或 `color: var(--color-primary)` + `font-weight: 600`
2. **重要**（名称、标题）—— 默认色 + `font-weight: 600`
3. **次要**（时间、备注）—— `.text-muted` / `.text-mute`，字号小一档

真的需要新 class 时写进 `user.css`，并且**必须用 `--color-*` 前缀的变量**（不存在 `--primary`、`--text`、`--text-secondary` 这类简写，详见 `style-integration.md §3`）。

### 5.4.6 禁止的用户端写法

| 禁止 | 原因 | 替代方案 |
|------|------|---------|
| 用户端用 `<Table>` 展示数据 | 看起来像管理后台 | 用 `<Descriptions>` 或卡片列表 |
| 详情页用 Modal 弹窗 | 导师认为你没有独立的详情功能 | 独立路由 `/xxx/detail/:id` |
| 用户表单用双列 grid | 看起来像管理端批量录入 | 单列堆叠 + 分区卡片 |
| 用户端无 h1/h2 标题层级 | 页面结构扁平，没有信息层次 | h1 标题 + h2 分区 + h3 子区块 |
| 所有数据同一颜色 | 看不出哪些数据重要 | 主色标核心数据，灰色标次要 |
| 详情页缺返回按钮 | 用户困在详情页出不去 | 左上角 `< 返回` 按钮 |

---

## 6. 弹窗/表单组件规范

### 6.1 弹窗拆分原则

**默认内联，共享才抽。**

| 场景 | 放哪里 | 示例 |
|------|--------|------|
| 页面专属的 add/edit 弹窗 | 内联在页面文件中 | `UserManage.vue` 内的 `<a-modal>` |
| 被 ≥2 个页面复用的弹窗 | 抽到 `components/` | `AvatarUpload.vue`（多页面复用） |
| 纯展示/确认弹窗 | `Modal.confirm()` 链式调用 | 删除确认 |

脚手架的所有管理页面（UserManage / NoticeManage 等）都把 add/edit Modal **内联在同一文件中**。

### 6.2 内联弹窗的结构

从上到下：头像上传（如涉及）→ 提示条（可选）→ Form。

要点：

- **Modal 宽度 640**，`title` 和 `okText` 都靠 `editing` 是否为 null 切换（`editing ? '编辑XXX' : '添加XXX'`）
- **Form 用 `layout="vertical"`**，内部套一层双列 grid 容器（`display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px`），grid 写在内联 style 里是脚手架现状
- **需要跨列的字段**（如富文本、长文本域）在该 Form.Item 上加 `gridColumn: '1 / -1'`
- **头像上传居中**，外层 div 加 `textAlign: 'center'` + 下边距

`UserManage` 的弹窗里还有一个 `<Alert type="info">` 说明"角色与密码不在本表单修改"，这是因为后端限制了该接口只能改基本资料。**新增模块有类似的字段限制时，照这个做法给用户一句说明**，比让用户改完发现没生效要好。

### 6.3 表单状态管理

| 框架 | 表单实例 | 编辑回填 | 提交校验 |
|---|---|---|---|
| React | `Form.useForm()` | `form.setFieldsValue(record)` | `form.validateFields()` |
| Vue-Antd | `ref(null)` 绑到 `<a-form ref="formRef">` | 自写 `resetForm(record)` | `formRef.value.validate()` |
| Vue-ElementPlus | `ref(null)` 绑到 `<el-form ref="formRef">` | 自写 `resetForm(record)` | `formRef.value.validate()` |
| Vue-Naive | `ref(null)` 绑到 `<n-form ref="formRef">` | 自写 `resetForm(record)` | `formRef.value.validate(callback)` |

关键细节：

- **新增和编辑共用一个 Modal**，靠 `editing` 区分：`null` = 新增，record 对象 = 编辑
- **`resetForm()` 处理两种场景**：传 record 就回填，不传就清空并填默认值
- **编辑时用户名框 disabled**，用户名不可改
- **新增时才显示密码框**，编辑态直接不渲染这个字段（`{!isEdit && <Form.Item ...>}`）。改密码走独立的 `updatePassword` 接口
- **Naive 的 `validate()` 是回调风格**，不返回 Promise，写法和另外三个不同

---

## 7. 样式规范

### 7.1 三件套分工

`<FE>/src/styles/` 下固定三个文件，四个前端一致：

| 文件 | 作用域 | 引入位置 |
|---|---|---|
| `global.css` | CSS 变量（`:root`）+ 重置 + 登录/注册/404 等公开页 | `main.jsx` / `main.js` |
| `admin.css` | 管理端布局与组件皮肤 | `layouts/AdminLayout.*` |
| `user.css` | 用户端布局与组件皮肤 | `layouts/UserLayout.*` |

**新增样式按作用域归入这三个之一，不要建第四个全局 css。** 只有 `global.css` 含 `:root` 变量定义，另两份只能读变量。

### 7.2 CSS 变量：只有 `--color-*` 这一套

变量名统一是带前缀的形式，`global.css` 的 `:root` 里共 **35 个**，分 8 组：

| 组 | 前缀 | 个数 |
|---|---|---|
| 主色色阶 | `--color-primary` / `-hover` / `-active` / `-bg` / `-bg-deep` | 5 |
| 文字 | `--color-text` / `-sub` / `-mute` / `-disable` | 4 |
| 背景与边框 | `--color-bg-page` / `-bg-card` / `-bg-hover` / `--color-border` / `-deep` | 5 |
| 状态色 | `--color-success` / `-warning` / `-danger` | 3 |
| 阴影 | `--shadow-sm` / `-md` / `-lg` | 3 |
| 布局尺寸 | `--h-header` / `--h-footer` / `--w-sider` / `--w-sider-mini` / `--w-container` | 5 |
| 圆角 | `--radius-sm` / `-md` / `-lg` | 3 |
| 字体 | `--font-sans` + `--font-size-xs…xxl`（6 档）| 7 |

**不存在 `--primary`、`--bg`、`--text`、`--text-secondary`、`--cta` 这些简写。** 写了不生效。改色方法见 `style-integration.md §3`。

`global.css` 里除了变量，只放 body 基础、滚动条、公开页样式。**页面特有样式不写在这**。

### 7.3 页面样式

- **Vue**：`<style scoped>`
- **React**：写进 `styles/admin.css` 或 `styles/user.css`。**脚手架里没有任何 `.module.css`**，不要新引入 CSS Module
- 内联 style 超过 3 个属性就抽成 class。单属性的语义状态色（`color: '#52c41a'` 成功绿）内联是脚手架现状，可以照做

### 7.4 已有的约定 class

以下 class 在 `global.css` 里已定义，**新增页面直接用，不要另起名字**：

| class | 用途 |
|---|---|
| `.page` / `.page-title` | 页面容器 / 页面大标题 |
| `.card` / `.section` | 卡片 / 分区间距 |
| `.toolbar` / `.toolbar-right` | 表格上方筛选栏 / 栏内右对齐组 |
| `.table-actions` | 表格操作列按钮容器 |
| `.btn-edit` / `.btn-delete` | 编辑/删除按钮的描边配色 |
| `.pagination-wrap` | 分页容器（右对齐） |
| `.banner` | 用户端 Hero 区（渐变底白字） |
| `.auth-screen` / `.auth-card` | 登录注册页外层 |
| `.avatar-box` / `.avatar-box-tip` | 头像上传区 |
| `.rich-editor-wrap` / `.rich-content` | 富文本编辑器 / 富文本正文展示 |
| `.text-sub` / `.text-mute` | 次要文字 / 更淡的说明文字 |
| `.text-ellipsis-2` | 两行截断 |
| `.stack-16` / `.stack-24` / `.mb-8` / `.mb-16` / `.mb-24` | 间距工具类 |

`admin.css` 里另有 `.a-` 前缀的一套布局 class（`.a-layout` `.a-sider` `.a-header` `.a-content` `.a-stat-grid` `.a-chart-grid` 等），`user.css` 里同样有 `.u-` 前缀的一套（`.u-layout` `.u-header` `.u-nav` `.u-content` 等）。**这两套是 Layout 专用的，业务页面不要引用。**

`user.css` 里面向业务页面的是详情页与文字那几个（`.detail-page` `.detail-title` `.detail-subtitle` `.detail-section` `.section-title` `.text-primary` `.text-muted`），写用户端页面时直接用。react 版另有 `.home-hero` `.home-intro` 等首页专用 class，Vue 三版没有（首页样式写在 `<style scoped>` 里）。

### 7.5 配色落地

阶段 1.5 风格选型完成后改 `:root` 里主色那 5 个色阶，另有 ECharts 等 4 处硬编码要同步。完整步骤见 `style-integration.md §3`。

---

## 8. 注释规范（红线）

### 8.1 禁止三类

1. **带标签的完整 JSDoc** —— 有 `@param` / `@returns` / `@description` 的就是违规。函数签名已经说明了参数，标签是纯噪音
2. **步骤编号注释** —— `// 1. 获取表单数据` `// 2. 校验表单` 这种把代码翻译一遍的清单
3. **废话注释** —— `const token = localStorage.getItem('token') // 获取 token`

**允许的是**：`api/*.js` 里每个函数上面一行块注释标用途（`/** 用户注册 */`），这是脚手架风格。区别在于**没有标签、只有一句人话**。

### 8.2 什么值得注释

只注释"为什么"，不注释"是什么"。脚手架里的合格例子：

- `// 走 store 的 logout 而不是直接摸 localStorage，避免 store 与本地存储不一致` —— 解释了为什么不用更直觉的写法
- `// redirecting 防重入，避免多个并发请求同时 401 时弹出多个提示` —— 解释了一个看不出用途的变量
- `// 前端只做菜单级屏蔽，真正的权限校验在后端` —— 交代了设计边界
- `// 因为 Naive UI 的 useMessage 必须在 setup 内调用, 这里用 window 级提示` —— 解释了绕路的原因

临时方案用 `FIXME:` 标明并写清原因（比如密码明文存储那处，脚手架目前没标，你可以自己补上）。**不要留 `TODO`**，要么做完要么删掉。脚手架全库目前 `TODO` / `FIXME` 数量都是 0，交付时也应该保持这个状态。

### 8.3 量化标准

- 注释行数 ÷ 总行数 ≤ 3%
- 一个文件超过 5 条注释就该重新审视
- API 文件可以 0 注释

---

## 9. 变量命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 函数名 | 动词开头，camelCase | `fetchList`, `handleDelete`, `handleSubmit` |
| 变量名 | 名词，camelCase | `list`, `loading`, `selectedIds` |
| 常量 | UPPER_SNAKE_CASE | `PAGE_SIZE`, `GENDER_OPTIONS` |
| 组件名 | PascalCase | `UserManage`, `AvatarUpload` |
| 页面/组件文件名 | PascalCase，与组件同名 | `UserManage.vue`, `AvatarUpload.jsx` |
| 非组件文件名 | camelCase | `request.js`, `userStore.js` |
| 目录名 | 全小写单词 | `views/`, `admin/`, `components/` |
| API 函数 | 动作+模块 | `pageQueryUser`, `deleteUserBatch` |

脚手架的高频命名，新页面跟着用：`loading` `list` `total` `pageNum` `pageSize` `selectedIds` `modalVisible` `editing` `fetchList` `handleAdd` `handleEdit` `handleDelete` `handleSubmit`。

**禁止**：拼音变量名（`yonghu`）、单字母变量（`d` `r`，`map`/`forEach` 的 `item` `i` 除外）、无意义缩写（`usrLst` `btnClk`）。

**后端出口已统一转驼峰**，前端一律读 `createTime` / `updateTime` / `createBy`，不要写 `create_time`。

---

## 10. 四个 UI 库的 API 差异对照

写代码前先确认当前项目用哪个库（看 `package.json`），然后照这张表用对应写法。**混用会直接报错或样式错乱。**

### 10.1 基础差异

| | React + antd | Vue + antd | Vue + ElementPlus | Vue + NaiveUI |
|---|---|---|---|---|
| 组件前缀 | `<Card>` `<Table>` | `<a-card>` `<a-table>` | `<el-card>` `<el-table>` | `<n-card>` `<n-data-table>` |
| 注册方式 | 直接 import | `app.use(Antd)` 全局 | `app.use(ElementPlus)` 全局 | **按需 import，无全局注册** |
| 图标库 | `@ant-design/icons` | `@ant-design/icons-vue` | `@element-plus/icons-vue` | `@vicons/ionicons5` |
| 图标用法 | `icon={<PlusOutlined />}` | `<template #icon>` | `<el-icon><Plus /></el-icon>` | `<n-icon><Add /></n-icon>` |

### 10.2 消息提示与确认框

| | 成功提示 | 确认框 | 注意 |
|---|---|---|---|
| React + antd | `message.success('删除成功')` | `Modal.confirm({ ... onOk })` | 从 `antd` import |
| Vue + antd | `message.success('删除成功')` | `Modal.confirm({ ... onOk })` | 从 `ant-design-vue` import |
| Vue + ElementPlus | `ElMessage.success('删除成功')` | `ElMessageBox.confirm(内容, 标题, opts).then().catch()` | **取消操作必须 `.catch(() => {})`**，否则控制台报未捕获异常 |
| Vue + NaiveUI | `message.success('删除成功')`，`message` 来自 `useMessage()` | `dialog.warning({ ... onPositiveClick })` | **`useMessage()` / `useDialog()` 必须在 setup 内调用** |

### 10.3 表格分页

| | 写法 |
|---|---|
| antd 系（React/Vue） | Table 的 `pagination` prop 传对象：`{ current, pageSize, total, onChange }` |
| ElementPlus | **独立组件** `<el-pagination>` 放表格下方，套在 `.pagination-wrap` 里，`@current-change` 触发重查 |
| NaiveUI | `<n-data-table>` 的 `pagination` prop（computed 对象）+ **必须加 `remote`**，表示后端分页而非前端切片 |

### 10.4 表格列定义

antd 系和 ElementPlus 用模板/JSX 写自定义列内容。**NaiveUI 的 columns 是纯 JS 数组，自定义内容要用 `render` + `h()` 函数**：

- 选择列写 `{ type: 'selection' }`
- 序号列用 `render: (_r, i) => (pageNum.value - 1) * pageSize + i + 1`
- Tag 列用 `render: (row) => h(NTag, { type: ... }, () => 文本)`
- 操作列用 `render: (row) => h('div', { class: 'table-actions' }, [h(NButton, {...}, () => '编辑'), ...])`，并加 `fixed: 'right'`

用到的组件（`NTag` `NButton`）要在 `<script setup>` 里 import 进来，`h()` 也要从 `vue` import。

### 10.5 表单校验

| | rules 定义 | 触发校验 |
|---|---|---|
| React + antd | 写在 `<Form.Item rules={[...]}>` 上 | `form.validateFields()`，返回 Promise |
| Vue + antd | 对象或 `ref`，绑 `<a-form :rules>` | `formRef.value.validate()`，返回 Promise |
| Vue + ElementPlus | **`computed(() => ({...}))`**，因为规则可能随 `editing` 变 | `formRef.value.validate()`，返回 Promise |
| Vue + NaiveUI | 对象，绑 `<n-form :rules>` | **`formRef.value.validate((errors) => {...})`，回调式不返回 Promise** |

ElementPlus 用 computed 是为了让密码字段在编辑态变成非必填（`editing.value ? [] : [{ required: true }]`）。

### 10.6 Naive UI 的 window 全局实例

`useMessage()` 在 `api/request.js` 里调不了（非 setup 上下文）。脚手架的解法是一个隐藏组件 `components/GlobalApi.vue`：它挂在 `App.vue` 的 provider 树里，在自己的 setup 里调 `useMessage()` / `useDialog()` / `useNotification()` / `useLoadingBar()`，然后挂到 `window.$message` 等四个全局变量上。

`request.js` 里通过 `window.$message` 和 `window.$loadingBar?.` 使用。**这套机制已配好，不要改动，也不要以为它挂在 `main.js` 里。**
