<template>
  <div class="auth-screen">
    <div class="auth-card" style="width: 480px">
      <div class="auth-brand">
        <div class="auth-brand-mark">S</div>
        <div class="auth-brand-title">注册账号</div>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        size="large"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名 (登录使用)"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item prop="confirm">
          <el-input
            v-model="form.confirm"
            type="password"
            placeholder="确认密码"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="昵称 (选填)"
            :prefix-icon="Avatar"
            maxlength="50"
          />
        </el-form-item>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px">
          <el-form-item>
            <el-input-number
              v-model="form.age"
              :min="1"
              :max="150"
              placeholder="年龄 (选填)"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="form.gender"
              placeholder="性别 (选填)"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="o in GENDER_OPTIONS"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="手机号 (选填)"
            :prefix-icon="Phone"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱 (选填)" :prefix-icon="Message" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%"
            >注册</el-button
          >
        </el-form-item>
      </el-form>

      <div class="auth-footer">已有账号？<router-link to="/login">立即登录</router-link></div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Avatar, Message, Phone } from '@element-plus/icons-vue'
import { register } from '@/api/user'

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
]

const router = useRouter()
const loading = ref(false)
const formRef = ref(null)
const form = reactive({
  username: '',
  password: '',
  confirm: '',
  nickname: '',
  age: null,
  gender: '',
  phone: '',
  email: ''
})
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度 3-50 个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '用户名需以字母开头，只能包含字母数字下划线',
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
      validator: (_rule, value, callback) => {
        if (!value) return callback()
        if (value !== form.password) return callback(new Error('两次密码不一致'))
        callback()
      },
      trigger: 'blur'
    }
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的 11 位手机号', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const handleSubmit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const { confirm, ...payload } = form
    await register(payload)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>
