<template>
	<view class="container container--auth">
		<view class="auth-header">
			<view class="auth-title">欢迎登录</view>
			<view class="auth-subtitle">多技术栈脚手架 · 移动端</view>
		</view>

		<view class="form">
			<view class="form-item">
				<input
					v-model="form.username"
					class="input"
					placeholder="请输入用户名"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="errors.username" class="error-text">{{ errors.username }}</view>

			<view class="form-item">
				<input
					v-model="form.password"
					class="input"
					placeholder="请输入密码（至少6位）"
					placeholder-class="input-placeholder"
					password
				/>
			</view>
			<view v-if="errors.password" class="error-text">{{ errors.password }}</view>

			<view class="form-item captcha-row">
				<input
					v-model="form.captcha"
					class="input captcha-input"
					placeholder="验证码"
					placeholder-class="input-placeholder"
					maxlength="4"
				/>
				<Captcha ref="captchaRef" :width="110" :height="36" />
			</view>
			<view v-if="errors.captcha" class="error-text">{{ errors.captcha }}</view>

			<button class="btn-primary mt-xl" :disabled="loading" @click="handleLogin">
				{{ loading ? '登录中...' : '登录' }}
			</button>
		</view>

		<view class="footer">
			<text class="footer-text">还没有账号？</text>
			<text class="footer-link" @click="goRegister">立即注册</text>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { login } from '@/api/user'
import { userStore } from '@/store/user'
import Captcha from '@/components/Captcha.vue'

const captchaRef = ref(null)

const form = reactive({
	username: '',
	password: '',
	captcha: ''
})
const errors = reactive({
	username: '',
	password: '',
	captcha: ''
})
const loading = ref(false)

const validate = () => {
	let valid = true
	errors.username = ''
	errors.password = ''
	errors.captcha = ''

	if (!form.username.trim()) {
		errors.username = '请输入用户名'
		valid = false
	}
	if (!form.password) {
		errors.password = '请输入密码'
		valid = false
	} else if (form.password.length < 6) {
		errors.password = '密码至少6位'
		valid = false
	}
	if (!form.captcha) {
		errors.captcha = '请输入验证码'
		valid = false
	} else if (!captchaRef.value?.verify(form.captcha)) {
		errors.captcha = '验证码错误'
		captchaRef.value?.refresh()
		valid = false
	}
	return valid
}

const handleLogin = async () => {
	if (!validate()) return

	loading.value = true
	try {
		const res = await login(form.username, form.password)
		userStore.setLogin(res.data.token, res.data.userInfo)
		uni.showToast({ title: '登录成功', icon: 'success' })
		setTimeout(() => {
			uni.reLaunch({ url: '/pages/profile/index' })
		}, 500)
	} catch (e) {
		captchaRef.value?.refresh()
		form.captcha = ''
	} finally {
		loading.value = false
	}
}

const goRegister = () => {
	uni.redirectTo({ url: '/pages/register/index' })
}
</script>

<style scoped lang="scss">
.captcha-row {
	display: flex;
	align-items: center;
	gap: $space-md;
}

.captcha-input {
	flex: 1;
}
</style>
