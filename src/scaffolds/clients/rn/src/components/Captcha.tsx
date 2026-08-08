/**
 * RN 版纯前端验证码
 * - 不依赖 Canvas(RN 没有原生 Canvas), 用 View + Text 模拟
 * - 4 位字符随机倾斜 + 多色, 干扰点
 * - 暴露 verify(input) / refresh(), 不区分大小写
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, radius } from '@/styles/theme'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PALETTE = ['#1890ff', '#722ed1', '#eb2f96', '#fa541c', '#13c2c2', '#52c41a', '#fa8c16']

export interface CaptchaHandle {
  verify: (input: string) => boolean
  refresh: () => void
}

interface CaptchaProps {
  width?: number
  height?: number
  length?: number
}

interface Cell {
  ch: string
  color: string
  rotate: string
  dy: number
}

const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(function Captcha(
  { width = 110, height = 40, length = 4 },
  ref
) {
  const codeRef = useRef('')
  const [cells, setCells] = useState<Cell[]>([])

  const generate = () => {
    let text = ''
    const arr: Cell[] = []
    for (let i = 0; i < length; i++) {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)]
      text += ch
      arr.push({
        ch,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        rotate: `${Math.floor((Math.random() - 0.5) * 30)}deg`,
        dy: Math.floor((Math.random() - 0.5) * 6)
      })
    }
    codeRef.current = text
    setCells(arr)
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
      style={[styles.box, { width, height }]}
      accessibilityLabel="点击刷新验证码"
    >
      {cells.map((c, idx) => (
        <Text
          key={idx}
          style={[
            styles.ch,
            { color: c.color, transform: [{ rotate: c.rotate }, { translateY: c.dy }] }
          ]}
        >
          {c.ch}
        </Text>
      ))}
      {/* 几个干扰点 */}
      <View style={[styles.dot, { top: 6,  left: 12, backgroundColor: '#ff4d4f' }]} />
      <View style={[styles.dot, { top: 22, left: 42, backgroundColor: '#52c41a' }]} />
      <View style={[styles.dot, { top: 12, left: 78, backgroundColor: '#faad14' }]} />
    </Pressable>
  )
})

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f5f7fa',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderDeep,
    overflow: 'hidden',
    paddingHorizontal: 6
  },
  ch: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System'
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2
  }
})

export default Captcha
