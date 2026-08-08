/**
 * 我的 Tab
 * - 显示个人信息
 * - 编辑昵称/年龄/性别/手机/邮箱
 * - 头像上传
 * - 退出登录
 */
import { useState } from 'react'
import { View, ScrollView, Image, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import {
  Text, Card, Avatar, Button, TextInput, HelperText,
  Snackbar, SegmentedButtons, Divider, ActivityIndicator
} from 'react-native-paper'
import { useUserStore } from '@/store/user'
import { updateUser, getUserById } from '@/api/user'
import { uploadImage } from '@/api/file'
import { gs } from '@/styles/global'
import { colors, spacing } from '@/styles/theme'
import { STATIC_BASE, APP_VERSION } from '@/config'

const PHONE_REG = /^1[3-9]\d{9}$/
const EMAIL_REG = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/

export default function ProfileTab() {
  const userInfo = useUserStore(s => s.userInfo)
  const setUserInfo = useUserStore(s => s.setUserInfo)
  const logout = useUserStore(s => s.logout)

  const [nickname, setNickname] = useState(userInfo?.nickname || '')
  const [age, setAge] = useState(userInfo?.age ? String(userInfo.age) : '')
  const [gender, setGender] = useState(userInfo?.gender || '')
  const [phone, setPhone] = useState(userInfo?.phone || '')
  const [email, setEmail] = useState(userInfo?.email || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [snack, setSnack] = useState('')

  const phoneError = phone && !PHONE_REG.test(phone) ? '请输入有效的 11 位手机号' : ''
  const emailError = email && !EMAIL_REG.test(email) ? '邮箱格式不正确' : ''
  const ageError = age && (!/^\d+$/.test(age) || +age < 1 || +age > 150) ? '年龄 1-150' : ''

  const handleSave = async () => {
    if (!userInfo) return
    if (phoneError || emailError || ageError) { setSnack('请检查输入'); return }
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
      // 刷新 userInfo
      const res: any = await getUserById(userInfo.id)
      if (res.data) await setUserInfo(res.data)
      setSnack('保存成功')
    } finally {
      setSaving(false)
    }
  }

  const handlePickAvatar = async () => {
    if (!userInfo) return
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setSnack('请先授予相册权限')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    })
    if (result.canceled || !result.assets?.[0]) return

    setUploading(true)
    try {
      const data = await uploadImage(result.assets[0])
      await updateUser({ id: userInfo.id, avatar: data.url })
      const res: any = await getUserById(userInfo.id)
      if (res.data) await setUserInfo(res.data)
      setSnack('头像更新成功')
    } catch (e: any) {
      setSnack(e?.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗?', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定', style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/login')
        }
      }
    ])
  }

  if (!userInfo) {
    return (
      <View style={[gs.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const avatarUrl = userInfo.avatar
    ? (userInfo.avatar.startsWith('http') ? userInfo.avatar : `${STATIC_BASE}${userInfo.avatar}`)
    : ''

  return (
    <ScrollView style={gs.screen} keyboardShouldPersistTaps="handled">
      {/* 顶部头像区 */}
      <View style={[gs.banner, { alignItems: 'center', paddingVertical: spacing.xl }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#fff' }} />
        ) : (
          <Avatar.Text
            size={80}
            label={(userInfo.nickname || userInfo.username).slice(0, 1).toUpperCase()}
            style={{ backgroundColor: '#fff' }}
            labelStyle={{ color: colors.primary, fontSize: 32 }}
          />
        )}
        <Text style={[gs.bannerTitle, { fontSize: 18, marginTop: spacing.md }]}>{userInfo.nickname || userInfo.username}</Text>
        <Text style={gs.bannerSub}>{userInfo.role === 'admin' ? '管理员' : '普通用户'}</Text>
        <Button
          mode="outlined"
          onPress={handlePickAvatar}
          loading={uploading}
          disabled={uploading}
          icon="camera"
          textColor="#fff"
          style={{ marginTop: spacing.md, borderColor: '#fff' }}
        >
          更换头像
        </Button>
      </View>

      {/* 资料编辑 */}
      <Card style={[gs.card, { marginHorizontal: spacing.lg }]}>
        <Card.Title title="个人资料" />
        <Card.Content>
          <TextInput
            label="用户名"
            value={userInfo.username}
            mode="outlined"
            disabled
            style={gs.formField}
          />
          <TextInput
            label="昵称"
            value={nickname}
            onChangeText={setNickname}
            mode="outlined"
            style={gs.formField}
          />
          <TextInput
            label="年龄"
            value={age}
            onChangeText={v => setAge(v.replace(/\D/g, ''))}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={3}
            error={!!ageError}
            style={gs.formField}
          />
          {!!ageError && <HelperText type="error">{ageError}</HelperText>}

          <Text style={gs.fieldLabel}>性别</Text>
          <SegmentedButtons
            value={gender}
            onValueChange={setGender}
            buttons={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'other', label: '其他' }
            ]}
            style={gs.formField}
          />

          <TextInput
            label="手机号"
            value={phone}
            onChangeText={v => setPhone(v.replace(/\D/g, ''))}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={11}
            error={!!phoneError}
            style={gs.formField}
          />
          {!!phoneError && <HelperText type="error">{phoneError}</HelperText>}

          <TextInput
            label="邮箱"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            style={gs.formField}
          />
          {!!emailError && <HelperText type="error">{emailError}</HelperText>}

          <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ marginTop: spacing.md }}>
            保存修改
          </Button>
        </Card.Content>
      </Card>

      {/* 关于与登出 */}
      <Card style={[gs.card, { marginHorizontal: spacing.lg }]}>
        <Card.Content>
          <View style={gs.rowSpace}>
            <Text style={gs.text}>注册时间</Text>
            <Text style={gs.textMute}>{userInfo.createTime || '-'}</Text>
          </View>
          <Divider style={{ marginVertical: spacing.sm }} />
          <View style={gs.rowSpace}>
            <Text style={gs.text}>客户端版本</Text>
            <Text style={gs.textMute}>v{APP_VERSION}</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xxl }}>
        <Button mode="outlined" icon="logout" textColor={colors.danger} onPress={handleLogout}>
          退出登录
        </Button>
      </View>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2000}>{snack}</Snackbar>
    </ScrollView>
  )
}
