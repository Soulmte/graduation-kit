/**
 * 静态资源统一入口。
 *
 * 目录约定：src/static/<分类>/<文件>，分类按用途拆，不按格式拆。
 *   src/static/tab/  底部导航图标
 *
 * Taro 的 H5 端不会自动拷贝 src/static，图片必须 import 交给构建处理，
 * 写成 '/static/xxx.png' 在 H5 下会 404。页面统一从这里引，不要自己写路径。
 */
import homeIcon from '@/static/tab/tab-home.png'
import homeActiveIcon from '@/static/tab/tab-home-active.png'
import noticeIcon from '@/static/tab/tab-notice.png'
import noticeActiveIcon from '@/static/tab/tab-notice-active.png'
import profileIcon from '@/static/tab/tab-profile.png'
import profileActiveIcon from '@/static/tab/tab-profile-active.png'

export const TAB_ICONS = {
  home: { icon: homeIcon, activeIcon: homeActiveIcon },
  notice: { icon: noticeIcon, activeIcon: noticeActiveIcon },
  profile: { icon: profileIcon, activeIcon: profileActiveIcon }
}
