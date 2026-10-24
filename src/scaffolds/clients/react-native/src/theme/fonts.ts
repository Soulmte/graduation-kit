import { useFonts } from 'expo-font'

/**
 * 应用字体
 *
 * 字形随安装包走，不向系统取字：部分安卓机装了第三方主题字体（手写体、圆体等），
 * 一换手机字形和字宽就变，偏宽的字体还会把按钮文字挤出容器。
 * 这里把 Noto Sans SC 打进包里，只注册 400 / 700 两个字面，
 * 组件写 fontWeight 时由 expo-font 自动挑对应字面，不会退化成合成粗体。
 *
 * 字族名要和 src/theme/typography.css 里的 font-family 保持一致。
 */
export const APP_FONT = 'NotoSansSC'

export function useAppFonts() {
  return useFonts([
    {
      fontFamily: APP_FONT,
      fontDefinitions: [
        {
          path: require('@expo-google-fonts/noto-sans-sc/400Regular/NotoSansSC_400Regular.ttf'),
          weight: 400
        },
        {
          path: require('@expo-google-fonts/noto-sans-sc/700Bold/NotoSansSC_700Bold.ttf'),
          weight: 700
        }
      ]
    }
  ])
}
