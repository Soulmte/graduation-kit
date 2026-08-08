/**
 * 用户状态管理
 * 使用 Vue 3 reactive 做轻量单例，避免引入 pinia
 */
import { reactive } from 'vue'

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export const userStore = reactive({
  token: uni.getStorageSync(TOKEN_KEY) || '',
  userInfo: uni.getStorageSync(USER_INFO_KEY) || null,

  /**
   * 保存登录信息
   */
  setLogin(token, userInfo) {
    this.token = token
    this.userInfo = userInfo
    uni.setStorageSync(TOKEN_KEY, token)
    uni.setStorageSync(USER_INFO_KEY, userInfo)
  },

  /**
   * 更新用户信息
   */
  updateUserInfo(userInfo) {
    this.userInfo = { ...this.userInfo, ...userInfo }
    uni.setStorageSync(USER_INFO_KEY, this.userInfo)
  },

  /**
   * 退出登录
   */
  logout() {
    this.token = ''
    this.userInfo = null
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_INFO_KEY)
  },

  /**
   * 是否已登录
   */
  isLoggedIn() {
    return !!this.token
  }
})
