/**
 * 客户端配置
 *
 * 接口地址来自项目根 .env（EXPO_PUBLIC_ 前缀的变量在打包时内联）：
 *   EXPO_PUBLIC_API_BASE_URL     http://localhost:8080/api
 *   EXPO_PUBLIC_STATIC_BASE_URL  http://localhost:8080
 *
 * 真机调试时 localhost 指向手机本身，需在 .env 里换成开发机的局域网 IP；
 * Android 模拟器访问宿主机用 10.0.2.2。改完 .env 需重启 dev server 才生效。
 */

const DEFAULT_ORIGIN = 'http://localhost:8080'

const trimSlash = (value: string) => value.replace(/\/+$/, '')

const staticBase = trimSlash(
  process.env.EXPO_PUBLIC_STATIC_BASE_URL || DEFAULT_ORIGIN
)

export const BASE_URL = trimSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL || `${DEFAULT_ORIGIN}/api`
)

export const STATIC_BASE = staticBase

export const APP_NAME = '多技术栈脚手架 · 移动端'
export const APP_VERSION = '1.0.0'
