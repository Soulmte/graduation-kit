/**
 * 用户状态
 * 使用 Vue 3 reactive 做轻量单例，避免引入 Pinia
 */
import { reactive } from 'vue'
import Taro from '@tarojs/taro'

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export const userStore = reactive({
  token: Taro.getStorageSync(TOKEN_KEY) || '',
  userInfo: Taro.getStorageSync(USER_INFO_KEY) || null,

  /**
   * 保存登录信息
   */
  setLogin(token, userInfo) {
    this.token = token
    this.userInfo = userInfo
    Taro.setStorageSync(TOKEN_KEY, token)
    Taro.setStorageSync(USER_INFO_KEY, userInfo)
  },

  /**
   * 合并更新本地用户信息
   */
  updateUserInfo(userInfo) {
    this.userInfo = { ...this.userInfo, ...userInfo }
    Taro.setStorageSync(USER_INFO_KEY, this.userInfo)
  },

  /**
   * 退出登录
   */
  logout() {
    this.token = ''
    this.userInfo = null
    Taro.removeStorageSync(TOKEN_KEY)
    Taro.removeStorageSync(USER_INFO_KEY)
  },

  /**
   * 是否已登录
   */
  isLoggedIn() {
    return Boolean(this.token)
  }
})
