/**
 * 图 4-1 系统整体架构图
 * 纯声明式：每层的虚线框、每张卡片、每个箭头都是独立元素，均可拖拽与编辑。
 * 想批量调整仍可改 LAYERS 后刷新页面。
 */
DIAGRAMS['02-architecture'] = (() => {
  const W = 940, PAD = 40, INNER = 20
  const LAYER_H = 100, GAP = 30, TOP = 60

  const LAYERS = [
    { key: 'pres', title: '表现层 (Presentation)', cardW: 230,
      items: ['Web 管理端', 'Web 用户端', '移动端 uni-app'] },
    { key: 'comm', title: '通信层 (Communication)', cardW: 175,
      items: ['RESTful API', 'JSON 报文', 'JWT 认证', 'CORS 跨域'] },
    { key: 'biz', title: '业务层 (Business)', cardW: 175,
      items: ['用户管理', '文件上传', '操作日志', '公告管理'] },
    { key: 'cross', title: '公共层 (Cross-Cutting)', cardW: 175,
      items: ['JWT 拦截器', '全局异常处理', 'AOP 日志切面', '统一响应封装'] },
    { key: 'persist', title: '持久层 (Persistence)', cardW: 260, inset: 110, fontSize: 15,
      items: ['MySQL 8.0 数据库', '本地文件存储'] },
  ]

  const nodes = []
  const links = []
  const boxW = W - PAD * 2

  LAYERS.forEach((layer, li) => {
    const y = TOP + li * (LAYER_H + GAP)
    const cy = y + LAYER_H / 2

    nodes.push({
      id: layer.key + 'Box', shape: 'group',
      cx: W / 2, cy, w: boxW, h: LAYER_H,
      label: layer.title, fontSize: 16,
    })

    const inset = layer.inset || 0
    const xs = distribute(PAD + INNER + inset, W - PAD - INNER - inset, layer.items.length, layer.cardW)
    xs.forEach((x, i) => {
      nodes.push({
        id: layer.key + i, shape: 'rect',
        cx: x + layer.cardW / 2, cy,
        w: layer.cardW, h: 46,
        label: layer.items[i], bold: true,
        fontSize: layer.fontSize || 14,
      })
    })

    // 层间箭头：引用上下两层虚线框的锚点，端点自动贴边并随框移动
    if (li < LAYERS.length - 1) {
      links.push({
        id: 'arrow' + li,
        from: layer.key + 'Box',
        to: LAYERS[li + 1].key + 'Box',
        fromSide: 'bottom',
        toSide: 'top',
      })
    }
  })

  return {
    id: '02-architecture',
    name: '图4-1 系统整体架构图',
    width: W,
    height: TOP + LAYERS.length * LAYER_H + (LAYERS.length - 1) * GAP + 40,
    nodes,
    links,
  }
})()
