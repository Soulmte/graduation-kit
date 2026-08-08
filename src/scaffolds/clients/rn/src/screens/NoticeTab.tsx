/**
 * 公告 Tab: 分页列表
 */
import { useCallback, useEffect, useState } from 'react'
import { View, FlatList, RefreshControl, Pressable } from 'react-native'
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper'
import { router } from 'expo-router'
import { pageQueryNotice } from '@/api/notice'
import type { Notice } from '@/api/notice'
import { gs } from '@/styles/global'
import { colors, spacing } from '@/styles/theme'

const PAGE_SIZE = 10

// 简单的 HTML 标签剥离, 用于列表预览
const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()

export default function NoticeTab() {
  const [items, setItems] = useState<Notice[]>([])
  const [keyword, setKeyword] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = useCallback(async (page: number, replace: boolean) => {
    if (replace) setRefreshing(true); else setLoading(true)
    try {
      const res: any = await pageQueryNotice({ pageNum: page, pageSize: PAGE_SIZE, title: keyword || undefined })
      const records = res.data?.records || []
      setItems(prev => (replace ? records : [...prev, ...records]))
      setTotal(res.data?.total || 0)
      setPageNum(page)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [keyword])

  useEffect(() => { fetch(1, true) }, [keyword])

  const onEndReached = () => {
    if (loading || refreshing) return
    if (items.length >= total) return
    fetch(pageNum + 1, false)
  }

  return (
    <View style={gs.screen}>
      <View style={{ padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Searchbar
          placeholder="搜索公告标题"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => fetch(1, true)}
          mode="bar"
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(1, true)} />}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        ListEmptyComponent={
          !loading && !refreshing
            ? <Text style={[gs.textMute, { textAlign: 'center', marginTop: spacing.xxl }]}>暂无公告</Text>
            : null
        }
        ListFooterComponent={
          loading && items.length > 0
            ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} />
            : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/notice/${item.id}`)}
            android_ripple={{ color: colors.bgHover }}
          >
            <View style={gs.noticeItem}>
              <Text style={gs.noticeTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={gs.noticeContent} numberOfLines={2}>{stripHtml(item.content)}</Text>
              <Text style={gs.noticeTime}>{item.createTime}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  )
}
