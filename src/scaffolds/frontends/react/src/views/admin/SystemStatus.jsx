import { useState, useEffect } from 'react'
import { Card, Statistic, Button, Descriptions, Tag, Spin, Row, Col } from 'antd'
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  DesktopOutlined
} from '@ant-design/icons'
import request from '../../utils/request'

export default function SystemStatus() {
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [latency, setLatency] = useState(null)
  const [checkedAt, setCheckedAt] = useState(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    const start = Date.now()
    try {
      const res = await request.get('/health')
      setLatency(Date.now() - start)
      setHealth(res.data)
      setError(null)
    } catch (err) {
      setLatency(Date.now() - start)
      setError(err.message || '连接失败')
      setHealth(null)
    } finally {
      setCheckedAt(new Date().toLocaleString())
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const connected = !error && health
  const dbOk = health?.database === 'ok'

  const latencyColor =
    latency == null ? '#999' : latency < 100 ? '#52c41a' : latency < 300 ? '#faad14' : '#ff4d4f'

  return (
    <Spin spinning={loading}>
      {/* ====== 状态概览卡片 ====== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="服务状态"
              value={connected ? '运行中' : '已断开'}
              prefix={
                connected ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )
              }
              valueStyle={{
                color: connected ? '#52c41a' : '#ff4d4f',
                fontSize: 20
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="数据库"
              value={dbOk ? '已连接' : error ? '不可用' : '检测中'}
              prefix={
                dbOk ? (
                  <DatabaseOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <DatabaseOutlined style={{ color: '#ff4d4f' }} />
                )
              }
              valueStyle={{ color: dbOk ? '#52c41a' : '#ff4d4f', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="响应延迟"
              value={latency != null ? `${latency} ms` : '-'}
              prefix={<ThunderboltOutlined style={{ color: latencyColor }} />}
              valueStyle={{ color: latencyColor, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="前端框架"
              value="React"
              prefix={<DesktopOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ====== 详细信息 ====== */}
      <Card
        title="后端详情"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchHealth} loading={loading}>
            刷新
          </Button>
        }
      >
        {error ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="连接状态">
              <Tag icon={<CloseCircleOutlined />} color="error">
                连接失败
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="错误信息">{error}</Descriptions.Item>
            <Descriptions.Item label="响应耗时">{latency} ms</Descriptions.Item>
            <Descriptions.Item label="检查时间">{checkedAt || '-'}</Descriptions.Item>
          </Descriptions>
        ) : health ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="连接状态">
              <Tag icon={<CheckCircleOutlined />} color="success">
                正常
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="后端技术栈">
              <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>
                <CloudServerOutlined /> {health.service || '未知'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="数据库状态">
              <Tag color={dbOk ? 'success' : 'error'}>
                {dbOk ? '连接正常' : health.database || '异常'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="API 地址">/api/health</Descriptions.Item>
            <Descriptions.Item label="响应耗时">
              <span style={{ color: latencyColor, fontWeight: 600 }}>{latency} ms</span>
            </Descriptions.Item>
            <Descriptions.Item label="上次检查">{checkedAt || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <CloudServerOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>点击「刷新」检查系统状态</p>
          </div>
        )}
      </Card>
    </Spin>
  )
}
