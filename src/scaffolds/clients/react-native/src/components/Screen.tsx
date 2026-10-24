import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * 页面外壳
 * 统一留出顶部状态栏高度，避免标题被手机的时间、电量、摄像头遮住。
 * 底部留白交给各页面自己处理（带底部导航的页面由导航栏负责）。
 */
export default function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {children}
    </View>
  )
}
