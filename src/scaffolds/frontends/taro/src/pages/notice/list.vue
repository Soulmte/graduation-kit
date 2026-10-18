<template>
  <view class="container">
    <view class="search-bar">
      <input
        v-model="searchTitle"
        class="search-input"
        placeholder="搜索公告标题"
        placeholder-class="input-placeholder"
        confirm-type="search"
        @confirm="handleSearch"
      />
      <view class="search-btn" :class="{ disabled: loading }" @tap="handleSearch">搜索</view>
    </view>

    <view v-if="list.length === 0 && !loading" class="empty">暂无公告</view>

    <view
      v-for="item in list"
      :key="item.id"
      class="card"
      @tap="goDetail(item.id)"
    >
      <view class="cell-title">{{ item.title }}</view>
      <view class="cell-desc">{{ item.content }}</view>
      <view class="cell-meta">{{ item.createTime }}</view>
    </view>

    <view class="loading">
      <text v-if="loading">加载中...</text>
      <text v-else-if="!hasMore && list.length > 0">没有更多了</text>
    </view>

    <TabBar active="notice" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import Taro, { useLoad, useReachBottom, usePullDownRefresh } from '@tarojs/taro'
import { pageQueryNotice } from '@/api/notice'
import TabBar from '@/components/TabBar.vue'

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
    // 错误已在请求拦截器中提示
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (loading.value) return
  searchTitle.value = searchTitle.value.trim()
  list.value = []
  hasMore.value = true
  loadData(true)
}

const goDetail = (id) => {
  Taro.navigateTo({ url: `/pages/notice/detail?id=${id}` })
}

useLoad(() => loadData(true))

useReachBottom(() => {
  if (hasMore.value && !loading.value) {
    pageNum.value++
    loadData()
  }
})

usePullDownRefresh(async () => {
  await loadData(true)
  Taro.stopPullDownRefresh()
})
</script>

<style scoped lang="scss">
.search-bar {
  display: flex;
  align-items: center;
  gap: $space-md;
  margin-bottom: $space-md;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 76rpx;
  padding: 0 $space-lg;
  background: $color-surface;
  border-radius: $radius-pill;
  font-size: $font-base;
  border: 1rpx solid $color-border-strong;
  box-sizing: border-box;
}

.search-btn {
  flex-shrink: 0;
  height: 76rpx;
  line-height: 76rpx;
  padding: 0 $space-lg;
  border-radius: $radius-pill;
  background: $color-primary;
  color: $color-text-inverse;
  font-size: $font-base;
  text-align: center;
}

.search-btn.disabled {
  opacity: 0.5;
}
</style>
