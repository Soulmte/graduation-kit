# 代码规范（脚手架风格）

本文件定义：**基于脚手架项目的代码编写规范**，确保生成的代码与现有脚手架风格一致。

> 前置阅读：本文件只规定代码怎么写。阶段流程看 `SKILL.md §2`，自检清单看 `self-check.md`。

---

## 0. 写代码之前：必读清单

在创建任何文件之前，**必须先读取目标前端的以下 5 个文件**，确保生成的代码风格完全一致：

| # | 文件 | 看什么 |
|---|------|--------|
| 1 | `src/router/index.js` 或 `src/App.jsx` | 路由表结构、守卫写法、路径别名 |
| 2 | `src/stores/user.js` 或 `src/stores/userStore.js` | Store API 风格、action 命名 |
| 3 | `src/api/request.js` 或 `src/utils/request.js` | 拦截器写法、token 注入方式、进度条方案 |
| 4 | `src/views/admin/UserManage.vue` 或 `.jsx` | 页面结构模板：Card→Toolbar→Table→Modal |
| 5 | `src/styles/global.css` 或 `src/styles/admin.css` | 已有 CSS 变量、class 命名约定 |

---

### 0.1 速查表

| 层级 | React | Vue | 关键差异 |
|------|-------|-----|---------|
| API 层 | `api/user.js` ← 相对路径导入 | `api/user.js` ← `@/` 别名导入 | 导入路径风格不同 |
| Store 层 | `stores/userStore.js` (Zustand) | `stores/user.js` (Pinia Composition) | API 完全不同 |
| 路由层 | `App.jsx` 内 Routes + 组件守卫 | `router/index.js` + `beforeEach` | 守卫机制不同 |
| 组件层 | `views/` + `components/` | `views/` + `components/` | JSX vs SFC |
| 样式层 | `styles/global.css` | `styles/global.css` + `<style scoped>` | Vue 多 scoped |
| request | `utils/request.js` | `api/request.js` | 位置和 401 处理不同 |
| Token 注入 | 拦截器读 `localStorage` | 拦截器读 `useUserStore()` | 来源不同 |

### 0.2 导入路径规范（按框架分）

| 框架 | 路径风格 | 示例 |
|------|---------|------|
| React | 相对路径 | `import { login } from '../../api/user'` |
| Vue-Antd | `@/` 别名 | `import { login } from '@/api/user'` |
| Vue-ElementPlus | `@/` 别名 | `import { login } from '@/api/user'` |
| Vue-Naive | `@/` 别名 | `import { login } from '@/api/user'` |

**`@/` 指向 `src/`**。写 Vue 代码时一律用 `@/`，写 React 代码时一律用相对路径。

### 0.3 脚手架已有 API 路径（新增接口必须遵守此协议）

```
POST   /api/user/login          → { code:200, data:{ token, userInfo } }
POST   /api/user/register       → { code:200, message:"注册成功" }
POST   /api/user/pageQuery      → { code:200, data:{ records, total } }
GET    /api/user/listAll        → { code:200, data:[...] }
GET    /api/user/getById/:id    → { code:200, data:{...} }
PUT    /api/user/update         → { code:200, message:"更新成功" }
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
DELETE /api/log/deleteById/:id  → { code:200 }
DELETE /api/log/deleteBatch     → { code:200 }

POST   /api/file/upload         → { code:200, data:{ url, fileName } }
POST   /api/file/uploadBatch    → { code:200, data:[{ url, fileName }] }
DELETE /api/file/delete         → { code:200 }

GET    /api/health              → { code:200, data:"ok" }
```

统一响应格式：`{ code: number, message?: string, data?: any }`
- `code === 200` → 成功
- `code !== 200` → 业务异常
- HTTP 401 → 未登录/Token 过期

---

## 1. API 层规范

### 1.1 文件结构

```
src/api/
├── user.js      ← 用户相关 API（脚手架已有，直接复用）
├── notice.js    ← 公告相关 API（脚手架已有，直接复用）
├── log.js       ← 日志相关 API（脚手架已有，直接复用）
├── file.js      ← 文件上传 API（脚手架已有，直接复用）
└── <module>.js  ← 新增业务模块 API（按需创建）
```

### 1.2 标准模板

**React 版**（相对路径导入 `request`）：

```js
// api/user.js
import request from '../utils/request'

export const login = (username, password) => {
  return request.post('/user/login', { username, password })
}

export const pageQueryUser = (query) => {
  return request.post('/user/pageQuery', query)
}

export const getUserById = (id) => {
  return request.get(`/user/getById/${id}`)
}

export const updateUser = (data) => {
  return request.put('/user/update', data)
}

export const deleteUser = (id) => {
  return request.delete(`/user/deleteById/${id}`)
}

export const deleteUserBatch = (ids) => {
  return request.delete('/user/deleteBatch', { data: ids })
}
```

**Vue 版**（`@/` 别名导入 `request`）：

```js
// api/user.js
import request from '@/api/request'

export const login = (username, password) => {
  return request.post('/user/login', { username, password })
}

export const pageQueryUser = (query) => {
  return request.post('/user/pageQuery', query)
}

export const getUserById = (id) => {
  return request.get(`/user/getById/${id}`)
}

export const updateUser = (data) => {
  return request.put('/user/update', data)
}

export const deleteUser = (id) => {
  return request.delete(`/user/deleteById/${id}`)
}

export const deleteUserBatch = (ids) => {
  return request.delete('/user/deleteBatch', { data: ids })
}
```

### 1.3 规则

- **函数名 = 动作 + 模块名**：`login` / `pageQueryUser` / `deleteUserBatch`
- **导出方式**：`export const fnName = (...) => request.method(url, data)`
- **参数风格**：简单参数直接传（`login(username, password)`），复杂参数传对象（`pageQueryUser(query)`）
- **返回值**：直接 `return request.xxx(...)`，不做 `.then()` 二次处理
- **禁止**：在 API 文件中写 `try-catch`，错误处理交给 request 拦截器
- **禁止**：在 API 文件中处理 token，token 在 request 拦截器统一注入
- **复用优先**：脚手架已有的 `user.js` / `notice.js` / `log.js` / `file.js` 不要重写，只新增业务模块的 API 文件
- **新增接口**：路径格式遵循 `POST /api/<模块>/<动作>`，响应格式 `{ code, message, data }`

---

## 2. request.js 规范（按框架分，三套模板）

