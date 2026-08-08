<template>
	<view class="container">
		<view class="avatar-section" @click="chooseAvatar">
			<image class="avatar" :src="avatarUrl" />
			<view class="avatar-tip">点击更换头像</view>
		</view>

		<view class="form">
			<view class="form-item">
				<view class="label">用户名</view>
				<input class="input" :value="form.username" disabled />
			</view>
			<view class="form-item">
				<view class="label">昵称</view>
				<input
					v-model="form.nickname"
					class="input"
					placeholder="请输入昵称"
					placeholder-style="color:#aaa"
				/>
			</view>
			<view class="form-item">
				<view class="label">邮箱</view>
				<input
					v-model="form.email"
					class="input"
					placeholder="请输入邮箱"
					placeholder-style="color:#aaa"
				/>
			</view>
			<view class="form-item">
				<view class="label">手机号</view>
				<input
					v-model="form.phone"
					class="input"
					placeholder="请输入手机号"
					placeholder-style="color:#aaa"
					type="number"
					maxlength="11"
				/>
			</view>
			<view class="form-item">
				<view class="label">年龄</view>
				<input
					v-model="form.age"
					class="input"
					placeholder="请输入年龄"
					placeholder-style="color:#aaa"
					type="number"
					maxlength="3"
				/>
			</view>
			<view class="form-item">
				<view class="label">性别</view>
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
						:class="{ active: !form.gender }"
						@click="form.gender = ''"
					>未设置</view>
				</view>
			</view>
			<view class="form-item">
				<view class="label">安全</view>
				<button class="btn-plain" @click="pwdVisible = true">修改密码</button>
			</view>

			<button class="btn-primary" :disabled="loading" @click="handleSave">
				{{ loading ? '保存中...' : '保存' }}
			</button>
		</view>

		<view v-if="pwdVisible" class="mask" @click="closePwd">
			<view class="dialog" @click.stop>
				<view class="dialog-title">修改密码</view>
				<input
					v-model="pwdForm.oldPassword"
					class="input"
					placeholder="原密码"
					placeholder-style="color:#aaa"
					password
				/>
				<input
					v-model="pwdForm.newPassword"
					class="input"
					placeholder="新密码（6-20 位）"
					placeholder-style="color:#aaa"
					password
				/>
				<input
					v-model="pwdForm.confirmPassword"
					class="input"
					placeholder="确认新密码"
					placeholder-style="color:#aaa"
					password
				/>
				<view class="dialog-actions">
					<button class="btn-plain" @click="closePwd">取消</button>
					<button class="btn-primary" :disabled="pwdLoading" @click="handleUpdatePassword">
						{{ pwdLoading ? '提交中...' : '确定' }}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { updateUser, updatePassword } from '@/api/user'
import { uploadFile } from '@/api/file'
import { userStore } from '@/store/user'
import { resolveAvatar } from '@/utils/index'

const form = reactive({
	id: userStore.userInfo?.id,
	username: userStore.userInfo?.username || '',
	nickname: userStore.userInfo?.nickname || '',
	email: userStore.userInfo?.email || '',
	phone: userStore.userInfo?.phone || '',
	age: userStore.userInfo?.age ? String(userStore.userInfo.age) : '',
	gender: userStore.userInfo?.gender || '',
	avatar: userStore.userInfo?.avatar || ''
})
const loading = ref(false)

const avatarUrl = computed(() => resolveAvatar(form.avatar))

const pwdVisible = ref(false)
const pwdLoading = ref(false)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const closePwd = () => {
	pwdVisible.value = false
	pwdForm.oldPassword = ''
	pwdForm.newPassword = ''
	pwdForm.confirmPassword = ''
}

