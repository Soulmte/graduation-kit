/**
 * 需要在 JS 里取值的颜色（图标、状态栏、下拉刷新等）。
 *
 * 其余样式一律写 Tailwind 类名，颜色由 src/theme/tokens.css 的令牌提供：
 *   bg-background / bg-surface / text-foreground / text-muted / bg-accent ...
 * 只有这些拿不到 CSS 变量的第三方组件属性才用本文件。
 */
export const palette = {
  accent: '#1890ff',
  accentForeground: '#ffffff',
  muted: '#8c8c8c',
  border: '#e8e8e8',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f'
} as const