> **如果脚手架已有此文件，不要重写，直接复用。** 仅在脚手架无此文件或需要新增拦截逻辑时参考以下模板。

### 2.1 React 版（`utils/request.js`）

**特征**：Token 从 `localStorage` 读取，401 跳转用 `window.location.href`，无进度条。

```js
import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) return res
    if (res.code === 401) {
      message.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
      return Promise.reject(new Error(res.message))
    }
    message.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message))
  },
  error => {
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
```

### 2.2 Vue-Antd / Vue-ElementPlus 版（`api/request.js`）

**特征**：Token 从 `useUserStore()` 读取，401 走 `userStore.logout()` + `router.push`，**有 NProgress**。

```js
import axios from 'axios'
import { message } from 'ant-design-vue'           // Vue-Antd
// import { ElMessage } from 'element-plus'         // Vue-ElementPlus 用这行替代
import { useUserStore } from '@/stores/user'
import router from '@/router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    NProgress.start()
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    NProgress.done()
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    NProgress.done()
    const res = response.data
    if (res.code !== 200) {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    NProgress.done()
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录')
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
```

### 2.3 Vue-Naive 版（`api/request.js`）

**特征**：Token 从 `useUserStore()` 读取，用 `window.$message` / `window.$loadingBar` 全局访问（因为 Naive UI 的 `useMessage` 必须在 setup 内调用），**无 NProgress**。

```js
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const notifyError = (msg) => {
  if (window.$message) window.$message.error(msg)
  else console.error(msg)
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    window.$loadingBar?.start()
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    window.$loadingBar?.error()
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    window.$loadingBar?.finish()
    const res = response.data
    if (res.code !== 200) {
      notifyError(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    window.$loadingBar?.error()
    if (error.response?.status === 401) {
      notifyError('登录已过期，请重新登录')
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
    } else {
      notifyError(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
```

### 2.4 通用规则（三套都遵守）

- **baseURL**：统一为 `/api`（走 vite proxy）
- **timeout**：10000ms
- **401 处理**：清除 token + 跳转登录页（响应体 `code===401` 和 HTTP 状态码 `401` 两端都要处理）
- **进度条**：不增不删。脚手架有的保留，没有的不加
- **错误提示**：走组件库的 message/notification，不用 `alert()`

---

## 3. Store 层规范

### 3.1 React (Zustand)

```js
import { create } from 'zustand'

export const useUserStore = create((set) => ({
  token: localStorage.getItem('token') || '',
  userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),

  login: async (username, password) => {
    const res = await loginApi(username, password)
    const { token, userInfo } = res.data
    set({ token, userInfo })
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    return res
  },

  logout: () => {
    set({ token: '', userInfo: null })
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  },

  updateUserInfo: (userInfo) => {
    set({ userInfo })
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  }
}))
```

### 3.2 Vue (Pinia — Composition API / Setup Store)

> **三个 Vue 脚手架全部使用 Composition API 风格的 Pinia Store**（`defineStore('name', () => {...})`），不是 Options API 风格。

```js
// stores/user.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const login = async (username, password) => {
    const res = await loginApi(username, password)
    token.value = res.data.token
    userInfo.value = res.data.userInfo
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
    return res
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  return { token, userInfo, login, logout, setUserInfo }
})
```

**关键点**：
- `ref()` 定义响应式状态，`.value` 读写
- `return` 暴露的属性和方法才能在组件中访问
- 不要在 Setup Store 内使用 `this`

### 3.3 Store 使用规则（React + Vue 通用）

- Store 只存 `token` 和 `userInfo`，业务数据不走 Store
- localStorage 同步写入**在 Store action 内部完成**，组件不感知
- React 组件通过 `useUserStore(state => state.token)` 获取，Vue 通过 `userStore.token` 获取
- **不直接读 localStorage**：所有对 token/userInfo 的读取都走 Store
- **不创建额外的 Store**：除非有独立的大模块（如购物车/订单），否则一个 Store 够用
- 脚手架已有 Store 文件**直接复用**，不要重写

---

## 4. 路由规范

### 4.1 React (react-router-dom v6)

```jsx
<Routes>
  <Route path="/" element={<Navigate to="/user/home" replace />} />
  <Route path="/user" element={<UserLayout />}>
    <Route path="home" element={<UserHome />} />
    <Route path="profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
  </Route>
  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="user" element={<UserManage />} />
  </Route>
  <Route path="/login" element={<Login />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 4.2 Vue (Vue Router 4)

```js
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/user/home'
  },
  {
    path: '/user',
    component: () => import('@/layouts/UserLayout.vue'),
    children: [
      { path: 'home', name: 'UserHome', component: () => import('@/views/user/Home.vue'), meta: { title: '首页' } },
      { path: 'notice', name: 'UserNotice', component: () => import('@/views/user/Notice.vue'), meta: { title: '公告' } },
      { path: 'profile', name: 'UserProfile', component: () => import('@/views/user/Profile.vue'), meta: { title: '个人中心', requiresAuth: true } }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'user', name: 'UserManage', component: () => import('@/views/admin/UserManage.vue'), meta: { title: '用户管理' } }
    ]
  },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  { path: '/register', name: 'Register', component: () => import('@/views/Register.vue'), meta: { title: '注册' } },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
    return
  }

  if (to.meta.requiresAdmin && userStore.userInfo?.role !== 'admin') {
    next('/user/home')
    return
  }

  next()
})

export default router
```

### 4.3 路由规则（React + Vue 通用）

- 嵌套路由：`/user` 和 `/admin` 分别对应 UserLayout 和 AdminLayout
- Vue：懒加载用 `() => import('@/views/...')`，**走 `@/` 别名**
- React：直接 import 组件，路由守卫用组件包裹（`<ProtectedRoute>` / `<AdminRoute>`）
- Vue：路由守卫用 `router.beforeEach` + `meta.requiresAuth` / `meta.requiresAdmin`
- 管理员路由：额外检查 `userInfo?.role !== 'admin'` → 踢到 `/user/home`
- 404 兜底路由必须有
- 路由路径用 kebab-case：`/user/order-history`（不是 `/user/orderHistory`）
- 新增路由添加到已有路由表中，不要重写整个路由文件

---

## 5. 页面组件规范

### 5.1 页面标准四段结构

**所有脚手架页面都遵循同一个结构。** 写任何管理后台页面都按这个骨架来：

```
<Card title="模块名" extra={操作按钮(添加/批量删除)}>
  ├── 1. toolbar 区 — 搜索框 + 下拉筛选 + 搜索按钮
  ├── 2. Table 区  — 带 rowSelection、pagination、loading
  ├── 3. Modal 区  — 内联编辑弹窗（页面专属，不抽组件）
  │     ├── AvatarUpload（如涉及头像）
  │     └── Form（layout="vertical" + 双列 grid 布局）
  └── 4. 样式区  — scoped 或 CSS Module
