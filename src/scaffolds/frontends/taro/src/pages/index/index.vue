<template>
  <view class="container">
    <view class="banner">
      <view class="banner-title">欢迎使用</view>
      <view class="banner-sub">Taro + Vue 3 · 移动端</view>
    </view>

    <view class="card">
      <view class="card-title">系统功能</view>
      <view v-for="(item, idx) in features" :key="idx" class="cell-item">
        <view class="cell-title">{{ item.name }}</view>
        <view class="cell-desc">{{ item.desc }}</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">最新公告</view>
      <view v-if="notices.length === 0" class="empty">暂无公告</view>
      <view
        v-for="item in notices"
        :key="item.id"
        class="cell-item"
        @tap="goDetail(item.id)"
      >
        <view class="cell-title">{{ item.title }}</view>
        <view class="cell-meta">{{ item.createTime }}</view>
      </view>
    </view>

    <TabBar active="home" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import Taro, { useLoad } from '@tarojs/taro'
import { listAllNotice } from '@/api/notice'
import TabBar from '@/components/TabBar.vue'

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
    // 错误已在请求拦截器中提示
  }
}

const goDetail = (id) => {
  Taro.navigateTo({ url: `/pages/notice/detail?id=${id}` })
}

useLoad(loadNotices)
</script>

<style scoped lang="scss">
.banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: $color-text-inverse;
  padding: $space-2xl $space-xl;
  border-radius: $radius-lg;
  margin-bottom: $space-md;
}

.banner-title {
  font-size: $font-2xl;
  font-weight: 700;
}

.banner-sub {
  font-size: $font-sm;
  margin-top: $space-sm;
  opacity: 0.9;
}
</style>
