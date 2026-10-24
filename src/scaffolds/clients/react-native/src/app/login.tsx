import { useRef, useState, type ComponentRef } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { FieldError, Input, Label, Text, TextField } from 'heroui-native'
import { useUserStore } from '@/store/user'
import Captcha, { type CaptchaHandle } from '@/components/Captcha'
import Screen from '@/components/Screen'
import AppButton from '@/components/AppButton'
import { showToast } from '@/components/AppToast'

/**
 * 登录页
 * 校验顺序：必填 → 长度 → 验证码 → 请求后端
 */
export default function LoginPage() {
  const login = useUserStore((s) => s.login)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [loading, setLoading] = useState(false)
  const captchaRef = useRef<CaptchaHandle>(null)
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)

  const usernameError = username && username.length < 3 ? '用户名至少 3 个字符' : ''
  const passwordError = password && password.length < 6 ? '密码至少 6 位' : ''

  const submit = async () => {
    if (!username || !password) {
      showToast('warning', '请输入用户名和密码')
      return
    }
    if (usernameError || passwordError) {
      showToast('warning', '请检查输入内容')
      return
    }
    if (!captcha) {
      showToast('warning', '请输入验证码')
      return
    }
    if (!captchaRef.current?.verify(captcha)) {
      showToast('error', '验证码错误')
      captchaRef.current?.refresh()
      setCaptcha('')
      return
    }

    setLoading(true)
    try {
      const userInfo = await login(username, password)
      router.replace('/home')
      showToast('success', `欢迎回来，${userInfo.nickname || userInfo.username}`)
    } catch {
      captchaRef.current?.refresh()
      setCaptcha('')
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
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View className="gap-2 items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-accent items-center justify-center">
            <Text className="text-accent-foreground" type="h2">
              S
            </Text>
          </View>
          <Text type="h3">欢迎登录</Text>
          <Text type="body-sm" color="muted">
            多技术栈脚手架 · 移动端
          </Text>
        </View>

        <View className="gap-4">
          <TextField isInvalid={!!usernameError}>
            <Label>用户名</Label>
            <Input
              value={username}
              onChangeText={setUsername}
              placeholder="请输入用户名"
              autoCapitalize="none"
              autoCorrect={false}
              isInvalid={!!usernameError}
            />
            {!!usernameError && <FieldError>{usernameError}</FieldError>}
          </TextField>

          <TextField isInvalid={!!passwordError}>
            <Label>密码</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="请输入密码"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              isInvalid={!!passwordError}
            />
            {!!passwordError && <FieldError>{passwordError}</FieldError>}
          </TextField>

          <View className="gap-2">
            <Label>验证码</Label>
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Input
                  value={captcha}
                  onChangeText={setCaptcha}
                  placeholder="4 位验证码"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={4}
                  onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                />
              </View>
              <Captcha ref={captchaRef} />
            </View>
          </View>

          <AppButton onPress={submit} isDisabled={loading} size="lg" className="mt-2">
            {loading ? '登录中…' : '登录'}
          </AppButton>

          <View className="flex-row justify-center gap-1 mt-2">
            <Text type="body-sm" color="muted">
              还没有账号？
            </Text>
            <Text type="body-sm" className="text-accent" onPress={() => router.push('/register')}>
              立即注册
            </Text>
          </View>

          <View className="mt-6 px-2">
            <Text type="body-xs" color="muted" align="center" numberOfLines={2}>
              测试账号 admin / 123456、test / 123456
            </Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
