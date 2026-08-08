import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Modal,
  message,
  Descriptions,
  Tag,
  Space
} from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { updateUser, updatePassword } from '../../api/user'
import { useUserStore } from '../../stores/userStore'
import AvatarUpload from '../../components/AvatarUpload'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]

const ROLE_MAP = { admin: '管理员', user: '普通用户' }

export default function Profile() {
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatar, setAvatar] = useState('')
  const userInfo = useUserStore((s) => s.userInfo)
  const updateUserInfoStore = useUserStore((s) => s.updateUserInfo)

  useEffect(() => {
    if (userInfo) {
      setAvatar(userInfo.avatar || '')
    }
  }, [userInfo])

  const startEdit = () => {
    form.setFieldsValue({
      nickname: userInfo?.nickname,
      age: userInfo?.age,
      gender: userInfo?.gender,
      phone: userInfo?.phone,
      email: userInfo?.email
    })
    setEditing(true)
  }

  const cancelEdit = () => {
    form.resetFields()
    setEditing(false)
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await updateUser({ ...values, id: userInfo.id, avatar })
      message.success('更新成功')
      updateUserInfoStore({ ...userInfo, ...values, avatar })
      setEditing(false)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (values) => {
    setPasswordLoading(true)
    try {
      await updatePassword(values.oldPassword, values.newPassword)
      message.success('密码修改成功')
      passwordForm.resetFields()
      setPasswordModalOpen(false)
    } catch (err) {
      message.error(err.message || '修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="profile-page">
      {/* ====== 顶栏：标题 + 操作按钮 ====== */}
      <div className="profile-toolbar">
        <div>
          <h1 className="profile-title">个人信息</h1>
          <p className="profile-subtitle">管理你的账户资料和联系方式</p>
        </div>
        <Space>
          {editing ? (
            <>
              <Button icon={<CloseOutlined />} onClick={cancelEdit}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={() => form.submit()}
              >
                保存
              </Button>
            </>
          ) : (
            <Button type="primary" icon={<EditOutlined />} onClick={startEdit}>
              编辑资料
            </Button>
          )}
        </Space>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* ====== 上部：头像 + 信息概览 ====== */}
        <Card className="profile-card">
          <div className="profile-header">
            <AvatarUpload value={avatar} onChange={setAvatar} size={80} disabled={!editing} />
            <Descriptions column={2} size="small" colon={false} className="profile-info">
              <Descriptions.Item label="用户名">{userInfo?.username}</Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color={userInfo?.role === 'admin' ? 'blue' : 'default'}>
                  {ROLE_MAP[userInfo?.role] || userInfo?.role}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="昵称">
                {editing ? (
                  <Form.Item name="nickname" noStyle>
                    <Input placeholder="请输入昵称" maxLength={50} style={{ width: 160 }} />
                  </Form.Item>
                ) : (
                  userInfo?.nickname || '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">{userInfo?.createTime || '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        </Card>

        {/* ====== 下部：左右两栏 ====== */}
        <div className="profile-form-grid">
          {/* 左栏：基本信息 */}
          <Card title="基本信息" className="profile-card">
            {editing ? (
              <>
                <Form.Item label="年龄" name="age">
                  <InputNumber min={1} max={150} placeholder="年龄" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="性别" name="gender">
                  <Select placeholder="请选择性别" allowClear options={GENDER_OPTIONS} />
                </Form.Item>
              </>
            ) : (
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="年龄">{userInfo?.age ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="性别">
                  {GENDER_OPTIONS.find((g) => g.value === userInfo?.gender)?.label || '-'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          {/* 右栏：联系方式 + 安全设置 */}
          <div className="profile-right-col">
            <Card title="联系方式" className="profile-card">
              {editing ? (
                <>
                  <Form.Item
                    label="手机号"
                    name="phone"
                    rules={[{ pattern: /^1\d{10}$/, message: '手机号格式不正确' }]}
                  >
                    <Input placeholder="请输入手机号" maxLength={11} />
                  </Form.Item>
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[{ type: 'email', message: '邮箱格式不正确' }]}
                  >
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                </>
              ) : (
                <Descriptions column={1} size="small" colon={false}>
                  <Descriptions.Item label="手机号">{userInfo?.phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{userInfo?.email || '-'}</Descriptions.Item>
                </Descriptions>
              )}
            </Card>

            <Card title="安全设置" className="profile-card">
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="密码">********</Descriptions.Item>
              </Descriptions>
              <Button onClick={() => setPasswordModalOpen(true)} style={{ marginTop: 8 }}>
                修改密码
              </Button>
            </Card>
          </div>
        </div>
      </Form>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => {
          passwordForm.resetFields()
          setPasswordModalOpen(false)
        }}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordLoading}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少需要6位' },
              { max: 20, message: '密码最长20位' }
            ]}
          >
            <Input.Password placeholder="6-20位" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次密码输入不一致'))
                }
              })
            ]}
          >
            <Input.Password placeholder="请再次输入" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
