/**
 * 公共工具方法
 */
import config from '@/config/index'

/**
 * 拼接头像完整地址
 * 后端返回的是 /uploads/xxx.jpg 相对路径，小程序端不认，必须拼成完整 URL
 */
export function resolveAvatar(avatar) {
  if (!avatar) return ''
  if (avatar.startsWith('http')) return avatar
  return `${config.UPLOAD_BASE}/${avatar.replace('/uploads/', '')}`
}

/**
 * 取昵称首字，用于没有头像时的占位
 */
export function avatarInitial(userInfo) {
  const name = userInfo?.nickname || userInfo?.username || '用'
  return name.slice(0, 1).toUpperCase()
}
