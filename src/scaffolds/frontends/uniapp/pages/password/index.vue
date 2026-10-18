<template>
	<view class="container">
		<view class="form">
			<view class="form-item">
				<view class="form-label">原密码</view>
				<input
					v-model="form.oldPassword"
					class="input"
					password
					placeholder="请输入原密码"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="errors.oldPassword" class="error-text">{{ errors.oldPassword }}</view>

			<view class="form-item">
				<view class="form-label">新密码</view>
				<input
					v-model="form.newPassword"
					class="input"
					password
					placeholder="6-20 位新密码"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="errors.newPassword" class="error-text">{{ errors.newPassword }}</view>

			<view class="form-item">
				<view class="form-label">确认新密码</view>
				<input
					v-model="form.confirmPassword"
					class="input"
					password
					placeholder="请再次输入新密码"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</view>

			<button class="btn-primary mt-xl" :disabled="loading" @click="handleSubmit">
				{{ loading ? '提交中...' : '确认修改' }}
			</button>
			<view class="tip">修改成功后会退出登录，请使用新密码重新登录。</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { updatePassword } from '@/api/user'
import { userStore } from '@/store/user'

const form = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
})
const errors = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
})
const loading = ref(false)

const validate = () => {
	let valid = true
	errors.oldPassword = ''
	errors.newPassword = ''
	errors.confirmPassword = ''

	if (!form.oldPassword) {
		errors.oldPassword = '请输入原密码'
		valid = false
	}
	if (!form.newPassword) {
		errors.newPassword = '请输入新密码'
		valid = false
	} else if (form.newPassword.length < 6 || form.newPassword.length > 20) {
		errors.newPassword = '新密码长度 6-20 位'
		valid = false
	} else if (form.newPassword === form.oldPassword) {
		errors.newPassword = '新密码不能与原密码相同'
		valid = false
	}
	if (!form.confirmPassword) {
		errors.confirmPassword = '请确认新密码'
		valid = false
	} else if (form.newPassword !== form.confirmPassword) {
		errors.confirmPassword = '两次输入的新密码不一致'
		valid = false
	}
	return valid
}

const handleSubmit = async () => {
	if (!validate()) return

	loading.value = true
	try {
		await updatePassword(form.oldPassword, form.newPassword)
		uni.showToast({ title: '修改成功', icon: 'success' })
		userStore.logout()
		setTimeout(() => {
			uni.reLaunch({ url: '/pages/login/index' })
		}, 800)
	} catch (e) {
		// 错误已在拦截器中提示
	} finally {
		loading.value = false
	}
}
</script>

<style scoped lang="scss">
.tip {
	margin-top: $space-lg;
	font-size: $font-xs;
	color: $color-text-muted;
	line-height: 1.6;
	text-align: center;
}
</style>
