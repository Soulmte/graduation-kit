<template>
  <n-config-provider
    :theme="isDark ? darkTheme : null"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <global-api />
            <router-view />
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { provide, ref, watchEffect } from 'vue'
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  darkTheme,
  zhCN,
  dateZhCN
} from 'naive-ui'
import GlobalApi from '@/components/GlobalApi.vue'

// 暗色模式状态(持久化到 localStorage)
const isDark = ref(localStorage.getItem('theme') === 'dark')

// 切换函数, 供子组件调用
const toggleDark = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 给 html 加 dark 类, global.css 里的 html.dark 会覆盖所有 --color-* 变量
// 这样自定义的 .a-* / .u-* 样式能和 naive 组件一起切换
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
})

// 通过 provide 让任何子组件都能拿到
provide('isDark', isDark)
provide('toggleDark', toggleDark)

// 绿色主题覆盖(亮暗通用)
const themeOverrides = {
  common: {
    primaryColor: '#18a058FF',
    primaryColorHover: '#36ad6aFF',
    primaryColorPressed: '#0c7a43FF',
    primaryColorSuppl: '#36ad6aFF',
    successColor: '#18a058FF',
    borderRadius: '6px',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif"
  },
  Menu: {
    itemColorActive: 'rgba(24, 160, 88, 0.1)',
    itemColorActiveHover: 'rgba(24, 160, 88, 0.15)',
    itemColorActiveCollapsed: 'rgba(24, 160, 88, 0.1)',
    itemTextColorActive: '#18a058',
    itemTextColorActiveHover: '#18a058',
    itemIconColorActive: '#18a058',
    itemIconColorActiveHover: '#18a058'
  }
}
</script>
