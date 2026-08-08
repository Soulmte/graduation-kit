<template>
  <n-card>
    <template #header>
      <div class="card-header">
        <span>公告管理</span>
        <n-space>
          <n-button type="primary" @click="handleAdd">添加公告</n-button>
          <n-button type="error" :disabled="!selectedIds.length" @click="handleBatchDelete"
            >批量删除</n-button
          >
        </n-space>
      </div>
    </template>

    <div class="toolbar">
      <n-input
        v-model:value="title"
        placeholder="搜索标题"
        style="width: 250px"
        clearable
        @keydown.enter="onSearch"
      />
      <n-button type="primary" @click="onSearch">搜索</n-button>
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

    <n-modal
      v-model:show="modalVisible"
      preset="card"
      :title="editing ? '编辑公告' : '添加公告'"
      style="width: 900px"
    >
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item label="标题" path="title">
          <n-input
            v-model:value="form.title"
            placeholder="请输入标题"
            :maxlength="200"
            show-count
          />
        </n-form-item>
        <n-form-item label="内容">
          <rich-text-editor v-model="content" :height="360" />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="modalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit">{{ editing ? '保存' : '添加' }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
</template>

<script setup>
import { h, reactive, ref, onMounted, computed } from 'vue'
import {
  NCard,
  NButton,
  NSpace,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NDataTable,
  useMessage,
  useDialog
} from 'naive-ui'
import {
  pageQueryNotice,
  addNotice,
  updateNotice,
  deleteNotice,
  deleteNoticeBatch
} from '@/api/notice'
import RichTextEditor from '@/components/RichTextEditor.vue'

const htmlToText = (html = '') =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const title = ref('')
const selectedIds = ref([])

const modalVisible = ref(false)
const editing = ref(null)
const formRef = ref(null)
const form = reactive({ title: '' })
const content = ref('')
const rules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }] }

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
  { title: '标题', key: 'title', width: 220 },
  {
    title: '内容预览',
    key: 'content',
    ellipsis: { tooltip: true },
    render: (r) => h('span', { class: 'text-sub' }, htmlToText(r.content))
  },
  { title: '创建时间', key: 'createTime', width: 180 },
  { title: '更新时间', key: 'updateTime', width: 180 },
  {
    title: '操作',
    key: 'op',
    width: 180,
    fixed: 'right',
    render: (row) =>
      h('div', { class: 'table-actions' }, [
        h(
          NButton,
          { size: 'small', type: 'primary', secondary: true, onClick: () => handleEdit(row) },
          () => '编辑'
        ),
        h(
          NButton,
          { size: 'small', type: 'error', secondary: true, onClick: () => handleDelete(row.id) },
          () => '删除'
        )
      ])
  }
]

const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageQueryNotice({ pageNum: pageNum.value, pageSize, title: title.value })
    list.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}
const onSearch = () => {
  pageNum.value = 1
  fetchList()
}

const handleAdd = () => {
  editing.value = null
  form.title = ''
  content.value = ''
  modalVisible.value = true
}
const handleEdit = (r) => {
  editing.value = r
  form.title = r.title
  content.value = r.content || ''
  modalVisible.value = true
}

const handleDelete = (id) => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这条公告吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteNotice(id)
      message.success('删除成功')
      fetchList()
    }
  })
}
const handleBatchDelete = () => {
  if (!selectedIds.value.length) return message.warning('请先选择要删除的公告')
  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedIds.value.length} 条公告吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteNoticeBatch(selectedIds.value)
      message.success('批量删除成功')
      selectedIds.value = []
      fetchList()
    }
  })
}

const handleSubmit = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    if (!htmlToText(content.value)) {
      message.warning('请输入公告内容')
      return
    }
    const payload = { title: form.title, content: content.value }
    if (editing.value) {
      await updateNotice({ ...payload, id: editing.value.id })
      message.success('更新成功')
    } else {
      await addNotice(payload)
      message.success('创建成功')
    }
    modalVisible.value = false
    fetchList()
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
</style>
