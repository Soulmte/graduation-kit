import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Input, Modal, message, DatePicker } from 'antd'
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { pageQueryLog, deleteLog, deleteLogBatch } from '../../api/log'
import ResizableTitle from '../../components/ResizableTitle'

const { Search } = Input
const { RangePicker } = DatePicker

/** 尝试格式化 JSON, 失败则原样返回 */
const tryFormatJson = (str) => {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

export default function LogManage() {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const pageSize = 10
  const [username, setUsername] = useState('')
  const [operation, setOperation] = useState('')
  const [timeRange, setTimeRange] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const q = { pageNum, pageSize, username, operation }
      if (timeRange?.length === 2) {
        q.startTime = timeRange[0].format('YYYY-MM-DD HH:mm:ss')
        q.endTime = timeRange[1].format('YYYY-MM-DD HH:mm:ss')
      }
      const res = await pageQueryLog(q)
      setList(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [pageNum, username, operation, timeRange])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条日志吗？',
      onOk: async () => {
        await deleteLog(id)
        message.success('删除成功')
        fetchList()
      }
    })
  }

  const handleBatchDelete = () => {
    if (!selectedIds.length) return message.warning('请先选择要删除的日志')
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedIds.length} 条日志吗？`,
      onOk: async () => {
        await deleteLogBatch(selectedIds)
        message.success('批量删除成功')
        setSelectedIds([])
        fetchList()
      }
    })
  }

  const columnsDef = [
    {
      title: '序号',
      key: 'idx',
      width: 70,
      render: (_, __, i) => (pageNum - 1) * pageSize + i + 1
    },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '操作', dataIndex: 'operation', width: 160 },
    { title: '方法', dataIndex: 'method', ellipsis: true },
    {
      title: '耗时',
      dataIndex: 'executeTime',
      width: 100,
      render: (t) => (t != null ? `${t} ms` : '-')
    },
    { title: 'IP', dataIndex: 'ip', width: 140 },
    { title: '操作时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'op',
      width: 150,
      render: (_, r) => (
        <div className="table-actions">
          <Button
            size="small"
            className="btn-edit"
            icon={<EyeOutlined />}
            onClick={() => {
              setDetailRecord(r)
              setDetailVisible(true)
            }}
          >
            详情
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
      title="操作日志"
      extra={
        <Button
          danger
          icon={<DeleteOutlined />}
          disabled={!selectedIds.length}
          onClick={handleBatchDelete}
        >
          批量删除
        </Button>
      }
    >
      <div className="toolbar">
        <Search
          placeholder="搜索用户名"
          style={{ width: 200 }}
          allowClear
          onSearch={(v) => {
            setUsername(v)
            setPageNum(1)
          }}
        />
        <Search
          placeholder="搜索操作"
          style={{ width: 200 }}
          allowClear
          onSearch={(v) => {
            setOperation(v)
            setPageNum(1)
          }}
        />
        <RangePicker
          showTime
          onChange={(v) => {
            setTimeRange(v)
            setPageNum(1)
          }}
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
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {detailRecord && (
          <div style={{ lineHeight: 2 }}>
            <p>
              <strong>用户名:</strong> {detailRecord.username || '-'}
            </p>
            <p>
              <strong>操作:</strong> {detailRecord.operation || '-'}
            </p>
            <p>
              <strong>方法:</strong> {detailRecord.method || '-'}
            </p>
            <p>
              <strong>耗时:</strong>{' '}
              {detailRecord.executeTime != null ? `${detailRecord.executeTime} ms` : '-'}
            </p>
            <p>
              <strong>IP:</strong> {detailRecord.ip || '-'}
            </p>
            <p>
              <strong>操作时间:</strong> {detailRecord.createTime || '-'}
            </p>
            <p>
              <strong>请求参数:</strong>
            </p>
            <pre
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                overflow: 'auto',
                maxHeight: 300,
                fontSize: 13,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {tryFormatJson(detailRecord.params)}
            </pre>
          </div>
        )}
      </Modal>
    </Card>
  )
}
