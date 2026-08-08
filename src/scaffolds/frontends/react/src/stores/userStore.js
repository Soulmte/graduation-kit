import { create } from 'zustand'
import { login as loginApi } from '../api/user'

export const useUserStore = create((set) => ({
  token: localStorage.getItem('token') || '',
  userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),

  login: async (username, password) => {
    const res = await loginApi(username, password)
    const { token, userInfo } = res.data

    set({ token, userInfo })
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify(userInfo))

    return res
  },

  logout: () => {
    set({ token: '', userInfo: null })
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  },

  updateUserInfo: (userInfo) => {
    set({ userInfo })
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  }
}))
