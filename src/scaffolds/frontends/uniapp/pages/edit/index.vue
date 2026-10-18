<template>
	<view class="container container--surface container--flush">
		<view class="avatar-section" @click="chooseAvatar">
			<image v-if="avatarUrl" class="avatar avatar--lg" :src="avatarUrl" />
			<view v-else class="avatar avatar--lg avatar-fallback">{{ initial }}</view>
			<view class="avatar-tip">点击更换头像</view>
		</view>

		<view class="form-panel">
			<view class="form-item">
				<view class="form-label">用户名</view>
				<input class="input" :value="form.username" disabled />
			</view>
			<view class="form-item">
				<view class="form-label">昵称</view>
				<input
					v-model="form.nickname"
					class="input"
					placeholder="请输入昵称"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view class="form-item">
				<view class="form-label">邮箱</view>
				<input
					v-model="form.email"
					class="input"
					placeholder="请输入邮箱"
					placeholder-class="input-placeholder"
				/>
			</view>
			<view class="form-item">
				<view class="form-label">手机号</view>
				<input
					v-model="form.phone"
					class="input"
					placeholder="请输入手机号"
					placeholder-class="input-placeholder"
					type="number"
					maxlength="11"
				/>
			</view>
			<view class="form-item">
				<view class="form-label">年龄</view>
				<input
					v-model="form.age"
					class="input"
					placeholder="请输入年龄"
					placeholder-class="input-placeholder"
					type="number"
					maxlength="3"
				/>
			</view>
			<view class="form-item">
				<view class="form-label">性别</view>
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

			<button class="btn-primary mt-xl" :disabled="loading" @click="handleSave">
				{{ loading ? '保存中...' : '保存' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { updateUser } from '@/api/user'
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
const initial = computed(() => {
	const name = form.nickname || form.username || '用'
	return name.slice(0, 1)
})

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

<style scoped lang="scss">
.avatar-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	background: $color-surface;
	padding: $space-2xl 0;
	margin-bottom: $space-md;
}

.avatar-tip {
	margin-top: $space-md;
	font-size: $font-sm;
	color: $color-text-muted;
}

.form-panel {
	background: $color-surface;
	padding: 0 $space-lg;
}
</style>
