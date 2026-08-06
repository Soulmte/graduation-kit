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

## 1. 文件结构检查

**检查目标**：文件放在正确的目录下。

| 文件类型 | 正确位置 | 错误位置 |
|---------|---------|---------|
| API 函数 | `src/api/<module>.js` | `src/utils/` / 组件内联 |
| 页面组件 | `src/views/<admin\|user>/` | `src/components/` |
| 公共组件 | `src/components/` | `src/views/` |
| Store | `src/stores/` | `src/utils/` |
| 样式 | `src/styles/`（全局）或 scoped（页面） | 行内 style 复杂样式 |
| 图片/静态资源 | `public/` 或 `src/assets/` | `src/` 根目录 |

**检查命令**：
```bash
# 确认 api/ 目录下都是 API 文件，无组件代码
ls frontends/<项目>/src/api/

# 确认无 .vue/.jsx 文件散落在 src/ 根目录
ls frontends/<项目>/src/*.{vue,jsx} 2>/dev/null
```

---

## 2. API 封装检查

**检查目标**：所有 HTTP 请求走 request 封装。

**通过标准**：
- [ ] 所有 API 调用通过 `api/<module>.js` 中的函数
- [ ] 组件中无 `axios.post/get/put/delete` 裸调用
- [ ] 组件中无 `fetch()` 调用
- [ ] request.js 的 baseURL 为 `/api`

**检查命令**：
```bash
# 检查组件中是否有裸 axios/fetch 调用
search_content "axios\." --glob "*.vue" --path frontends/<项目>/src/views
search_content "fetch(" --glob "*.vue" --path frontends/<项目>/src/views
```

---

## 3. Store 使用检查

**检查目标**：token/userInfo 走 Store，不裸读 localStorage。

**通过标准**：
- [ ] 组件获取 token 走 `useUserStore(state => state.token)` 或 `userStore.token`
- [ ] 组件获取 userInfo 走 Store，不直接 `JSON.parse(localStorage.getItem('userInfo'))`
- [ ] login/logout 通过 Store action 执行
- [ ] Store action 内部同步写入 localStorage

**检查命令**：
```bash
# 检查组件中是否有裸 localStorage 操作（Request拦截器除外）
search_content "localStorage" --glob "*.vue" --path frontends/<项目>/src/views
search_content "localStorage" --glob "*.jsx" --path frontends/<项目>/src/views
```

---

## 4. 组件拆分检查

**检查目标**：单文件不超过行数上限。弹窗默认内联在页面中（脚手架风格），不强制拆出。

**通过标准**：

| 文件类型 | 行数上限 | 备注 |
|---------|---------|------|
| 页面组件（含内联弹窗） | ≤ 350 | 脚手架典型值 250-300 行，含弹窗逻辑可略超 |
| 可复用组件（components/） | ≤ 200 | 被多页面共享的才抽到这里 |
| API 文件 | ≤ 60 | |
| Store 文件 | ≤ 80 | |
| 工具函数 | ≤ 100 | |

**检查命令**：
```bash
# React 项目
find frontends/<项目>/src/views -name "*.jsx" | xargs wc -l | awk '$1 > 350'

# Vue 项目
find frontends/<项目>/src/views -name "*.vue" | xargs wc -l | awk '$1 > 350'
```

---

## 5. 注释量检查

**检查目标**：无 JSDoc 块注释，无步骤编号注释，注释率 ≤ 3%。

**通过标准**：
- [ ] 无 `/** ... */` JSDoc 注释
- [ ] 无 `// 1.` `// 2.` `// 3.` 步骤编号注释
- [ ] 无 `// 获取 token` 等废话注释
- [ ] 无 `// TODO` 注释（要么做完要么删掉）
- [ ] API 文件可以 0 注释

**检查命令**：
```bash
# 搜索 JSDoc 块注释
search_content "\/\*\*" --glob "*.{vue,jsx,js}" --path frontends/<项目>/src

# 搜索步骤编号注释
search_content "\/\/ [0-9]+\." --glob "*.{vue,jsx,js}" --path frontends/<项目>/src
```

---

## 6. 组件引入来源检查

**检查目标**：组件来源一致，不混用不同组件库。

**通过标准**：

| 前端框架 | 只引入这些来源 |
|---------|-------------|
| React | `antd` + `@ant-design/icons` |
| Vue+Antd | `ant-design-vue` + `@ant-design/icons-vue` |
| Vue+ElementPlus | `element-plus` + `@element-plus/icons-vue` |
| Vue+NaiveUI | `naive-ui` |

