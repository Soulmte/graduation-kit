import { Pressable, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text } from 'heroui-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '@/theme/colors'

const TABS = [
  { path: '/home', label: '首页', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { path: '/notice', label: '公告', icon: 'bullhorn-outline', activeIcon: 'bullhorn' },
  { path: '/profile', label: '我的', icon: 'account-outline', activeIcon: 'account' }
] as const

/**
 * 底部导航栏
 * 外观（分割线、间距、字号、选中色）定义在 src/theme/tabbar.css，
 * 这里只负责：判断当前路由、切换页面、底部安全区留白。
 */
export default function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View className="tabbar" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {TABS.map((tab) => {
        const active = pathname === tab.path

        return (
          <Pressable
            key={tab.path}
            className="tabbar__item"
            onPress={() => router.replace(tab.path)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <MaterialCommunityIcons
              name={active ? tab.activeIcon : tab.icon}
              size={24}
              color={active ? palette.accent : palette.muted}
            />
            <Text className={active ? 'tabbar__label tabbar__label--active' : 'tabbar__label tabbar__label--idle'}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
