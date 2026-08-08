<template>
  <canvas
    ref="canvasRef"
    title="点击刷新验证码"
    @click="generate"
    :style="{
      cursor: 'pointer',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--color-border-deep)',
      display: 'block'
    }"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const canvasRef = ref(null)
const code = ref('')
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const randomColor = () => {
  const r = Math.floor(Math.random() * 120 + 30)
  const g = Math.floor(Math.random() * 120 + 30)
  const b = Math.floor(Math.random() * 120 + 30)
  return `rgb(${r},${g},${b})`
}

const generate = () => {
  let text = ''
  for (let i = 0; i < 4; i++) text += CHARS[Math.floor(Math.random() * CHARS.length)]
  code.value = text
  draw(text)
}

const draw = (text) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = 110,
    h = 36
  const scale = window.devicePixelRatio || 1
  canvas.width = w * scale
  canvas.height = h * scale
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  ctx.scale(scale, scale)

  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = randomColor()
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = randomColor()
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, 1, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.font = 'bold 22px Arial, sans-serif'
  ctx.textBaseline = 'middle'
  const charWidth = w / (text.length + 0.5)
  for (let i = 0; i < text.length; i++) {
    ctx.save()
    ctx.fillStyle = randomColor()
    const x = charWidth * (i + 0.5) + 2
    const y = h / 2 + (Math.random() - 0.5) * 6
    const angle = (Math.random() - 0.5) * 0.5
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillText(text[i], 0, 0)
    ctx.restore()
  }
}

const verify = (input) => (input || '').toLowerCase() === code.value.toLowerCase()
const refresh = generate

defineExpose({ verify, refresh })
onMounted(generate)
</script>