</Card>
```

### 5.2 React 页面完整模板

```jsx
import { useState, useEffect } from 'react'
import { Card, Table, Button, Input, InputNumber, Select, Space, Modal, Form, Tag, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { pageQueryUser, register, updateUser, deleteUser, deleteUserBatch } from '../../api/user'
import AvatarUpload from '../../components/AvatarUpload'

const { Search } = Input

export default function UserManage() {
  // --- 表格状态 ---
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const pageSize = 10
  const [selectedIds, setSelectedIds] = useState([])

  // --- 筛选状态 ---
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')

  // --- 弹窗状态 ---
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [avatar, setAvatar] = useState('')
  const [form] = Form.useForm()

  // 筛选条件变化 → 重置页码 + 重新加载
  useEffect(() => { fetchList() }, [pageNum, username, role])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await pageQueryUser({ pageNum, pageSize, username, role })
      setList(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditing(null); setAvatar('')
    form.resetFields()
    form.setFieldsValue({ role: 'user' })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditing(record)
    setAvatar(record.avatar || '')
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除', content: '确定要删除吗？',
      okButtonProps: { danger: true },
      onOk: async () => { await deleteUser(id); message.success('删除成功'); fetchList() }
    })
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return message.warning('请先选择要删除的用户')
    Modal.confirm({
      title: '确认批量删除', content: `确定要删除选中的 ${selectedIds.length} 个吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteUserBatch(selectedIds)
        message.success('批量删除成功')
        setSelectedIds([]); fetchList()
      }
    })
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload = { ...values, avatar }
    if (editing) {
      await updateUser({ ...payload, id: editing.id })
      message.success('更新成功')
    } else {
      await register(payload)
      message.success('添加成功')
    }
    setModalVisible(false); fetchList()
  }

  const columns = [
    { title: '序号', key: 'idx', width: 70, render: (_, __, i) => (pageNum - 1) * pageSize + i + 1 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '昵称',   dataIndex: 'nickname', width: 120, render: v => v || '-' },
    { title: '邮箱',   dataIndex: 'email', ellipsis: true, render: v => v || '-' },
    {
      title: '角色', dataIndex: 'role', width: 110,
      render: r => <Tag color={r === 'admin' ? 'red' : 'blue'}>{r === 'admin' ? '管理员' : '普通用户'}</Tag>
    },
    {
      title: '操作', key: 'op', width: 180, fixed: 'right',
      render: (_, r) => (
        <div className="table-actions">
          <Button size="small" className="btn-edit"   icon={<EditOutlined />}   onClick={() => handleEdit(r)}>编辑</Button>
          <Button size="small" className="btn-delete" icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)}>删除</Button>
        </div>
      )
    }
  ]

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          <Button danger icon={<DeleteOutlined />} disabled={!selectedIds.length} onClick={handleBatchDelete}>批量删除</Button>
        </Space>
      }
    >
      {/* === toolbar 筛选区 === */}
      <div className="toolbar">
        <Search placeholder="搜索用户名" onSearch={v => { setUsername(v); setPageNum(1) }} style={{ width: 220 }} allowClear />
        <Select placeholder="选择角色" onChange={v => { setRole(v || ''); setPageNum(1) }} style={{ width: 150 }} allowClear>
          <Select.Option value="admin">管理员</Select.Option>
          <Select.Option value="user">普通用户</Select.Option>
        </Select>
      </div>

      {/* === 数据表格 === */}
      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        scroll={{ x: 1200 }}
        rowSelection={{ selectedRowKeys: selectedIds, onChange: setSelectedIds }}
        pagination={{ current: pageNum, pageSize, total, onChange: setPageNum, showTotal: t => `共 ${t} 条` }}
      />

      {/* === 内联编辑弹窗 === */}
      <Modal
        title={editing ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        okText={editing ? '保存' : '添加'}
        cancelText="取消"
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <AvatarUpload value={avatar} onChange={setAvatar} size={88} />
        </div>

        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" disabled={!!editing} />
            </Form.Item>
            <Form.Item
              label="密码" name="password"
              rules={editing ? [] : [{ required: true, message: '请输入密码' }]}
              help={editing ? '留空表示不修改密码' : undefined}
            >
              <Input.Password placeholder={editing ? '留空表示不修改' : '请输入密码'} />
            </Form.Item>
            <Form.Item label="昵称" name="nickname">
              <Input placeholder="请输入昵称" maxLength={50} />
            </Form.Item>
            <Form.Item label="年龄" name="age">
              <InputNumber min={1} max={150} placeholder="年龄" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="性别" name="gender">
              <Select placeholder="请选择性别" allowClear options={[
                { value: 'male', label: '男' }, { value: 'female', label: '女' }, { value: 'other', label: '其他' }
              ]} />
            </Form.Item>
            <Form.Item label="手机号" name="phone" rules={[{ pattern: /^1\d{10}$/, message: '手机号格式不正确' }]}>
              <Input placeholder="请输入手机号" maxLength={11} />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
              <Select placeholder="请选择角色">
                <Select.Option value="admin">管理员</Select.Option>
                <Select.Option value="user">普通用户</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  )
}
```

### 5.3 Vue 页面完整模板（以 Ant Design Vue 为例）

```vue
<template>
  <a-card title="用户管理">
    <template #extra>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template> 添加
        </a-button>
        <a-button danger :disabled="!selectedIds.length" @click="handleBatchDelete">
          <template #icon><delete-outlined /></template> 批量删除
        </a-button>
      </a-space>
    </template>

    <!-- === toolbar 筛选区 === -->
    <div class="toolbar">
      <a-input-search v-model:value="filters.username" placeholder="搜索用户名" style="width:220px" allow-clear @search="onFilter" />
      <a-select v-model:value="filters.role" placeholder="选择角色" style="width:150px" allow-clear @change="onFilter">
        <a-select-option value="admin">管理员</a-select-option>
        <a-select-option value="user">普通用户</a-select-option>
      </a-select>
    </div>

    <!-- === 数据表格 === -->
    <a-table
      :loading="loading"
      :columns="columns"
      :data-source="list"
      row-key="id"
      :scroll="{ x: 1200 }"
      :row-selection="{ selectedRowKeys: selectedIds, onChange: v => selectedIds = v }"
      :pagination="{ current: pageNum, pageSize, total, onChange: p => { pageNum = p; fetchList() }, showTotal: t => `共 ${t} 条` }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'idx'">
          {{ (pageNum - 1) * pageSize + index + 1 }}
        </template>
        <template v-else-if="column.key === 'role'">
          <a-tag :color="record.role === 'admin' ? 'red' : 'blue'">
            {{ record.role === 'admin' ? '管理员' : '普通用户' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'op'">
          <div class="table-actions">
            <a-button size="small" class="btn-edit" @click="handleEdit(record)">
              <template #icon><edit-outlined /></template> 编辑
            </a-button>
            <a-button size="small" class="btn-delete" @click="handleDelete(record.id)">
              <template #icon><delete-outlined /></template> 删除
            </a-button>
          </div>
        </template>
      </template>
    </a-table>

    <!-- === 内联编辑弹窗 === -->
    <a-modal
      v-model:open="modalVisible"
      :title="editing ? '编辑用户' : '添加用户'"
      :width="640"
      :ok-text="editing ? '保存' : '添加'"
      cancel-text="取消"
      @ok="handleSubmit"
    >
      <div style="text-align:center;margin-bottom:16px">
        <avatar-upload :value="avatar" @update:value="avatar = $event" :size="88" />
      </div>
      <a-form :model="form" layout="vertical" ref="formRef">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
          <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
            <a-input v-model:value="form.username" placeholder="请输入用户名" :disabled="!!editing" />
          </a-form-item>
          <a-form-item label="密码" name="password"
            :rules="editing ? [] : [{ required: true, message: '请输入密码' }]"
            :help="editing ? '留空表示不修改密码' : undefined"
          >
            <a-input-password v-model:value="form.password" :placeholder="editing ? '留空表示不修改' : '请输入密码'" />
          </a-form-item>
          <a-form-item label="昵称" name="nickname">
            <a-input v-model:value="form.nickname" placeholder="请输入昵称" :maxlength="50" />
          </a-form-item>
          <a-form-item label="年龄" name="age">
            <a-input-number v-model:value="form.age" :min="1" :max="150" placeholder="年龄" style="width:100%" />
          </a-form-item>
          <a-form-item label="性别" name="gender">
            <a-select v-model:value="form.gender" placeholder="请选择性别" allow-clear :options="GENDER_OPTIONS" />
          </a-form-item>
          <a-form-item label="手机号" name="phone" :rules="[{ pattern: /^1\d{10}$/, message: '手机号格式不正确' }]">
            <a-input v-model:value="form.phone" placeholder="请输入手机号" :maxlength="11" />
          </a-form-item>
          <a-form-item label="邮箱" name="email" :rules="[{ type: 'email', message: '邮箱格式不正确' }]">
            <a-input v-model:value="form.email" placeholder="请输入邮箱" />
          </a-form-item>
          <a-form-item label="角色" name="role" :rules="[{ required: true, message: '请选择角色' }]">
            <a-select v-model:value="form.role" placeholder="请选择角色">
              <a-select-option value="admin">管理员</a-select-option>
              <a-select-option value="user">普通用户</a-select-option>
            </a-select>
          </a-form-item>
        </div>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { pageQueryUser, register, updateUser, deleteUser, deleteUserBatch } from '@/api/user'
import AvatarUpload from '@/components/AvatarUpload.vue'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' }, { value: 'female', label: '女' }, { value: 'other', label: '其他' }
]

// --- 表格状态 ---
const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const selectedIds = ref([])
const filters = reactive({ username: '', role: undefined })

// --- 弹窗状态 ---
const modalVisible = ref(false)
const editing = ref(null)
const avatar = ref('')
const formRef = ref(null)
const form = reactive({
  username: '', password: '', nickname: '',
  age: null, gender: undefined, phone: '', email: '', role: 'user'
})

// --- 表格列定义 ---
const columns = [
  { title: '序号', key: 'idx', width: 70 },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 120 },
  { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true },
  { title: '角色', dataIndex: 'role', key: 'role', width: 110 },
  { title: '操作', key: 'op', width: 180, fixed: 'right' }
]

// --- 数据获取 ---
const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageQueryUser({ pageNum: pageNum.value, pageSize, username: filters.username, role: filters.role || '' })
    list.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const onFilter = () => { pageNum.value = 1; fetchList() }

// --- 表单重置 ---
const resetForm = (u = {}) => {
  form.username = u.username || ''; form.password = ''
  form.nickname = u.nickname || ''; form.age = u.age ?? null
  form.gender = u.gender || undefined; form.phone = u.phone || ''
  form.email = u.email || ''; form.role = u.role || 'user'
  avatar.value = u.avatar || ''
}

// --- 事件处理 ---
const handleAdd = () => { editing.value = null; resetForm(); modalVisible.value = true }
const handleEdit = (r) => { editing.value = r; resetForm(r); modalVisible.value = true }

const handleDelete = (id) => {
  Modal.confirm({
    title: '确认删除', content: '确定要删除吗？',
    okButtonProps: { danger: true },
    onOk: async () => { await deleteUser(id); message.success('删除成功'); fetchList() }
  })
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) return message.warning('请先选择要删除的用户')
  Modal.confirm({
    title: '确认批量删除', content: `确定要删除选中的 ${selectedIds.value.length} 个吗？`,
    okButtonProps: { danger: true },
    onOk: async () => {
      await deleteUserBatch(selectedIds.value)
      message.success('批量删除成功')
      selectedIds.value = []; fetchList()
    }
  })
}

const handleSubmit = async () => {
  await formRef.value.validate()
  const payload = { ...form, avatar: avatar.value }
  if (editing.value) {
    await updateUser({ ...payload, id: editing.value.id })
    message.success('更新成功')
  } else {
    await register(payload)
    message.success('添加成功')
  }
  modalVisible.value = false; fetchList()
}

onMounted(fetchList)
</script>
```

### 5.4 页面规则（React + Vue 通用）

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

### 5.5 用户端 vs 管理端：两套视觉语言

**管理端页面和管理端页面长得一模一样是毕设常见扣分点。** 用户端页面需要有独立的视觉语言，让导师一眼看出"这是给普通用户用的"。

### 5.5.1 两套设计体系对比

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

### 5.5.2 用户端页面结构模板

```
用户端页面结构（从上到下）：
┌──────────────────────────────────────┐
│  Banner / Hero 区                     │
│  <h1> 页面大标题 </h1>                │
│  <p>  副标题或描述 </p>                │
├──────────────────────────────────────┤
│  统计卡片区（可选）                     │
│  ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ 统计1 │ │ 统计2 │ │ 统计3 │          │
│  └──────┘ └──────┘ └──────┘          │
├──────────────────────────────────────┤
│  详情卡片区                            │
│  <h2> 基本信息 </h2>                   │
│  ┌─ 描述列表（label + value 纵向排列）─┐ │
│  │  姓名：张三                         │ │
│  │  部门：技术部                       │ │
│  │  入职时间：2024-01-15              │ │
│  └───────────────────────────────────┘ │
│  <h2> 其他信息 </h2>                   │
│  ┌───────────────────────────────────┐ │
│  │  ...                              │ │
│  └───────────────────────────────────┘ │
├──────────────────────────────────────┤
│  表单卡片区                            │
│  <h2> 编辑信息 </h2>                   │
│  <Form layout="vertical" max-width>    │
│    <Form.Item label="字段名">          │
│    ...（单列堆叠，字段多时分卡片）       │
│    <Button type="primary">提交</Button> │
│  </Form>                               │
└──────────────────────────────────────┘
```

### 5.5.3 详情页规范（Detail Page）

**详情页是只读展示页**，用于查看某条数据的完整信息。不要用 Modal 弹窗替代详情页。

**模板**：

```vue
<template>
  <div class="detail-page">
    <!-- 返回按钮 -->
    <a-button type="link" @click="$router.back()">
      <template #icon><arrow-left-outlined /></template> 返回
    </a-button>

    <!-- 页面标题 -->
    <h1 class="detail-title">{{ detail.title }}</h1>
    <p class="detail-subtitle">创建于 {{ detail.createTime }}</p>

    <!-- 分区1：核心信息（用主色大字突出） -->
    <a-card class="detail-section">
      <h2 class="section-title">基本信息</h2>
      <a-descriptions :column="2" bordered size="middle">
        <a-descriptions-item label="编号">
          <span class="text-primary">{{ detail.id }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColor(detail.status)">{{ detail.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="负责人">
          <span class="text-strong">{{ detail.owner }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="联系方式">
          {{ detail.phone || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 分区2：详细信息（普通字号） -->
    <a-card class="detail-section">
      <h2 class="section-title">详细内容</h2>
      <div class="detail-content" v-html="detail.content" />
    </a-card>

    <!-- 分区3：附加信息（灰色小字） -->
    <a-card class="detail-section">
      <h2 class="section-title">操作记录</h2>
      <a-timeline>
        <a-timeline-item v-for="log in detail.logs" :key="log.id" :color="log.color">
          {{ log.action }} — <span class="text-muted">{{ log.time }}</span>
        </a-timeline-item>
      </a-timeline>
    </a-card>
  </div>
</template>
```

**React 版**：

```jsx
<div className="detail-page">
  <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>

  <h1 className="detail-title">{detail.title}</h1>
  <p className="detail-subtitle">创建于 {detail.createTime}</p>

  <Card className="detail-section">
    <h2 className="section-title">基本信息</h2>
    <Descriptions bordered column={2} size="middle">
      <Descriptions.Item label="编号">
        <span className="text-primary">{detail.id}</span>
      </Descriptions.Item>
      <Descriptions.Item label="状态">
        <Tag color={statusColor(detail.status)}>{detail.status}</Tag>
      </Descriptions.Item>
    </Descriptions>
  </Card>
</div>
```

**详情页关键规则**：

| 规则 | 说明 |
|------|------|
| 有返回按钮 | 详情页左上角必须有 `< 返回` 按钮 |
| h1 是数据标题 | 不是"详情页"三个字，而是数据本身的名称（如公告标题、用户名） |
| h2 分区 | 每个 Card 内用 `<h2>` 作为分区标题 |
| 核心数据用主色 | 编号、金额、状态等关键字段用 `var(--primary)` 或 `<span class="text-primary">` |
| 次要数据灰色 | 时间戳、备注、辅助说明用 `var(--text-secondary)` 灰色 |
| 状态用彩色 Tag | 通过/待审/拒绝 → green/blue/red；不是纯文字 |
| 描述列表（Descriptions） | 只读数据用 `<Descriptions>` 或 `<dl>`，**不要用 Table** |
| UI 组件库的 Descriptions | Ant Design: `<a-descriptions>` / Element Plus: `<el-descriptions>` / Naive UI 用 `<n-descriptions>` 或手写 grid |

### 5.5.4 用户端表单规范（User Form）

用户端表单**不要用 Table 列表形式**，不要用双列紧凑 grid。应该：

- **字段 ≤ 5 个**：单列堆叠（`layout="vertical"`）+ `max-width: 480px` 居中
- **字段 6-10 个**：分 2-3 个 Card 区块，每区 3-5 个字段，单列堆叠
- **字段 > 10 个**：分步骤（Steps/Wizard），每步一个 Card

```vue
<!-- 用户端表单模板（字段少） -->
<a-card class="user-form-card">
  <h2 class="section-title">编辑资料</h2>
  <a-form layout="vertical" style="max-width:480px">
    <a-form-item label="昵称">
      <a-input v-model:value="form.nickname" size="large" />
    </a-form-item>
    <a-form-item label="个人简介">
      <a-textarea v-model:value="form.bio" :rows="4" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" size="large" block>保存</a-button>
    </a-form-item>
  </a-form>
</a-card>
```

```vue
<!-- 用户端表单模板（字段多 → 分区卡片） -->
<div class="user-form-stack">
  <a-card class="user-form-card">
    <h2 class="section-title">基本信息</h2>
    <a-form layout="vertical" style="max-width:600px">
      <!-- 单列堆叠 4-5 个字段 -->
    </a-form>
  </a-card>

  <a-card class="user-form-card">
    <h2 class="section-title">联系方式</h2>
    <a-form layout="vertical" style="max-width:600px">
      <!-- 单列堆叠 3-4 个字段 -->
    </a-form>
  </a-card>

  <a-button type="primary" size="large" block>提交</a-button>
</div>
```

**用户端表单规则**：

| 规则 | 管理端 | 用户端 |
|------|--------|--------|
| 布局 | 双列 grid `1fr 1fr` | **单列堆叠**，`max-width: 480-600px` |
| 按钮 | 弹窗底部 `okText="保存"` | **页面底部 `size="large" block`** |
| 分区 | 无（一个弹窗一个 Form） | **多个 Card 分区**，每区有 `<h2>` 标题 |
| 输入框大小 | 默认 | `size="large"`（更大、更好点） |
| 占位提示 | 简短 | 更友好："请输入你的昵称" |

### 5.5.5 标题和颜色的层级体系

```css
/* 用户端页面的标题层级 */
.detail-title, .page-title {
  font-size: 24px;        /* h1 — 页面唯一大标题 */
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.section-title {
  font-size: 16px;        /* h2 — 分区标题 */
  font-weight: 600;
  color: var(--text);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);  /* 分区标题下划线 */
}

.subsection-title {
  font-size: 14px;        /* h3 — 子区块 */
  font-weight: 500;
  color: var(--text-secondary);
}

/* 数据重要性的颜色层级 */
.text-primary   { color: var(--primary); font-weight: 600; }   /* 最核心：编号、金额 */
.text-strong    { color: var(--text);     font-weight: 600; }   /* 重要：姓名、标题 */
.text-muted     { color: var(--text-secondary); font-size: 13px; }  /* 次要：时间、备注 */
```

**颜色使用示例**：

```
┌─────────────────────────────────────────────┐
│  ← 返回                                      │
│                                              │
│  公告 #2024-001          ← h1 + 主色         │
│  发布于 2024-03-15       ← 灰色小字          │
│  ┌─────────────────────────────────────┐     │
│  │ 基本信息                      h2    │     │
│  │ 标题：关于系统升级的通知    ← 加粗  │     │
│  │ 状态：✅ 已发布           ← 彩色Tag │     │
│  │ 作者：管理员              ← 普通   │     │
│  │ 更新时间：2024-03-16     ← 灰色   │     │
│  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

### 5.5.6 禁止的用户端写法

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

### 6.2 内联弹窗标准结构

弹窗内结构：**AvatarUpload（如涉及）→ Form（vertical + 双列 grid）→ 提交**

```jsx
// React 弹窗核心结构
<Modal
  title={editing ? '编辑XXX' : '添加XXX'}
  open={modalVisible}
  onOk={handleSubmit}
  onCancel={() => setModalVisible(false)}
  width={640}
  okText={editing ? '保存' : '添加'}
  cancelText="取消"
>
  <div style={{ textAlign: 'center', marginBottom: 16 }}>
    <AvatarUpload value={avatar} onChange={setAvatar} size={88} />
  </div>
  <Form form={form} layout="vertical">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {/* Form.Item 双列排列 */}
    </div>
  </Form>
</Modal>
```

### 6.3 表单状态管理模式

| 框架 | 表单实例 | 编辑数据回填 | 提交校验 |
|------|---------|------------|---------|
| React | `Form.useForm()` | `form.setFieldsValue(record)` | `form.validateFields()` |
| Vue-Antd | `ref(null)` 绑定到 `<a-form ref="formRef">` | `resetForm(record)` | `formRef.value.validate()` |
| Vue-ElementPlus | `ref(null)` 绑定到 `<el-form ref="formRef">` | `resetForm(record)` | `formRef.value.validate()` |
| Vue-Naive | `ref(null)` 绑定到 `<n-form ref="formRef">` | `resetForm(record)` | `formRef.value.validate(callback)` |

**关键细节**：
- 编辑时编辑用户名框 **disabled**（用户名不可改）
- 编辑时密码框留空 = 不修改密码（`help="留空表示不修改密码"`）
- 新增/编辑共享同一个 Modal，通过 `editing` 状态区分（`null` = 新增，`record对象` = 编辑）
- `resetForm()` 函数处理两种场景：传 record → 回填，不传 → 清空 + 默认值

---

## 7. 样式规范

### 7.1 先检查已有变量

在写任何样式之前，先读 `styles/global.css`。脚手架可能已有 CSS 变量定义。**有则扩展，无则新建。** 不要覆盖已有变量，只追加业务需要的。

### 7.2 全局样式（styles/global.css）

```css
:root {
  --primary: #1890ff;
  --primary-hover: #40a9ff;
  --bg: #f5f5f5;
  --bg-white: #ffffff;
  --text: #333333;
  --text-secondary: #666666;
  --border: #e8e8e8;
  --danger: #ff4d4f;
  --success: #52c41a;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
}
```

规则：全局样式只放 CSS 变量 + body 基础 + 滚动条。**禁止**在这里写页面特有的样式。

### 7.3 页面样式

- React：使用 CSS Module（`xxx.module.css`）或内联 style
- Vue：使用 `<style scoped>`
- 禁止内联 style 写复杂样式（超过 3 个属性就抽成 class）

### 7.4 脚手架约定 class 名称

以下 class 在所有脚手架页面中统一使用，**新增页面必须沿用**：

| class | 用途 | 示例 |
|-------|------|------|
| `.toolbar` | 表格上方的筛选工具栏 | `display:flex; gap:8px; margin-bottom:16px` |
| `.table-actions` | 表格操作列的按钮容器 | `display:flex; gap:8px` |
| `.card-header` | Card 头部的 flex 布局 | `display:flex; align-items:center; justify-content:space-between` |
| `.btn-edit` | 编辑按钮样式 | 可选，统一视觉 |
| `.btn-delete` | 删除按钮样式 | 可选，统一视觉 |
| `.pagination-wrap` | 分页容器（ElementPlus 用） | `margin-top:16px; display:flex; justify-content:flex-end` |

### 7.5 配色落地（来自风格选型）

阶段 1.5 风格选型完成后，将配色写入 CSS 变量。见 `style-integration.md §3`。

---

## 8. 注释规范（红线）

### 8.1 禁止的注释

```js
// ❌ JSDoc 块注释
/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
export const login = (username, password) => { ... }

// ❌ 步骤编号注释
const handleLogin = async () => {
  // 1. 获取表单数据
  // 2. 校验表单
  // 3. 调用登录接口
  // 4. 保存 token
  // 5. 跳转首页
}

// ❌ 废话注释
const token = localStorage.getItem('token')  // 获取 token
```

### 8.2 允许的注释

```js
// ✅ 非显而易见的逻辑才注释
// 登录/注册时从 body 读用户名（此时还没有 token）
const username = req.body.username

// ✅ 临时解决方案
// FIXME: 当前用明文比对，后续替换为 BCrypt
if (password !== user.password) { ... }
```

### 8.3 量化标准

- 注释行数 ÷ 总行数 ≤ 3%
- 一个文件超过 5 条注释 → 重写
- API 文件可以 0 注释

---

## 9. 变量命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 函数名 | 动词开头，camelCase | `fetchUserList`, `handleDelete`, `onSearch` |
| 变量名 | 名词，camelCase | `userList`, `loading`, `selectedRowKeys` |
| 常量 | UPPER_SNAKE_CASE | `PAGE_SIZE`, `MAX_FILE_SIZE` |
| 组件名 | PascalCase | `UserManage`, `UserEditModal` |
| 页面/组件文件名 | PascalCase，与组件同名 | `UserManage.vue`, `UserEditModal.jsx` |
| 非组件文件名 | camelCase | `request.js`, `userStore.js`, `formatDate.js` |
| 目录名 | 全小写单词 | `views/`, `admin/`, `components/` |
| API 函数 | 动作+模块 | `pageQueryUser`, `deleteUserBatch` |

**禁止**：
- 拼音变量名（`yonghu` / `shuju`）
- 单字母变量（`d` / `r` / `e`，forEach 的 `item` 除外）
- 无意义缩写（`usrLst` / `btnClk`）

---

## 10. Element Plus 特殊模式

Element Plus 与 Ant Design Vue 的关键差异：

### 10.1 组件前缀和引入

```vue
<script setup>
// 组件使用 el- 前缀（模板中：<el-card> <el-table> <el-button>）
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
</script>
```

### 10.2 消息提示

```js
// ✅ Element Plus 正确用法（不是 message.success）
import { ElMessage, ElMessageBox } from 'element-plus'

ElMessage.success('删除成功')
ElMessage.warning('请先选择')
ElMessage.error('操作失败')

// ✅ 确认弹窗（不是 Modal.confirm）
ElMessageBox.confirm('确定要删除吗？', '确认删除', {
  type: 'warning',
  confirmButtonText: '删除',
  confirmButtonClass: 'el-button--danger'
}).then(async () => {
  await deleteUser(id)
  ElMessage.success('删除成功')
  fetchList()
}).catch(() => {})   // 取消操作必须 catch
```

### 10.3 表格分页

```vue
<!-- Element Plus 分页是独立组件，放在表格下方 -->
<el-pagination
  v-model:current-page="pageNum"
  :page-size="pageSize"
  :total="total"
  layout="total, prev, pager, next"
  background
  @current-change="fetchList"
/>

<!-- 包裹在 .pagination-wrap 容器中 -->
<div class="pagination-wrap">
  <el-pagination ... />
</div>
```

### 10.4 表单校验

```js
// Element Plus 的 rules 是 computed（响应式）
const rules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: editing.value ? [] : [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}))
```

### 10.5 图标使用

```vue
<!-- Element Plus 图标是组件，不是 template #icon -->
<el-button type="primary" @click="handleAdd">
  <el-icon><Plus /></el-icon> 添加
</el-button>

<!-- 引入 -->
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
```

---

## 11. Naive UI 特殊模式

Naive UI 与 Ant Design Vue / Element Plus 的核心差异：

### 11.1 组件引入方式

```vue
<script setup>
import { h } from 'vue'
import {
  NCard, NButton, NSpace, NInput, NSelect, NModal, NForm, NFormItem,
  NInputNumber, NDataTable, NTag, NGrid, NGi, useMessage, useDialog
} from 'naive-ui'
</script>
```

**Naive UI 特征**：
- 组件以 `N` 开头（`n-card`、`n-button`、`n-data-table`）
- **按需引入**，不使用全局注册
- 无独立图标库，图标内建在组件中或使用内联 SVG

### 11.2 消息提示（useMessage / useDialog）

```js
// ⚠️ Naive UI 的 useMessage 和 useDialog 必须在 setup 内调用
const message = useMessage()
const dialog = useDialog()

// 使用方式
message.success('删除成功')
message.warning('请先选择')
message.error('操作失败')

// 确认弹窗
dialog.warning({
  title: '确认删除',
  content: '确定要删除吗？',
  positiveText: '删除',
  negativeText: '取消',
  onPositiveClick: async () => {
    await deleteUser(id)
    message.success('删除成功')
    fetchList()
  }
})
```

### 11.3 表格（NDataTable）

Naive UI 的表格列定义使用 `render` 函数 + `h()`：

```js
const columns = [
  { type: 'selection' },
  {
    title: '序号', key: 'idx', width: 70,
    render: (_r, i) => (pageNum.value - 1) * pageSize + i + 1
  },
  {
    title: '角色', key: 'role', width: 110,
    render: (row) => h(NTag, { type: row.role === 'admin' ? 'error' : 'success' },
      () => row.role === 'admin' ? '管理员' : '普通用户'
    )
  },
  {
    title: '操作', key: 'op', width: 180, fixed: 'right',
    render: (row) => h('div', { class: 'table-actions' }, [
      h(NButton, { size: 'small', type: 'primary', secondary: true, onClick: () => handleEdit(row) }, () => '编辑'),
      h(NButton, { size: 'small', type: 'error', secondary: true, onClick: () => handleDelete(row.id) }, () => '删除')
    ])
  }
]
```

### 11.4 表格分页

```js
// Naive UI 分页是表格的 prop（不是独立组件）
const pagination = computed(() => ({
  page: pageNum.value,
  pageSize,
  itemCount: total.value,
  showSizePicker: false,
  prefix: ({ itemCount }) => `共 ${itemCount} 条`,
  onChange: (p) => { pageNum.value = p; fetchList() }
}))

// 在模板中
<n-data-table :pagination="pagination" remote />
```

**注意**：`remote` 属性表示分页由后端控制（不是前端分页）。

### 11.5 表单校验

```js
// Naive UI 的 form validate 是回调式（不是 async/await）
const handleSubmit = () => {
  formRef.value.validate((errors) => {
    if (errors) return
    // 校验通过...
  })
}
```

### 11.6 request.js 中的 window 全局

Naive UI 的 `useMessage` 不能在 request.js（非 setup 上下文）中调用，脚手架使用 `window.$message` 全局实例：

```js
// api/request.js 中
const notifyError = (msg) => {
  if (window.$message) window.$message.error(msg)
  else console.error(msg)
}
```

这需要在 `main.js` 中挂载全局实例，脚手架已处理好，**不要改动**。

---

## 12. uni-app 特殊模式（H5 + 小程序跨端）

uni-app 使用 Vue 语法但有自己的组件库和 API。

### 12.1 目录结构

```
src/
├── api/           ← 同 Vue 前端，使用 @/ 别名
├── pages/         ← 页面（按功能分目录，每个目录一个 .vue）
├── components/    ← 公共组件
├── store/         ← Pinia Store（同 Vue 用法）
├── config/        ← API 地址等配置
├── static/        ← 静态资源
├── pages.json     ← 路由配置（替代 router/index.js）
└── manifest.json  ← 应用配置
```

### 12.2 关键差异

| 差异点 | 说明 |
|--------|------|
| 路由 | 不用 Vue Router，在 `pages.json` 中配置 `pages` 数组，tabBar 在 `tabBar` 节点配置 |
| 组件 | 使用 uni-app 内置组件：`<view>` / `<text>` / `<image>` / `<navigator>`，不能用 `<div>` / `<span>` / `<a>` |
| CSS 单位 | 用 `rpx`（750rpx = 屏幕宽度），不用 `px` |
| API 调用 | 小程序环境不支持 `axios`，用 uni-app 内置的 `uni.request()` |
| Store | Pinia 用法与 Vue 完全相同（`@/stores/user`），注册在 `main.js` |
| 条件编译 | `#ifdef H5` / `#ifdef MP-WEIXIN` / `#endif` 区分平台 |

### 12.3 request.js 模板

```js
// api/request.js
const BASE_URL = 'http://localhost:8080/api';

const request = (url, method = 'GET', data = null) => {
  const token = uni.getStorageSync('token');
  const header = {};
  if (token) header['Authorization'] = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      header,
      data,
      timeout: 10000,
      success(res) {
        if (res.data.code === 200) {
          resolve(res.data);
        } else if (res.data.code === 401) {
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          uni.reLaunch({ url: '/pages/login/index' });
          reject(new Error(res.data.message));
        } else {
          uni.showToast({ title: res.data.message || '请求失败', icon: 'none' });
          reject(new Error(res.data.message));
        }
      },
      fail(err) {
        uni.showToast({ title: '网络连接失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

export default {
  get: (url, data) => request(url, 'GET', data),
  post: (url, data) => request(url, 'POST', data),
  put: (url, data) => request(url, 'PUT', data),
  delete: (url, data) => request(url, 'DELETE', data)
};
```

### 12.4 页面模板

```vue
<!-- pages/notice/detail.vue -->
<template>
  <view class="detail-page">
    <view class="detail-title">{{ detail.title }}</view>
    <view class="detail-time">发布于 {{ detail.createTime }}</view>
    <rich-text :nodes="detail.content"></rich-text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getById } from '@/api/notice';

const detail = ref(null);
onLoad((options) => {
  getById(options.id).then(res => { detail.value = res.data; });
});
</script>
```

### 12.5 uni-app 规则

- 页面必须是 `<view>` / `<text>` / `<image>` 系列，不能用 HTML 标签
- 单位用 `rpx`，1rpx = 屏幕宽度/750
- 小程序环境不支持 `document` / `window` 等 Web API
- 页面生命周期：`onLoad` / `onShow` / `onReady`（替代 mounted）
- 图片用 `<image mode="aspectFill">`，不能直接设宽高不设 mode

---

## 13. wxapp 原生小程序特殊模式

### 13.1 目录结构

```
├── app.js          ← 全局入口，初始化 token
├── app.json        ← 页面注册 + 窗口配置
├── app.wxss        ← 全局样式（rpx 单位）
├── config/         ← index.js（API 地址 + 上传文件地址）
├── api/            ← 封装 wx.request（引用 config）
├── utils/          ← store.js（wx.getStorageSync 管理 token）
├── static/         ← 静态资源（默认头像等）
└── pages/          ← 每个页面一个目录（.wxml + .js + .json + .wxss）
```

### 13.1.1 配置文件

```js
// config/index.js — 切换后端只需改端口
const BASE_URL = 'http://localhost:8084/api'
const UPLOAD_BASE = 'http://localhost:8084/uploads'

module.exports = { BASE_URL, UPLOAD_BASE }
```

### 13.1.2 图片 URL 处理

小程序不能用相对路径访问后端上传的文件，需要拼接完整 URL：

```js
const { UPLOAD_BASE } = require('../../config/index');
// 后端返回 /uploads/2024-01-01/xxx.jpg
// 小程序需要 http://localhost:8084/uploads/2024-01-01/xxx.jpg
const fullUrl = UPLOAD_BASE + '/' + record.avatar.replace('/uploads/', '');
```

### 13.2 request.js 模板

```js
const BASE_URL = 'http://localhost:8080/api';

const request = (url, method = 'GET', data = null) => {
  const token = wx.getStorageSync('token');
  const header = { 'Content-Type': 'application/json' };
  if (token) header['Authorization'] = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url, method, header, data, timeout: 10000,
      success(res) {
        if (res.data.code === 200) {
          resolve(res.data);
        } else if (res.data.code === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error(res.data.message));
        } else {
          wx.showToast({ title: res.data.message || '请求失败', icon: 'none' });
          reject(new Error(res.data.message));
        }
      },
      fail(err) {
        wx.showToast({ title: '网络连接失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

module.exports = { get, post, put, delete };
```

### 13.3 页面模板

```xml
<!-- pages/notice/notice.wxml -->
<view class="container">
  <view wx:if="{{detail}}" class="card">
    <view class="detail-title">{{detail.title}}</view>
    <view class="detail-time">发布于 {{detail.createTime}}</view>
    <rich-text nodes="{{detail.content}}"></rich-text>
  </view>
</view>
```

```js
// pages/notice/notice.js
const api = require('../../api/notice');

Page({
  data: { detail: null },
  onLoad(options) {
    api.getById(options.id).then(res => {
      this.setData({ detail: res.data });
    });
  }
});
```

### 13.4 wxapp 规则

- 页面是 `.wxml` + `.js` + `.json` + `.wxss` 四件套，**缺一不可**
- 样式单位用 `rpx`（750rpx = 屏幕宽度）
- 状态管理用 `wx.getStorageSync` / `wx.setStorageSync`，**没有 Pinia/Zustand**
- 跳转用 `wx.navigateTo`（保留栈）或 `wx.reLaunch`（清空栈）
- 页面间传参通过 URL query：`/pages/notice/notice?id=1`
- `module.exports` 导出（不用 ES module）
- 不能用 `axios`、`localStorage`、`document`
