<template>
  <el-container class="a-layout">
    <el-aside :width="collapsed ? 'var(--w-sider-mini)' : 'var(--w-sider)'" class="a-sider">
      <div class="a-logo">
        <span class="a-logo-mark">S</span>
        <span v-if="!collapsed">后台管理</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        :collapse-transition="false"
        class="a-menu"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/admin/user">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/notice">
          <el-icon><Bell /></el-icon>
          <template #title>公告管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/log">
          <el-icon><Document /></el-icon>
          <template #title>日志管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/status">
          <el-icon><Monitor /></el-icon>
          <template #title>系统状态</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="a-body">
      <el-header class="a-header">
        <div class="a-header-left">
          <el-icon class="a-trigger" @click="collapsed = !collapsed">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
          <span class="a-breadcrumb">管理控制台</span>
        </div>
        <el-dropdown trigger="click">
          <div class="a-user">
            <el-avatar :size="32" :src="userStore.userInfo?.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="a-user-name">
              {{ userStore.userInfo?.nickname || userStore.userInfo?.username || '未登录' }}
            </span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/admin/profile')">
                <el-icon><User /></el-icon> 个人中心
              </el-dropdown-item>
              <el-dropdown-item @click="router.push('/user/home')">
                <el-icon><HomeFilled /></el-icon> 用户端
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="a-content">
        <router-view />
      </el-main>

      <el-footer class="a-footer-slot">
        <app-footer />
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Odometer,
  User,
  Bell,
  Document,
  Expand,
  Fold,
  HomeFilled,
  SwitchButton,
  Monitor
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import AppFooter from '@/components/AppFooter.vue'
import '@/styles/admin.css'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const collapsed = ref(false)

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('退出成功')
  router.push('/login')
}
</script>
