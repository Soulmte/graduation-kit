<template>
  <div class="u-layout">
    <header class="u-header">
      <div class="u-header-inner">
        <div class="u-logo" @click="router.push('/user/home')">
          <span class="u-logo-mark">S</span>
          <span class="u-logo-text">脚手架平台</span>
        </div>

        <n-menu
          mode="horizontal"
          :value="route.path"
          :options="menuOptions"
          class="u-nav"
          @update:value="(v) => router.push(v)"
        />

        <div class="u-actions">
          <n-icon class="u-theme-toggle" size="18" @click="toggleDark">
            <SunnyOutline v-if="isDark" />
            <MoonOutline v-else />
          </n-icon>
          <template v-if="userStore.token">
            <n-dropdown trigger="click" :options="userMenu" @select="onUserSelect">
              <div class="u-user">
                <n-avatar
                  :size="32"
                  round
                  :src="userStore.userInfo?.avatar || ''"
                  style="flex-shrink: 0"
                />
                <span class="u-user-name">
                  {{ userStore.userInfo?.nickname || userStore.userInfo?.username }}
                </span>
              </div>
            </n-dropdown>
          </template>
          <template v-else>
            <n-button text @click="router.push('/login')">登录</n-button>
            <n-button type="primary" @click="router.push('/register')">注册</n-button>
          </template>
        </div>
      </div>
    </header>

    <main class="u-content">
      <div class="u-content-inner">
        <router-view />
      </div>
    </main>

    <app-footer />
  </div>
</template>

<script setup>
import { h, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NMenu, NAvatar, NDropdown, NButton, NIcon, useMessage } from 'naive-ui'
import {
  HomeOutline,
  NotificationsOutline,
  MoonOutline,
  SunnyOutline
} from '@vicons/ionicons5'
import { useUserStore } from '@/stores/user'
import AppFooter from '@/components/AppFooter.vue'
import '@/styles/user.css'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const message = useMessage()

// 暗色模式由 App.vue provide 下来
const isDark = inject('isDark')
const toggleDark = inject('toggleDark')

const renderIcon = (icon) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptions = [
  { label: '首页', key: '/user/home', icon: renderIcon(HomeOutline) },
  {
    label: '公告',
    key: '/user/notice',
    icon: renderIcon(NotificationsOutline)
  }
]

const userMenu = [
  { label: '个人中心', key: 'profile' },
  ...(userStore.userInfo?.role === 'admin' ? [{ label: '管理后台', key: 'admin' }] : []),
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout' }
]

const onUserSelect = (key) => {
  if (key === 'profile') router.push('/user/profile')
  else if (key === 'admin') router.push('/admin/dashboard')
  else if (key === 'logout') {
    userStore.logout()
    message.success('退出成功')
    router.push('/login')
  }
}
</script>
