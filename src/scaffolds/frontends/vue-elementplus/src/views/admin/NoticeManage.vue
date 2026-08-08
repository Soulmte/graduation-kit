<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>公告管理</span>
        <div style="display: flex; gap: 8px">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 添加公告
          </el-button>
          <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon> 批量删除
          </el-button>
        </div>
      </div>
    </template>

    <div class="toolbar">
      <el-input
        v-model="title"
        placeholder="搜索标题"
        style="width: 250px"
        clearable
        @keydown.enter="onSearch"
      />
      <el-button type="primary" @click="onSearch">搜索</el-button>
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
      <el-table-column prop="title" label="标题" width="220" />
      <el-table-column label="内容预览" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="text-sub">{{ htmlToText(row.content) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createBy" label="发布人" width="120">
        <template #default="{ row }">{{ row.createBy || '-' }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button size="small" class="btn-edit" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button size="small" class="btn-delete" @click="handleDelete(row.id)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
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

    <el-dialog
      v-model="modalVisible"
      :title="editing ? '编辑公告' : '添加公告'"
      width="900px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" required>
          <rich-text-editor v-model="content" :height="360" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ editing ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
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
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageQueryNotice({
      pageNum: pageNum.value,
      pageSize,
      title: title.value
    })
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
  ElMessageBox.confirm('确定要删除这条公告吗？', '确认删除', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger'
  })
    .then(async () => {
      await deleteNotice(id)
      ElMessage.success('删除成功')
      fetchList()
    })
    .catch(() => {})
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) return ElMessage.warning('请先选择要删除的公告')
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条公告吗？`, '确认批量删除', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger'
  })
    .then(async () => {
      await deleteNoticeBatch(selectedIds.value)
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      fetchList()
    })
    .catch(() => {})
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (!htmlToText(content.value)) {
    ElMessage.warning('请输入公告内容')
    return
  }
  const payload = { title: form.title, content: content.value }
  if (editing.value) {
    await updateNotice({ ...payload, id: editing.value.id })
    ElMessage.success('更新成功')
  } else {
    await addNotice(payload)
    ElMessage.success('创建成功')
  }
  modalVisible.value = false
  fetchList()
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
