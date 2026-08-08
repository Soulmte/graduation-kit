<template>
	<view class="container">
		<view class="banner">
			<view class="banner-title">欢迎使用</view>
			<view class="banner-sub">多技术栈脚手架 · 移动端</view>
		</view>

		<view class="card">
			<view class="card-title">系统功能</view>
			<view class="feature" v-for="(item, idx) in features" :key="idx">
				<view class="feature-name">{{ item.name }}</view>
				<view class="feature-desc">{{ item.desc }}</view>
			</view>
		</view>

		<view class="card">
			<view class="card-title">最新公告</view>
			<view v-if="notices.length === 0" class="empty">暂无公告</view>
			<view
				v-for="item in notices"
				:key="item.id"
				class="notice-item"
				@click="goDetail(item.id)"
			>
				<view class="notice-title">{{ item.title }}</view>
				<view class="notice-time">{{ item.createTime }}</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listAllNotice } from '@/api/notice'

const notices = ref([])
const features = [
	{ name: '用户中心', desc: '注册登录 · 个人资料管理' },
	{ name: '公告浏览', desc: '查看系统最新通知' },
	{ name: '头像上传', desc: '支持相册/拍照上传' }
]

const loadNotices = async () => {
	try {
		const res = await listAllNotice()
		notices.value = (res.data || []).slice(0, 5)
	} catch (e) {
		// 错误已在拦截器中提示
	}
}

const goDetail = (id) => {
	uni.navigateTo({ url: `/pages/notice/detail?id=${id}` })
}

onMounted(loadNotices)
</script>

<style>
.container {
	padding: 20rpx;
	min-height: 100vh;
	background: #f5f5f5;
}

.banner {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	padding: 60rpx 40rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
}

.banner-title {
	font-size: 44rpx;
	font-weight: bold;
}

.banner-sub {
	font-size: 26rpx;
	margin-top: 12rpx;
	opacity: 0.9;
}

.card {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: 600;
	margin-bottom: 20rpx;
	color: #333;
}

.feature {
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.feature:last-child {
	border-bottom: none;
}

.feature-name {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 6rpx;
}

.feature-desc {
	font-size: 24rpx;
	color: #999;
}

.empty {
	text-align: center;
	color: #999;
	font-size: 26rpx;
	padding: 40rpx 0;
}

.notice-item {
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.notice-item:last-child {
	border-bottom: none;
}

.notice-title {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 8rpx;
}

.notice-time {
	font-size: 22rpx;
	color: #999;
}
</style>
