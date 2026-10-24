import { Button } from 'heroui-native'
import type { ComponentProps } from 'react'

type AppButtonProps = ComponentProps<typeof Button>

/**
 * 统一按钮
 *
 * HeroUI 的 Button.Label 在部分安卓机上会被父容器挤压/换行，
 * 导致「登录」只显示一个「登」。这里固定单行 + 不收缩 + 左右留 2px 余量，
 * 避开「字体实际渲染宽度比测量值宽」导致的末字裁剪。
 * 用法：<AppButton onPress={save}>保存</AppButton>
 */
export default function AppButton({ children, ...rest }: AppButtonProps) {
  return (
    <Button {...rest}>
      <Button.Label numberOfLines={1} style={{ flexShrink: 0, paddingHorizontal: 2 }}>
        {children}
      </Button.Label>
    </Button>
  )
}
