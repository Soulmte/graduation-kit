/**
 * 消息中心示例数据
 *
 * 接入真实后端时：
 * 1. 新增 message 表与 /message/pageQuery 等接口
 * 2. 把页面里的 MOCK_MESSAGES 换成接口返回
 * 页面结构不需要改。
 */
export const MESSAGE_TYPES = {
  system: { label: '系统', color: '#007aff' },
  notice: { label: '公告', color: '#f0ad4e' },
  interact: { label: '互动', color: '#4cd964' },
  security: { label: '安全', color: '#ff3b30' }
}

export const MOCK_MESSAGES = [
  {
    id: 1,
    type: 'system',
    title: '系统维护通知',
    summary: '平台将于今晚 23:00 - 24:00 进行例行维护，期间可能短暂无法访问。',
    content:
      '为了提供更稳定的服务，平台将于今晚 23:00 - 24:00 进行例行维护。维护期间登录、公告、个人中心等功能可能出现短暂不可用，请提前保存正在编辑的内容。给你带来的不便敬请谅解。',
    time: '2026-10-18 09:30'
  },
  {
    id: 2,
    type: 'notice',
    title: '新的公告已发布',
    summary: '「系统上线通知」已发布，点击查看详情。',
    content:
      '本系统已完成部署，欢迎使用。初始管理员账号 admin，密码 123456。首次登录后请尽快修改默认密码，并完善个人资料。',
    time: '2026-10-18 09:00'
  },
  {
    id: 3,
    type: 'interact',
    title: '有人回复了你的反馈',
    summary: '你提交的「移动端页面适配」反馈已收到回复。',
    content:
      '感谢你的反馈。移动端页面已完成安全区适配、固定栏占位与长文本换行处理，后续版本会继续优化小屏设备上的显示效果。',
    time: '2026-10-17 18:20'
  },
  {
    id: 4,
    type: 'security',
    title: '账号安全提醒',
    summary: '检测到你的账号较长时间未修改密码，建议定期更换。',
    content:
      '为了保障账号安全，建议每 90 天更换一次密码，不要在多个网站使用相同密码。如发现异常登录，请立即修改密码并联系管理员。',
    time: '2026-10-16 10:05'
  },
  {
    id: 5,
    type: 'system',
    title: '新版本发布',
    summary: 'v1.0.0 已发布，新增消息中心与设置页。',
    content:
      '本次更新新增消息中心、设置页、用户协议与隐私政策页面，并优化了移动端的导航栏与底部 tabBar 占位逻辑。',
    time: '2026-10-15 14:00'
  }
]
