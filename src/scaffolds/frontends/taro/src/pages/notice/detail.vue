<template>
  <view class="container">
    <view v-if="notice" class="card">
      <view class="article-title">{{ notice.title }}</view>
      <view class="article-meta">发布时间：{{ notice.createTime }}</view>
      <rich-text class="article-content" :nodes="notice.content || ''" />
    </view>
    <view v-else class="empty">加载中...</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useLoad } from '@tarojs/taro'
import { getNoticeById } from '@/api/notice'

const notice = ref(null)

useLoad(async (options) => {
  if (!options.id) return
  try {
    const res = await getNoticeById(options.id)
    notice.value = res.data
  } catch (e) {
    // 错误已在请求拦截器中提示
  }
})
</script>
