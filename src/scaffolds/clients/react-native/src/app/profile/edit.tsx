import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Avatar, Card, FieldError, Input, Label, Text, TextField } from 'heroui-native'
import { useUserStore } from '@/store/user'
import { getUserById, updateUser } from '@/api/user'
import { uploadImage } from '@/api/file'
import { STATIC_BASE } from '@/config'
import AppButton from '@/components/AppButton'
import { showToast } from '@/components/AppToast'

const PHONE_REG = /^1[3-9]\d{9}$/
const EMAIL_REG = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/

const GENDERS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
] as const

/**
 * 个人资料（二级页面）
 * 从「我的」进入，负责头像与资料编辑；提交后回写全局 store。
 */
export default function ProfileEditPage() {
  const userInfo = useUserStore((s) => s.userInfo)
  const setUserInfo = useUserStore((s) => s.setUserInfo)
  const [uploading, setUploading] = useState(false)
  const [nickname, setNickname] = useState(userInfo?.nickname || '')
  const [age, setAge] = useState(userInfo?.age ? String(userInfo.age) : '')
  const [gender, setGender] = useState(userInfo?.gender || '')
  const [phone, setPhone] = useState(userInfo?.phone || '')
  const [email, setEmail] = useState(userInfo?.email || '')
  const [saving, setSaving] = useState(false)

  const phoneError = phone && !PHONE_REG.test(phone) ? '请输入有效的 11 位手机号' : ''
  const emailError = email && !EMAIL_REG.test(email) ? '邮箱格式不正确' : ''
  const ageError = age && (!/^\d+$/.test(age) || +age < 1 || +age > 150) ? '年龄 1-150' : ''

  const avatarUrl = userInfo?.avatar
    ? userInfo.avatar.startsWith('http')
      ? userInfo.avatar
      : `${STATIC_BASE}${userInfo.avatar}`
    : ''

  const save = async () => {
    if (!userInfo) return
    if (phoneError || emailError || ageError) {
      showToast('warning', '请检查输入内容')
      return
    }

    setSaving(true)
    try {
      await updateUser({
        id: userInfo.id,
        nickname: nickname || undefined,
        age: age ? +age : undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        email: email || undefined
      })
      const res: any = await getUserById(userInfo.id)
      if (res.data) await setUserInfo(res.data)
      showToast('success', '保存成功')
    } catch {
      // 失败提示由 request 拦截器统一弹出
    } finally {
      setSaving(false)
    }
  }

  const pickAvatar = async () => {
    if (!userInfo || uploading) return

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        showToast('warning', '没有相册权限，请到系统设置里开启')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      })
      if (result.canceled || !result.assets?.length) return

      const asset = result.assets[0]
      if (__DEV__) console.log('[avatar] picked', asset.uri, asset.mimeType, asset.fileSize)

      setUploading(true)
      const uploaded = await uploadImage(asset)
      if (__DEV__) console.log('[avatar] uploaded', uploaded.url)

      await updateUser({ id: userInfo.id, avatar: uploaded.url })
      const res: any = await getUserById(userInfo.id)
      if (res.data) await setUserInfo(res.data)
      showToast('success', '头像已更新')
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      if (__DEV__) console.warn('[avatar] failed', message)
      showToast('error', '头像上传失败', message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollView className="page" contentContainerClassName="page-content">
      <Card>
        <Card.Body className="items-center gap-3 py-4">
          <Pressable onPress={pickAvatar}>
            <Avatar size="lg">
              {avatarUrl ? <Avatar.Image source={{ uri: avatarUrl }} /> : null}
              <Avatar.Fallback>
                {(userInfo?.nickname || userInfo?.username || 'U').slice(0, 1).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
          </Pressable>
          <Text type="body-xs" color="muted">
            {uploading ? '头像上传中…' : '点击头像更换'}
          </Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="w-full">基本资料</Card.Title>
        </Card.Header>
        <Card.Body className="gap-4">
          <TextField>
            <Label>昵称</Label>
            <Input value={nickname} onChangeText={setNickname} placeholder="请输入昵称" />
          </TextField>

          <TextField isInvalid={!!ageError}>
            <Label>年龄</Label>
            <Input
              value={age}
              onChangeText={(v) => setAge(v.replace(/\D/g, ''))}
              placeholder="请输入年龄"
              keyboardType="number-pad"
              maxLength={3}
              isInvalid={!!ageError}
            />
            {!!ageError && <FieldError>{ageError}</FieldError>}
          </TextField>

          <View className="gap-2">
            <Label>性别</Label>
            <View className="flex-row gap-2">
              {GENDERS.map((item) => (
                <AppButton
                  key={item.value}
                  size="sm"
                  variant={gender === item.value ? 'primary' : 'secondary'}
                  onPress={() => setGender(gender === item.value ? '' : item.value)}
                >
                  {item.label}
                </AppButton>
              ))}
            </View>
          </View>

          <TextField isInvalid={!!phoneError}>
            <Label>手机号</Label>
            <Input
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D/g, ''))}
              placeholder="请输入手机号"
              keyboardType="number-pad"
              maxLength={11}
              isInvalid={!!phoneError}
            />
            {!!phoneError && <FieldError>{phoneError}</FieldError>}
          </TextField>

          <TextField isInvalid={!!emailError}>
            <Label>邮箱</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱"
              keyboardType="email-address"
              autoCapitalize="none"
              isInvalid={!!emailError}
            />
            {!!emailError && <FieldError>{emailError}</FieldError>}
          </TextField>
        </Card.Body>
      </Card>

      <AppButton onPress={save} isDisabled={saving} size="lg">
        {saving ? '保存中…' : '保存修改'}
      </AppButton>

      <View className="h-6" />
    </ScrollView>
  )
}
