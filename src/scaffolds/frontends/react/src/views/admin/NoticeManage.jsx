import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Input, Space, Modal, Form, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  pageQueryNotice,
  addNotice,
  updateNotice,
  deleteNotice,
  deleteNoticeBatch
} from '../../api/notice'
import RichTextEditor from '../../components/RichTextEditor'
import ResizableTitle from '../../components/ResizableTitle'

const { Search } = Input

// 把 HTML 去标签, 得到纯文本, 用于列表预览
const htmlToText = (html = '') =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

export default function NoticeManage() {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const pageSize = 10
  const [title, setTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const [content, setContent] = useState('')

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pageQueryNotice({ pageNum, pageSize, title })
      setList(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [pageNum, title])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleAdd = () => {
    setEditing(null)
    setContent('')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (r) => {
    setEditing(r)
    setContent(r.content || '')
    form.setFieldsValue(r)
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条公告吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteNotice(id)
        message.success('删除成功')
        fetchList()
      }
    })
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return message.warning('请先选择要删除的公告')
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedIds.length} 条公告吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteNoticeBatch(selectedIds)
        message.success('批量删除成功')
        setSelectedIds([])
        fetchList()
      }
    })
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (!htmlToText(content)) {
      message.warning('请输入公告内容')
      return
    }
    const payload = { ...values, content }
    if (editing) {
      await updateNotice({ ...payload, id: editing.id })
      message.success('更新成功')
    } else {
      await addNotice(payload)
      message.success('创建成功')
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
    { title: '标题', dataIndex: 'title', width: 220 },
    {
      title: '内容预览',
      dataIndex: 'content',
      ellipsis: true,
      render: (html) => <span className="text-sub">{htmlToText(html)}</span>
    },
    {
      title: '发布人',
      dataIndex: 'createBy',
      width: 120,
      render: (v) => v || '-'
    },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    {
      title: '操作',
      key: 'op',
      width: 180,
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
      title="公告管理"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加公告
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
          placeholder="搜索标题"
          onSearch={(v) => {
            setTitle(v)
            setPageNum(1)
          }}
          style={{ width: 250 }}
          allowClear
        />
      </div>

      <Table
        loading={loading}
        columns={mergedColumns}
        dataSource={list}
        rowKey="id"
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
        title={editing ? '编辑公告' : '添加公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText={editing ? '保存' : '添加'}
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" maxLength={200} showCount />
          </Form.Item>

          <Form.Item label="内容" required>
            <RichTextEditor
              value={content}
              onChange={setContent}
              height={360}
              placeholder="支持格式、图片、表格等富文本内容..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
