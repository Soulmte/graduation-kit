/**
 * 请求封装
 * 基于 uni.request + Promise
 */
import { userStore } from '@/store/user'
import config from '@/config/index'

const BASE_URL = config.BASE_URL

/**
 * 通用请求方法
 */
function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}),
        ...(options.header || {})
      },
      success: (res) => {
        const body = res.data
        if (body.code === 200) {
          resolve(body)
        } else if (body.code === 401) {
          uni.showToast({ title: '登录已过期', icon: 'none' })
          userStore.logout()
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error(body.message))
        } else {
          uni.showToast({ title: body.message || '请求失败', icon: 'none' })
          reject(new Error(body.message))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

/**
 * 文件上传
 */
export function upload(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/file/upload',
      filePath,
      name: 'file',
      header: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data)
          if (body.code === 200) resolve(body)
          else reject(new Error(body.message))
        } catch (e) {
          reject(e)
        }
      },
      fail: reject
    })
  })
}

export default request
