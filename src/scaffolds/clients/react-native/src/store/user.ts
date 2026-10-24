/**
 * 用户登录态 store(zustand + AsyncStorage 持久化)
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as userApi from '@/api/user'
import type { UserInfo } from '@/api/user'

interface UserState {
  token: string
  userInfo: UserInfo | null
  hydrated: boolean
  hydrate: () => Promise<void>
  login: (username: string, password: string) => Promise<UserInfo>
  logout: () => Promise<void>
  setUserInfo: (info: UserInfo) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  token: '',
  userInfo: null,
  hydrated: false,

  /** 启动时从 AsyncStorage 恢复 */
  hydrate: async () => {
    const [[, token], [, userInfoStr]] = await AsyncStorage.multiGet(['token', 'userInfo'])
    let userInfo: UserInfo | null = null
    try {
      userInfo = userInfoStr ? JSON.parse(userInfoStr) : null
    } catch {
      userInfo = null
    }
    set({ token: token || '', userInfo, hydrated: true })
  },

  login: async (username: string, password: string) => {
    const res = await userApi.login(username, password)
    const { token, userInfo } = res.data
    await AsyncStorage.multiSet([
      ['token', token],
      ['userInfo', JSON.stringify(userInfo)]
    ])
    set({ token, userInfo })
    return userInfo
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'userInfo'])
    set({ token: '', userInfo: null })
  },

  setUserInfo: async (info: UserInfo) => {
    await AsyncStorage.setItem('userInfo', JSON.stringify(info))
    set({ userInfo: info })
  }
}))
