/**
 * 静态资源统一入口。
 *
 * 目录约定：static/<分类>/<文件>，分类按用途拆，不按格式拆。
 *   static/tab/     底部导航图标
 *   static/avatar/  默认头像
 *
 * 页面不要写死 '/static/xxx.png'，统一从这里引；以后换图或加分类只改一处。
 */
export const ASSET_BASE = '/static'

export const TAB_ICONS = {
	home: {
		icon: `${ASSET_BASE}/tab/tab-home.png`,
		activeIcon: `${ASSET_BASE}/tab/tab-home-active.png`
	},
	notice: {
		icon: `${ASSET_BASE}/tab/tab-notice.png`,
		activeIcon: `${ASSET_BASE}/tab/tab-notice-active.png`
	},
	profile: {
		icon: `${ASSET_BASE}/tab/tab-profile.png`,
		activeIcon: `${ASSET_BASE}/tab/tab-profile-active.png`
	}
}

export const DEFAULT_AVATAR = `${ASSET_BASE}/avatar/default-avatar.png`
