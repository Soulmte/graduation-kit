<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
        <div style="display: flex; gap: 8px">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 添加用户
          </el-button>
          <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon> 批量删除
          </el-button>
        </div>
      </div>
    </template>

    <div class="toolbar">
      <el-input
        v-model="filters.username"
        placeholder="搜索用户名"
        style="width: 220px"
        clearable
        @keydown.enter="onFilter"
      />
      <el-select
        v-model="filters.role"
        placeholder="选择角色"
        style="width: 150px"
        clearable
        @change="onFilter"
      >
        <el-option label="管理员" value="admin" />
        <el-option label="普通用户" value="user" />
      </el-select>
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
      <el-table-column prop="nickname" label="昵称" width="120">
        <template #default="{ row }">{{ row.nickname || '-' }}</template>
      </el-table-column>
      <el-table-column prop="gender" label="性别" width="70">
        <template #default="{ row }">{{ genderLabel(row.gender) }}</template>
      </el-table-column>
      <el-table-column prop="age" label="年龄" width="70">
        <template #default="{ row }">{{ row.age || '-' }}</template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" show-overflow-tooltip>
        <template #default="{ row }">{{ row.email || '-' }}</template>
      </el-table-column>
      <el-table-column prop="role" label="角色" width="110">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
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

    <el-dialog v-model="modalVisible" :title="editing ? '编辑用户' : '添加用户'" width="640px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        title="新增用户走注册接口，角色固定为普通用户；密码由用户自行在个人中心修改，此处不提供改密与改角色"
      />

      <div style="text-align: center; margin-bottom: 16px">
        <avatar-upload :value="avatar" @update:value="avatar = $event" :size="88" />
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!!editing" />
          </el-form-item>
          <el-form-item v-if="!editing" label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="50" />
          </el-form-item>
          <el-form-item label="年龄" prop="age">
            <el-input-number
              v-model="form.age"
              :min="1"
              :max="150"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-select v-model="form.gender" placeholder="请选择性别" clearable style="width: 100%">
              <el-option
                v-for="o in GENDER_OPTIONS"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
        </div>
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
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { pageQueryUser, register, updateUser, deleteUser, deleteUserBatch } from '@/api/user'
import AvatarUpload from '@/components/AvatarUpload.vue'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]
const genderLabel = (g) => GENDER_OPTIONS.find((o) => o.value === g)?.label || '-'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const selectedIds = ref([])
const filters = reactive({ username: '', role: '' })

const modalVisible = ref(false)
const editing = ref(null)
const avatar = ref('')
const formRef = ref(null)
const form = reactive({
  username: '',
  password: '',
  nickname: '',
  age: null,
  gender: '',
  phone: '',
  email: ''
})

const rules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: editing.value ? [] : [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}))

const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageQueryUser({
      pageNum: pageNum.value,
      pageSize,
      username: filters.username,
      role: filters.role
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
  form.gender = u.gender || ''
  form.phone = u.phone || ''
  form.email = u.email || ''
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
  ElMessageBox.confirm('确定要删除这个用户吗？', '确认删除', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger'
  })
    .then(async () => {
      await deleteUser(id)
      ElMessage.success('删除成功')
      fetchList()
    })
    .catch(() => {})
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) return ElMessage.warning('请先选择要删除的用户')
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个用户吗？`, '确认批量删除', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger'
  })
    .then(async () => {
      await deleteUserBatch(selectedIds.value)
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      fetchList()
    })
    .catch(() => {})
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (editing.value) {
    // 后端 update 接口只接收基本资料，username/role/password 不在此修改
    await updateUser({
      id: editing.value.id,
      nickname: form.nickname,
      age: form.age,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      avatar: avatar.value
    })
    ElMessage.success('更新成功')
  } else {
    // 注册接口角色由后端写死为 user
    await register({ ...form, avatar: avatar.value })
    ElMessage.success('添加成功')
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
