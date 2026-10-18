/**
 * 应用配置
 * 切换后端只需改端口：8080(Spring Boot) / 8081(Express) / 8082(Flask)
 * 真机调试时把 LAN_HOST 改成电脑的局域网 IP（Windows 用 ipconfig 查 IPv4）
 */
const LAN_HOST = 'localhost'

const DEV_BASE_URL = `http://${LAN_HOST}:8080/api`
const PROD_BASE_URL = 'https://your-domain.com/api'

let BASE_URL = DEV_BASE_URL
let UPLOAD_BASE = `http://${LAN_HOST}:8080/uploads`

// H5 开发走 devServer 代理（见 config/index.js 的 h5.devServer.proxy）
if (process.env.TARO_ENV === 'h5') {
  BASE_URL = '/api'
  UPLOAD_BASE = '/uploads'
}

if (process.env.NODE_ENV === 'production') {
  BASE_URL = PROD_BASE_URL
  UPLOAD_BASE = PROD_BASE_URL.replace('/api', '/uploads')
}

export default {
  BASE_URL,
  UPLOAD_BASE
}
