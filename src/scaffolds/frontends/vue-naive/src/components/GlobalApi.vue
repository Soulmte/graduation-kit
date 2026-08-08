<template><div style="display: none"></div></template>

<script setup>
/**
 * Naive UI 的 message / dialog 必须在 setup 内调用
 * 这个组件挂到 App 里, 把实例暴露给 window, 方便 axios 拦截器调用
 */
import { useMessage, useDialog, useNotification, useLoadingBar } from 'naive-ui'

window.$message = useMessage()
window.$dialog = useDialog()
window.$notification = useNotification()
window.$loadingBar = useLoadingBar()
</script>
