# 开发自检清单

本文件定义：**每个模块生成完后的 8 项自检标准**。

> 前置阅读：本文件只在写完代码后使用。代码怎么写看 `code-standards.md`。

---

## 0. 自检流程

```
写完一个模块的代码
      ↓
逐项执行 9 项检查
      ↓
  ┌─ 全部通过 → 标记 ✅，进入下一模块
  └─ 有未通过 → 修复 → 重新自检
```

**自检时机**：阶段 2 的每个模块（基础层 / 用户模块 / 核心业务 / 公告 / 日志 / 文件）完成后立即执行。

**自检工具**：优先用 grep 类搜索工具与 `wc -l` 命令核查，避免肉眼遗漏。下文示例里的 `search_content "<正则>" --glob "<模式>" --path <目录>` 是**伪代码**，请换成当前环境实际可用的搜索工具（如 grep 工具，或 `rg "<正则>" -g "<模式>" <目录>`）。

---

## 0.1 路径变量（跑命令前必须先确定）

下文所有命令里的 `<FE>` 指**前端根目录**，定义见 `SKILL.md` §1.5。跑任何检查命令前先 `ls` 确认它到底是什么：

| 场景 | `<FE>` 取值 |
|------|-------------|
| 抽出来的新项目（推荐） | `frontend` |
| 多前端并行 | `frontend-react` / `frontend-vue` 等 |
| 直接在脚手架仓库里开发 | `frontends/react` / `frontends/vue-antd` 等 |

同理 `<BE>` 指后端根目录（`backend` 或 `backends/springboot` 等）。

### ⚠️ 假通过防范

**路径写错时，搜索命令会返回零结果——这看起来和“检查通过”一模一样。** 两个必做的预防：

1. **跑第一条命令前先验证目录存在**：`ls <FE>/src/views` 能列出文件才往下走。报 `No such file` 就是路径错了，不是代码干净
2. **uniapp / wxapp 没有 `src/` 目录**，下文命令要**把 `<FE>/src/` 改成 `<FE>/`**，并把 `views/` 改成 `pages/`、`stores/` 改成 `store/`（wxapp 是 `utils/`）。不改就全部返空假通过。跨端项目的完整目录差异见 `crossplatform-standards.md §1`

每项检查输出结果时，**要区分“搜了但没命中”和“目录不存在”**，后者不能计作通过。

---

## 1. 文件结构检查

**检查目标**：文件放在正确的目录下。

| 文件类型 | 正确位置 | 错误位置 |
|---------|---------|---------|
| API 函数 | `src/api/<module>.js` | `src/utils/` / 组件内联 |
| 页面组件 | `src/views/<admin\|user>/` | `src/components/` |
| 公共组件 | `src/components/` | `src/views/` |
| Store | `src/stores/` | `src/utils/` |
| 样式 | `src/styles/`（全局三件套）或 scoped（页面） | 行内 style 复杂样式 |
| 图片/静态资源 | `public/`，或 `src/assets/`（仅当该目录已存在） | `src/` 根目录 |

**三条容易误判的差异，先看清再下结论**：

1. **`src/assets/` 不是每个前端都有** —— vue-antd、vue-elementplus 有；react、vue-naive 没有。后两者的静态资源放 `public/`，**不要因为「缺少 assets 目录」判为不合规**，也不要为了凑结构新建空目录
2. **`src/utils/` 不一定是错的** —— react 版的 `request.js` 就在 `src/utils/request.js`（vue 三版在 `src/api/request.js`）。表格里「错误位置 `src/utils/`」指的是**业务 API 函数**不该放那儿，请求封装本身放 `utils/` 是 react 版的既定结构
3. **`src/` 根目录允许存在入口文件** —— `App.vue`/`App.jsx`、`main.js`/`main.jsx` 本来就在根目录，react 版的路由还写在 `src/App.jsx` 里。判断散落文件时要排除这几个

**检查命令**：
```bash
# 确认 api/ 目录下都是 API 文件，无组件代码
ls <FE>/src/api/

# 列出 src/ 根目录文件，人工排除 App.* 与 main.* 后应为空
ls <FE>/src/
```

---

## 2. API 封装检查

