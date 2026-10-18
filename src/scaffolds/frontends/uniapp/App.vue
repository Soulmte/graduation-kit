<script>
export default {
	onLaunch() {
		console.log('App Launch')
	},
	onShow() {
		console.log('App Show')
	},
	onHide() {
		console.log('App Hide')
	}
}
</script>

<style lang="scss">
/* 公共样式：容器、卡片、表单、按钮、列表等 */
@import './common/styles/common.scss';

page {
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
	background: $color-bg;
	font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
	color: $color-text;
}

/* 所有盒子默认 border-box，避免 width + padding 撑出父容器 */
view,
text,
input,
textarea,
button,
image {
	box-sizing: border-box;
	max-width: 100%;
}

/* 图片默认不撑破容器，也不被 flex 压扁 */
image {
	display: block;
	flex-shrink: 0;
}

button {
	max-width: 100%;
	margin: 0;
	padding: 0;
}

button::after {
	border: none;
}

/* #ifdef H5 */
/* 兜底：任何漏出 .container 的元素都不产生横向滚动条 */
html,
body,
#app {
	width: 100%;
	max-width: 100%;
	overflow-x: hidden;
}
/* #endif */
</style>
