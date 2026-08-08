import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, InputNumber, Select, Button, message } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  IdcardOutlined,
  PhoneOutlined
} from '@ant-design/icons'
import { register } from '../api/user'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await register(values)
      message.success('注册成功，请登录')
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ width: 480 }}>
        <div className="auth-brand">
          <div className="auth-brand-mark">S</div>
          <div className="auth-brand-title">注册账号</div>
        </div>

        <Form onFinish={handleSubmit} size="large" layout="vertical">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 50, message: '长度 3-50 个字符' },
              {
                pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                message: '用户名需以字母开头，只能包含字母数字下划线'
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名 (登录使用)"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 32, message: '密码长度 6-32 位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('两次密码不一致'))
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item name="nickname" rules={[{ max: 50, message: '昵称最多 50 个字符' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="昵称 (选填)" maxLength={50} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="age">
              <InputNumber min={1} max={150} placeholder="年龄 (选填)" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="gender">
              <Select placeholder="性别 (选填)" allowClear options={GENDER_OPTIONS} />
            </Form.Item>
          </div>

          <Form.Item
            name="phone"
            rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的 11 位手机号' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="手机号 (选填)" maxLength={11} />
          </Form.Item>

          <Form.Item name="email" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱 (选填)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>

          <div className="auth-footer">
            已有账号？<Link to="/login">立即登录</Link>
          </div>
        </Form>
      </div>
    </div>
  )
}
