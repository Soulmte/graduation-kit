/**
 * 注册页
 */
import { useState } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { TextInput, Button, Text, HelperText, SegmentedButtons, Snackbar } from 'react-native-paper'
import { register } from '@/api/user'
import { gs } from '@/styles/global'
import { colors, spacing } from '@/styles/theme'

const PHONE_REG = /^1[3-9]\d{9}$/
const EMAIL_REG = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/
const USERNAME_REG = /^[a-zA-Z][a-zA-Z0-9_]*$/

export default function RegisterScreen() {
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
  const [secure, setSecure] = useState(true)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState('')

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const usernameError = form.username && !USERNAME_REG.test(form.username)
    ? '用户名需以字母开头, 只能包含字母数字下划线' : ''
  const passwordError = form.password && (form.password.length < 6 || form.password.length > 32)
    ? '密码长度 6-32 位' : ''
  const confirmError = form.confirm && form.confirm !== form.password
    ? '两次密码不一致' : ''
  const ageError = form.age && (!/^\d+$/.test(form.age) || +form.age < 1 || +form.age > 150)
    ? '年龄 1-150' : ''
  const phoneError = form.phone && !PHONE_REG.test(form.phone)
    ? '请输入有效的 11 位手机号' : ''
  const emailError = form.email && !EMAIL_REG.test(form.email)
    ? '邮箱格式不正确' : ''

  const submit = async () => {
    if (!form.username || !form.password || !form.confirm) {
      setSnack('请填写必填项')
      return
    }
    if (usernameError || passwordError || confirmError || ageError || phoneError || emailError) {
      setSnack('请检查输入')
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
      setSnack('注册成功, 请登录')
      setTimeout(() => router.replace('/login'), 800)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={gs.authScreen} keyboardShouldPersistTaps="handled">
        <View style={gs.authCard}>
          <View style={gs.authBrand}>
            <View style={gs.authBrandMark}>
              <Text style={gs.authBrandMarkText}>S</Text>
            </View>
            <Text style={gs.authTitle}>注册账号</Text>
          </View>

          <TextInput
            label="用户名 *"
            value={form.username}
            onChangeText={v => set('username', v)}
            mode="outlined"
            autoCapitalize="none"
            left={<TextInput.Icon icon="account" />}
            error={!!usernameError}
            style={gs.formField}
          />
          {!!usernameError && <HelperText type="error">{usernameError}</HelperText>}

          <TextInput
            label="密码 *"
            value={form.password}
            onChangeText={v => set('password', v)}
            mode="outlined"
            secureTextEntry={secure}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure(s => !s)} />}
            error={!!passwordError}
            style={gs.formField}
          />
          {!!passwordError && <HelperText type="error">{passwordError}</HelperText>}

          <TextInput
            label="确认密码 *"
            value={form.confirm}
            onChangeText={v => set('confirm', v)}
            mode="outlined"
            secureTextEntry={secure}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-check" />}
            error={!!confirmError}
            style={gs.formField}
          />
          {!!confirmError && <HelperText type="error">{confirmError}</HelperText>}

          <TextInput
            label="昵称"
            value={form.nickname}
            onChangeText={v => set('nickname', v)}
            mode="outlined"
            left={<TextInput.Icon icon="badge-account" />}
            style={gs.formField}
          />

          <View style={[gs.row, { gap: spacing.sm }, gs.formField]}>
            <TextInput
              label="年龄"
              value={form.age}
              onChangeText={v => set('age', v.replace(/\D/g, ''))}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={3}
              error={!!ageError}
              style={{ flex: 1 }}
            />
          </View>
          {!!ageError && <HelperText type="error">{ageError}</HelperText>}

          <Text style={gs.fieldLabel}>性别</Text>
          <SegmentedButtons
            value={form.gender}
            onValueChange={v => set('gender', v)}
            buttons={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'other', label: '其他' }
            ]}
            style={gs.formField}
          />

          <TextInput
            label="手机号"
            value={form.phone}
            onChangeText={v => set('phone', v.replace(/\D/g, ''))}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={11}
            left={<TextInput.Icon icon="phone" />}
            error={!!phoneError}
            style={gs.formField}
          />
          {!!phoneError && <HelperText type="error">{phoneError}</HelperText>}

          <TextInput
            label="邮箱"
            value={form.email}
            onChangeText={v => set('email', v)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            error={!!emailError}
            style={gs.formField}
          />
          {!!emailError && <HelperText type="error">{emailError}</HelperText>}

          <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={{ marginTop: spacing.md }}>
            注册
          </Button>

          <View style={gs.authFooter}>
            <Text style={gs.textSub}>已有账号？</Text>
            <Text style={gs.textPrimary} onPress={() => router.replace('/login')}>立即登录</Text>
          </View>
        </View>
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2000}>{snack}</Snackbar>
    </KeyboardAvoidingView>
  )
}
