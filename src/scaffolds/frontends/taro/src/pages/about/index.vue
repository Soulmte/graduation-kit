<template>
  <view class="container">
    <view class="about-hero">
      <view class="about-logo">毕</view>
      <view class="about-name">毕业设计管理系统</view>
      <view class="about-version">Version 1.0.0</view>
    </view>

    <view class="card">
      <view class="card-title">项目简介</view>
      <view class="about-desc">
        面向毕业设计场景的移动端通用脚手架，包含登录注册、公告、消息中心、个人中心与设置等基础模块。
        项目采用前后端分离架构，接口统一使用 { code, message, data } 协议。
      </view>
      <view class="feature-tags">
        <text v-for="tag in tags" :key="tag" class="feature-tag">{{ tag }}</text>
      </view>
    </view>

    <view class="cell-group">
      <view class="cell" @tap="goAgreement('user')">
        <text class="cell-text">用户协议</text>
        <text class="cell-arrow">›</text>
      </view>
      <view class="cell" @tap="goAgreement('privacy')">
        <text class="cell-text">隐私政策</text>
        <text class="cell-arrow">›</text>
      </view>
      <view class="cell" @tap="copyEmail">
        <text class="cell-text">联系邮箱</text>
        <text class="cell-meta">admin@example.com</text>
      </view>
    </view>

    <view class="about-footer">© 2026 Graduation Kit</view>
  </view>
</template>

<script setup>
import Taro from '@tarojs/taro'

const tags = ['Taro', 'Vue 3', 'Express', 'MySQL']

const goAgreement = (type) => Taro.navigateTo({ url: `/pages/agreement/index?type=${type}` })

const copyEmail = () => {
  Taro.setClipboardData({
    data: 'admin@example.com',
    success: () => Taro.showToast({ title: '邮箱已复制', icon: 'none' })
  })
}
</script>

<style scoped lang="scss">
.about-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-2xl $space-xl;
  margin-bottom: $space-md;
  border-radius: $radius-lg;
  background: $color-surface;
  border: 1rpx solid $color-border;
  color: $color-text;
}

.about-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  margin-bottom: $space-md;
  border-radius: 32rpx;
  background: $color-primary-light;
  color: $color-primary;
  font-size: 56rpx;
  font-weight: 700;
}

.about-name {
  font-size: $font-xl;
  font-weight: 600;
  color: $color-text;
}

.about-version {
  margin-top: $space-xs;
  font-size: $font-sm;
  color: $color-text-muted;
}

.about-desc {
  font-size: $font-base;
  color: $color-text-secondary;
  line-height: 1.8;
  overflow-wrap: break-word;
  word-break: break-word;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-sm;
  margin-top: $space-md;
}

.feature-tag {
  padding: 6rpx $space-md;
  border-radius: $radius-pill;
  background: $color-primary-light;
  color: $color-primary;
  font-size: $font-xs;
}

.about-footer {
  margin: $space-xl 0;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-xs;
}
</style>
