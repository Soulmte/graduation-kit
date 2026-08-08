import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

// Token 失效统一处理：清理登录态并跳回登录页
// redirecting 防重入，避免多个并发请求同时 401 时弹出多个提示
let redirecting = false
const handleUnauthorized = () => {
  if (redirecting) return
  redirecting = true
  ElMessage.error('登录已过期，请重新登录')
  useUserStore().logout()
  router.push('/login').finally(() => {
    redirecting = false
  })
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    NProgress.start()
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
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

    // Token失效：清理并跳转
    if (res.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(res.message))
    }

    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    NProgress.done()
    if (error.response?.status === 401) {
      handleUnauthorized()
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
