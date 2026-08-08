import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { UserOutlined, BellOutlined } from '@ant-design/icons'
import { listAllNotice } from '../../api/notice'

export default function Home() {
  const [noticeCount, setNoticeCount] = useState(0)

  useEffect(() => {
    listAllNotice()
      .then((res) => setNoticeCount((res.data || []).length))
      .catch(() => {})
  }, [])

  return (
    <div className="stack-24">
      <div className="banner">
        <h1>欢迎使用多技术栈脚手架</h1>
        <p>一套前端, 可连接六种后端实现</p>
      </div>

      <div className="home-hero">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card>
              <Statistic
                title="公告数"
                value={noticeCount}
                prefix={<BellOutlined />}
                valueStyle={{ color: 'var(--color-primary)' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="服务状态"
                value="运行中"
                prefix={<UserOutlined />}
                valueStyle={{ color: 'var(--color-success)' }}
              />
            </Card>
          </Col>
        </Row>

        <div className="home-intro">
          <div className="home-intro-title">系统功能</div>
          <ul className="home-intro-list">
            <li>用户管理: 注册、登录、个人信息维护</li>
            <li>公告管理: 发布、查看、检索</li>
            <li>操作日志: 自动记录 + 条件查询</li>
            <li>文件上传: 头像与附件</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
