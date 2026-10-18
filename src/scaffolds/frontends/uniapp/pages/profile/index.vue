<template>
	<view class="container">
		<!-- 未登录 -->
		<view v-if="!userStore.token" class="login-prompt">
			<view class="avatar avatar--lg avatar-fallback">游</view>
			<view class="prompt-text">请先登录</view>
			<button class="btn-primary btn-primary--pill" @click="goLogin">登录 / 注册</button>
		</view>

		<!-- 已登录 -->
		<view v-else>
			<view class="user-card">
				<image v-if="avatarUrl" class="avatar avatar--md" :src="avatarUrl" />
				<view v-else class="avatar avatar--md avatar-fallback avatar-on-card">{{ initial }}</view>
				<view class="user-info">
					<view class="username">{{ displayName }}</view>
					<view class="role">{{ roleLabel }}</view>
					<view v-if="userStore.userInfo?.phone" class="user-phone">{{ userStore.userInfo.phone }}</view>
				</view>
			</view>

			<view class="cell-group">
				<view class="cell" @click="goEdit">
					<text class="cell-text">编辑资料</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell" @click="goPassword">
					<text class="cell-text">修改密码</text>
					<text class="cell-arrow">›</text>
				</view>
				<view class="cell" @click="goMessage">
					<text class="cell-text">消息中心</text>
					<view class="cell-right">
						<text v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</text>
						<text class="cell-arrow">›</text>
					</view>
				</view>
				<view class="cell" @click="goSettings">
					<text class="cell-text">设置</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>

			<button class="btn-logout" @click="handleLogout">退出登录</button>
		</view>

		<TabBar active="profile" />
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userStore } from '@/store/user'
import { resolveAvatar } from '@/utils/index'
import { getUnreadCount } from '@/utils/message'
import TabBar from '@/components/TabBar.vue'

const avatarUrl = computed(() => resolveAvatar(userStore.userInfo?.avatar))
const initial = computed(() => {
	const name = userStore.userInfo?.nickname || userStore.userInfo?.username || '游'
	return name.slice(0, 1)
})

const displayName = computed(() =>
	userStore.userInfo?.nickname || userStore.userInfo?.username || '用户'
)

const roleLabel = computed(() =>
	userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户'
)

const unreadCount = ref(0)
onShow(() => {
	unreadCount.value = getUnreadCount()
})

const goLogin = () => uni.navigateTo({ url: '/pages/login/index' })
const goEdit = () => uni.navigateTo({ url: '/pages/edit/index' })
const goPassword = () => uni.navigateTo({ url: '/pages/password/index' })
const goMessage = () => uni.navigateTo({ url: '/pages/message/index' })
const goSettings = () => uni.navigateTo({ url: '/pages/settings/index' })

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

<style scoped lang="scss">
.login-prompt {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx $space-xl;
}

.prompt-text {
	font-size: $font-md;
	color: $color-text-secondary;
	margin: $space-lg 0 $space-xl;
}

.user-card {
	display: flex;
	align-items: center;
	background: linear-gradient(135deg, #1890ff 0%, $color-primary-dark 100%);
	border-radius: $radius-lg;
	padding: $space-xl $space-lg;
	margin-bottom: $space-md;
}

.user-card .avatar {
	border: 4rpx solid $color-text-inverse;
}

.avatar-on-card {
	font-size: 56rpx;
}

.user-info {
	flex: 1;
	min-width: 0;
	margin-left: $space-lg;
	color: $color-text-inverse;
}

.username {
	font-size: $font-xl;
	font-weight: 600;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.role {
	font-size: $font-sm;
	margin-top: $space-xs;
	opacity: 0.9;
}

.user-phone {
	font-size: $font-xs;
	margin-top: 6rpx;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	opacity: 0.8;
}

.cell-right {
	display: flex;
	align-items: center;
	gap: $space-sm;
}

.unread-badge {
	min-width: 32rpx;
	height: 32rpx;
	line-height: 32rpx;
	padding: 0 8rpx;
	border-radius: $radius-pill;
	background: $color-danger;
	color: $color-text-inverse;
	font-size: $font-xs;
	text-align: center;
}
</style>
