/**
 * 根布局
 * - PaperProvider 注入主题
 * - SafeAreaProvider 处理刘海/状态栏
 * - Stack 全局导航
 */
import { Stack } from 'expo-router'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { paperTheme } from '@/styles/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="main" />
          <Stack.Screen name="notice/[id]" options={{ headerShown: true, title: '公告详情' }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
