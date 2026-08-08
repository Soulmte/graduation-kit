/**
 * 主容器: 使用 Paper BottomNavigation 实现底部 Tab(避免 expo-router 括号目录)
 * 三个 Tab: 首页 / 公告 / 我的
 */
import { useEffect, useState } from 'react'
import { BottomNavigation } from 'react-native-paper'
import { router } from 'expo-router'
import { useUserStore } from '@/store/user'

import HomeTab from '@/screens/HomeTab'
import NoticeTab from '@/screens/NoticeTab'
import ProfileTab from '@/screens/ProfileTab'

export default function MainScreen() {
  const token = useUserStore(s => s.token)
  const hydrated = useUserStore(s => s.hydrated)

  // 未登录踢回登录页
  useEffect(() => {
    if (hydrated && !token) router.replace('/login')
  }, [hydrated, token])

  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: 'home',    title: '首页',  focusedIcon: 'home',    unfocusedIcon: 'home-outline' },
    { key: 'notice',  title: '公告',  focusedIcon: 'bell',    unfocusedIcon: 'bell-outline' },
    { key: 'profile', title: '我的',  focusedIcon: 'account', unfocusedIcon: 'account-outline' }
  ])

  const renderScene = BottomNavigation.SceneMap({
    home:    HomeTab,
    notice:  NoticeTab,
    profile: ProfileTab
  })

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      shifting={false}
    />
  )
}
