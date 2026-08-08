/**
 * 全局主题 + 设计令牌
 * 与 Web 端 (React/Vue-Antd/EP) 的蓝白配色保持一致
 */
import { MD3LightTheme, configureFonts } from 'react-native-paper'
import type { MD3Theme } from 'react-native-paper'

// 颜色常量(供非 Paper 组件直接用)
export const colors = {
  primary:        '#1890ff',
  primaryHover:   '#40a9ff',
  primaryActive:  '#096dd9',
  primaryBg:      '#e6f4ff',

  text:        '#262626',
  textSub:     '#595959',
  textMute:    '#8c8c8c',
  textDisable: '#bfbfbf',

  bgPage:    '#f5f7fa',
  bgCard:    '#ffffff',
  bgHover:   '#f5f7fa',
  border:    '#f0f0f0',
  borderDeep:'#d9d9d9',

  success: '#52c41a',
  warning: '#faad14',
  danger:  '#ff4d4f'
} as const

// 字号
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28
} as const

// 圆角
export const radius = {
  sm: 4,
  md: 6,
  lg: 8
} as const

// 间距
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const

// React Native Paper 主题(MD3)
const fontConfig = {
  default: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
    fontSize: 14
  }
}

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  roundness: 1, // 整体小圆角
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#ffffff',
    primaryContainer: colors.primaryBg,
    onPrimaryContainer: colors.primary,
    secondary: colors.primary,
    onSecondary: '#ffffff',
    error: colors.danger,
    background: colors.bgPage,
    surface: colors.bgCard,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSub,
    outline: colors.borderDeep,
    outlineVariant: colors.border
  }
}
