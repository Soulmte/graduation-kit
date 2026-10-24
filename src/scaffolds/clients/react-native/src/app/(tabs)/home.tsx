import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, Card, Spinner, Text } from 'heroui-native'
import { useUserStore } from '@/store/user'
import { listAllNotice } from '@/api/notice'
import type { Notice } from '@/api/notice'
import { palette } from '@/theme/colors'
import { APP_NAME } from '@/config'
import Screen from '@/components/Screen'
import AppButton from '@/components/AppButton'

const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()

/**
 * 首页：欢迎卡片 + 账号信息 + 最新公告
 */
export default function HomePage() {
  const userInfo = useUserStore((s) => s.userInfo)
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await listAllNotice()
      setNotices((res.data || []).slice(0, 3))
    } catch {
      setNotices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const name = userInfo?.nickname || userInfo?.username || '同学'

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={palette.accent} />
        }
      >
      <View className="rounded-3xl bg-accent p-5 gap-1">
        <Text type="body-sm" className="text-accent-foreground/80">
          欢迎回来
        </Text>
        <Text type="h3" className="text-accent-foreground">
          {name}
        </Text>
        <Text type="body-xs" className="text-accent-foreground/70">
          {APP_NAME}
        </Text>
      </View>

      <Card>
        <Card.Header>
          <Avatar size="md">
            <Avatar.Fallback>{name.slice(0, 1).toUpperCase()}</Avatar.Fallback>
          </Avatar>
          <Card.Title className="w-full">{name}</Card.Title>
          <Card.Description>
            {userInfo?.role === 'admin' ? '管理员' : '普通用户'}
          </Card.Description>
        </Card.Header>
        <Card.Body className="gap-2">
          <View className="flex-row justify-between">
            <Text type="body-sm" color="muted">
              手机号
            </Text>
            <Text type="body-sm">{userInfo?.phone || '未填写'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text type="body-sm" color="muted">
              邮箱
            </Text>
            <Text type="body-sm">{userInfo?.email || '未填写'}</Text>
          </View>
        </Card.Body>
        <Card.Footer>
          <AppButton variant="secondary" size="sm" onPress={() => router.push('/profile')}>
            去完善资料
          </AppButton>
        </Card.Footer>
      </Card>

      <View className="flex-row items-center justify-between mt-2">
        <Text type="h5">最新公告</Text>
        <Text type="body-sm" className="text-accent" onPress={() => router.push('/notice')}>
          查看全部
        </Text>
      </View>

      {loading && notices.length === 0 ? (
        <View className="py-10 items-center">
          <Spinner />
        </View>
      ) : notices.length === 0 ? (
        <Text type="body-sm" color="muted" align="center" className="py-8">
          暂无公告
        </Text>
      ) : (
        notices.map((notice) => (
          <Pressable
            key={notice.id}
            onPress={() => router.push(`/notice/${notice.id}`)}
            className="active:opacity-70"
          >
            <Card>
              <Card.Header>
                <Card.Title className="w-full">{notice.title}</Card.Title>
                <Card.Description>{notice.createTime}</Card.Description>
              </Card.Header>
              <Card.Body>
                <Text type="body-sm" color="muted" truncate>
                  {stripHtml(notice.content)}
                </Text>
              </Card.Body>
            </Card>
          </Pressable>
        ))
      )}

      <View className="h-6" />
      </ScrollView>
    </Screen>
  )
}
