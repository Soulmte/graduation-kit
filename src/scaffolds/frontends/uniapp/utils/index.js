/**
 * 公共工具方法
 */
import config from '@/config/index'

const DEFAULT_AVATAR = '/static/logo.png'

/**
 * 拼接头像完整地址
 * 后端返回的是 /uploads/xxx.jpg 相对路径，小程序端不认，必须拼成完整 URL
 */
export function resolveAvatar(avatar) {
	if (!avatar) return DEFAULT_AVATAR
	if (avatar.startsWith('http')) return avatar
	return config.UPLOAD_BASE + '/' + avatar.replace('/uploads/', '')
}
