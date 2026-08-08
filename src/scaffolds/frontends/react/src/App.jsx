import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './stores/userStore'
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './views/Login'
import Register from './views/Register'
import UserHome from './views/user/Home'
import UserNotice from './views/user/Notice'
import NoticeDetail from './views/user/NoticeDetail'
import UserProfile from './views/user/Profile'
import Dashboard from './views/admin/Dashboard'
import UserManage from './views/admin/UserManage'
import NoticeManage from './views/admin/NoticeManage'
import LogManage from './views/admin/LogManage'
import AdminProfile from './views/admin/Profile'
import SystemStatus from './views/admin/SystemStatus'
import NotFound from './views/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/user/home" replace />} />

      {/* 用户端路由 */}
      <Route path="/user" element={<UserLayout />}>
        <Route path="home" element={<UserHome />} />
        <Route path="notice" element={<UserNotice />} />
        <Route path="notice/:id" element={<NoticeDetail />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 管理端路由 */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="user" element={<UserManage />} />
        <Route path="notice" element={<NoticeManage />} />
        <Route path="log" element={<LogManage />} />
        <Route path="status" element={<SystemStatus />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* 登录注册 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 404 兜底 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// 需要登录的路由保护
// 用 Navigate 直接重定向，避免 useEffect 跳转造成的登录前页面闪帧
function ProtectedRoute({ children }) {
  const token = useUserStore((state) => state.token)

  if (!token) return <Navigate to="/login" replace />
  return children
}

// 需要管理员权限的路由保护
// 前端只做菜单级屏蔽，真正的权限校验在后端（@RequireAdmin / adminMiddleware）
// 即使用户篡改本地 role 绕过路由，接口依旧会返 403
function AdminRoute({ children }) {
  const token = useUserStore((state) => state.token)
  const userInfo = useUserStore((state) => state.userInfo)

  if (!token) return <Navigate to="/login" replace />
  if (userInfo?.role !== 'admin') return <Navigate to="/user/home" replace />
  return children
}

export default App
