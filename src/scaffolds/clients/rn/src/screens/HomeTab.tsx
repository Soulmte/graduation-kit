/**
 * 首页 Tab
 */
import { useEffect, useState } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper'
import { useUserStore } from '@/store/user'
import { listAllNotice } from '@/api/notice'
import type { Notice } from '@/api/notice'
import { gs } from '@/styles/global'
import { colors, spacing } from '@/styles/theme'
import { APP_NAME } from '@/config'

export default function HomeTab() {
  const userInfo = useUserStore(s => s.userInfo)
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await listAllNotice()
      setNotices((res.data || []).slice(0, 3))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <ScrollView
      style={gs.screen}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {/* Banner */}
      <View style={gs.banner}>
        <Text style={gs.bannerTitle}>欢迎回来</Text>
        <Text style={gs.bannerSub}>{userInfo?.nickname || userInfo?.username || ''}</Text>
        <Text style={[gs.bannerSub, { fontSize: 13, marginTop: 4 }]}>{APP_NAME}</Text>
      </View>

      {/* 个人卡片 */}
      <Card style={[gs.card, { marginHorizontal: spacing.lg }]}>
        <Card.Title
          title={userInfo?.nickname || userInfo?.username}
          subtitle={userInfo?.role === 'admin' ? '管理员' : '普通用户'}
          left={(props) => (
            <Avatar.Text {...props}
              label={(userInfo?.nickname || userInfo?.username || 'U').slice(0, 1).toUpperCase()}
              style={{ backgroundColor: colors.primary }}
            />
          )}
        />
      </Card>

      {/* 最新公告 */}
      <View style={[gs.row, { marginTop: spacing.lg, marginHorizontal: spacing.lg, justifyContent: 'space-between' }]}>
        <Text style={[gs.text, { fontWeight: '600', fontSize: 16 }]}>最新公告</Text>
      </View>

      {loading && notices.length === 0 ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
      ) : notices.length === 0 ? (
        <Text style={[gs.textMute, { textAlign: 'center', marginTop: spacing.xl }]}>暂无公告</Text>
      ) : (
        notices.map(n => (
          <View key={n.id} style={gs.noticeItem}>
            <Text style={gs.noticeTitle} numberOfLines={1}>{n.title}</Text>
            <Text style={gs.noticeTime}>{n.createTime}</Text>
          </View>
        ))
      )}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  )
}
