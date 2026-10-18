<template>
  <view class="container">
    <view class="message-toolbar">
      <view class="filter-group">
        <view class="filter-item" :class="{ active: filter === 'all' }" @tap="filter = 'all'">全部</view>
        <view class="filter-item" :class="{ active: filter === 'unread' }" @tap="filter = 'unread'">未读</view>
      </view>
      <text class="mark-all" @tap="handleMarkAll">全部已读</text>
    </view>

    <view v-if="filtered.length === 0" class="empty">暂无消息</view>

    <view v-for="item in filtered" :key="item.id" class="card message-card" @tap="goDetail(item)">
      <view class="message-head">
        <text class="message-type" :style="{ color: typeOf(item).color }">{{ typeOf(item).label }}</text>
        <text class="cell-meta">{{ item.time }}</text>
      </view>
      <view class="message-title">
        <view v-if="!isRead(item.id)" class="unread-dot" />
        <text class="cell-title">{{ item.title }}</text>
      </view>
      <view class="cell-desc">{{ item.summary }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import Taro, { useDidShow } from '@tarojs/taro'
import { MESSAGE_TYPES, MOCK_MESSAGES } from '@/data/messages'
import { getReadIds, markAllRead, markRead } from '@/utils/message'

const filter = ref('all')
const readIds = ref([])

const refresh = () => {
  readIds.value = getReadIds()
}

useDidShow(refresh)

const typeOf = (item) => MESSAGE_TYPES[item.type] || { label: '消息', color: '#999999' }
const isRead = (id) => readIds.value.includes(id)
const filtered = computed(() =>
  filter.value === 'unread' ? MOCK_MESSAGES.filter((item) => !isRead(item.id)) : MOCK_MESSAGES
)

const handleMarkAll = () => {
  markAllRead()
  refresh()
  Taro.showToast({ title: '已全部标记为已读', icon: 'none' })
}

const goDetail = (item) => {
  markRead(item.id)
  refresh()
  Taro.navigateTo({ url: `/pages/message/detail?id=${item.id}` })
}
</script>

<style scoped lang="scss">
.message-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-md;
}

.filter-group {
  display: flex;
  padding: 4rpx;
  border-radius: $radius-pill;
  background: $color-surface-muted;
}

.filter-item {
  padding: 8rpx $space-lg;
  border-radius: $radius-pill;
  font-size: $font-sm;
  color: $color-text-secondary;
}

.filter-item.active {
  background: $color-surface;
  color: $color-primary;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.mark-all {
  font-size: $font-sm;
  color: $color-primary;
}

.message-card:active {
  opacity: 0.85;
}

.message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-xs;
}

.message-type {
  font-size: $font-xs;
  font-weight: 600;
}

.message-title {
  display: flex;
  align-items: center;
  gap: $space-xs;
}

.unread-dot {
  width: 12rpx;
  height: 12rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: $color-danger;
}
</style>
