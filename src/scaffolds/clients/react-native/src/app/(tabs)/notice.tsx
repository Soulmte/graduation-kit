import { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Card, Input, Spinner, Text, TextField } from 'heroui-native'
import { pageQueryNotice } from '@/api/notice'
import type { Notice } from '@/api/notice'
import { palette } from '@/theme/colors'
import Screen from '@/components/Screen'
import AppButton from '@/components/AppButton'

const PAGE_SIZE = 10

const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()

/**
 * 公告列表：搜索 + 下拉刷新 + 滚动到底加载下一页
 */
export default function NoticePage() {
  const [items, setItems] = useState<Notice[]>([])
  const [keyword, setKeyword] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPage = useCallback(
    async (page: number, replace: boolean) => {
      if (replace) setRefreshing(true)
      else setLoading(true)
      try {
        const res: any = await pageQueryNotice({
          pageNum: page,
          pageSize: PAGE_SIZE,
          title: keyword || undefined
        })
        const records: Notice[] = res.data?.records || []
        setItems((prev) => (replace ? records : [...prev, ...records]))
        setTotal(res.data?.total || 0)
        setPageNum(page)
      } catch {
        if (replace) setItems([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [keyword]
  )

  useEffect(() => {
    fetchPage(1, true)
  }, [fetchPage])

  const hasMore = items.length < total
  const reachedEnd = (offsetY: number, height: number, layoutHeight: number) =>
    offsetY + layoutHeight >= height - 80

  return (
    <Screen>
      <View className="p-4 pb-2">
        <TextField>
          <Input
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索公告标题"
            returnKeyType="search"
            onSubmitEditing={() => fetchPage(1, true)}
          />
        </TextField>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPage(1, true)}
            tintColor={palette.accent}
          />
        }
        onScroll={({ nativeEvent }) => {
          if (loading || refreshing || !hasMore) return
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent
          if (reachedEnd(contentOffset.y, contentSize.height, layoutMeasurement.height)) {
            fetchPage(pageNum + 1, false)
          }
        }}
        scrollEventThrottle={200}
      >
        {items.length === 0 && !refreshing ? (
          <Text type="body-sm" color="muted" align="center" className="py-10">
            暂无公告
          </Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/notice/${item.id}`)}
              className="active:opacity-70"
            >
              <Card>
                <Card.Header>
                  <Card.Title className="w-full">{item.title}</Card.Title>
                  <Card.Description>{item.createTime}</Card.Description>
                </Card.Header>
                <Card.Body>
                  <Text type="body-sm" color="muted" truncate>
                    {stripHtml(item.content)}
                  </Text>
                </Card.Body>
              </Card>
            </Pressable>
          ))
        )}

        {loading ? (
          <View className="py-6 items-center">
            <Spinner />
          </View>
        ) : hasMore && items.length > 0 ? (
          <AppButton variant="ghost" size="sm" onPress={() => fetchPage(pageNum + 1, false)}>
            加载更多
          </AppButton>
        ) : items.length > 0 ? (
          <Text type="body-xs" color="muted" align="center" className="py-4">
            共 {total} 条，已全部加载
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
