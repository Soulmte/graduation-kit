<template>
	<view class="container">
		<view class="search-bar">
			<input
				v-model="searchTitle"
				class="search-input"
				placeholder="搜索公告标题"
				confirm-type="search"
				@confirm="handleSearch"
			/>
		</view>

		<view v-if="list.length === 0 && !loading" class="empty">暂无公告</view>

		<view
			v-for="item in list"
			:key="item.id"
			class="notice-card"
			@click="goDetail(item.id)"
		>
			<view class="notice-title">{{ item.title }}</view>
			<view class="notice-preview">{{ item.content }}</view>
			<view class="notice-time">{{ item.createTime }}</view>
		</view>

		<view v-if="loading" class="loading">加载中...</view>
		<view v-else-if="!hasMore && list.length > 0" class="loading">没有更多了</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app'
import { pageQueryNotice } from '@/api/notice'

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const searchTitle = ref('')
const loading = ref(false)
const hasMore = ref(true)

const loadData = async (reset = false) => {
	if (loading.value) return
	if (reset) {
		pageNum.value = 1
		hasMore.value = true
	}
	if (!hasMore.value) return

	loading.value = true
	try {
		const res = await pageQueryNotice({
			pageNum: pageNum.value,
			pageSize,
			title: searchTitle.value
		})
		const records = res.data.records || []
		list.value = reset ? records : [...list.value, ...records]
		total.value = res.data.total
		hasMore.value = list.value.length < total.value
	} catch (e) {
		// 错误已在拦截器中提示
	} finally {
		loading.value = false
	}
}

const handleSearch = () => {
	loadData(true)
}

const goDetail = (id) => {
	uni.navigateTo({ url: `/pages/notice/detail?id=${id}` })
}

onLoad(() => loadData(true))

onReachBottom(() => {
	if (hasMore.value && !loading.value) {
		pageNum.value++
		loadData()
	}
})

onPullDownRefresh(async () => {
	await loadData(true)
	uni.stopPullDownRefresh()
})
</script>

<style>
.container {
	padding: 20rpx;
	min-height: 100vh;
	background: #f5f5f5;
}

.search-bar {
	margin-bottom: 20rpx;
}

.search-input {
	background: #fff;
	padding: 20rpx 30rpx;
	border-radius: 40rpx;
	font-size: 28rpx;
	border: 1rpx solid #e5e5e5;
}

.notice-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.notice-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}

.notice-preview {
	font-size: 26rpx;
	color: #666;
	line-height: 1.6;
	margin-bottom: 16rpx;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.notice-time {
	font-size: 22rpx;
	color: #999;
}

.empty,
.loading {
	text-align: center;
	color: #999;
	font-size: 26rpx;
	padding: 40rpx 0;
}
</style>
