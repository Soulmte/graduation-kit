<template>
  <div class="profile-page">
    <!-- 顶栏：标题 + 操作按钮 -->
    <div class="profile-toolbar">
      <div class="profile-toolbar-left">
        <h2>个人信息</h2>
        <p>管理你的账户资料和联系方式</p>
      </div>
      <el-button v-if="!editing" type="primary" @click="startEdit">
        <el-icon><Edit /></el-icon> 编辑资料
      </el-button>
      <span v-else>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          <el-icon><Check /></el-icon> 保存
        </el-button>
      </span>
    </div>

    <!-- 上部：头像 + 信息概览 -->
    <el-card class="profile-card">
      <div class="profile-upper">
        <avatar-upload v-model:value="avatar" :size="120" :disabled="!editing" />
        <el-descriptions :column="2" size="small" border style="flex: 1">
          <el-descriptions-item label="用户名">
            {{ userStore.userInfo?.username }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="userStore.userInfo?.role === 'admin' ? 'primary' : 'info'">
              {{ ROLE_MAP[userStore.userInfo?.role] || userStore.userInfo?.role }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="昵称">
            <el-input
              v-if="editing"
              v-model="form.nickname"
              placeholder="请输入昵称"
              maxlength="50"
              style="width: 160px"
            />
            <span v-else>{{ userStore.userInfo?.nickname || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ userStore.userInfo?.createTime || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 下部：左右两栗 -->
    <el-form ref="formRef" :model="form" :rules="rules">
      <div class="profile-lower">
        <el-card header="基本信息">
          <template v-if="editing">
            <el-form-item label="年龄">
              <el-input-number v-model="form.age" :min="1" :max="150" style="width: 100%" />
            </el-form-item>
            <el-form-item label="性别">
              <el-select v-model="form.gender" clearable style="width: 100%">
                <el-option
                  v-for="o in GENDER_OPTIONS"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </template>
          <el-descriptions v-else :column="1" size="small">
            <el-descriptions-item label="年龄">
              {{ userStore.userInfo?.age ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ genderLabel(userStore.userInfo?.gender) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <div class="profile-right-col">
          <el-card header="联系方式">
            <template v-if="editing">
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="请输入邮箱" />
              </el-form-item>
            </template>
            <el-descriptions v-else :column="1" size="small">
              <el-descriptions-item label="手机号">
                {{ userStore.userInfo?.phone || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ userStore.userInfo?.email || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card header="安全设置">
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="密码">********</el-descriptions-item>
            </el-descriptions>
            <el-button style="margin-top: 8px" @click="passwordVisible = true">
              修改密码
            </el-button>
          </el-card>
        </div>
      </div>
    </el-form>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordVisible" title="修改密码" width="460px" @closed="resetPasswordForm">
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="96px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="6-20位"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Check } from '@element-plus/icons-vue'
import { updateUser, updatePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'
import AvatarUpload from '@/components/AvatarUpload.vue'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]
const genderLabel = (g) => GENDER_OPTIONS.find((o) => o.value === g)?.label || '-'

const ROLE_MAP = { admin: '管理员', user: '普通用户' }

const userStore = useUserStore()
const loading = ref(false)
const editing = ref(false)
const avatar = ref('')
const formRef = ref(null)

// 只包含后端 update 接口允许修改的字段，role 与 password 不在此修改
const form = reactive({
  nickname: '',
  age: null,
  gender: '',
  phone: '',
  email: ''
})

const rules = {
  phone: [{ pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const syncFromStore = () => {
  const u = userStore.userInfo || {}
  form.nickname = u.nickname || ''
  form.age = u.age ?? null
  form.gender = u.gender || ''
  form.phone = u.phone || ''
  form.email = u.email || ''
  avatar.value = u.avatar || ''
}

onMounted(syncFromStore)
watch(() => userStore.userInfo, syncFromStore)

const startEdit = () => {
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  syncFromStore()
}

const handleSubmit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await updateUser({ ...form, id: userStore.userInfo.id, avatar: avatar.value })
    ElMessage.success('更新成功')
    userStore.updateUserInfo({ ...userStore.userInfo, ...form, avatar: avatar.value })
    editing.value = false
  } finally {
    loading.value = false
  }
}

// ---- 修改密码 ----
const passwordVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) callback(new Error('两次密码输入不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

const resetPasswordForm = () => {
  passwordFormRef.value?.resetFields()
}

const handlePasswordSubmit = async () => {
  await passwordFormRef.value.validate()
  passwordLoading.value = true
  try {
    await updatePassword(passwordForm.oldPassword, passwordForm.newPassword)
    ElMessage.success('密码修改成功')
    passwordVisible.value = false
  } finally {
    passwordLoading.value = false
  }
}
</script>

<style scoped>
/* ---- 顶栏 ---- */
.profile-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.profile-toolbar-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.profile-toolbar-left p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* ---- 上部 ---- */
.profile-card {
  margin-bottom: 16px;
}
.profile-upper {
  display: flex;
  align-items: center;
  gap: 32px;
}

/* ---- 下部 ---- */
.profile-lower {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
.profile-right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .profile-upper {
    flex-direction: column;
    align-items: flex-start;
  }
  .profile-lower {
    grid-template-columns: 1fr;
  }
}
</style>
