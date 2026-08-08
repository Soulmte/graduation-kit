/**
 * 客户端配置
 *
 * 重要: React Native 真机调试时, localhost 指向手机本地, 必须改成开发机的局域网 IP
 *   例如: http://192.168.1.100:8084
 *
 * Web (npm run web) / Android 模拟器 (10.0.2.2) 可用 localhost
 */

// 切换后端只改这里:
//   8080 Spring Boot / 8081 Express / 8082 Flask / 8083 FastAPI / 8084 Go / 8085 .NET
export const BASE_URL = 'http://localhost:8084/api'
export const STATIC_BASE = 'http://localhost:8084'

export const APP_NAME = '多技术栈脚手架 · 移动端'
export const APP_VERSION = '1.0.0'
