/**
 * 纯前端验证码
 * RN 没有原生 Canvas，用 View + Text 模拟：随机字符 + 倾斜 + 多色 + 干扰点。
 * 通过 ref 暴露 verify(input) 与 refresh()，不区分大小写。
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from 'heroui-native'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PALETTE = ['#1890ff', '#722ed1', '#eb2f96', '#fa541c', '#13c2c2', '#52c41a']

export interface CaptchaHandle {
  verify: (input: string) => boolean
  refresh: () => void
}

interface CaptchaProps {
  length?: number
}

interface Cell {
  char: string
  color: string
  rotate: string
  offsetY: number
}

const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(function Captcha({ length = 4 }, ref) {
  const codeRef = useRef('')
  const [cells, setCells] = useState<Cell[]>([])

  const generate = () => {
    let text = ''
    const next: Cell[] = []
    for (let i = 0; i < length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)]
      text += char
      next.push({
        char,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        rotate: `${Math.floor((Math.random() - 0.5) * 30)}deg`,
        offsetY: Math.floor((Math.random() - 0.5) * 6)
      })
    }
    codeRef.current = text
    setCells(next)
  }

  useEffect(() => {
    generate()
  }, [])

  useImperativeHandle(ref, () => ({
    verify: (input: string) => (input || '').toLowerCase() === codeRef.current.toLowerCase(),
    refresh: generate
  }))

  return (
    <Pressable
      onPress={generate}
      className="h-11 w-28 flex-row items-center justify-around rounded-xl bg-surface-secondary active:opacity-70"
      accessibilityLabel="点击刷新验证码"
    >
      {cells.map((cell, index) => (
        <Text
          key={index}
          style={{
            color: cell.color,
            fontSize: 20,
            fontWeight: '700',
            transform: [{ rotate: cell.rotate }, { translateY: cell.offsetY }]
          }}
        >
          {cell.char}
        </Text>
      ))}
      <View className="absolute left-2 top-2 h-[3px] w-[3px] rounded-full bg-success" />
      <View className="absolute right-3 top-3 h-[3px] w-[3px] rounded-full bg-warning" />
    </Pressable>
  )
})

export default Captcha