**检查目标**：所有 HTTP 请求走 request 封装。

**通过标准**：
- [ ] 所有 API 调用通过 `api/<module>.js` 中的函数
- [ ] 组件中无 `axios.post/get/put/delete` 裸调用
- [ ] 组件中无 `fetch()` 调用
- [ ] request 封装的 baseURL 为 `/api`

**request.js 位置因前端而异**，搜不到不是缺失：

| 项目 | 路径 |
|---|---|
| react | `<FE>/src/utils/request.js` |
| vue-antd / vue-elementplus / vue-naive | `<FE>/src/api/request.js` |

四个前端的 `baseURL` 均已确认是 `/api`，真实后端地址靠 `vite.config.js` 的 proxy 转发。**不要建议把它改成完整 URL 或环境变量**。

**检查命令**（两条均应返空，Vue 项目把 `*.vue` 换成 `*.jsx` 即 React 版）：
```bash
search_content "axios\." --glob "*.{vue,jsx}" --path <FE>/src/views
search_content "fetch(" --glob "*.{vue,jsx}" --path <FE>/src/views
```

还要顺手看 `<FE>/src/components`，上传类组件容易绕过封装直接发请求。

---

## 3. Store 使用检查

**检查目标**：token/userInfo 走 Store，不裸读 localStorage。

**通过标准**：
- [ ] 组件获取 token 走 `useUserStore(state => state.token)`（React）或 `userStore.token`（Vue）
- [ ] 组件获取 userInfo 走 Store，不直接 `JSON.parse(localStorage.getItem('userInfo'))`
- [ ] login/logout 通过 Store action 执行
- [ ] Store action 内部同步写入 localStorage

**两处合法的 localStorage 直读，不要报为问题**：

1. **Store 自身**（`stores/user*.js`）—— 初始化读取与持久化写入就在这里，本来就该直接操作
2. **react 版的 `src/utils/request.js`** —— 拦截器里有 2 处 localStorage 直读。Vue 三版的 `api/request.js` 是 `useUserStore()` 取 token（localStorage 计数 0），**两种写法都是既定实现，不要去统一**

已实测四个前端的 `views/` 下 localStorage / axios / fetch 裸调用**均为 0**，这是基准线。你新写的页面如果搜出来，就是你引入的。

**检查命令**：
```bash
# views/ 与 components/ 下应为零命中
search_content "localStorage" --glob "*.{vue,jsx}" --path <FE>/src/views
search_content "localStorage" --glob "*.{vue,jsx}" --path <FE>/src/components
```

---

## 4. 组件拆分检查

**检查目标**：单文件不超过行数上限。弹窗默认内联在页面中（脚手架风格），不强制拆出。

**通过标准**：

| 文件类型 | 行数上限 | 脚手架实测最大值 |
|---------|---------|------|
| 页面组件（含内联弹窗） | ≤ 400 | 390（vue-antd `UserManage.vue`） |
| 可复用组件（components/） | ≤ 200 | 122（`AvatarUpload.vue`） |
| 布局组件（layouts/） | ≤ 200 | 127（`AdminLayout.vue`） |
| 业务 API 文件 | ≤ 80 | 65（react `api/user.js`） |
| request 封装 | ≤ 100 | 75（vue 版 `api/request.js`） |
| Store 文件 | ≤ 80 | 44（vue-antd `stores/user.js`） |
| 工具函数 | ≤ 100 | — |

上限取得比实测最大值略宽，是给你新增业务的余量。**超不是错，是信号**：先看能不能把表格列定义、表单校验规则这类纯数据提到 `<script>` 顶部常量，再考虑拆组件。不要为了凑行数把单页面专用的弹窗拆到 `components/`（参见 code-standards.md §6.1）。

**检查命令**：
```bash
# React 项目
find <FE>/src/views -name "*.jsx" | xargs wc -l | awk '$1 > 400'

# Vue 项目
find <FE>/src/views -name "*.vue" | xargs wc -l | awk '$1 > 400'
```

---

## 5. 注释量检查

**检查目标**：无带标签的完整 JSDoc，无步骤编号注释，注释率 ≤ 3%。

