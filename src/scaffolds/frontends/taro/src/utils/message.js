import Taro from '@tarojs/taro'
import { MOCK_MESSAGES } from '@/data/messages'

const READ_KEY = 'message_read_ids'

export const getReadIds = () => {
  const ids = Taro.getStorageSync(READ_KEY)
  return Array.isArray(ids) ? ids : []
}

export const markRead = (id) => {
  const ids = getReadIds()
  if (!ids.includes(id)) {
    ids.push(id)
    Taro.setStorageSync(READ_KEY, ids)
  }
}

export const markAllRead = () => {
  Taro.setStorageSync(READ_KEY, MOCK_MESSAGES.map((item) => item.id))
}

export const getUnreadCount = () => {
  const ids = getReadIds()
  return MOCK_MESSAGES.filter((item) => !ids.includes(item.id)).length
}
