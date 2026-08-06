/**
 * 图 2-2 系统技术栈全景图
 * 纯声明式：所有虚线框与卡片均为可拖拽元素。
 */
DIAGRAMS['01-framework'] = (() => {
  const W = 940, PAD = 40
  const nodes = []
  const links = []

  /** 生成「虚线框 + 一排卡片」 */
  function layer(key, cfg) {
    const x = cfg.x == null ? PAD : cfg.x
    const w = cfg.w == null ? W - PAD * 2 : cfg.w
    const cy = cfg.y + cfg.h / 2

    nodes.push({
      id: key + 'Box', shape: 'group',
      cx: x + w / 2, cy, w, h: cfg.h,
      label: cfg.title, fontSize: cfg.titleSize || 16,
    })

    const cardH = cfg.cardH || 46
    const cardCy = cfg.y + (cfg.cardY == null ? (cfg.h - cardH) / 2 + 8 : cfg.cardY) + cardH / 2
    const inset = cfg.inset || 0
    const xs = distribute(x + 20 + inset, x + w - 20 - inset, cfg.items.length, cfg.cardW)
    xs.forEach((cx, i) => {
      nodes.push({
        id: key + i, shape: 'rect',
        cx: cx + cfg.cardW / 2, cy: cardCy,
        w: cfg.cardW, h: cardH,
        label: cfg.items[i],
        bold: cfg.bold !== false,
        fontSize: cfg.fontSize || 14,
      })
    })
  }

  layer('front', { y: 60, h: 110, title: '前端层', cardW: 180, cardH: 50, cardY: 35,
    items: ['React + Antd', 'Vue + Antd', 'Vue + ElementPlus', 'uni-app 移动端'] })

  layer('api', { y: 205, h: 80, title: '统一 API 层', cardW: 175, cardH: 40, cardY: 20,
    items: ['路由分发', '参数校验', 'JWT 拦截', '响应封装'] })

  // 后端层外框
  nodes.push({
    id: 'backBox', shape: 'group',
    cx: W / 2, cy: 320 + 400 / 2, w: W - PAD * 2, h: 400,
    label: '后端层 (以 Spring Boot 为例，可替换为其他后端栈)', fontSize: 16,
  })

  // 后端 4 个子层
  const SUBS = [
    { key: 'ctrl', y: 350, title: 'Controller 层',
      items: ['UserController', 'NoticeController', 'FileController', 'LogController'] },
    { key: 'svc', y: 440, title: 'Service 层',
      items: ['UserService', 'NoticeService', 'FileService', 'LogService'] },
    { key: 'mp', y: 530, title: 'Mapper 层 (MyBatis-Plus)',
      items: ['UserMapper', 'NoticeMapper', 'FileMapper', 'LogMapper'] },
  ]
  SUBS.forEach(s => layer(s.key, {
    x: 60, w: 820, y: s.y, h: 70, title: s.title,
    cardW: 170, cardH: 40, cardY: 15,
    items: s.items, fontSize: 13, titleSize: 14, bold: false,
  }))

  layer('aspect', {
    x: 60, w: 820, y: 620, h: 70, title: '横切关注点 (Cross-Cutting Concerns)',
    cardW: 220, cardH: 40, cardY: 15, fontSize: 13, titleSize: 14,
    items: ['JWT 拦截器', 'AOP 日志切面', '全局异常处理'],
  })

  layer('data', { y: 755, h: 80, title: '数据层', cardW: 260, cardH: 44, cardY: 20, inset: 110,
    fontSize: 15, items: ['本地文件存储', 'MySQL 8.0 数据库'] })

  // 层间箭头：两端引用虚线框锚点，自动贴边并随框移动
  const FLOW = [
    ['frontBox', 'apiBox'],
    ['apiBox', 'backBox'],
    ['ctrlBox', 'svcBox'],
    ['svcBox', 'mpBox'],
    ['backBox', 'dataBox'],
  ]
  FLOW.forEach(([a, b], i) => {
    links.push({ id: 'a' + (i + 1), from: a, to: b, fromSide: 'bottom', toSide: 'top' })
  })

  return {
    id: '01-framework',
    name: '图2-2 系统技术栈全景图',
    width: W,
    height: 850,
    nodes,
    links,
  }
})()
