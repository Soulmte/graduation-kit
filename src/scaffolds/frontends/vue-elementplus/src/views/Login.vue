<template>
  <div class="auth-screen">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-brand-mark">S</div>
        <div class="auth-brand-title">欢迎登录</div>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
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
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item prop="captcha">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input
              v-model="form.captcha"
              placeholder="验证码"
              :prefix-icon="Key"
              maxlength="4"
              autocomplete="off"
            />
            <captcha ref="captchaRef" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%"
            >登录</el-button
          >
        </el-form-item>
      </el-form>

      <div class="auth-footer">还没有账号？<router-link to="/register">立即注册</router-link></div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import Captcha from '@/components/Captcha.vue'

const router = useRouter()
const userStore = useUserStore()
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

const handleSubmit = async () => {
  await formRef.value.validate()
  if (!captchaRef.value.verify(form.captcha)) {
    ElMessage.error('验证码错误')
    captchaRef.value.refresh()
    form.captcha = ''
    return
  }
  loading.value = true
  try {
    const res = await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push(res.data.userInfo.role === 'admin' ? '/admin/dashboard' : '/user/home')
  } catch {
    captchaRef.value.refresh()
    form.captcha = ''
  } finally {
    loading.value = false
  }
}
</script>
