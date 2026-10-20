/**
 * 静态资源统一入口。
 *
 * 目录约定：static/<分类>/<文件>，分类按用途拆，不按格式拆。
 *   static/avatar/  默认头像
 *
 * 页面不要写死 '/static/xxx.png'，统一从这里引。
 */
const ASSET_BASE = '/static'

const DEFAULT_AVATAR = `${ASSET_BASE}/avatar/default-avatar.png`

module.exports = {
  ASSET_BASE,
  DEFAULT_AVATAR
}
