<template>
	<view class="container">
		<view class="header">
			<view class="title">欢迎登录</view>
			<view class="subtitle">多技术栈脚手架 · 移动端</view>
		</view>

		<view class="form">
			<view class="form-item">
				<input
					v-model="form.username"
					class="input"
					placeholder="请输入用户名"
					placeholder-style="color:#aaa"
				/>
			</view>
			<view v-if="errors.username" class="error-text">{{ errors.username }}</view>

			<view class="form-item">
				<input
					v-model="form.password"
					class="input"
					placeholder="请输入密码（至少6位）"
					placeholder-style="color:#aaa"
					password
				/>
			</view>
			<view v-if="errors.password" class="error-text">{{ errors.password }}</view>

			<view class="form-item captcha-row">
				<input
					v-model="form.captcha"
					class="input captcha-input"
					placeholder="验证码"
					placeholder-style="color:#aaa"
					maxlength="4"
				/>
				<Captcha ref="captchaRef" :width="110" :height="36" />
			</view>
			<view v-if="errors.captcha" class="error-text">{{ errors.captcha }}</view>

			<button class="btn-primary" :disabled="loading" @click="handleLogin">
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
			uni.switchTab({ url: '/pages/profile/index' })
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

<style>
.container {
	min-height: 100vh;
	background: #fff;
	padding: 60rpx 50rpx;
}

.header {
	text-align: center;
	margin: 80rpx 0 80rpx;
}

.title {
	font-size: 48rpx;
	font-weight: 600;
	color: #333;
}

.subtitle {
	font-size: 26rpx;
	color: #999;
	margin-top: 16rpx;
}

.form-item {
	margin-bottom: 20rpx;
}

.input {
	height: 90rpx;
	background: #f7f7f7;
	border-radius: 12rpx;
	padding: 0 30rpx;
	font-size: 28rpx;
}

.captcha-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.captcha-input {
	flex: 1;
}

.error-text {
	font-size: 24rpx;
	color: #ff3b30;
	padding: 4rpx 10rpx 16rpx;
}

.btn-primary {
	margin-top: 40rpx;
	background: #007aff;
	color: #fff;
	border-radius: 12rpx;
	height: 90rpx;
	line-height: 90rpx;
	font-size: 30rpx;
}

.footer {
	text-align: center;
	margin-top: 60rpx;
	font-size: 26rpx;
}

.footer-text {
	color: #999;
}

.footer-link {
	color: #007aff;
	margin-left: 10rpx;
}
</style>
