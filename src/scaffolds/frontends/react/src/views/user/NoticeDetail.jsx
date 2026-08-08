import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { getNoticeById } from '../../api/notice'

export default function NoticeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getNoticeById(id)
      .then((res) => setDetail(res.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spin spinning style={{ display: 'block', marginTop: 120 }} />

  if (!detail)
    return (
      <div className="detail-page">
        <p>公告不存在</p>
      </div>
    )

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <h1 className="detail-title">{detail.title}</h1>
      <p className="detail-subtitle">
        发布于 <span className="text-muted">{detail.createTime}</span>
        {detail.updateTime !== detail.createTime && (
          <>
            {' '}
            · 更新于 <span className="text-muted">{detail.updateTime}</span>
          </>
        )}
      </p>

      <Card className="detail-section">
        <h2 className="section-title">基本信息</h2>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="编号">
            <span className="text-primary">{detail.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="发布人">{detail.createBy || '-'}</Descriptions.Item>
          <Descriptions.Item label="发布时间">{detail.createTime}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{detail.updateTime}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="detail-section">
        <h2 className="section-title">详细内容</h2>
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: detail.content || '' }} />
      </Card>
    </div>
  )
}
