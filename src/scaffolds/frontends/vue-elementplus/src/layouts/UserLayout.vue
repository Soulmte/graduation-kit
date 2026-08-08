<template>
  <el-container class="u-layout" direction="vertical">
    <el-header class="u-header">
      <div class="u-header-inner">
        <div class="u-logo" @click="router.push('/user/home')">
          <span class="u-logo-mark">S</span>
          <span class="u-logo-text">脚手架平台</span>
        </div>

        <el-menu
          mode="horizontal"
          :default-active="route.path"
          :ellipsis="false"
          class="u-nav"
          router
        >
          <el-menu-item index="/user/home">
            <el-icon><HomeFilled /></el-icon>
            首页
          </el-menu-item>
          <el-menu-item index="/user/notice">
            <el-icon><Bell /></el-icon>
            公告
          </el-menu-item>
        </el-menu>

        <div class="u-actions">
          <template v-if="userStore.token">
            <el-dropdown trigger="click">
              <div class="u-user">
                <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="u-user-name">
                  {{ userStore.userInfo?.nickname || userStore.userInfo?.username }}
                </span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/user/profile')">
                    <el-icon><User /></el-icon> 个人中心
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="userStore.userInfo?.role === 'admin'"
                    @click="router.push('/admin/dashboard')"
                  >
                    <el-icon><Odometer /></el-icon> 管理后台
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button text @click="router.push('/login')">登录</el-button>
            <el-button type="primary" @click="router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-header>

    <el-main class="u-content">
      <div class="u-content-inner">
        <router-view />
      </div>
    </el-main>

    <el-footer class="u-footer-slot">
      <app-footer />
    </el-footer>
  </el-container>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, Bell, User, SwitchButton, Odometer } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import AppFooter from '@/components/AppFooter.vue'
import '@/styles/user.css'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const handleLogout = () => {
  userStore.logout()
  ElMessage.success('退出成功')
  router.push('/login')
}
</script>
