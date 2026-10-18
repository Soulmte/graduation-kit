/**
 * 请求封装
 * 基于 Taro.request + Promise，与 Web 前端的 { code, message, data } 协议一致
 */
import Taro from '@tarojs/taro'
import { userStore } from '@/store/user'
import config from '@/config/index'

function request(options) {
  return new Promise((resolve, reject) => {
    Taro.request({
      url: config.BASE_URL + options.url,
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
          Taro.showToast({ title: '登录已过期', icon: 'none' })
          userStore.logout()
          Taro.reLaunch({ url: '/pages/login/index' })
          reject(new Error(body.message))
        } else {
          Taro.showToast({ title: body.message || '请求失败', icon: 'none' })
          reject(new Error(body.message))
        }
      },
      fail: (err) => {
        Taro.showToast({ title: '网络错误', icon: 'none' })
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
    Taro.uploadFile({
      url: config.BASE_URL + '/file/upload',
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
