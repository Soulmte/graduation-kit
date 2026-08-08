<template>
  <!-- Top Row: 4 Stat Cards -->
  <el-row :gutter="20" class="stat-row">
    <el-col :xs="24" :sm="12" :md="6">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-icon" :class="connected ? 'icon-green' : 'icon-red'">
            <el-icon :size="28">
              <CircleCheck v-if="connected" />
              <CircleClose v-else />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">服务状态</div>
            <div class="stat-value" :class="connected ? 'text-green' : 'text-red'">
              {{ connected ? '运行中' : '已断开' }}
            </div>
          </div>
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :sm="12" :md="6">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-icon" :class="dbStatus === 'ok' ? 'icon-green' : 'icon-red'">
            <el-icon :size="28"><Coin /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">数据库</div>
            <div class="stat-value" :class="dbStatus === 'ok' ? 'text-green' : 'text-red'">
              {{ dbStatus === 'ok' ? '已连接' : '不可用' }}
            </div>
          </div>
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :sm="12" :md="6">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-icon" :class="latencyColorClass">
            <el-icon :size="28"><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">响应延迟</div>
            <div class="stat-value" :class="latencyColorClass">
              {{ latency != null ? `${latency} ms` : '-' }}
            </div>
          </div>
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :sm="12" :md="6">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-icon icon-blue">
            <el-icon :size="28"><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">前端框架</div>
            <div class="stat-value text-blue">Element Plus</div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <!-- Backend Details -->
  <el-card v-loading="loading" class="backend-card">
    <template #header>
      <div class="card-header">
        <span>后端详情</span>
        <el-button type="primary" :loading="loading" @click="fetchHealth">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </template>

    <el-descriptions border :column="2">
      <el-descriptions-item label="连接状态">
        <el-tag :type="connected ? 'success' : 'danger'">
          {{ connected ? '已连接' : '未连接' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="后端技术栈">
        {{ serviceName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="数据库状态">
        <el-tag :type="dbStatus === 'ok' ? 'success' : 'danger'">
          {{ dbStatus === 'ok' ? '正常' : dbStatus || '-' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="API地址">
        {{ apiBaseUrl }}
      </el-descriptions-item>
      <el-descriptions-item label="响应耗时">
        {{ latency != null ? `${latency} ms` : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="上次检查时间">
        {{ lastCheckTime || '-' }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Refresh,
  CircleCheck,
  CircleClose,
  Coin,
  Timer,
  Monitor,
  Cloudy
} from '@element-plus/icons-vue'
import request from '@/api/request'

const loading = ref(false)
const connected = ref(false)
const serviceName = ref('')
const dbStatus = ref('')
const latency = ref(null)
const lastCheckTime = ref('')

const apiBaseUrl = computed(() => {
  const base = import.meta.env.VITE_API_BASE_URL
  return base || (typeof window !== 'undefined' ? window.location.origin : '-')
})

const latencyColorClass = computed(() => {
  if (latency.value == null) return 'text-muted'
  if (latency.value < 100) return 'icon-green text-green'
  if (latency.value < 300) return 'icon-orange text-orange'
  return 'icon-red text-red'
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
    lastCheckTime.value = new Date().toLocaleString()
  } catch {
    connected.value = false
    serviceName.value = ''
    dbStatus.value = ''
    latency.value = null
    lastCheckTime.value = new Date().toLocaleString()
  } finally {
    loading.value = false
  }
}

onMounted(fetchHealth)
</script>

<style scoped>
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-green {
  background: #f0fdf4;
  color: #22c55e;
}
.icon-red {
  background: #fef2f2;
  color: #ef4444;
}
.icon-blue {
  background: #eff6ff;
  color: #3b82f6;
}
.icon-orange {
  background: #fff7ed;
  color: #f97316;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.text-green {
  color: #22c55e;
}
.text-red {
  color: #ef4444;
}
.text-blue {
  color: #3b82f6;
}
.text-orange {
  color: #f97316;
}
.text-muted {
  color: #909399;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.backend-card {
  margin-bottom: 20px;
}
</style>
