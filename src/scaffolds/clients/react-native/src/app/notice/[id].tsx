import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Card, Spinner, Text } from 'heroui-native'
import { getNoticeById } from '@/api/notice'
import type { Notice } from '@/api/notice'

/** 富文本公告在移动端按纯文本展示，避免额外引入渲染库 */
const stripHtml = (s: string) =>
  (s || '')
    .replace(/<\/?p[^>]*>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()

export default function NoticeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [data, setData] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getNoticeById(id)
      .then((res: any) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    )
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text type="body-sm" color="muted">
          公告不存在或已删除
        </Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-4">
      <Card>
        <Card.Header>
          <Card.Title className="w-full">{data.title}</Card.Title>
          <Card.Description>发布于 {data.createTime}</Card.Description>
        </Card.Header>
        <Card.Body>
          <Text type="body">{stripHtml(data.content)}</Text>
        </Card.Body>
      </Card>
      <View className="h-6" />
    </ScrollView>
  )
}
