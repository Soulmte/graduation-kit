import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { FieldError, Input, Label, Text, TextField } from 'heroui-native'
import { register } from '@/api/user'
import Screen from '@/components/Screen'
import AppButton from '@/components/AppButton'
import { showToast } from '@/components/AppToast'

const USERNAME_REG = /^[a-zA-Z][a-zA-Z0-9_]*$/
const PHONE_REG = /^1[3-9]\d{9}$/
const EMAIL_REG = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/

const GENDERS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
] as const

/**
 * 注册页
 * 每个字段的校验都只依赖自己，提交时统一汇总，便于逐条提示。
 */
export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm: '',
    nickname: '',
    age: '',
    gender: '',
    phone: '',
    email: ''
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const usernameError =
    form.username && (!USERNAME_REG.test(form.username) || form.username.length < 3)
      ? '字母开头，3-50 位字母数字下划线'
      : ''
  const passwordError = form.password && form.password.length < 6 ? '密码至少 6 位' : ''
  const confirmError = form.confirm && form.confirm !== form.password ? '两次输入的密码不一致' : ''
  const ageError =
    form.age && (!/^\d+$/.test(form.age) || +form.age < 1 || +form.age > 150) ? '年龄 1-150' : ''
  const phoneError = form.phone && !PHONE_REG.test(form.phone) ? '请输入有效的 11 位手机号' : ''
  const emailError = form.email && !EMAIL_REG.test(form.email) ? '邮箱格式不正确' : ''

  const submit = async () => {
    if (!form.username || !form.password || !form.confirm) {
      showToast('warning', '用户名和密码为必填项')
      return
    }
    if (usernameError || passwordError || confirmError || ageError || phoneError || emailError) {
      showToast('warning', '请检查输入内容')
      return
    }

    setLoading(true)
    try {
      const { confirm, age, ...rest } = form
      await register({
        ...rest,
        age: age ? +age : undefined,
        gender: form.gender || undefined
      })
      showToast('success', '注册成功，请登录')
      router.replace('/login')
    } catch {
      // 后端报错已由 request 拦截器弹出提示
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View className="gap-1 mb-2">
          <Text type="h3">创建账号</Text>
          <Text type="body-sm" color="muted">
            带 * 的字段为必填
          </Text>
        </View>

        <TextField isRequired isInvalid={!!usernameError}>
          <Label>用户名</Label>
          <Input
            value={form.username}
            onChangeText={(v) => set('username', v)}
            placeholder="字母开头，3-50 位"
            autoCapitalize="none"
            autoCorrect={false}
            isInvalid={!!usernameError}
          />
          {!!usernameError && <FieldError>{usernameError}</FieldError>}
        </TextField>

        <TextField isRequired isInvalid={!!passwordError}>
          <Label>密码</Label>
          <Input
            value={form.password}
            onChangeText={(v) => set('password', v)}
            placeholder="至少 6 位"
            secureTextEntry
            autoCapitalize="none"
            isInvalid={!!passwordError}
          />
          {!!passwordError && <FieldError>{passwordError}</FieldError>}
        </TextField>

        <TextField isRequired isInvalid={!!confirmError}>
          <Label>确认密码</Label>
          <Input
            value={form.confirm}
            onChangeText={(v) => set('confirm', v)}
            placeholder="再次输入密码"
            secureTextEntry
            autoCapitalize="none"
            isInvalid={!!confirmError}
          />
          {!!confirmError && <FieldError>{confirmError}</FieldError>}
        </TextField>

        <TextField>
          <Label>昵称</Label>
          <Input value={form.nickname} onChangeText={(v) => set('nickname', v)} placeholder="选填" />
        </TextField>

        <TextField isInvalid={!!ageError}>
          <Label>年龄</Label>
          <Input
            value={form.age}
            onChangeText={(v) => set('age', v.replace(/\D/g, ''))}
            placeholder="选填"
            keyboardType="number-pad"
            maxLength={3}
            isInvalid={!!ageError}
          />
          {!!ageError && <FieldError>{ageError}</FieldError>}
        </TextField>

        <View className="gap-2">
          <Label>性别</Label>
          <View className="flex-row gap-2">
            {GENDERS.map((g) => (
              <AppButton
                key={g.value}
                size="sm"
                variant={form.gender === g.value ? 'primary' : 'secondary'}
                onPress={() => set('gender', form.gender === g.value ? '' : g.value)}
              >
                {g.label}
              </AppButton>
            ))}
          </View>
        </View>

        <TextField isInvalid={!!phoneError}>
          <Label>手机号</Label>
          <Input
            value={form.phone}
            onChangeText={(v) => set('phone', v.replace(/\D/g, ''))}
            placeholder="选填"
            keyboardType="number-pad"
            maxLength={11}
            isInvalid={!!phoneError}
          />
          {!!phoneError && <FieldError>{phoneError}</FieldError>}
        </TextField>

        <TextField isInvalid={!!emailError}>
          <Label>邮箱</Label>
          <Input
            value={form.email}
            onChangeText={(v) => set('email', v)}
            placeholder="选填"
            keyboardType="email-address"
            autoCapitalize="none"
            isInvalid={!!emailError}
          />
          {!!emailError && <FieldError>{emailError}</FieldError>}
        </TextField>

        <AppButton onPress={submit} isDisabled={loading} size="lg" className="mt-2">
          {loading ? '提交中…' : '注册'}
        </AppButton>

        <View className="flex-row justify-center gap-1">
          <Text type="body-sm" color="muted">
            已有账号？
          </Text>
          <Text type="body-sm" className="text-accent" onPress={() => router.replace('/login')}>
            返回登录
          </Text>
        </View>

        <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
