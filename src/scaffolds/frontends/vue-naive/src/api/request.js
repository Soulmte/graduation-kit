import axios from 'axios'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// Naive UI 的 useMessage 必须在 setup 内调用, 拦截器里拿不到
// 所以走 GlobalApi.vue 挂在 window 上的实例, 拿不到时降级成 console
const notifyError = (msg) => {
  if (window.$message) window.$message.error(msg)
  else console.error(msg)
}

// Token 失效统一处理：清理登录态并跳回登录页
// redirecting 防重入, 避免多个并发请求同时 401 时弹出多个提示
let redirecting = false
const handleUnauthorized = () => {
  if (redirecting) return
  redirecting = true
  notifyError('登录已过期，请重新登录')
  useUserStore().logout()
  router.push('/login').finally(() => {
    redirecting = false
  })
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    window.$loadingBar?.start()
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    window.$loadingBar?.error()
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    window.$loadingBar?.finish()
    const res = response.data

    // Token失效：清理并跳转
    if (res.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(res.message))
    }

    if (res.code !== 200) {
      notifyError(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    window.$loadingBar?.error()
    if (error.response?.status === 401) {
      handleUnauthorized()
    } else {
      notifyError(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
