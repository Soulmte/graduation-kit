/**
 * 公告详情(动态路由 /notice/:id)
 */
import { useEffect, useState } from 'react'
import { View, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Text, ActivityIndicator, Card } from 'react-native-paper'
import { getNoticeById } from '@/api/notice'
import type { Notice } from '@/api/notice'
import { gs } from '@/styles/global'
import { colors, spacing, fontSize } from '@/styles/theme'

// 简易 HTML 渲染: 剥标签后纯文本展示(避免引入 react-native-render-html 等额外库)
const stripHtml = (s: string) => (s || '').replace(/<\/?p[^>]*>/g, '\n').replace(/<br\s*\/?>(?:\s*)/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [data, setData] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getNoticeById(id)
      .then((res: any) => setData(res.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View style={[gs.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!data) {
    return (
      <View style={[gs.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={gs.textMute}>公告不存在</Text>
      </View>
    )
  }

  return (
    <ScrollView style={gs.screen}>
      <Card style={[gs.card, { marginHorizontal: spacing.lg }]}>
        <Card.Content>
          <Text style={[gs.text, { fontSize: fontSize.xl, fontWeight: '700' }]}>{data.title}</Text>
          <Text style={[gs.textMute, { marginTop: spacing.sm }]}>
            发布于 {data.createTime}
            {data.updateTime && data.updateTime !== data.createTime ? `  ·  更新于 ${data.updateTime}` : ''}
          </Text>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
          <Text style={[gs.text, { lineHeight: 24 }]}>{stripHtml(data.content)}</Text>
        </Card.Content>
      </Card>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  )
}
