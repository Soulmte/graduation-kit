<template>
	<view class="container">
		<view class="cell-group">
			<view class="cell" @click="goPassword">
				<text class="cell-text">修改密码</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="goMessage">
				<text class="cell-text">消息中心</text>
				<view class="cell-right">
					<text v-if="unread > 0" class="unread-badge">{{ unread }}</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="cell-group">
			<view class="cell">
				<text class="cell-text">消息通知</text>
				<switch :checked="notify" color="#007aff" @change="onNotifyChange" />
			</view>
			<view class="cell">
				<text class="cell-text">声音提醒</text>
				<switch :checked="sound" color="#007aff" @change="onSoundChange" />
			</view>
		</view>

		<view class="cell-group">
			<view class="cell" @click="clearCache">
				<text class="cell-text">清除缓存</text>
				<view class="cell-right">
					<text class="cell-meta">{{ cacheSize }}</text>
					<text class="cell-arrow">›</text>
				</view>
			</view>
			<view class="cell" @click="goAbout">
				<text class="cell-text">关于我们</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="goAgreement('user')">
				<text class="cell-text">用户协议</text>
				<text class="cell-arrow">›</text>
			</view>
			<view class="cell" @click="goAgreement('privacy')">
				<text class="cell-text">隐私政策</text>
				<text class="cell-arrow">›</text>
			</view>
		</view>

		<button v-if="userStore.token" class="btn-logout" @click="handleLogout">退出登录</button>
		<view class="version">当前版本 1.0.0</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userStore } from '@/store/user'
import { getUnreadCount } from '@/utils/message'

const notify = ref(uni.getStorageSync('settings_notify') !== false)
const sound = ref(uni.getStorageSync('settings_sound') !== false)
const cacheSize = ref('2.6 MB')
const unread = ref(0)

onShow(() => {
	unread.value = getUnreadCount()
})

const onNotifyChange = (e) => {
	notify.value = e.detail.value
	uni.setStorageSync('settings_notify', notify.value)
}

const onSoundChange = (e) => {
	sound.value = e.detail.value
	uni.setStorageSync('settings_sound', sound.value)
}

const clearCache = () => {
	uni.showModal({
		title: '清除缓存',
		content: '确定清除本地缓存吗？不会影响登录状态。',
		success: (res) => {
			if (!res.confirm) return
			cacheSize.value = '0 KB'
			uni.showToast({ title: '已清除', icon: 'success' })
		}
	})
}

const goPassword = () => uni.navigateTo({ url: '/pages/password/index' })
const goMessage = () => uni.navigateTo({ url: '/pages/message/index' })
const goAbout = () => uni.navigateTo({ url: '/pages/about/index' })
const goAgreement = (type) => uni.navigateTo({ url: `/pages/agreement/index?type=${type}` })

const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (!res.confirm) return
			userStore.logout()
			uni.showToast({ title: '已退出', icon: 'success' })
			setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 300)
		}
	})
}
</script>

<style scoped lang="scss">
.cell-right {
	display: flex;
	align-items: center;
	gap: $space-sm;
}

.cell switch {
	transform: scale(0.8);
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

.btn-logout {
	margin-top: $space-md;
}

.version {
	margin: $space-lg 0;
	text-align: center;
	color: $color-text-muted;
	font-size: $font-xs;
}
</style>
