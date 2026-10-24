import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { Card, FieldError, Input, Label, Text, TextField } from 'heroui-native'
import { updatePassword } from '@/api/user'
import { useUserStore } from '@/store/user'
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll'
import AppButton from '@/components/AppButton'
import { showToast } from '@/components/AppToast'

/**
 * 修改密码（二级页面）
 *
 * 后端 PUT /user/updatePassword 只认当前登录用户，不收 userId，
 * 原密码校验失败会走统一拦截器弹出「原密码错误」。
 * 改完统一退出登录：旧 token 不再被使用，也顺带验证一次新密码能否登录。
 *
 * 表单刚好一屏，键盘弹出后没有滚动余量，用 useKeyboardAwareScroll 补留白并上滚。
 */
export default function PasswordPage() {
  const logout = useUserStore((s) => s.logout)
  const { scrollRef, revealField, keyboardSpacer } = useKeyboardAwareScroll()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const newError =
    newPassword && (newPassword.length < 6 || newPassword.length > 20)
      ? '新密码长度 6-20 位'
      : newPassword && newPassword === oldPassword
        ? '新密码不能与原密码相同'
        : ''
  const confirmError =
    confirmPassword && confirmPassword !== newPassword ? '两次输入的新密码不一致' : ''

  const submit = async () => {
    if (!oldPassword) {
      showToast('warning', '请输入原密码')
      return
    }
    if (!newPassword) {
      showToast('warning', '请输入新密码')
      return
    }
    if (newError || confirmError) {
      showToast('warning', '请检查输入内容')
      return
    }
    if (!confirmPassword) {
      showToast('warning', '请再次输入新密码')
      return
    }

    setSaving(true)
    try {
      await updatePassword({ oldPassword, newPassword })
      showToast('success', '密码已修改', '请用新密码重新登录')
      await logout()
      router.replace('/login')
    } catch {
      // 原密码错误等业务提示由 request 拦截器统一弹出
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="page"
      contentContainerClassName="page-content"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Card>
        <Card.Header>
          <Card.Title className="w-full">修改密码</Card.Title>
          <Card.Description>修改成功后会退出登录，请用新密码重新登录。</Card.Description>
        </Card.Header>
        <Card.Body className="gap-4">
          <TextField>
            <Label>原密码</Label>
            <Input
              value={oldPassword}
              onChangeText={setOldPassword}
              onFocus={revealField}
              placeholder="请输入原密码"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>

          <TextField isInvalid={!!newError}>
            <Label>新密码</Label>
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              onFocus={revealField}
              placeholder="6-20 位新密码"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              isInvalid={!!newError}
            />
            {!!newError && <FieldError>{newError}</FieldError>}
          </TextField>

          <TextField isInvalid={!!confirmError}>
            <Label>确认新密码</Label>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={revealField}
              placeholder="请再次输入新密码"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              isInvalid={!!confirmError}
            />
            {!!confirmError && <FieldError>{confirmError}</FieldError>}
          </TextField>
        </Card.Body>
      </Card>

      <AppButton size="lg" onPress={submit} isDisabled={saving}>
        {saving ? '提交中…' : '确认修改'}
      </AppButton>

      <Text type="body-xs" color="muted" align="center">
        忘记原密码请联系管理员重置
      </Text>

      {/* 键盘高度留白：给「把输入框滚上来」留出滚动余量 */}
      <View style={{ height: keyboardSpacer + 16 }} />
    </ScrollView>
  )
}
