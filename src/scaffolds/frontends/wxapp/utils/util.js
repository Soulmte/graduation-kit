const { UPLOAD_BASE } = require('../config/index')

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const DEFAULT_AVATAR = '/static/default-avatar.png'

/**
 * 拼接头像完整地址
 * 后端返回的是 /uploads/xxx.jpg 相对路径，小程序不认，必须拼成完整 URL
 */
const resolveAvatar = avatar => {
  if (!avatar) return DEFAULT_AVATAR
  if (avatar.startsWith('http')) return avatar
  return UPLOAD_BASE + '/' + avatar.replace('/uploads/', '')
}

module.exports = {
  formatTime,
  resolveAvatar
}
