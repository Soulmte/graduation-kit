/**
 * 全站统一页脚
 * - 用户端/管理端共用
 * - 所有样式通过 CSS 变量读取, 确保与全局主题一致
 */
export default function AppFooter() {
  const year = new Date().getFullYear()
  return (
    <div style={styles.wrap}>
      <div style={styles.main}>
        © {year} 多技术栈脚手架管理平台
        <span style={styles.divider}>·</span>
        All Rights Reserved
      </div>
      <div style={styles.sub}>React + Ant Design · 基于 Vite 构建</div>
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--color-bg-card)',
    borderTop: '1px solid var(--color-border)',
    padding: '12px 24px',
    textAlign: 'center'
  },
  main: {
    fontSize: 'var(--font-size-md)',
    color: 'var(--color-text-sub)'
  },
  sub: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-mute)',
    marginTop: 2
  },
  divider: {
    margin: '0 8px',
    color: 'var(--color-text-disable)'
  }
}
