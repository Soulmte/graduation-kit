<template>
  <div>
    <!-- Stat Cards -->
    <n-grid :cols="4" :x-gap="16">
      <n-gi>
        <n-card size="small">
          <div class="stat-label">服务状态</div>
          <n-tag :type="connected ? 'success' : 'error'" size="large">
            {{ connected ? '运行中' : '已断开' }}
          </n-tag>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <div class="stat-label">数据库</div>
          <n-tag :type="dbOk ? 'success' : 'error'" size="large">
            {{ dbOk ? '已连接' : '不可用' }}
          </n-tag>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <div class="stat-label">响应延迟</div>
          <n-tag :type="latencyTagType" size="large">
            {{ latency != null ? `${latency} ms` : '-' }}
          </n-tag>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <div class="stat-label">前端框架</div>
          <n-tag type="info" size="large">Naive UI</n-tag>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Backend Details -->
    <n-card title="后端详情" style="margin-top: 16px">
      <template #header-extra>
        <n-button type="primary" :loading="loading" @click="fetchHealth">刷新</n-button>
      </template>
      <n-descriptions bordered :column="2">
        <n-descriptions-item label="连接状态">
          <n-tag :type="connected ? 'success' : 'error'">
            {{ connected ? '已连接' : '未连接' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="后端技术栈">
          {{ serviceName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="数据库状态">
          <n-tag :type="dbOk ? 'success' : 'error'">
            {{ dbOk ? '正常' : '异常' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="API地址">
          {{ apiAddress }}
        </n-descriptions-item>
        <n-descriptions-item label="响应耗时">
          {{ latency != null ? `${latency} ms` : '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="上次检查时间">
          {{ checkedAt || '-' }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NCard, NGrid, NGi, NDescriptions, NDescriptionsItem, NTag, NButton } from 'naive-ui'
import request from '@/api/request'

const loading = ref(false)
const connected = ref(false)
const serviceName = ref('')
const dbStatus = ref('')
const latency = ref(null)
const checkedAt = ref('')

const dbOk = computed(() => dbStatus.value === 'ok')

const latencyTagType = computed(() => {
  if (latency.value == null) return 'default'
  if (latency.value < 100) return 'success'
  if (latency.value < 300) return 'warning'
  return 'error'
})

const apiAddress = computed(() => {
  return import.meta.env.VITE_API_BASE_URL || request.defaults?.baseURL || '/api'
})

const fetchHealth = async () => {
  loading.value = true
  const start = Date.now()
  try {
    const res = await request.get('/health')
    latency.value = Date.now() - start
    connected.value = true
    serviceName.value = res.data?.service || ''
    dbStatus.value = res.data?.database || ''
  } catch {
    connected.value = false
    serviceName.value = ''
    dbStatus.value = ''
    latency.value = null
  } finally {
    checkedAt.value = new Date().toLocaleString()
    loading.value = false
  }
}

onMounted(fetchHealth)
</script>

<style scoped>
.stat-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}
</style>
