<template>
	<view class="container container--auth">
		<view class="auth-header">
			<view class="auth-title">用户注册</view>
		</view>

		<view class="form">
			<view class="form-item">
				<input
					v-model="form.username"
					class="input"
					placeholder="用户名（2-20位字母数字下划线）"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="errors.username" class="error-text">{{ errors.username }}</view>

			<view class="form-item">
				<input
					v-model="form.password"
					class="input"
					placeholder="密码（至少6位）"
					placeholder-class="input-placeholder"
					password
				/>
			</view>
			<view v-if="errors.password" class="error-text">{{ errors.password }}</view>

			<view class="form-item">
				<input
					v-model="form.confirmPassword"
					class="input"
					placeholder="确认密码"
					placeholder-class="input-placeholder"
					password
				/>
			</view>
			<view v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</view>

			<view class="form-item">
				<input
					v-model="form.nickname"
					class="input"
					placeholder="昵称（可选）"
					placeholder-class="input-placeholder"
				/>
			</view>

			<view class="form-item">
				<input
					v-model="form.email"
					class="input"
					placeholder="邮箱（可选）"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="errors.email" class="error-text">{{ errors.email }}</view>

			<view class="form-item">
				<input
					v-model="form.phone"
					class="input"
					placeholder="手机号（可选）"
					placeholder-class="input-placeholder"
					type="number"
					maxlength="11"
				/>
			</view>
			<view v-if="errors.phone" class="error-text">{{ errors.phone }}</view>

			<view class="form-item form-row">
				<view class="form-label">年龄（可选）</view>
				<input
					v-model="form.age"
					class="input"
					placeholder="年龄"
					placeholder-class="input-placeholder"
					type="number"
					maxlength="3"
				/>
			</view>

			<view class="form-item">
				<view class="form-label">性别（可选）</view>
				<view class="gender-group">
					<view
						class="gender-item"
						:class="{ active: form.gender === '男' }"
						@click="form.gender = '男'"
					>男</view>
					<view
						class="gender-item"
						:class="{ active: form.gender === '女' }"
						@click="form.gender = '女'"
					>女</view>
					<view
						class="gender-item"
						:class="{ active: form.gender === '' }"
						@click="form.gender = ''"
					>不选</view>
				</view>
			</view>

			<button class="btn-primary mt-xl" :disabled="loading" @click="handleRegister">
				{{ loading ? '注册中...' : '注册' }}
			</button>
		</view>

		<view class="footer">
			<text class="footer-text">已有账号？</text>
			<text class="footer-link" @click="goLogin">立即登录</text>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { register } from '@/api/user'

const form = reactive({
	username: '',
	password: '',
	confirmPassword: '',
	nickname: '',
	email: '',
	phone: '',
	age: '',
	gender: ''
})
const errors = reactive({
	username: '',
	password: '',
	confirmPassword: '',
	email: '',
	phone: ''
})
const loading = ref(false)

const validate = () => {
	let valid = true
	errors.username = ''
	errors.password = ''
	errors.confirmPassword = ''
	errors.email = ''
	errors.phone = ''

	// 用户名：2-20位字母数字下划线
	const usernameReg = /^[a-zA-Z0-9_]{2,20}$/
	if (!form.username.trim()) {
		errors.username = '请输入用户名'
		valid = false
	} else if (!usernameReg.test(form.username)) {
		errors.username = '用户名为2-20位字母、数字或下划线'
		valid = false
	}

	// 密码：至少6位
	if (!form.password) {
		errors.password = '请输入密码'
		valid = false
	} else if (form.password.length < 6) {
		errors.password = '密码至少6位'
		valid = false
	}

	// 确认密码
	if (!form.confirmPassword) {
		errors.confirmPassword = '请确认密码'
		valid = false
	} else if (form.password !== form.confirmPassword) {
		errors.confirmPassword = '两次密码不一致'
		valid = false
	}

	// 邮箱（可选，填了就校验格式）
	if (form.email) {
		const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailReg.test(form.email)) {
			errors.email = '邮箱格式不正确'
			valid = false
		}
	}

	// 手机号（可选，填了就校验格式）
	if (form.phone) {
		const phoneReg = /^1[3-9]\d{9}$/
		if (!phoneReg.test(form.phone)) {
			errors.phone = '手机号格式不正确'
			valid = false
		}
	}

	return valid
}

const handleRegister = async () => {
	if (!validate()) return

	loading.value = true
	try {
		const data = {
			username: form.username,
			password: form.password,
			nickname: form.nickname || undefined,
			email: form.email || undefined,
			phone: form.phone || undefined,
			age: form.age ? Number(form.age) : undefined,
			gender: form.gender || undefined
		}
		await register(data)
		uni.showToast({ title: '注册成功，请登录', icon: 'success' })
		setTimeout(() => {
			uni.redirectTo({ url: '/pages/login/index' })
		}, 800)
	} catch (e) {
		// 错误已在拦截器中提示
	} finally {
		loading.value = false
	}
}

const goLogin = () => {
	uni.redirectTo({ url: '/pages/login/index' })
}
</script>
