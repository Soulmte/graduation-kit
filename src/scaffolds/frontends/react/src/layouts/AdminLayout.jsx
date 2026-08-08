import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  BellOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import AppFooter from '../components/AppFooter'
import '../styles/admin.css'

const { Header, Sider, Content, Footer } = Layout

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, logout } = useUserStore()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/admin/user', icon: <UserOutlined />, label: '用户管理' },
    { key: '/admin/notice', icon: <BellOutlined />, label: '公告管理' },
    { key: '/admin/log', icon: <FileTextOutlined />, label: '日志管理' },
    { key: '/admin/status', icon: <DashboardOutlined />, label: '系统状态' }
  ]

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/admin/profile')
    },
    {
      key: 'userside',
      icon: <DashboardOutlined />,
      label: '用户端',
      onClick: () => navigate('/user/home')
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      }
    }
  ]

  return (
    <Layout className="a-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} width={220} className="a-sider">
        <div className="a-logo">
          <span className="a-logo-mark">S</span>
          {!collapsed && <span>后台管理</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="a-menu"
        />
      </Sider>

      <Layout className="a-body">
        <Header className="a-header">
          <div className="a-header-left">
            {collapsed ? (
              <MenuUnfoldOutlined className="a-trigger" onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined className="a-trigger" onClick={() => setCollapsed(true)} />
            )}
            <span className="a-breadcrumb">管理控制台</span>
          </div>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div className="a-user">
              <Avatar src={userInfo?.avatar} icon={<UserOutlined />} size={32} />
              <span className="a-user-name">
                {userInfo?.nickname || userInfo?.username || '未登录'}
              </span>
            </div>
          </Dropdown>
        </Header>

        <Content className="a-content">
          <Outlet />
        </Content>

        <Footer className="a-footer-slot">
          <AppFooter />
        </Footer>
      </Layout>
    </Layout>
  )
}
