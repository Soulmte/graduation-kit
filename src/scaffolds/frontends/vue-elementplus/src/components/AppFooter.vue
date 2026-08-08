<template>
  <div :style="wrap">
    <div :style="main">
      © {{ year }} 多技术栈脚手架管理平台
      <span :style="divider">·</span>
      All Rights Reserved
    </div>
    <div :style="sub">Vue 3 + Element Plus · 基于 Vite 构建</div>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()

const wrap = {
  background: 'var(--color-bg-card)',
  borderTop: '1px solid var(--color-border)',
  padding: '12px 24px',
  textAlign: 'center'
}
const main = {
  fontSize: 'var(--font-size-md)',
  color: 'var(--color-text-sub)'
}
const sub = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-text-mute)',
  marginTop: '2px'
}
const divider = {
  margin: '0 8px',
  color: 'var(--color-text-disable)'
}
</script>
