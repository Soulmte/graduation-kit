import { ScrollView, View } from 'react-native'
import { Card, Separator, Text } from 'heroui-native'
import { APP_NAME, APP_VERSION, BASE_URL } from '@/config'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text type="body-sm" color="muted">
        {label}
      </Text>
      <Text type="body-sm" className="flex-1 text-right">
        {value}
      </Text>
    </View>
  )
}

/**
 * 关于应用（二级页面）
 */
export default function AboutPage() {
  return (
    <ScrollView className="page" contentContainerClassName="page-content">
      <Card>
        <Card.Body className="items-center gap-2 py-5">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Text type="h4" className="text-accent-foreground">
              S
            </Text>
          </View>
          <Text type="h5">{APP_NAME}</Text>
          <Text type="body-xs" color="muted">
            版本 {APP_VERSION}
          </Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="w-full">技术栈</Card.Title>
        </Card.Header>
        <Card.Body className="gap-3">
          <InfoRow label="框架" value="Expo SDK 58 / React Native 0.88" />
          <Separator />
          <InfoRow label="路由" value="expo-router" />
          <Separator />
          <InfoRow label="组件库" value="HeroUI Native" />
          <Separator />
          <InfoRow label="样式" value="Uniwind（Tailwind CSS）" />
          <Separator />
          <InfoRow label="状态" value="zustand + AsyncStorage" />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="w-full">接口地址</Card.Title>
          <Card.Description>来自项目根目录 .env</Card.Description>
        </Card.Header>
        <Card.Body>
          <Text type="code">{BASE_URL}</Text>
        </Card.Body>
      </Card>

      <Text type="body-xs" color="muted" align="center">
        毕业设计脚手架 · 仅供学习使用
      </Text>

      <View className="h-6" />
    </ScrollView>
  )
}
