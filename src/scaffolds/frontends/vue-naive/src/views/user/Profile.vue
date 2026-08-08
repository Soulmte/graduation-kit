<template>
  <div class="profile-page">
    <!-- Toolbar -->
    <div class="profile-toolbar">
      <div class="toolbar-left">
        <h1 class="toolbar-title">个人信息</h1>
        <p class="toolbar-subtitle">管理你的账户资料和联系方式</p>
      </div>
      <div class="toolbar-right">
        <n-button v-if="!isEditing" type="primary" size="large" @click="enterEdit">
          编辑资料
        </n-button>
        <n-space v-else>
          <n-button type="primary" size="large" :loading="loading" @click="handleSave">
            保存
          </n-button>
          <n-button size="large" @click="cancelEdit"> 取消 </n-button>
        </n-space>
      </div>
    </div>

    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
      <!-- Upper section: Avatar + User Info -->
      <n-card class="profile-card upper-card">
        <div style="display: flex; align-items: center; gap: 8px">
          <avatar-upload
            :value="avatar"
            :size="80"
            :disabled="!isEditing"
            @update:value="avatar = $event"
          />
          <div class="user-info-grid">
            <span class="info-label">用户名</span><span>{{ form.username }}</span>
            <span class="info-label">角色</span
            ><n-tag :type="form.role === 'admin' ? 'primary' : 'info'" size="small">{{
              ROLE_MAP[form.role] || form.role
            }}</n-tag>
            <span class="info-label">昵称</span>
            <span>
              <n-input
                v-if="isEditing"
                v-model:value="form.nickname"
                placeholder="请输入昵称"
                :maxlength="50"
                size="small"
                style="width: 160px"
              />
              <span v-else>{{ form.nickname || '-' }}</span>
            </span>
            <span class="info-label">注册时间</span><span>{{ form.createTime || '-' }}</span>
          </div>
        </div>
      </n-card>

      <!-- Lower section: Grid -->
      <n-grid :cols="2" :x-gap="16" class="lower-grid">
        <n-gi>
          <n-card class="profile-card" title="基本信息">
            <template v-if="isEditing">
              <n-form-item label="年龄">
                <n-input-number v-model:value="form.age" :min="1" :max="150" style="width: 100%" />
              </n-form-item>
              <n-form-item label="性别">
                <n-select
                  v-model:value="form.gender"
                  placeholder="请选择性别"
                  clearable
                  :options="GENDER_OPTIONS"
                />
              </n-form-item>
            </template>
            <template v-else>
              <n-descriptions bordered :column="1">
                <n-descriptions-item label="年龄">
                  {{ form.age ?? '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="性别">
                  {{ genderLabel }}
                </n-descriptions-item>
              </n-descriptions>
            </template>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="profile-card" title="联系方式">
            <template v-if="isEditing">
              <n-form-item label="手机号" path="phone">
                <n-input v-model:value="form.phone" placeholder="请输入手机号" :maxlength="11" />
              </n-form-item>
              <n-form-item label="邮箱" path="email">
                <n-input v-model:value="form.email" placeholder="请输入邮箱" />
              </n-form-item>
            </template>
            <template v-else>
              <n-descriptions bordered :column="1">
                <n-descriptions-item label="手机号">
                  {{ form.phone || '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="邮箱">
                  {{ form.email || '-' }}
                </n-descriptions-item>
              </n-descriptions>
            </template>
          </n-card>
          <n-card class="profile-card security-card" title="安全设置">
            <n-descriptions bordered :column="1">
              <n-descriptions-item label="密码"> ******** </n-descriptions-item>
            </n-descriptions>
            <n-button style="margin-top: 8px" @click="passwordVisible = true"> 修改密码 </n-button>
          </n-card>
        </n-gi>
      </n-grid>
    </n-form>

    <!-- 修改密码弹窗：走独立接口，需校验原密码 -->
    <n-modal
      v-model:show="passwordVisible"
      preset="card"
      title="修改密码"
      style="width: 460px"
      @after-leave="resetPasswordForm"
    >
      <n-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-placement="left"
        :label-width="90"
      >
        <n-form-item label="原密码" path="oldPassword">
          <n-input
            v-model:value="passwordForm.oldPassword"
            type="password"
            show-password-on="click"
            placeholder="请输入原密码"
          />
        </n-form-item>
        <n-form-item label="新密码" path="newPassword">
          <n-input
            v-model:value="passwordForm.newPassword"
            type="password"
            show-password-on="click"
            placeholder="6-20 位"
          />
        </n-form-item>
        <n-form-item label="确认新密码" path="confirmPassword">
          <n-input
            v-model:value="passwordForm.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="再输一次新密码"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="passwordVisible = false">取消</n-button>
          <n-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NButton,
  NTag,
  NDescriptions,
  NDescriptionsItem,
  NGrid,
  NGi,
  NSpace,
  NModal,
  useMessage
} from 'naive-ui'
import { updateUser, updatePassword } from '@/api/user'
import { useUserStore } from '@/stores/user'
import AvatarUpload from '@/components/AvatarUpload.vue'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]

const ROLE_MAP = {
  admin: '管理员',
  user: '普通用户'
}

const userStore = useUserStore()
const message = useMessage()

const loading = ref(false)
const isEditing = ref(false)
const avatar = ref('')
const formRef = ref(null)

// 只包含后端 update 接口允许修改的字段，role 与 password 不在此修改
const form = reactive({
  username: '',
  nickname: '',
  age: null,
  gender: null,
  phone: '',
  email: '',
  role: '',
  createTime: ''
})

const rules = {
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的 11 位手机号',
      trigger: 'blur'
    }
  ],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const genderLabel = computed(() => {
  const opt = GENDER_OPTIONS.find((o) => o.value === form.gender)
  return opt ? opt.label : '-'
})

const syncFromStore = () => {
  const u = userStore.userInfo || {}
  form.username = u.username || ''
  form.nickname = u.nickname || ''
  form.age = u.age ?? null
  form.gender = u.gender || null
  form.phone = u.phone || ''
  form.email = u.email || ''
  form.role = u.role || 'user'
  form.createTime = u.createTime || u.createdAt || ''
  avatar.value = u.avatar || ''
}

onMounted(syncFromStore)
watch(() => userStore.userInfo, syncFromStore)

const enterEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  syncFromStore()
}

