<template>
  <div class="stack-16">
    <n-grid :cols="4" :x-gap="16" responsive="screen">
      <n-gi>
        <n-card>
          <n-statistic label="用户总数">
            <span style="color: var(--color-success)">{{ stats.userCount }}</span>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-statistic label="公告总数">
            <span style="color: var(--color-primary)">{{ stats.noticeCount }}</span>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-statistic label="日志总数">
            <span style="color: var(--color-danger)">{{ stats.logCount }}</span>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-statistic label="今日日志">
            <span style="color: var(--color-warning)">{{ stats.todayLogCount }}</span>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <div class="chart-grid">
      <n-card><div ref="logChart" style="height: 320px"></div></n-card>
      <n-card><div ref="roleChart" style="height: 320px"></div></n-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { NGrid, NGi, NCard, NStatistic } from 'naive-ui'
import * as echarts from 'echarts'
import { listAllUser } from '@/api/user'
import { listAllNotice } from '@/api/notice'
import { pageQueryLog } from '@/api/log'

const stats = reactive({ userCount: 0, noticeCount: 0, logCount: 0, todayLogCount: 0 })
const logChart = ref(null)
const roleChart = ref(null)
let logInst, roleInst

const fetchData = async () => {
  const [userRes, noticeRes, logRes] = await Promise.all([
    listAllUser(),
    listAllNotice(),
    pageQueryLog({ pageNum: 1, pageSize: 1 })
  ])
  const users = userRes.data || []
  stats.userCount = users.length
  stats.noticeCount = (noticeRes.data || []).length
  stats.logCount = logRes.data.total || 0

  const today = new Date().toISOString().split('T')[0]
  const todayRes = await pageQueryLog({
    pageNum: 1,
    pageSize: 1,
    startTime: `${today} 00:00:00`,
    endTime: `${today} 23:59:59`
  })
  stats.todayLogCount = todayRes.data.total || 0

  const roleMap = {}
  users.forEach((u) => {
    roleMap[u.role] = (roleMap[u.role] || 0) + 1
  })
  const roleData = Object.entries(roleMap).map(([name, value]) => ({
    name: name === 'admin' ? '管理员' : '普通用户',
    value
  }))

  const dates = [],
    counts = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const s = d.toISOString().split('T')[0]
    dates.push(s.slice(5))
    const r = await pageQueryLog({
      pageNum: 1,
      pageSize: 1,
      startTime: `${s} 00:00:00`,
      endTime: `${s} 23:59:59`
    })
    counts.push(r.data.total || 0)
  }

  await nextTick()
  logInst = echarts.init(logChart.value)
  logInst.setOption({
    title: { text: '近 7 天操作日志趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [
      {
        data: counts,
        type: 'line',
        smooth: true,
        itemStyle: { color: '#18a058' },
        areaStyle: { opacity: 0.3 }
      }
    ]
  })

  roleInst = echarts.init(roleChart.value)
  roleInst.setOption({
    title: { text: '用户角色分布' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    color: ['#18a058', '#f0a020', '#d03050'],
    series: [{ type: 'pie', radius: '60%', data: roleData }]
  })
}

const handleResize = () => {
  logInst?.resize()
  roleInst?.resize()
}
onMounted(() => {
  fetchData().catch(() => {})
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  logInst?.dispose()
  roleInst?.dispose()
})
</script>

<style scoped>
.chart-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
}
@media (max-width: 992px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