**检查命令**：
```bash
# Vue+Antd 项目不该出现 element-plus
search_content "element-plus" --path frontends/<项目>/src

# React+Antd 项目不该出现 @element-plus
search_content "element-plus" --path frontends/<项目>/src
```

---

## 7. 路由守卫检查

**检查目标**：需要登录的页面有 token 检查。

**通过标准**：
- [ ] 管理员页面（`/admin/*`）需要登录 + 管理员角色检查
- [ ] 用户个人页面（如个人中心）需要登录检查
- [ ] 公开页面（首页/公告/登录/注册）不需要登录
- [ ] 404 页面不需要登录

**检查方式**：
- React：检查 `<ProtectedRoute>` 和 `<AdminRoute>` 包裹的 Route
- Vue：检查 `meta.requiresAuth` 和 `router.beforeEach` 守卫逻辑

---

## 8. 样式规范检查

**检查目标**：样式使用规范，无内联复杂样式。

**通过标准**：
- [ ] 全局样式在 `styles/global.css` 中
- [ ] 页面样式使用 scoped（Vue）或 CSS Module（React）
- [ ] 无内联 style 超过 3 个属性的情况
- [ ] 配色使用 CSS 变量（`var(--primary)` 而非硬编码 `#1890ff`）
- [ ] 无 `!important`（除非覆盖第三方库样式）

**检查命令**：
```bash
# 搜索内联 style（检查是否有超过 3 属性的）
search_content "style=\{" --glob "*.jsx" --path frontends/<项目>/src

# 搜索硬编码颜色值（应该用 CSS 变量）
search_content "#[0-9a-fA-F]{6}" --glob "*.{vue,css}" --path frontends/<项目>/src/styles
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
| Vue-Naive | `@/` 别名，`useMessage()`/`useDialog()`，`<script setup>`，`window.$message`（request.js） | `ant-design-vue` 组件，NProgress，`ElMessage` |

**检查命令**：
```bash
# Vue 项目不应有相对路径导入 API（应该用 @/）
search_content "from '\.\.\/" --glob "*.vue" --path frontends/<项目>/src

# React 项目不应有 @/ 别名
search_content "from '@/" --glob "*.jsx" --path frontends/<项目>/src

# Vue-Antd 项目不应有 ElMessage
search_content "ElMessage" --path frontends/<项目>/src
```

---

## 10. 补充检查（不纳入 9 项但建议做）

### 10.1 控制台清洁度

```bash
search_content "console\.log" --glob "*.{vue,jsx,js}" --path frontends/<项目>/src
search_content "debugger" --glob "*.{vue,jsx,js}" --path frontends/<项目>/src
```

两项结果都应为空。

### 10.2 未使用的 import

手动检查每个文件的 import 语句，确保所有导入都被使用。

### 10.3 响应式适配

- [ ] 管理后台至少能在 1366×768 分辨率下正常显示（常见投影仪分辨率）
- [ ] 表格在小屏幕下可以横向滚动（`scroll={{ x: 1200 }}`）

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
| 4 | 组件拆分 | ✅ | UserManage.vue 285 行，含内联弹窗 |
| 5 | 注释量 | ✅ | 1 条必要注释，无 JSDoc |
| 6 | 引入来源 | ✅ | 全部来自 ant-design-vue |
| 7 | 路由守卫 | ✅ | /admin/* 有守卫 |
| 8 | 样式规范 | ✅ | 使用 CSS 变量 |
| 9 | 框架一致性 | ✅ | 无跨框架混用模式 |

通过：9/9 ✅
可以进入下一模块。
```

---

## 12. 常见问题修复指南

| 问题 | 修复方式 |
|------|---------|
| 页面超 350 行 | 先确认是否弹窗逻辑导致；是则拆出共享弹窗组件，否则拆分页面逻辑到 hooks/composables |
| Vue 项目出现相对路径 `../../api/` | 改为 `@/api/` |
| React 项目出现 `@/` 别名 | 改为相对路径 |
| Vue request.js 用 `localStorage` 读 token | 改为 `useUserStore().token` |
| 裸 localStorage 调用（组件中） | 改为 Store 读取 |
| JSDoc 注释 | 全部删除 |
| 步骤编号注释 | 全部删除 |
| 混用组件库 | 统一为一个组件库 |
| 硬编码颜色 | 改为 CSS 变量 |
| console.log | 全部删除 |
| console.log | 全部删除 |
