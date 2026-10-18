<template>
  <view class="container">
    <view v-if="message" class="card">
      <view class="message-head">
        <text class="message-type" :style="{ color: typeOf(message).color }">{{ typeOf(message).label }}</text>
        <text class="cell-meta">{{ message.time }}</text>
      </view>
      <view class="article-title">{{ message.title }}</view>
      <view class="article-meta">消息时间：{{ message.time }}</view>
      <view class="article-content">{{ message.content }}</view>
    </view>
    <view v-else class="empty">消息不存在</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useLoad } from '@tarojs/taro'
import { MESSAGE_TYPES, MOCK_MESSAGES } from '@/data/messages'
import { markRead } from '@/utils/message'

const message = ref(null)
const typeOf = (item) => MESSAGE_TYPES[item.type] || { label: '消息', color: '#999999' }

useLoad((options) => {
  const id = Number(options.id)
  message.value = MOCK_MESSAGES.find((item) => item.id === id) || null
  if (message.value) {
    markRead(message.value.id)
  }
})
</script>

<style scoped lang="scss">
.message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-sm;
}

.message-type {
  font-size: $font-xs;
  font-weight: 600;
}
</style>
