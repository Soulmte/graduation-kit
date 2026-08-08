<template>
  <n-card>
    <template #header>
      <div class="card-header">
        <span>操作日志</span>
        <n-button type="error" :disabled="!selectedIds.length" @click="handleBatchDelete"
          >批量删除</n-button
        >
      </div>
    </template>

    <div class="toolbar">
      <n-input
        v-model:value="filters.username"
        placeholder="搜索用户名"
        style="width: 200px"
        clearable
      />
      <n-input
        v-model:value="filters.operation"
        placeholder="搜索操作"
        style="width: 200px"
        clearable
      />
      <n-date-picker v-model:value="timeRange" type="datetimerange" clearable />
      <n-button type="primary" @click="onFilter">搜索</n-button>
    </div>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="list"
      :row-key="(row) => row.id"
      :pagination="pagination"
      :scroll-x="1200"
      @update:checked-row-keys="(v) => (selectedIds = v)"
      remote
    />

    <!-- 日志详情弹窗 -->
    <n-modal v-model:show="detailVisible" preset="card" title="日志详情" style="width: 600px">
      <n-descriptions bordered :column="1">
        <n-descriptions-item label="ID">{{ currentLog.id }}</n-descriptions-item>
        <n-descriptions-item label="用户名">{{ currentLog.username }}</n-descriptions-item>
        <n-descriptions-item label="操作">{{ currentLog.operation }}</n-descriptions-item>
        <n-descriptions-item label="方法">{{ currentLog.method }}</n-descriptions-item>
        <n-descriptions-item label="参数">
          <pre class="log-params">{{ formatParams(currentLog.params) }}</pre>
        </n-descriptions-item>
        <n-descriptions-item label="耗时">{{
          currentLog.executeTime != null ? `${currentLog.executeTime} ms` : '-'
        }}</n-descriptions-item>
        <n-descriptions-item label="IP">{{ currentLog.ip }}</n-descriptions-item>
        <n-descriptions-item label="操作时间">{{ currentLog.createTime }}</n-descriptions-item>
      </n-descriptions>
    </n-modal>
  </n-card>
</template>

<script setup>
import { h, reactive, ref, onMounted, computed } from 'vue'
import {
  NCard,
  NButton,
  NInput,
  NDatePicker,
  NDataTable,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  useMessage,
  useDialog
} from 'naive-ui'
import dayjs from 'dayjs'
import { pageQueryLog, deleteLog, deleteLogBatch } from '@/api/log'

const message = useMessage()
const dialog = useDialog()

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

const pagination = computed(() => ({
  page: pageNum.value,
  pageSize,
  itemCount: total.value,
  showSizePicker: false,
  prefix: ({ itemCount }) => `共 ${itemCount} 条`,
  onChange: (p) => {
    pageNum.value = p
    fetchList()
  }
}))

const columns = [
  { type: 'selection' },
  {
    title: '序号',
    key: 'idx',
    width: 70,
    render: (_r, i) => (pageNum.value - 1) * pageSize + i + 1
  },
  { title: '用户名', key: 'username', width: 120 },
  { title: '操作', key: 'operation', width: 160 },
  { title: '方法', key: 'method', ellipsis: { tooltip: true } },
  {
    title: '耗时',
    key: 'executeTime',
    width: 100,
    render: (r) => (r.executeTime != null ? `${r.executeTime} ms` : '-')
  },
  { title: 'IP', key: 'ip', width: 140 },
  { title: '操作时间', key: 'createTime', width: 180 },
  {
    title: '操作',
    key: 'op',
    width: 160,
    fixed: 'right',
    render: (row) =>
      h('div', { style: 'display:flex;gap:8px' }, [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => showDetail(row)
          },
          () => '详情'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            secondary: true,
            onClick: () => handleDelete(row.id)
          },
          () => '删除'
        )
      ])
  }
]

const fetchList = async () => {
  loading.value = true
  try {
    const q = {
      pageNum: pageNum.value,
      pageSize,
      username: filters.username,
      operation: filters.operation
    }
    if (timeRange.value && timeRange.value.length === 2) {
      q.startTime = dayjs(timeRange.value[0]).format('YYYY-MM-DD HH:mm:ss')
      q.endTime = dayjs(timeRange.value[1]).format('YYYY-MM-DD HH:mm:ss')
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
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这条日志吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteLog(id)
      message.success('删除成功')
      fetchList()
    }
  })
}
const handleBatchDelete = () => {
  if (!selectedIds.value.length) return message.warning('请先选择要删除的日志')
  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedIds.value.length} 条日志吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteLogBatch(selectedIds.value)
      message.success('批量删除成功')
      selectedIds.value = []
      fetchList()
    }
  })
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
