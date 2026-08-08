<template>
  <div class="a-layout">
    <aside class="a-sider" :class="{ 'is-collapsed': collapsed }">
      <div class="a-logo">
        <span class="a-logo-mark">S</span>
        <span v-if="!collapsed">后台管理</span>
      </div>
      <n-menu
        :value="route.path"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="20"
        :options="menuOptions"
        :root-indent="24"
        :indent="16"
        @update:value="(v) => router.push(v)"
      />
    </aside>

    <div class="a-body">
      <header class="a-header">
        <div class="a-header-left">
          <n-icon class="a-trigger" size="20" @click="collapsed = !collapsed">
            <MenuOutline v-if="collapsed" />
            <CloseOutline v-else />
          </n-icon>
          <span class="a-breadcrumb">管理控制台</span>
        </div>
        <div class="a-header-right">
          <n-icon class="a-trigger" size="18" @click="toggleDark">
            <SunnyOutline v-if="isDark" />
            <MoonOutline v-else />
          </n-icon>
          <n-dropdown trigger="click" :options="userMenu" @select="onUserSelect">
            <div class="a-user">
              <n-avatar
                :size="32"
                round
                :src="userStore.userInfo?.avatar || ''"
                style="flex-shrink: 0"
              />
              <span class="a-user-name">
                {{ userStore.userInfo?.nickname || userStore.userInfo?.username || '未登录' }}
              </span>
            </div>
          </n-dropdown>
        </div>
      </header>

      <div class="a-content">
        <router-view />
      </div>

      <app-footer />
    </div>
  </div>
</template>

<script setup>
import { ref, h, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NMenu, NAvatar, NDropdown, NIcon, useMessage } from 'naive-ui'
import {
  MenuOutline,
  CloseOutline,
  SpeedometerOutline,
  PeopleOutline,
  NotificationsOutline,
  DocumentTextOutline,
  PulseOutline,
  MoonOutline,
  SunnyOutline
} from '@vicons/ionicons5'
import { useUserStore } from '@/stores/user'
import AppFooter from '@/components/AppFooter.vue'
import '@/styles/admin.css'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const message = useMessage()
const collapsed = ref(false)

// 暗色模式由 App.vue provide 下来
const isDark = inject('isDark')
const toggleDark = inject('toggleDark')

const renderIcon = (icon) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptions = [
  {
    label: '仪表盘',
    key: '/admin/dashboard',
    icon: renderIcon(SpeedometerOutline)
  },
  { label: '用户管理', key: '/admin/user', icon: renderIcon(PeopleOutline) },
  {
    label: '公告管理',
    key: '/admin/notice',
    icon: renderIcon(NotificationsOutline)
  },
  {
    label: '日志管理',
    key: '/admin/log',
    icon: renderIcon(DocumentTextOutline)
  },
  { label: '系统状态', key: '/admin/status', icon: renderIcon(PulseOutline) }
]

const userMenu = [
  { label: '个人中心', key: 'profile' },
  { label: '用户端', key: 'userside' },
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout' }
]

const onUserSelect = (key) => {
  if (key === 'profile') router.push('/admin/profile')
  else if (key === 'userside') router.push('/user/home')
  else if (key === 'logout') {
    userStore.logout()
    message.success('退出成功')
    router.push('/login')
  }
}
</script>