**通过标准**：
- [ ] 无带 `@param` / `@returns` / `@description` 标签的注释块
- [ ] 无 `// 1.` `// 2.` `// 3.` 步骤编号注释
- [ ] 无 `// 获取 token` 等废话注释
- [ ] 无 `// TODO` 注释（要么做完要么删掉）
- [ ] API 文件可以 0 注释

**检查命令**：
```bash
# 搜带标签的 JSDoc（这才是违规的）
search_content "@param|@returns|@description" --glob "*.{vue,jsx,js}" --path <FE>/src

# 搜步骤编号注释
search_content "\/\/ [0-9]+\." --glob "*.{vue,jsx,js}" --path <FE>/src
```

**不要搜 `/**`**。脚手架的 `api/*.js` 普遍用单行块注释标函数用途（如标注“用户注册”），这是**允许**的写法，搜它会得到几十条假阳性。

---

## 6. 组件引入来源检查

**检查目标**：组件来源一致，不混用不同组件库。

**通过标准**：

| 前端框架 | UI 库 | 图标库 |
|---|---|---|
| React | `antd` | `@ant-design/icons` |
| Vue+Antd | `ant-design-vue` | `@ant-design/icons-vue` |
| Vue+ElementPlus | `element-plus` | `@element-plus/icons-vue` |
| Vue+NaiveUI | `naive-ui` | `@vicons/ionicons5` |

**四个前端共用的三个业务库不算混用**：`echarts`（图表）、`@wangeditor/editor`（富文本）、`axios`。React 额外有 `nprogress` `zustand` `react-resizable`，Vue 三版额外有 `pinia` `vue-router`（antd/naive 还有 `dayjs`）。这些都是脚手架自带依赖。

**检查命令**（先用 `package.json` 定位当前项目用哪个 UI 库，再搜另三个）：
```bash
# 1. 先看当前项目装了哪个 UI 库
cat <FE>/package.json

# 2. 再逐个确认另三个没被引入（每条都应返空）
search_content "from 'element-plus'|from \"element-plus\"" --path <FE>/src
search_content "from 'ant-design-vue'|from \"ant-design-vue\"" --path <FE>/src
search_content "from 'naive-ui'|from \"naive-ui\"" --path <FE>/src
search_content "from 'antd'|from \"antd\"" --path <FE>/src
```

只忽略**当前项目自己那一条**的命中，其余三条有任何命中就是混用。

---

## 7. 路由守卫检查

**检查目标**：需要登录的页面有 token 检查。

**通过标准**：
- [ ] 管理员页面（`/admin/*`）需要登录 + 管理员角色检查
- [ ] 用户个人页面（如个人中心）需要登录检查
- [ ] 公开页面（首页/公告/登录/注册）不需要登录
- [ ] 404 页面不需要登录

**检查方式**：
- **React**：路由定义在 `<FE>/src/App.jsx`（**没有 `router/` 目录**），看 `<ProtectedRoute>` 与 `<AdminRoute>` 包裹了哪些 Route
- **Vue 三版**：路由在 `<FE>/src/router/index.js`，看 `meta.requiresAuth` / `meta.requiresAdmin` 两个标记与 `router.beforeEach` 守卫逻辑

脚手架基准线：Vue 三版均为 `requiresAuth` 出现 3 处、`requiresAdmin` 2 处。**新增需登录的页面必须同步加 meta**，光添路由不加 meta 就是开放页。新增角色时还要改守卫判断（参见 feature-forge §2.1）。

---

## 8. 样式规范检查

**检查目标**：样式使用规范，无内联复杂样式。

**通过标准**：
- [ ] 全局样式写在 `<FE>/src/styles/` 的**三件套**里，新增样式按作用域归位，不新建第四个全局 css
- [ ] 页面样式用 scoped（Vue）或写进对应的 `admin.css` / `user.css`（React）
- [ ] 无内联 style 超过 3 个属性的情况
- [ ] `styles/*.css` 里的主题色走 CSS 变量（`var(--primary)`），不在规则里重新写死主色
- [ ] 无 `!important`（除非覆盖第三方库样式）

**三件套分工（四个前端一致）**：

