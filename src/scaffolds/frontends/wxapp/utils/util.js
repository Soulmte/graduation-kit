const { UPLOAD_BASE } = require('../config/index')
const { DEFAULT_AVATAR } = require('./assets')

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

const resolveAvatar = avatar => {
  if (!avatar) return DEFAULT_AVATAR
  if (avatar.startsWith('http')) return avatar
  return UPLOAD_BASE + '/' + avatar.replace('/uploads/', '')
}

module.exports = {
  formatTime,
  resolveAvatar
}
