/**
 * 入口分发
 * - 启动时 hydrate, 根据登录态跳转
 */
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useUserStore } from '@/store/user'
import { colors } from '@/styles/theme'

export default function Index() {
  const hydrated = useUserStore(s => s.hydrated)
  const token = useUserStore(s => s.token)
  const hydrate = useUserStore(s => s.hydrate)

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!hydrated) return
    router.replace(token ? '/main' : '/login')
  }, [hydrated, token])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPage }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}
