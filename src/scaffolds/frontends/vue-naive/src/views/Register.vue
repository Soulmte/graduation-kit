<template>
  <div class="auth-screen">
    <div class="auth-card" style="width: 480px">
      <div class="auth-brand">
        <div class="auth-brand-mark">S</div>
        <div class="auth-brand-title">注册账号</div>
      </div>

      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        label-placement="top"
        @submit.prevent="handleSubmit"
      >
        <n-form-item path="username" :show-label="false">
          <n-input
            v-model:value="form.username"
            placeholder="用户名 (登录使用)"
            autocomplete="username"
          />
        </n-form-item>
        <n-form-item path="password" :show-label="false">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="密码"
            show-password-on="click"
            autocomplete="new-password"
          />
        </n-form-item>
        <n-form-item path="confirm" :show-label="false">
          <n-input
            v-model:value="form.confirm"
            type="password"
            placeholder="确认密码"
            show-password-on="click"
            autocomplete="new-password"
          />
        </n-form-item>
        <n-form-item path="nickname" :show-label="false">
          <n-input v-model:value="form.nickname" placeholder="昵称 (选填)" :maxlength="50" />
        </n-form-item>

        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item path="age" :show-label="false">
              <n-input-number
                v-model:value="form.age"
                :min="1"
                :max="150"
                placeholder="年龄 (选填)"
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item path="gender" :show-label="false">
              <n-select
                v-model:value="form.gender"
                placeholder="性别 (选填)"
                clearable
                :options="GENDER_OPTIONS"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <n-form-item path="phone" :show-label="false">
          <n-input v-model:value="form.phone" placeholder="手机号 (选填)" :maxlength="11" />
        </n-form-item>
        <n-form-item path="email" :show-label="false">
          <n-input v-model:value="form.email" placeholder="邮箱 (选填)" />
        </n-form-item>

        <n-button type="primary" block attr-type="submit" :loading="loading">注册</n-button>
      </n-form>

      <div class="auth-footer" style="margin-top: 16px">
        已有账号？<router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSelect,
  NInputNumber,
  NGrid,
  NGridItem,
  useMessage
} from 'naive-ui'
import { register } from '@/api/user'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const formRef = ref(null)
const form = reactive({
  username: '',
  password: '',
  confirm: '',
  nickname: '',
  age: null,
  gender: null,
  phone: '',
  email: ''
})
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度 3-50 个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '用户名需以字母开头, 只能包含字母数字下划线',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value) => !value || value === form.password,
      message: '两次密码不一致',
      trigger: 'blur'
    }
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的 11 位手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const handleSubmit = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    loading.value = true
    try {
      const { confirm, ...payload } = form
      await register(payload)
      message.success('注册成功, 请登录')
      router.push('/login')
    } finally {
      loading.value = false
    }
  })
}
</script>
