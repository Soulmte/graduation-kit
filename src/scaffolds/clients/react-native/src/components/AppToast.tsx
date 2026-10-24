import { useEffect } from 'react'
import type { ComponentProps } from 'react'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Toast, useToast } from 'heroui-native'
import type { ToastComponentProps } from 'heroui-native'
import { palette } from '@/theme/colors'

/**
 * 全局轻提示
 *
 * 对外只有一个函数：showToast(kind, title, description?)
 * 不依赖 hook，所以 api 层（如 request.ts）也能直接调用。
 * 真正渲染由 <ToastHost /> 负责，它挂在根布局的 HeroUINativeProvider 里面。
 */

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

interface ToastPayload {
  kind: ToastKind
  title: string
  description?: string
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

const KIND_STYLE: Record<ToastKind, { icon: IconName; color: string; variant: 'success' | 'danger' | 'warning' | 'accent' }> = {
  success: { icon: 'check-circle', color: palette.success, variant: 'success' },
  error: { icon: 'close-circle', color: palette.danger, variant: 'danger' },
  warning: { icon: 'alert-circle', color: palette.warning, variant: 'warning' },
  info: { icon: 'information', color: palette.accent, variant: 'accent' }
}

/** ToastHost 挂载后把渲染函数注册到这里，供任意模块调用 */
let dispatch: ((payload: ToastPayload) => void) | null = null

export function showToast(kind: ToastKind, title: string, description?: string) {
  dispatch?.({ kind, title, description })
}

function AppToast({
  kind,
  title,
  description,
  ...toastProps
}: ToastComponentProps & ToastPayload) {
  const style = KIND_STYLE[kind]

  return (
    <Toast {...toastProps} variant={style.variant} className="flex-row items-center gap-3">
      <MaterialCommunityIcons name={style.icon} size={20} color={style.color} />
      <View className="flex-1">
        <Toast.Title>{title}</Toast.Title>
        {description ? <Toast.Description>{description}</Toast.Description> : null}
      </View>
    </Toast>
  )
}

/**
 * 挂在根布局：负责把 showToast 的调用转成 HeroUI 的 toast.show。
 * 不渲染任何可见内容。
 */
export function ToastHost() {
  const { toast } = useToast()

  useEffect(() => {
    dispatch = (payload) => {
      toast.show({
        duration: 2600,
        component: (props) => <AppToast {...props} {...payload} />
      })
    }
    return () => {
      dispatch = null
    }
  }, [toast])

  return null
}
