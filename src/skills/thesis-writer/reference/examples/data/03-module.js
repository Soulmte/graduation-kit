/**
 * 图 4-2 功能模块图
 * 三层树，二级功能用竖排文字。所有方框均可拖拽。
 */
DIAGRAMS['03-module'] = (() => {
  const W = 940
  const ROOT = '系统管理平台'
  const MODULES = [
    { key: 'user',   name: '用户管理模块', subs: ['注册', '登录', '信息维护', '权限控制'] },
    { key: 'file',   name: '文件上传模块', subs: ['单文件上传', '批量上传', '类型校验', '文件删除'] },
    { key: 'log',    name: '操作日志模块', subs: ['自动记录', '条件查询', '批量清理', '参数脱敏'] },
    { key: 'notice', name: '公告管理模块', subs: ['发布公告', '查询列表', '修改删除', '分页展示'] },
  ]

  const ROOT_Y = 59, L1_Y = 157, L2_TOP = 230
  const SUB_W = 32, SUB_GAP = 42, SUB_PAD = 8
  const SUB_FS = 14
  // 字距由字号推导（与 nodeVText 内部一致），改字号时框高自动跟随
  const LINE_H = resolveLineHeight(null, SUB_FS, 1.3)
  const L1_W = 160
  // 横向干高度：同层统一，避免因子节点高度不一致而参差
  const MID1 = (ROOT_Y + 38 / 2 + L1_Y - 38 / 2) / 2
  const MID2 = (L1_Y + 38 / 2 + L2_TOP) / 2

  const nodes = [
    { id: 'root', shape: 'rect', cx: W / 2, cy: ROOT_Y, w: 180, h: 38,
      label: ROOT, bold: true, fontSize: 16 },
  ]
  const links = []

  const xs = distribute(60, 880, MODULES.length, L1_W)
  MODULES.forEach((m, i) => {
    const cx = xs[i] + L1_W / 2
    nodes.push({
      id: m.key, shape: 'rect', cx, cy: L1_Y, w: L1_W, h: 38,
      label: m.name, bold: true,
    })
    links.push({ from: 'root', to: m.key, tree: true, midY: MID1 })

    const startX = cx - ((m.subs.length - 1) * SUB_GAP) / 2
    m.subs.forEach((s, j) => {
      // 不写 h：由 resolveSize 按字数与字号推算，改字号时框自动变高
      const h = [...s].length * LINE_H + SUB_PAD * 2
      const id = m.key + '_' + j
      nodes.push({
        id, shape: 'vtext',
        cx: startX + j * SUB_GAP, cy: L2_TOP + h / 2,
        w: SUB_W, label: s, fontSize: SUB_FS,
      })
      links.push({ from: m.key, to: id, tree: true, midY: MID2 })
    })
  })

  const maxChars = Math.max(...MODULES.flatMap(m => m.subs.map(s => [...s].length)))

  return {
    id: '03-module',
    name: '图4-2 功能模块图',
    width: W,
    height: L2_TOP + maxChars * LINE_H + SUB_PAD * 2 + 40,
    nodes,
    links,
  }
})()
