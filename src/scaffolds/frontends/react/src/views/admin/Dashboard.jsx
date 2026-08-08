import { useState, useEffect } from 'react'
import { Card, Statistic } from 'antd'
import { UserOutlined, BellOutlined, FileTextOutlined, RiseOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { listAllUser } from '../../api/user'
import { listAllNotice } from '../../api/notice'
import { pageQueryLog } from '../../api/log'

// 取本地日期的 YYYY-MM-DD。不能用 toISOString()，它返回 UTC 日期，
// 东八区凌晨 0-8 点会算成前一天
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// 查指定日期的日志数：只取 total，不拉具体记录
const countLogByDate = (dateStr) =>
  pageQueryLog({
    pageNum: 1,
    pageSize: 1,
    startTime: `${dateStr} 00:00:00`,
    endTime: `${dateStr} 23:59:59`
  }).then((res) => res.data.total || 0)

export default function Dashboard() {
  const [stats, setStats] = useState({
    userCount: 0,
    noticeCount: 0,
    logCount: 0,
    todayLogCount: 0
  })
  const [roleData, setRoleData] = useState([])
  const [logTrend, setLogTrend] = useState({ dates: [], counts: [] })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 近 7 天的日期（含今天）
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(fmtDate(d))
      }

      // 所有请求并发，避免串行累加延迟
      const [userRes, noticeRes, logRes, dayCounts] = await Promise.all([
        listAllUser(),
        listAllNotice(),
        pageQueryLog({ pageNum: 1, pageSize: 1 }),
        Promise.all(days.map(countLogByDate))
      ])

      const users = userRes.data || []
      const notices = noticeRes.data || []

      setStats({
        userCount: users.length,
        noticeCount: notices.length,
        logCount: logRes.data.total || 0,
        // 今日日志就是近 7 天的最后一项，无需重复请求
        todayLogCount: dayCounts[dayCounts.length - 1]
      })

      // 角色分布
      const roleMap = {}
      users.forEach((u) => {
        roleMap[u.role] = (roleMap[u.role] || 0) + 1
      })
      setRoleData(
        Object.entries(roleMap).map(([name, value]) => ({
          name: name === 'admin' ? '管理员' : '普通用户',
          value
        }))
      )

      // 图表只显示月-日
      setLogTrend({ dates: days.map((d) => d.slice(5)), counts: dayCounts })
    } catch {
      // 错误提示已在 request 拦截器统一处理
    }
  }

  const logChartOption = {
    title: { text: '近 7 天操作日志趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: logTrend.dates },
    yAxis: { type: 'value' },
    series: [
      {
        data: logTrend.counts,
        type: 'line',
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.3 }
      }
    ]
  }

  const roleChartOption = {
    title: { text: '用户角色分布' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: roleData,
        label: { color: '#595959' }
      }
    ],
    color: ['#1890ff', '#52c41a', '#faad14']
  }

  return (
    <div className="stack-16">
      <div className="a-stat-grid">
        <Card>
          <Statistic
            title="用户总数"
            value={stats.userCount}
            prefix={<UserOutlined />}
            valueStyle={{ color: 'var(--color-success)' }}
          />
        </Card>
        <Card>
          <Statistic
            title="公告总数"
            value={stats.noticeCount}
            prefix={<BellOutlined />}
            valueStyle={{ color: 'var(--color-primary)' }}
          />
        </Card>
        <Card>
          <Statistic
            title="日志总数"
            value={stats.logCount}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: 'var(--color-danger)' }}
          />
        </Card>
        <Card>
          <Statistic
            title="今日日志"
            value={stats.todayLogCount}
            prefix={<RiseOutlined />}
            valueStyle={{ color: 'var(--color-warning)' }}
          />
        </Card>
      </div>

      <div className="a-chart-grid">
        <Card>
          <ReactECharts option={logChartOption} style={{ height: 320 }} />
        </Card>
        <Card>
          <ReactECharts option={roleChartOption} style={{ height: 320 }} />
        </Card>
      </div>
    </div>
  )
}
