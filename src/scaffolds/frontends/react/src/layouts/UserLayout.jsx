import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  HomeOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import AppFooter from '../components/AppFooter'
import '../styles/user.css'

const { Header, Content, Footer } = Layout

export default function UserLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, userInfo, logout } = useUserStore()

  const menuItems = [
    { key: '/user/home', icon: <HomeOutlined />, label: '首页' },
    { key: '/user/notice', icon: <BellOutlined />, label: '公告' }
  ]

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/user/profile')
    },
    ...(userInfo?.role === 'admin'
      ? [
          {
            key: 'admin',
            icon: <DashboardOutlined />,
            label: '管理后台',
            onClick: () => navigate('/admin/dashboard')
          }
        ]
      : []),
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
    <Layout className="u-layout">
      <Header className="u-header">
        <div className="u-header-inner">
          <div className="u-logo" onClick={() => navigate('/user/home')}>
            <span className="u-logo-mark">S</span>
            <span className="u-logo-text">脚手架平台</span>
          </div>

          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="u-nav"
          />

          <div className="u-actions">
            {token ? (
              <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                <div className="u-user">
                  <Avatar src={userInfo?.avatar} icon={<UserOutlined />} size={32} />
                  <span className="u-user-name">{userInfo?.nickname || userInfo?.username}</span>
                </div>
              </Dropdown>
            ) : (
              <>
                <Button type="text" onClick={() => navigate('/login')}>
                  登录
                </Button>
                <Button type="primary" onClick={() => navigate('/register')}>
                  注册
                </Button>
              </>
            )}
          </div>
        </div>
      </Header>

      <Content className="u-content">
        <div className="u-content-inner">
          <Outlet />
        </div>
      </Content>

      <Footer className="u-footer-slot">
        <AppFooter />
      </Footer>
    </Layout>
  )
}
