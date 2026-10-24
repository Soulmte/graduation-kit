import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import type { ComponentProps } from 'react'
import { router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Avatar, Card, ListGroup, Text } from 'heroui-native'
import { useUserStore } from '@/store/user'
import { palette } from '@/theme/colors'
import { STATIC_BASE } from '@/config'
import Screen from '@/components/Screen'
import AppButton from '@/components/AppButton'
import ConfirmDialog from '@/components/ConfirmDialog'
import { showToast } from '@/components/AppToast'

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

/** 只放和当前用户相关的入口，具体操作一律进二级页面 */
const MENU: { icon: IconName; title: string; description: string; href: string }[] = [
  {
    icon: 'account-edit-outline',
    title: '个人资料',
    description: '头像、昵称、手机号、邮箱',
    href: '/profile/edit'
  },
  {
    icon: 'lock-reset',
    title: '修改密码',
    description: '改完需要用新密码重新登录',
    href: '/profile/password'
  },
  {
    icon: 'file-document-outline',
    title: '用户协议',
    description: '使用条款与免责说明',
    href: '/profile/agreement?type=user'
  },
  {
    icon: 'shield-lock-outline',
    title: '隐私政策',
    description: '我们收集哪些信息、怎么用',
    href: '/profile/agreement?type=privacy'
  },
  {
    icon: 'information-outline',
    title: '关于应用',
    description: '版本、技术栈与接口地址',
    href: '/profile/about'
  }
]

/**
 * 我的（一级页面）
 * 这里只做「导航 + 概览」：展示用户身份，把编辑动作全部放到二级页面。
 */
export default function ProfilePage() {
  const userInfo = useUserStore((s) => s.userInfo)
  const logout = useUserStore((s) => s.logout)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const name = userInfo?.nickname || userInfo?.username || '未登录'
  const isAdmin = userInfo?.role === 'admin'
  const avatarUrl = userInfo?.avatar
    ? userInfo.avatar.startsWith('http')
      ? userInfo.avatar
      : `${STATIC_BASE}${userInfo.avatar}`
    : ''

  const confirmLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      setLogoutOpen(false)
      router.replace('/login')
      showToast('success', '已退出登录')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerClassName="page-content">
        <Card>
          <Card.Body className="gap-3">
            <View className="flex-row items-center gap-3">
              <Avatar size="lg">
                {avatarUrl ? <Avatar.Image source={{ uri: avatarUrl }} /> : null}
                <Avatar.Fallback>{name.slice(0, 1).toUpperCase()}</Avatar.Fallback>
              </Avatar>
              <View className="flex-1 gap-1">
                <Text type="h5">{name}</Text>
                <Text type="body-xs" color="muted">
                  {isAdmin ? '管理员' : '普通用户'} · {userInfo?.username || '-'}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between rounded-xl bg-surface-secondary px-4 py-3">
              <View className="items-center gap-1">
                <Text type="body-xs" color="muted">
                  手机号
                </Text>
                <Text type="body-sm">{userInfo?.phone || '未填写'}</Text>
              </View>
              <View className="items-center gap-1">
                <Text type="body-xs" color="muted">
                  性别
                </Text>
                <Text type="body-sm">
                  {userInfo?.gender === 'male'
                    ? '男'
                    : userInfo?.gender === 'female'
                      ? '女'
                      : userInfo?.gender === 'other'
                        ? '其他'
                        : '未填写'}
                </Text>
              </View>
              <View className="items-center gap-1">
                <Text type="body-xs" color="muted">
                  年龄
                </Text>
                <Text type="body-sm">{userInfo?.age ?? '未填写'}</Text>
              </View>
            </View>
          </Card.Body>
        </Card>

        <ListGroup>
          {MENU.map((item) => (
            <ListGroup.Item key={item.href} onPress={() => router.push(item.href)}>
              <ListGroup.ItemPrefix>
                <MaterialCommunityIcons name={item.icon} size={20} color={palette.accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{item.title}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{item.description}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <AppButton variant="danger-soft" size="lg" onPress={() => setLogoutOpen(true)}>
          退出登录
        </AppButton>

        <ConfirmDialog
          isOpen={logoutOpen}
          title="退出登录"
          description="退出后需要重新输入用户名和密码才能继续使用。"
          confirmText="退出"
          danger
          loading={loggingOut}
          onConfirm={confirmLogout}
          onCancel={() => setLogoutOpen(false)}
        />

        <View className="h-6" />
      </ScrollView>
    </Screen>
  )
}
