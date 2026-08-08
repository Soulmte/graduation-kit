/**
 * 登录页
 */
import { useRef, useState } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { TextInput, Button, Text, HelperText, Snackbar } from 'react-native-paper'
import { useUserStore } from '@/store/user'
import Captcha, { type CaptchaHandle } from '@/components/Captcha'
import { gs } from '@/styles/global'
import { colors, spacing } from '@/styles/theme'

export default function LoginScreen() {
  const login = useUserStore(s => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [secure, setSecure] = useState(true)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState('')
  const captchaRef = useRef<CaptchaHandle>(null)

  // 校验
  const usernameError = !!username && (username.length < 3 || username.length > 50)
    ? '长度 3-50 个字符' : ''
  const passwordError = !!password && password.length < 6
    ? '密码至少 6 位' : ''

  const submit = async () => {
    if (!username || !password) { setSnack('请输入用户名和密码'); return }
    if (usernameError || passwordError) { setSnack('请检查输入'); return }
    if (!captcha) { setSnack('请输入验证码'); return }
    if (!captchaRef.current?.verify(captcha)) {
      setSnack('验证码错误')
      captchaRef.current?.refresh()
      setCaptcha('')
      return
    }
    setLoading(true)
    try {
      const userInfo = await login(username, password)
      router.replace('/main')
      setSnack(`欢迎回来, ${userInfo.nickname || userInfo.username}`)
    } catch {
      captchaRef.current?.refresh()
      setCaptcha('')
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
            <Text style={gs.authTitle}>欢迎登录</Text>
            <Text style={gs.authSubtitle}>多技术栈脚手架 · 移动端</Text>
          </View>

          <TextInput
            label="用户名"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            left={<TextInput.Icon icon="account" />}
            error={!!usernameError}
            style={gs.formField}
          />
          {!!usernameError && <HelperText type="error">{usernameError}</HelperText>}

          <TextInput
            label="密码"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={secure}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure(s => !s)} />}
            error={!!passwordError}
            style={gs.formField}
          />
          {!!passwordError && <HelperText type="error">{passwordError}</HelperText>}

          <View style={[gs.row, gs.formField, { gap: spacing.sm }]}>
            <TextInput
              label="验证码"
              value={captcha}
              onChangeText={setCaptcha}
              mode="outlined"
              autoCapitalize="characters"
              maxLength={4}
              left={<TextInput.Icon icon="shield-check" />}
              style={{ flex: 1 }}
            />
            <Captcha ref={captchaRef} />
          </View>

          <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={{ marginTop: spacing.md }}>
            登录
          </Button>

          <View style={gs.authFooter}>
            <Text style={gs.textSub}>还没有账号？</Text>
            <Text style={gs.textPrimary} onPress={() => router.push('/register')}>立即注册</Text>
          </View>
        </View>
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2000}>{snack}</Snackbar>
    </KeyboardAvoidingView>
  )
}
