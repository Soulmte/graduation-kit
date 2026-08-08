<template>
	<view class="container">
		<view v-if="notice" class="card">
			<view class="title">{{ notice.title }}</view>
			<view class="meta">发布时间：{{ notice.createTime }}</view>
			<!-- 使用 rich-text 渲染 HTML 内容 -->
			<rich-text class="content" :nodes="notice.content || ''" />
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getNoticeById } from '@/api/notice'

const notice = ref(null)

onLoad(async (options) => {
	if (!options.id) return
	try {
		const res = await getNoticeById(options.id)
		notice.value = res.data
	} catch (e) {
		// 错误已在拦截器中提示
	}
})
</script>

<style>
.container {
	padding: 20rpx;
	min-height: 100vh;
	background: #f5f5f5;
}

.card {
	background: #fff;
	border-radius: 16rpx;
	padding: 40rpx 30rpx;
}

.title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 16rpx;
}

.meta {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.content {
	font-size: 28rpx;
	color: #333;
	line-height: 1.8;
}
</style>
