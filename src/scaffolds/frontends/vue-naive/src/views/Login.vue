<template>
  <div class="auth-screen">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-brand-mark">S</div>
        <div class="auth-brand-title">欢迎登录</div>
      </div>

      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <n-form-item path="username" :show-label="false">
          <n-input v-model:value="form.username" placeholder="用户名" autocomplete="username" />
        </n-form-item>
        <n-form-item path="password" :show-label="false">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="密码"
            show-password-on="click"
            autocomplete="current-password"
          />
        </n-form-item>
        <n-form-item path="captcha" :show-label="false">
          <div style="display: flex; gap: 8px; width: 100%">
            <n-input
              v-model:value="form.captcha"
              placeholder="验证码"
              :maxlength="4"
              autocomplete="off"
            />
            <captcha ref="captchaRef" />
          </div>
        </n-form-item>
        <n-button type="primary" block attr-type="submit" :loading="loading">登录</n-button>
      </n-form>

      <div class="auth-footer" style="margin-top: 16px">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import Captcha from '@/components/Captcha.vue'

const router = useRouter()
const userStore = useUserStore()
const message = useMessage()
const loading = ref(false)
const formRef = ref(null)
const captchaRef = ref(null)
const form = reactive({ username: '', password: '', captcha: '' })
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度 3-50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const handleSubmit = () => {
  formRef.value.validate(async (errors) => {
    if (errors) return
    if (!captchaRef.value.verify(form.captcha)) {
      message.error('验证码错误')
      captchaRef.value.refresh()
      form.captcha = ''
      return
    }
    loading.value = true
    try {
      const res = await userStore.login(form.username, form.password)
      message.success('登录成功')
      router.push(res.data.userInfo.role === 'admin' ? '/admin/dashboard' : '/user/home')
    } catch {
      captchaRef.value.refresh()
      form.captcha = ''
    } finally {
      loading.value = false
    }
  })
}
</script>
