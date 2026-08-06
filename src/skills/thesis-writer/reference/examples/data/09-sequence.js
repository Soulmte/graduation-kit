/**
 * 图 5-14 用户登录时序图
 * 泳道头、生命线、激活条、每条消息线、每个自循环都是独立可拖元素。
 * 改内容/时间顺序：调 LANES 与 STEPS 后刷新；微调位置直接在编辑器里拖。
 */
DIAGRAMS['09-sequence'] = (() => {
  const LANES = [
    { id: 'user', name: '用户',     x: 130 },
    { id: 'web',  name: '前端 Web', x: 370 },
    { id: 'api',  name: '后端 API', x: 620 },
    { id: 'db',   name: '数据库',   x: 880 },
  ]

  const STEPS = [
    { from: 'user', to: 'web', label: '输入用户名密码' },
    { from: 'web',  to: 'api', label: 'POST /api/user/login' },
    { from: 'api',  to: 'db',  label: 'SELECT user WHERE username=?' },
    { from: 'db',   to: 'api', label: '返回用户记录', ret: true },
    { self: 'api',  label: '校验密码 + 生成 JWT', gap: 70 },
    { from: 'api',  to: 'web', label: 'Result<token, userInfo>', ret: true, gap: 90 },
    { self: 'web',  label: '保存 Token 到 localStorage', gap: 70 },
    { from: 'web',  to: 'user', label: '跳转首页 / 提示错误', ret: true, gap: 90 },
  ]

  // 激活条：[泳道, 起始步骤索引, 结束步骤索引]
  const ACTIVATIONS = [['web', 1, 7], ['api', 1, 5], ['db', 2, 3]]

  const HEAD_Y = 30, HEAD_H = 42, HEAD_W = 140
  const FIRST_Y = 110, GAP = 60, BAR_W = 10

  let y = FIRST_Y
  const ys = STEPS.map((s, i) => (i > 0 ? (y += s.gap || GAP) : y))
  const bottom = ys[ys.length - 1] + 80
  const xOf = id => LANES.find(l => l.id === id).x

  const nodes = []

  // 泳道头 + 生命线
  LANES.forEach(l => nodes.push({
    id: 'lane_' + l.id, shape: 'lane',
    cx: l.x, cy: HEAD_Y + HEAD_H / 2,
    w: HEAD_W, h: HEAD_H,
    label: l.name, fontSize: 15,
    laneBottom: bottom,
  }))

  // 激活条（x 绑定泳道）
  ACTIVATIONS.forEach(([id, a, b]) => {
    const top = ys[a] - 3
    const bot = ys[b]
    nodes.push({
      id: 'act_' + id, shape: 'activation',
      cx: xOf(id), cy: (top + bot) / 2,
      w: BAR_W, h: bot - top,
      bindX: 'lane_' + id,
    })
  })

  // 消息线与自循环（x 绑定泳道，拖泳道时自动跟随；y 自由拖动）
  STEPS.forEach((s, i) => {
    if (s.self) {
      nodes.push({
        id: 'msg' + i, shape: 'selfloop',
        cx: xOf(s.self), cy: ys[i],
        bindX: 'lane_' + s.self,
        label: s.label, radius: 18, barW: BAR_W,
      })
    } else {
      const x1 = xOf(s.from)
      const x2 = xOf(s.to)
      nodes.push({
        id: 'msg' + i, shape: 'message',
        cx: (x1 + x2) / 2, cy: ys[i],
        w: x2 - x1,
        anchorFrom: 'lane_' + s.from,
        anchorTo: 'lane_' + s.to,
        label: s.label, ret: s.ret,
        fontSize: 13, barW: BAR_W,
      })
    }
  })

  return {
    id: '09-sequence',
    name: '图5-14 用户登录时序图',
    width: 1000,
    height: bottom + 30,
    nodes,
  }
})()
