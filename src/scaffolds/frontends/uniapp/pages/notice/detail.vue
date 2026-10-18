<template>
	<view class="container">
		<view v-if="notice" class="card">
			<view class="article-title">{{ notice.title }}</view>
			<view class="article-meta">发布时间：{{ notice.createTime }}</view>
			<!-- 使用 rich-text 渲染 HTML 内容 -->
			<rich-text class="article-content" :nodes="notice.content || ''" />
		</view>
		<view v-else class="empty">加载中...</view>
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
