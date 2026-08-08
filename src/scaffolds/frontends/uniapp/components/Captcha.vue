<template>
	<view class="captcha-wrap" @click="generate">
		<canvas
			canvas-id="captchaCanvas"
			id="captchaCanvas"
			class="captcha-canvas"
			:style="{ width: width + 'px', height: height + 'px' }"
		/>
	</view>
</template>

<script setup>
/**
 * 纯前端图形验证码组件
 * - 4 位随机字符 (大写字母+数字, 排除易混淆字符)
 * - 干扰线 + 干扰点
 * - 点击可刷新
 * - 暴露 verify(input) 方法供父组件校验
 */
import { ref, onMounted, getCurrentInstance } from 'vue'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const props = defineProps({
	width: { type: Number, default: 110 },
	height: { type: Number, default: 36 },
	length: { type: Number, default: 4 }
})

const code = ref('')
const instance = getCurrentInstance()

const randomColor = () => {
	const r = Math.floor(Math.random() * 120 + 30)
	const g = Math.floor(Math.random() * 120 + 30)
	const b = Math.floor(Math.random() * 120 + 30)
	return `rgb(${r},${g},${b})`
}

const generate = () => {
	let text = ''
	for (let i = 0; i < props.length; i++) {
		text += CHARS[Math.floor(Math.random() * CHARS.length)]
	}
	code.value = text
	draw(text)
}

const draw = (text) => {
	const ctx = uni.createCanvasContext('captchaCanvas', instance)
	const { width, height } = props

	// 背景
	ctx.setFillStyle('#f5f7fa')
	ctx.fillRect(0, 0, width, height)

	// 干扰线
	for (let i = 0; i < 4; i++) {
		ctx.setStrokeStyle(randomColor())
		ctx.setLineWidth(1)
		ctx.beginPath()
		ctx.moveTo(Math.random() * width, Math.random() * height)
		ctx.lineTo(Math.random() * width, Math.random() * height)
		ctx.stroke()
	}

	// 干扰点
	for (let i = 0; i < 30; i++) {
		ctx.setFillStyle(randomColor())
		ctx.beginPath()
		ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2)
		ctx.fill()
	}

	// 字符
	ctx.setTextBaseline('middle')
	const charWidth = width / (props.length + 0.5)
	for (let i = 0; i < text.length; i++) {
		ctx.save()
		ctx.setFillStyle(randomColor())
		ctx.setFontSize(20)
		const x = charWidth * (i + 0.5)
		const y = height / 2 + (Math.random() - 0.5) * 6
		ctx.translate(x, y)
		ctx.rotate((Math.random() - 0.5) * 0.5)
		ctx.fillText(text[i], 0, 0)
		ctx.restore()
	}

	ctx.draw()
}

/**
 * 校验输入是否匹配（不区分大小写）
 */
const verify = (input) => {
	return (input || '').toUpperCase() === code.value.toUpperCase()
}

onMounted(() => {
	// 延迟绘制，确保 canvas 已渲染
	setTimeout(() => {
		generate()
	}, 100)
})

defineExpose({ verify, refresh: generate })
</script>

<style scoped>
.captcha-wrap {
	display: inline-block;
	border-radius: 8rpx;
	overflow: hidden;
	border: 1rpx solid #ddd;
}

.captcha-canvas {
	display: block;
}
</style>
