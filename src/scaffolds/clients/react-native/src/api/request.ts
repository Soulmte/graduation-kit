import axios, { type AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BASE_URL } from '@/config'
import { showToast } from '@/components/AppToast'

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
})

request.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) return res
    if (res.code === 401) {
      AsyncStorage.multiRemove(['token', 'userInfo'])
      showToast('warning', '登录已过期', '请重新登录')
      return Promise.reject(new Error('UNAUTHORIZED'))
    }
    showToast('error', '请求失败', res.message || '请稍后重试')
    return Promise.reject(new Error(res.message))
  },
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.multiRemove(['token', 'userInfo'])
      showToast('warning', '登录已过期', '请重新登录')
    } else {
      showToast('error', '网络异常', error.message || '请检查网络后重试')
    }
    return Promise.reject(error)
  }
)

export default request