const handleUpdatePassword = async () => {
	if (!pwdForm.oldPassword || !pwdForm.newPassword) {
		uni.showToast({ title: '请填写完整', icon: 'none' })
		return
	}
	if (pwdForm.newPassword.length < 6 || pwdForm.newPassword.length > 20) {
		uni.showToast({ title: '新密码长度 6-20 位', icon: 'none' })
		return
	}
	if (pwdForm.newPassword !== pwdForm.confirmPassword) {
		uni.showToast({ title: '两次密码不一致', icon: 'none' })
		return
	}
	pwdLoading.value = true
	try {
		await updatePassword(pwdForm.oldPassword, pwdForm.newPassword)
		uni.showToast({ title: '修改成功', icon: 'success' })
		closePwd()
	} catch (e) {
		// 错误已在拦截器中提示
	} finally {
		pwdLoading.value = false
	}
}

const chooseAvatar = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			try {
				uni.showLoading({ title: '上传中...' })
				const uploadRes = await uploadFile(res.tempFilePaths[0])
				form.avatar = uploadRes.data.url
				uni.showToast({ title: '上传成功', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: '上传失败', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		}
	})
}

const handleSave = async () => {
	loading.value = true
	try {
		const data = {
			id: form.id,
			nickname: form.nickname || undefined,
			email: form.email || undefined,
			phone: form.phone || undefined,
			age: form.age ? Number(form.age) : undefined,
			gender: form.gender || undefined,
			avatar: form.avatar || undefined
		}

		await updateUser(data)
		// 更新本地存储的用户信息
		userStore.updateUserInfo({
			nickname: form.nickname,
			email: form.email,
			phone: form.phone,
			age: form.age ? Number(form.age) : null,
			gender: form.gender,
			avatar: form.avatar
		})
		uni.showToast({ title: '保存成功', icon: 'success' })
		setTimeout(() => uni.navigateBack(), 500)
	} catch (e) {
		// 错误已在拦截器中提示
	} finally {
		loading.value = false
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

.avatar-section {
	background: #fff;
	padding: 60rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 20rpx;
}

.avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	background: #eee;
}

.avatar-tip {
	margin-top: 20rpx;
	font-size: 26rpx;
	color: #999;
}

.form {
	background: #fff;
	padding: 0 30rpx;
}

.form-item {
	padding: 28rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.label {
	font-size: 26rpx;
	color: #999;
	margin-bottom: 12rpx;
}

.input {
	height: 60rpx;
	font-size: 28rpx;
	color: #333;
}

.gender-group {
	display: flex;
	gap: 20rpx;
	margin-top: 8rpx;
}

.gender-item {
	flex: 1;
	text-align: center;
	height: 64rpx;
	line-height: 64rpx;
	background: #f7f7f7;
	border-radius: 12rpx;
	font-size: 26rpx;
	color: #666;
	border: 2rpx solid transparent;
}

.gender-item.active {
	background: #e8f4ff;
	color: #007aff;
	border-color: #007aff;
}

.btn-primary {
	margin: 40rpx 30rpx;
	background: #007aff;
	color: #fff;
	border-radius: 12rpx;
	height: 90rpx;
	line-height: 90rpx;
	font-size: 30rpx;
}

.btn-plain {
	margin-top: 8rpx;
	background: #f7f7f7;
	color: #333;
	border-radius: 12rpx;
	height: 72rpx;
	line-height: 72rpx;
	font-size: 28rpx;
}

.mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99;
}

.dialog {
	width: 600rpx;
	background: #fff;
	border-radius: 16rpx;
	padding: 40rpx 30rpx 30rpx;
}

.dialog-title {
	font-size: 32rpx;
	color: #333;
	text-align: center;
	margin-bottom: 30rpx;
}

.dialog .input {
	height: 80rpx;
	background: #f7f7f7;
	border-radius: 12rpx;
	padding: 0 24rpx;
	margin-bottom: 20rpx;
}

.dialog-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 10rpx;
}

.dialog-actions .btn-plain,
.dialog-actions .btn-primary {
	flex: 1;
	margin: 0;
	height: 80rpx;
	line-height: 80rpx;
}
</style>
