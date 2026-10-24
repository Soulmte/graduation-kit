import '../../global.css'

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { HeroUINativeProvider } from 'heroui-native'
import { Uniwind } from 'uniwind'
import { ToastHost } from '@/components/AppToast'
import { APP_FONT, useAppFonts } from '@/theme/fonts'

// 毕设要求首屏浅色，固定亮色主题，不跟随系统的深色模式。
Uniwind.setTheme('light')

/**
 * 根布局：全局只做五件事——字体、手势容器、安全区、HeroUI 主题、路由栈。
 *
 * GestureHandlerRootView 必须是最外层，否则弹层/滑动手势失效。
 * textProps 关掉字体缩放：系统的「超大字号」会把按钮文字挤到换行。
 * 字族则由 theme/typography.css 统一锁定为内置字体，两者缺一不可。
 */
export default function RootLayout() {
  // 字体从安装包读，正常只要几毫秒；读失败也放行，避免白屏卡死。
  const [fontsLoaded, fontError] = useAppFonts()

  if (!fontsLoaded && !fontError) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider
          config={{
            textProps: { allowFontScaling: false },
            textInputProps: { allowFontScaling: false }
          }}
        >
          <StatusBar style="dark" />
          <ToastHost />
          <Stack
            id="root"
            screenOptions={{
              headerShown: false,
              // 二级页的导航栏是原生头，CSS 管不到，只能在这里单独指定字族。
              headerTitleStyle: { fontFamily: APP_FONT },
              headerBackTitleStyle: { fontFamily: APP_FONT }
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="notice/[id]" options={{ headerShown: true, title: '公告详情' }} />
            <Stack.Screen name="profile/edit" options={{ headerShown: true, title: '个人资料' }} />
            <Stack.Screen name="profile/password" options={{ headerShown: true, title: '修改密码' }} />
            {/* 标题在页面内按 ?type= 覆盖，这里给个兜底值 */}
            <Stack.Screen name="profile/agreement" options={{ headerShown: true, title: '用户协议' }} />
            <Stack.Screen name="profile/about" options={{ headerShown: true, title: '关于应用' }} />
          </Stack>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