| 文件 | 作用域 | 引入位置 |
|---|---|---|
| `global.css` | CSS 变量（`:root`）+ 重置 + 登录/注册/404 等公开页 | `main.jsx` / `main.js` |
| `admin.css` | 管理端布局与组件皮肤 | `layouts/AdminLayout.*` |
| `user.css` | 用户端布局与组件皮肤 | `layouts/UserLayout.*` |

只看 `global.css` 会漏看一半样式。**只有 `global.css` 包含 `:root` 变量定义**，另两份只能读变量不能重定义。

**两个容易误判的点**：

1. **React 版不用 CSS Module** —— 脚手架里没有任何 `.module.css`，样式就靠三件套 + 少量内联 style。**不要因为「没用 CSS Module」判为不合规**，也不要新引入这套机制
2. **内联的语义状态色不算硬编码违规** —— `style={{ color: '#52c41a' }}`（成功绿）、`'#ff4d4f'`（失败红）这类单属性写法在脚手架里本来就存在。这条检查只管 `styles/*.css` 里的**主色**是不是绕过了变量

**检查命令**：
```bash
# 确认三件套齐全，且没多出第四个全局 css
ls <FE>/src/styles/

# 搜索内联 style（看有无超过 3 属性的）
search_content "style=\{" --glob "*.jsx" --path <FE>/src

# 搜硬编码颜色：命中的 :root 变量定义行是合法的，只看变量定义之外的规则
search_content "#[0-9a-fA-F]{6}" --glob "*.css" --path <FE>/src/styles
```

---

## 8.5 用户端与管理端差异化检查

**检查目标**：用户端页面不使用管理端 Table+Modal 风格，有独立详情页。

**通过标准**：
- [ ] 业务数据（如公告、课程、订单）有独立详情页路由 `/xxx/detail/:id`
- [ ] 详情页使用 `<Descriptions>` 或卡片布局，**不用 `<Table>`**
- [ ] 用户端表单**单列堆叠**（不是双列 grid），`max-width: 480-600px`
- [ ] 页面有 h1 大标题 + h2 分区标题，分区标题有下划线分隔
- [ ] 核心数据（编号、金额、名称）用主色或加粗，次要数据（时间、备注）用灰色
- [ ] 详情页左上角有"返回"按钮
- [ ] 详情页不用 Modal 弹窗

**检查方式**：
- 打开用户端任意页面，问自己：这看起来像管理后台还是像给普通用户用的？
- 如果答案像管理后台 → 不通过

---

## 9. 框架一致性检查

**检查目标**：代码风格与选定的框架一致，未混入其他框架的模式。

**通过标准**：

| 选定框架 | 应该看到 | 不应该看到 |
|---------|---------|-----------|
| React | 相对路径 `'../../api/user'`，`localStorage.getItem('token')`（仅 request.js） | `@/` 别名，`defineStore`，`<script setup>` |
| Vue-Antd | `@/` 别名，`useUserStore().token`（request.js），`<script setup>`，NProgress | `window.location.href` 跳转，Zustand |
| Vue-ElementPlus | `@/` 别名，`ElMessage`，`<script setup>`，NProgress | `ant-design-vue` 组件，`message.success` |
| Vue-Naive | `@/` 别名，`useMessage()`/`useDialog()`（页面内），`<script setup>`，`window.$message` + `window.$loadingBar`（request.js） | `ant-design-vue` 组件，NProgress，`ElMessage` |

**已实测的基准线**（`src/` 全目录统计）：react 相对路径导入 36 次 / `@/` 别名 **0** 次；vue 三版 `@/` 别名 31–34 次 / 相对路径 **0** 次。两边完全不交叉，混了就是新引入的。

**两个不要误判的细节**：

1. **naive 版 request.js 用的是自定义 `notifyError()` 包装**（内部读 `window.$message`，拿不到就 fallback 到 `console.error`），不是直接调 `useMessage()`。因为 Naive 的 `useMessage` 必须在 setup 内调用。这是正确实现
2. **naive 版没有 NProgress**，用 `window.$loadingBar` 代替。不要因为「缺少加载进度条」去装 NProgress

