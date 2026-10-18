<template>
  <view class="tabbar-wrap">
    <!-- 占位块：高度 = 固定 tabBar 的真实高度，保证页面内容不被遮挡 -->
    <view class="tabbar-spacer" :style="spacerStyle" />
    <view class="tabbar">
      <view
        v-for="item in items"
        :key="item.key"
        class="tabbar-item"
        @tap="go(item)"
      >
        <image
          class="tabbar-icon"
          :src="active === item.key ? item.activeIcon : item.icon"
          mode="aspectFit"
        />
        <text class="tabbar-text" :class="{ active: active === item.key }">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 自绘 tabBar
 * - 不使用 app.config.js 的原生 tabBar，样式完全可控
 * - 组件内部带一个与自身等高的占位块，页面不需要再写 padding-bottom
 * - 切换用 reLaunch：页面不再是原生 tabBar 页面，switchTab 不生效
 */
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import homeIcon from '@/static/tab-home.png'
import homeActiveIcon from '@/static/tab-home-active.png'
import noticeIcon from '@/static/tab-notice.png'
import noticeActiveIcon from '@/static/tab-notice-active.png'
import profileIcon from '@/static/tab-profile.png'
import profileActiveIcon from '@/static/tab-profile-active.png'

const props = defineProps({
  active: { type: String, default: 'home' }
})

const instance = getCurrentInstance()
const spacerHeight = ref(0)
const spacerStyle = computed(() => (spacerHeight.value ? { height: `${spacerHeight.value}px` } : {}))
const timers = []

const measure = () => {
  try {
    const query = instance?.proxy
      ? Taro.createSelectorQuery().in(instance.proxy)
      : Taro.createSelectorQuery()
    query.select('.tabbar').boundingClientRect((rect) => {
      if (rect && rect.height) spacerHeight.value = rect.height
    }).exec()
  } catch (e) {
    // 测量失败时保留 CSS 兜底高度
  }
}

onMounted(() => {
  nextTick(() => {
    timers.push(setTimeout(measure, 30))
    timers.push(setTimeout(measure, 300))
  })
  Taro.onWindowResize?.(measure)
})

onUnmounted(() => {
  timers.forEach(clearTimeout)
  Taro.offWindowResize?.(measure)
})

const items = [
  {
    key: 'home',
    text: '首页',
    url: '/pages/index/index',
    icon: homeIcon,
    activeIcon: homeActiveIcon
  },
  {
    key: 'notice',
    text: '公告',
    url: '/pages/notice/list',
    icon: noticeIcon,
    activeIcon: noticeActiveIcon
  },
  {
    key: 'profile',
    text: '我的',
    url: '/pages/profile/index',
    icon: profileIcon,
    activeIcon: profileActiveIcon
  }
]

const go = (item) => {
  if (item.key === props.active) return
  Taro.reLaunch({ url: item.url })
}
</script>

<style scoped lang="scss">
.tabbar-wrap {
  width: 100%;
}

/* 测量完成前先用兜底高度，宁可多留一点，也不会遮住内容 */
.tabbar-spacer {
  height: calc(#{$tabbar-height} + env(safe-area-inset-bottom));
}

.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: $z-tabbar;
  display: flex;
  background: $color-surface;
  border-top: 1rpx solid #eeeeee;
  padding: $space-xs 0;
  padding-bottom: calc(#{$space-xs} + env(safe-area-inset-bottom));
}

.tabbar-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.tabbar-icon {
  width: 44rpx;
  height: 44rpx;
}

.tabbar-text {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: $font-xs;
  color: $color-text-muted;
  line-height: 1.4;
}

.tabbar-text.active {
  color: $color-primary;
}
</style>
