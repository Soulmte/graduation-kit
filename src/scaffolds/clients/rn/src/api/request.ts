import axios, { type AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import { BASE_URL } from '@/config'

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
})

request.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) return res
    if (res.code === 401) {
      AsyncStorage.multiRemove(['token', 'userInfo'])
      Alert.alert('登录已过期', '请重新登录')
      return Promise.reject(new Error('UNAUTHORIZED'))
    }
    Alert.alert('提示', res.message || '请求失败')
    return Promise.reject(new Error(res.message))
  },
  error => {
    if (error.response?.status === 401) {
      AsyncStorage.multiRemove(['token', 'userInfo'])
      Alert.alert('登录已过期', '请重新登录')
    } else {
      Alert.alert('网络错误', error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request
