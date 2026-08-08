import { useNavigate } from 'react-router-dom'
import { Button, Result } from 'antd'

/**
 * 404 页面 - 访问不存在的路径时展示
 */
export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-page)'
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="抱歉, 您访问的页面不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/user/home')}>
            返回首页
          </Button>
        }
      />
    </div>
  )
}
