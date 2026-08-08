import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Modal,
  Form,
  Tag,
  Alert,
  message
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { pageQueryUser, register, updateUser, deleteUser, deleteUserBatch } from '../../api/user'
import AvatarUpload from '../../components/AvatarUpload'
import ResizableTitle from '../../components/ResizableTitle'

const { Search } = Input

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]
const genderLabel = (g) => GENDER_OPTIONS.find((o) => o.value === g)?.label || '-'

export default function UserManage() {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const pageSize = 10
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [avatar, setAvatar] = useState('')
  const [form] = Form.useForm()

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pageQueryUser({ pageNum, pageSize, username, role })
      setList(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [pageNum, username, role])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleAdd = () => {
    setEditing(null)
    setAvatar('')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditing(record)
    setAvatar(record.avatar || '')
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  // 后端 update 接口不接收 role 与 password（防提权与越权改密），
  // 因此编辑时不展示这两个字段，避免“提示成功但实际未生效”
  const isEdit = !!editing

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteUser(id)
        message.success('删除成功')
        fetchList()
      }
    })
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return message.warning('请先选择要删除的用户')
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedIds.length} 个用户吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteUserBatch(selectedIds)
        message.success('批量删除成功')
        setSelectedIds([])
        fetchList()
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
    setModalVisible(false)
    fetchList()
  }

  const columnsDef = [
    {
      title: '序号',
      key: 'idx',
      width: 70,
      render: (_, __, i) => (pageNum - 1) * pageSize + i + 1
    },
    { title: '用户名', dataIndex: 'username', width: 120 },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 120,
      render: (v) => v || '-'
    },
    { title: '性别', dataIndex: 'gender', width: 70, render: genderLabel },
    { title: '年龄', dataIndex: 'age', width: 70, render: (v) => v || '-' },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      render: (v) => v || '-'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
      render: (v) => v || '-'
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 110,
      render: (r) => (
        <Tag color={r === 'admin' ? 'red' : 'blue'}>{r === 'admin' ? '管理员' : '普通用户'}</Tag>
      )
    },
    { title: '创建时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作',
      key: 'op',
      width: 180,
      fixed: 'right',
      render: (_, r) => (
        <div className="table-actions">
          <Button
            size="small"
            className="btn-edit"
            icon={<EditOutlined />}
            onClick={() => handleEdit(r)}
          >
            编辑
          </Button>
          <Button
            size="small"
            className="btn-delete"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(r.id)}
          >
            删除
          </Button>
        </div>
      )
    }
  ]

  const [columns, setColumns] = useState(columnsDef)

  const handleResize = useCallback(
    (index) =>
      (_, { size }) => {
        setColumns((prev) => {
          const next = [...prev]
          next[index] = { ...next[index], width: Math.max(60, size.width) }
          return next
        })
      },
    []
  )

  const mergedColumns = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column) => ({
      width: column.width,
      onResize: handleResize(index)
    })
  }))

  const tableComponents = {
    header: { cell: ResizableTitle }
  }

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加用户
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={!selectedIds.length}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
        </Space>
      }
    >
      <div className="toolbar">
        <Search
          placeholder="搜索用户名"
          onSearch={(v) => {
            setUsername(v)
            setPageNum(1)
          }}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          placeholder="选择角色"
          onChange={(v) => {
            setRole(v || '')
            setPageNum(1)
          }}
          style={{ width: 150 }}
          allowClear
        >
          <Select.Option value="admin">管理员</Select.Option>
          <Select.Option value="user">普通用户</Select.Option>
        </Select>
      </div>

      <Table
        loading={loading}
        columns={mergedColumns}
        dataSource={list}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        components={tableComponents}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: setSelectedIds
        }}
        pagination={{
          current: pageNum,
          pageSize,
          total,
          onChange: setPageNum,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

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

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            isEdit
              ? '角色与密码不在本表单修改，后端已限制该接口只能更新基本资料'
              : '新建账号的角色固定为普通用户，由后端统一控制'
          }
        />

        <Form form={form} layout="vertical">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 16px'
            }}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" disabled={isEdit} />
            </Form.Item>
            {!isEdit && (
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            )}
            <Form.Item label="昵称" name="nickname">
              <Input placeholder="请输入昵称" maxLength={50} />
            </Form.Item>
            <Form.Item label="年龄" name="age">
              <InputNumber min={1} max={150} placeholder="年龄" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="性别" name="gender">
              <Select placeholder="请选择性别" allowClear options={GENDER_OPTIONS} />
            </Form.Item>
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
          </div>
        </Form>
      </Modal>
    </Card>
  )
}
