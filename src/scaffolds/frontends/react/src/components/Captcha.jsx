import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'

/**
 * 纯前端图形验证码
 * - 4 位随机字符 (数字+大小写字母, 排除易混淆)
 * - 干扰线 + 干扰点
 * - 点击可换一张
 * - 暴露 verify(input) 方法供父组件校验 (不走后端)
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const randomColor = () => {
  const r = Math.floor(Math.random() * 120 + 30)
  const g = Math.floor(Math.random() * 120 + 30)
  const b = Math.floor(Math.random() * 120 + 30)
  return `rgb(${r},${g},${b})`
}

const Captcha = forwardRef(function Captcha({ width = 110, height = 36, length = 4 }, ref) {
  const canvasRef = useRef(null)
  const [code, setCode] = useState('')

  const generate = () => {
    let text = ''
    for (let i = 0; i < length; i++) {
      text += CHARS[Math.floor(Math.random() * CHARS.length)]
    }
    setCode(text)
    draw(text)
  }

  const draw = (text) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const scale = window.devicePixelRatio || 1
    canvas.width = width * scale
    canvas.height = height * scale
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(scale, scale)

    // 背景
    ctx.fillStyle = '#f5f7fa'
    ctx.fillRect(0, 0, width, height)

    // 干扰线
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = randomColor()
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.stroke()
    }

    // 干扰点
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = randomColor()
      ctx.beginPath()
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // 字符
    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.textBaseline = 'middle'
    const charWidth = width / (length + 0.5)
    for (let i = 0; i < text.length; i++) {
      ctx.save()
      ctx.fillStyle = randomColor()
      const x = charWidth * (i + 0.5) + 2
      const y = height / 2 + (Math.random() - 0.5) * 6
      const angle = (Math.random() - 0.5) * 0.5
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillText(text[i], 0, 0)
      ctx.restore()
    }
  }

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    /** 不区分大小写比对 */
    verify: (input) => (input || '').toLowerCase() === code.toLowerCase(),
    refresh: generate
  }))

  return (
    <canvas
      ref={canvasRef}
      onClick={generate}
      title="点击刷新验证码"
      style={{
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border-deep)',
        display: 'block'
      }}
    />
  )
})

export default Captcha
