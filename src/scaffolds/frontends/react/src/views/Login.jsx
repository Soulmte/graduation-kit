import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import Captcha from '../components/Captcha'

export default function Login() {
  const navigate = useNavigate()
  const login = useUserStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const captchaRef = useRef(null)

  const handleSubmit = async (values) => {
    // 前端验证码校验, 不走后端
    if (!captchaRef.current.verify(values.captcha)) {
      message.error('验证码错误')
      captchaRef.current.refresh()
      return
    }
    setLoading(true)
    try {
      const res = await login(values.username, values.password)
      message.success('登录成功')
      navigate(res.data.userInfo.role === 'admin' ? '/admin/dashboard' : '/user/home')
    } catch {
      captchaRef.current.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">S</div>
          <div className="auth-brand-title">欢迎登录</div>
        </div>

        <Form onFinish={handleSubmit} size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 50, message: '长度 3-50 个字符' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                prefix={<SafetyOutlined />}
                placeholder="验证码"
                autoComplete="off"
                maxLength={4}
              />
              <Captcha ref={captchaRef} />
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div className="auth-footer">
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        </Form>
      </div>
    </div>
  )
}
