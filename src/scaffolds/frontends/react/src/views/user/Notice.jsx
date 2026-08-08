import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Pagination, Spin, Empty } from 'antd'
import { pageQueryNotice } from '../../api/notice'

const { Search } = Input

const PAGE_SIZE = 10

const htmlToText = (html = '') =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

export default function Notice() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [title, setTitle] = useState('')

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await pageQueryNotice({ pageNum, pageSize: PAGE_SIZE, title })
      setList(res.data.records)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }, [pageNum, title])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return (
    <Card title="公告列表">
      <div className="toolbar">
        <Search
          placeholder="搜索标题"
          onSearch={(v) => {
            setTitle(v)
            setPageNum(1)
          }}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      <Spin spinning={loading}>
        {list.length === 0 && !loading ? (
          <Empty description="暂无公告" />
        ) : (
          list.map((item) => (
            <div key={item.id} className="u-notice-item">
              <div className="u-notice-title" onClick={() => navigate(`/user/notice/${item.id}`)}>
                {item.title}
              </div>
              <div className="u-notice-content text-ellipsis-2">{htmlToText(item.content)}</div>
              <div className="u-notice-time">发布时间: {item.createTime}</div>
            </div>
          ))
        )}
      </Spin>

      <div className="pagination-wrap">
        <Pagination
          current={pageNum}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={setPageNum}
          showTotal={(t) => `共 ${t} 条`}
        />
      </div>
    </Card>
  )
}
