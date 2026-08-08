import axios from 'axios'
import { message } from 'antd'
import NProgress from 'nprogress'
import { useUserStore } from '../stores/userStore'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Token 失效的统一处理：清空登录态并回到登录页
// 走 store 的 logout 而不是直接摸 localStorage，避免 store 与本地存储不一致
let redirecting = false
const handleUnauthorized = () => {
  if (redirecting) return
  redirecting = true
  message.error('登录已过期，请重新登录')
  useUserStore.getState().logout()
  window.location.href = '/login'
}

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    NProgress.start()
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    NProgress.done()
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    NProgress.done()
    const res = response.data

    if (res.code === 200) {
      return res
    }
    // 未携带 token 时后端返 HTTP 200 + body code 401
    if (res.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(res.message))
    }
    message.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message))
  },
  (error) => {
    NProgress.done()
    // Token 无效或已过期时后端返 HTTP 401
    if (error.response?.status === 401) {
      handleUnauthorized()
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
