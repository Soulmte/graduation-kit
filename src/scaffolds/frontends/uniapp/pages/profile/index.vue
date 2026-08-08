<template>
	<view class="container">
		<!-- 未登录 -->
		<view v-if="!userStore.token" class="login-prompt">
			<image class="default-avatar" src="/static/logo.png" />
			<view class="prompt-text">请先登录</view>
			<button class="btn-primary" @click="goLogin">登录 / 注册</button>
		</view>

		<!-- 已登录 -->
		<view v-else>
			<view class="user-card">
				<image class="avatar" :src="avatarUrl" />
				<view class="user-info">
					<view class="username">{{ displayName }}</view>
					<view class="role">{{ roleLabel }}</view>
					<view v-if="userStore.userInfo?.phone" class="user-phone">{{ userStore.userInfo.phone }}</view>
				</view>
			</view>

			<view class="menu">
				<view class="menu-item" @click="goEdit">
					<text class="menu-text">编辑资料</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="showAbout">
					<text class="menu-text">关于系统</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>

			<button class="btn-logout" @click="handleLogout">退出登录</button>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue'
import { userStore } from '@/store/user'
import { resolveAvatar } from '@/utils/index'

const avatarUrl = computed(() => resolveAvatar(userStore.userInfo?.avatar))

const displayName = computed(() =>
	userStore.userInfo?.nickname || userStore.userInfo?.username || '用户'
)

const roleLabel = computed(() =>
	userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户'
)

const goLogin = () => uni.navigateTo({ url: '/pages/login/index' })
const goEdit = () => uni.navigateTo({ url: '/pages/edit/index' })

const showAbout = () => {
	uni.showModal({
		title: '关于',
		content: '毕业设计管理系统 v1.0.0',
		showCancel: false
	})
}

const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				userStore.logout()
				uni.showToast({ title: '已退出', icon: 'success' })
			}
		}
	})
}
</script>

<style>
.container {
	padding: 20rpx;
	min-height: 100vh;
	background: #f5f5f5;
}

.login-prompt {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 40rpx;
}

.default-avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	margin-bottom: 30rpx;
}

.prompt-text {
	font-size: 30rpx;
	color: #666;
	margin-bottom: 40rpx;
}

.btn-primary {
	width: 400rpx;
	background: #007aff;
	color: #fff;
	border-radius: 40rpx;
	font-size: 30rpx;
}

.user-card {
	background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
	border-radius: 16rpx;
	padding: 40rpx 30rpx;
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.avatar {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	border: 4rpx solid #fff;
	background: #fff;
}

.user-info {
	margin-left: 30rpx;
	color: #fff;
}

.username {
	font-size: 36rpx;
	font-weight: 600;
}

.role {
	font-size: 24rpx;
	margin-top: 8rpx;
	opacity: 0.9;
}

.user-phone {
	font-size: 22rpx;
	margin-top: 6rpx;
	opacity: 0.8;
}

.menu {
	background: #fff;
	border-radius: 16rpx;
	margin-bottom: 40rpx;
}

.menu-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-text {
	font-size: 28rpx;
	color: #333;
}

.menu-arrow {
	color: #ccc;
	font-size: 32rpx;
}

.btn-logout {
	background: #fff;
	color: #ff3b30;
	border-radius: 12rpx;
	font-size: 30rpx;
}
</style>
