<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>操作日志</span>
        <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
      </div>
    </template>

    <div class="toolbar">
      <el-input
        v-model="filters.username"
        placeholder="搜索用户名"
        style="width: 200px"
        clearable
      />
      <el-input v-model="filters.operation" placeholder="搜索操作" style="width: 200px" clearable />
      <el-date-picker
        v-model="timeRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <el-button type="primary" @click="onFilter">搜索</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      row-key="id"
      @selection-change="selectedIds = $event.map((r) => r.id)"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column label="序号" width="70">
        <template #default="{ $index }">
          {{ (pageNum - 1) * pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="operation" label="操作" width="160" />
      <el-table-column prop="method" label="方法" show-overflow-tooltip />
      <el-table-column label="耗时" width="100">
        <template #default="{ row }">
          {{ row.executeTime != null ? `${row.executeTime} ms` : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="createTime" label="操作时间" width="180" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="showDetail(row)">详情</el-button>
          <el-button size="small" class="btn-delete" @click="handleDelete(row.id)">
            <el-icon><Delete /></el-icon> 删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="fetchList"
      />
    </div>

    <!-- 日志详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <el-descriptions border :column="1">
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentLog.username }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ currentLog.operation }}</el-descriptions-item>
        <el-descriptions-item label="方法">{{ currentLog.method }}</el-descriptions-item>
        <el-descriptions-item label="参数">
          <pre class="log-params">{{ formatParams(currentLog.params) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{
          currentLog.executeTime != null ? `${currentLog.executeTime} ms` : '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { pageQueryLog, deleteLog, deleteLogBatch } from '@/api/log'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const selectedIds = ref([])
const filters = reactive({ username: '', operation: '' })
const timeRange = ref(null)
const detailVisible = ref(false)
const currentLog = ref({})

const showDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

const formatParams = (str) => {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const q = {
      pageNum: pageNum.value,
      pageSize,
      username: filters.username,
      operation: filters.operation
    }
    if (timeRange.value?.length === 2) {
      q.startTime = timeRange.value[0]
      q.endTime = timeRange.value[1]
    }
    const res = await pageQueryLog(q)
    list.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const onFilter = () => {
  pageNum.value = 1
  fetchList()
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条日志吗？', '确认删除', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger'
  })
    .then(async () => {
      await deleteLog(id)
      ElMessage.success('删除成功')
      fetchList()
    })
    .catch(() => {})
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) return ElMessage.warning('请先选择要删除的日志')
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条日志吗？`, '确认批量删除', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger'
  })
    .then(async () => {
      await deleteLogBatch(selectedIds.value)
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      fetchList()
    })
    .catch(() => {})
}

onMounted(fetchList)
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.log-params {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 13px;
  max-height: 300px;
  overflow: auto;
}
</style>