**检查命令**：
```bash
# Vue 项目不应有相对路径导入 API（应该用 @/）
search_content "from '\.\.\/" --glob "*.vue" --path <FE>/src

# React 项目不应有 @/ 别名
search_content "from '@/" --glob "*.jsx" --path <FE>/src

# Vue-Antd 项目不应有 ElMessage
search_content "ElMessage" --path <FE>/src
```

---

## 10. 补充检查（不纳入 9 项但建议做）

### 10.1 控制台清洁度

```bash
search_content "console\.log" --glob "*.{vue,jsx,js}" --path <FE>/src
search_content "debugger" --glob "*.{vue,jsx,js}" --path <FE>/src
```

两项结果都应为空。

### 10.2 未使用的 import

手动检查每个新建/改动过的文件，确保所有导入都被使用。删除功能后忘改 import 是最常见的残留。

### 10.3 响应式适配

- [ ] 管理后台至少能在 1366×768 分辨率下正常显示（常见投影仪分辨率）
- [ ] 宽表格在小屏幕下可以横向滚动

**横向滚动的写法四版不同，照当前项目的来**：

| 项目 | 写法 |
|---|---|
| react | `scroll={{ x: 'max-content' }}` |
| vue-antd | `scroll="{ x: 'max-content' }"` |
| vue-naive | `scroll-x="1200"`（数值，列多时给 1400） |
| vue-elementplus | 无此属性，`el-table` 靠容器宽度自适应 |

列数少于 6 列时不加也行，**不要给每个表格都硬加**。

---

## 11. 自检结果模板

自检完成后输出：

```
📋 《XXX》模块自检报告

| # | 检查项 | 结果 | 备注 |
|---|--------|------|------|
| 1 | 文件结构 | ✅ | 文件在正确目录 |
| 2 | API 封装 | ✅ | 无裸 axios 调用 |
| 3 | Store 使用 | ✅ | token 走 Store |
| 4 | 组件拆分 | ✅ | UserManage.vue 285 行，含内联弹窗，未超 400 |
| 5 | 注释量 | ✅ | 1 条必要注释，无带标签 JSDoc |
| 6 | 引入来源 | ✅ | 全部来自 ant-design-vue，无跳库 |
| 7 | 路由守卫 | ✅ | /admin/* 已加 requiresAdmin |
| 8 | 样式规范 | ✅ | 新样式归入 admin.css，主色走变量 |
| 9 | 框架一致性 | ✅ | 全部 `@/` 别名，无跳框架模式 |

通过：9/9 ✅
可以进入下一模块。
```

**输出两条约束**：

1. **备注列要写具体数字或文件名**，不写「符合规范」这类空话。看不到证据的✅等于没查
2. **“目录不存在”不能写✅** —— 按 §0.1 的要求标为 ⚠，并注明是路径不对还是该前端本来没这个目录

---

## 12. 常见问题修复指南

| 问题 | 修复方式 |
|------|---------|
| 页面超 400 行 | 先把表格列定义、校验规则提到 `<script>` 顶部常量；仍超才拆页面逻辑到 hooks/composables。**不拆页面专用弹窗** |
| Vue 项目出现相对路径 `../../api/` | 改为 `@/api/` |
| React 项目出现 `@/` 别名 | 改为相对路径。（`vite.config.js` 里确实配了 `@` 别名，不会报错，但全项目 36 处都用相对路径，混写伤风格一致性） |
| Vue 组件里裸读 localStorage 取 token | 改为 `useUserStore().token` |
| React 组件里裸读 localStorage | 改为 `useUserStore(state => state.token)`（`utils/request.js` 里的两处除外） |
| 带 `@param`/`@returns` 标签的 JSDoc | 删掉标签，保留一行用途说明 |
| 步骤编号注释 | 全部删除 |
| 混用组件库 | 统一为 `package.json` 里已装的那一个，不新装依赖 |
| `styles/*.css` 里硬编码主色 | 改为 `var(--primary)` 等已有变量 |
| 新建了第四个全局 css | 按作用域并回 `global.css` / `admin.css` / `user.css` |
| console.log / debugger | 全部删除 |
| 用户端页面长得像管理后台 | 按 §8.5 改：拆独立详情页路由，换卡片/Descriptions 布局 |
