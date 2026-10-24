import { View } from 'react-native'
import { Slot } from 'expo-router'
import BottomTabBar from '@/components/BottomTabBar'

/**
 * 底部 Tab 的布局：上面是当前页面，下面是导航栏。
 * 三个 Tab 本身就是路由页面（home / notice / profile），不存在第二套页面目录。
 */
export default function TabsLayout() {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <Slot />
      </View>
      <BottomTabBar />
    </View>
  )
}