const handleSave = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    loading.value = true
    try {
      const payload = {
        ...form,
        id: userStore.userInfo.id,
        avatar: avatar.value
      }
      delete payload.role
      delete payload.createTime
      await updateUser(payload)
      message.success('更新成功')
      userStore.updateUserInfo({
        ...userStore.userInfo,
        ...form,
        avatar: avatar.value
      })
      isEditing.value = false
    } finally {
      loading.value = false
    }
  })
}

const passwordVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      min: 6,
      max: 20,
      message: '密码长度在 6-20 位之间',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value) => value === passwordForm.newPassword,
      message: '两次密码输入不一致',
      trigger: 'blur'
    }
  ]
}

const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.restoreValidation()
}

const handlePasswordSubmit = () => {
  passwordFormRef.value.validate(async (errors) => {
    if (errors) return
    passwordLoading.value = true
    try {
      await updatePassword(passwordForm.oldPassword, passwordForm.newPassword)
      message.success('密码修改成功')
      passwordVisible.value = false
    } finally {
      passwordLoading.value = false
    }
  })
}
</script>

<style scoped>
.profile-page {
  padding: 24px;
}

.profile-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.toolbar-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.toolbar-subtitle {
  margin: 4px 0 0;
  color: var(--color-text-mute);
  font-size: 14px;
}

.upper-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
}

.user-info-grid {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 6px 16px;
  font-size: 14px;
  line-height: 1.8;
}
.info-label {
  color: var(--color-text-mute);
}

.lower-grid {
  margin-top: 16px;
}

.profile-card {
  margin-bottom: 16px;
}

.security-card {
  margin-bottom: 0;
}
</style>
