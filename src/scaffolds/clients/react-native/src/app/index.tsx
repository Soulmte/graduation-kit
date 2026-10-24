import { useEffect } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { Spinner } from 'heroui-native'
import { useUserStore } from '@/store/user'

/**
 * 启动分发：等本地登录态恢复完，再决定去登录页还是首页。
 * 这里只做跳转，不放任何界面内容。
 */
export default function IndexPage() {
  const hydrated = useUserStore((s) => s.hydrated)
  const token = useUserStore((s) => s.token)
  const hydrate = useUserStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) return
    router.replace(token ? '/home' : '/login')
  }, [hydrated, token])

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Spinner size="lg" />
    </View>
  )
}
