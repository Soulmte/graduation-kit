<template>
  <n-card>
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
        <n-space>
          <n-button type="primary" @click="handleAdd">添加用户</n-button>
          <n-button type="error" :disabled="!selectedIds.length" @click="handleBatchDelete"
            >批量删除</n-button
          >
        </n-space>
      </div>
    </template>

    <div class="toolbar">
      <n-input
        v-model:value="filters.username"
        placeholder="搜索用户名"
        style="width: 220px"
        clearable
        @keydown.enter="onFilter"
      />
      <n-select
        v-model:value="filters.role"
        placeholder="选择角色"
        style="width: 150px"
        clearable
        :options="ROLE_OPTIONS"
        @update:value="onFilter"
      />
      <n-button type="primary" @click="onFilter">搜索</n-button>
    </div>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="list"
      :row-key="(row) => row.id"
      :pagination="pagination"
      :scroll-x="1400"
      @update:checked-row-keys="(v) => (selectedIds = v)"
      remote
    />

    <n-modal
      v-model:show="modalVisible"
      preset="card"
      :title="editing ? '编辑用户' : '添加用户'"
      style="width: 640px"
    >
      <div style="text-align: center; margin-bottom: 16px">
        <avatar-upload :value="avatar" @update:value="avatar = $event" :size="88" />
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="用户名" path="username">
              <n-input
                v-model:value="form.username"
                placeholder="请输入用户名"
                :disabled="!!editing"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="密码" path="password">
              <n-input
                v-model:value="form.password"
                type="password"
                :placeholder="editing ? '留空表示不修改' : '请输入密码'"
                show-password-on="click"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="昵称" path="nickname">
              <n-input v-model:value="form.nickname" placeholder="请输入昵称" :maxlength="50" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="年龄" path="age">
              <n-input-number v-model:value="form.age" :min="1" :max="150" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="性别" path="gender">
              <n-select
                v-model:value="form.gender"
                placeholder="请选择性别"
                clearable
                :options="GENDER_OPTIONS"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="手机号" path="phone">
              <n-input v-model:value="form.phone" placeholder="请输入手机号" :maxlength="11" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="邮箱" path="email">
              <n-input v-model:value="form.email" placeholder="请输入邮箱" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="角色" path="role">
              <n-select v-model:value="form.role" :options="ROLE_OPTIONS" />
            </n-form-item>
          </n-gi>
        </n-grid>
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
  NSelect,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NDataTable,
  NTag,
  NGrid,
  NGi,
  useMessage,
  useDialog
} from 'naive-ui'
import { pageQueryUser, register, updateUser, deleteUser, deleteUserBatch } from '@/api/user'
import AvatarUpload from '@/components/AvatarUpload.vue'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]
const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' }
]
const genderLabel = (g) => GENDER_OPTIONS.find((o) => o.value === g)?.label || '-'

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const selectedIds = ref([])
const filters = reactive({ username: '', role: null })

const modalVisible = ref(false)
const editing = ref(null)
const avatar = ref('')
const formRef = ref(null)
const form = reactive({
  username: '',
  password: '',
  nickname: '',
  age: null,
  gender: null,
  phone: '',
  email: '',
  role: 'user'
})

const rules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: editing.value ? [] : [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的 11 位手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}))

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
  { title: '昵称', key: 'nickname', width: 120, render: (r) => r.nickname || '-' },
  { title: '性别', key: 'gender', width: 70, render: (r) => genderLabel(r.gender) },
  { title: '年龄', key: 'age', width: 70, render: (r) => r.age || '-' },
  { title: '手机号', key: 'phone', width: 130, render: (r) => r.phone || '-' },
  {
    title: '邮箱',
    key: 'email',
    width: 220,
    ellipsis: { tooltip: true },
    render: (r) => r.email || '-'
  },
  {
    title: '角色',
    key: 'role',
    width: 110,
    render: (r) =>
      h(NTag, { type: r.role === 'admin' ? 'error' : 'success' }, () =>
        r.role === 'admin' ? '管理员' : '普通用户'
      )
  },
  { title: '创建时间', key: 'createTime', width: 170 },
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
    const res = await pageQueryUser({
      pageNum: pageNum.value,
      pageSize,
      username: filters.username,
      role: filters.role || ''
    })
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

const resetForm = (u = {}) => {
  form.username = u.username || ''
  form.password = ''
  form.nickname = u.nickname || ''
  form.age = u.age ?? null
  form.gender = u.gender || null
  form.phone = u.phone || ''
  form.email = u.email || ''
  form.role = u.role || 'user'
  avatar.value = u.avatar || ''
}

const handleAdd = () => {
  editing.value = null
  resetForm()
  modalVisible.value = true
}
const handleEdit = (r) => {
  editing.value = r
  resetForm(r)
  modalVisible.value = true
}

const handleDelete = (id) => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个用户吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteUser(id)
      message.success('删除成功')
      fetchList()
    }
  })
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) return message.warning('请先选择要删除的用户')
  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedIds.value.length} 个用户吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteUserBatch(selectedIds.value)
      message.success('批量删除成功')
      selectedIds.value = []
      fetchList()
    }
  })
}

const handleSubmit = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    const payload = { ...form, avatar: avatar.value }
    if (editing.value) {
      await updateUser({ ...payload, id: editing.value.id })
      message.success('更新成功')
    } else {
      await register(payload)
      message.success('添加成功')
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
