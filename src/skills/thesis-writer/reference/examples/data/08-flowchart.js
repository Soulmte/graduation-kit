/**
 * 图 5-12 文件上传流程图（三列布局）
 * 左列主流程前半 → 中列主流程后半，右列为异常通道。
 *
 * 走线约定：
 *   同列上下相邻 → connect + fromSide/toSide，端点自动贴边
 *   需要绕行的   → points 折线，只写必要的拐点坐标
 * 判断框分支从左右顶点引出，由 diamondEdge 自动求交，不留空隙。
 */
DIAGRAMS['08-flowchart'] = (() => {
  const LX = 220, MX = 580, EX = 850
  const ERR = { w: 160, h: 40, fontSize: 13 }

  // 绕行通道的 x/y，集中在此便于整体调整
  const CH = {
    errIn: 400,     // 异常分支下行通道
    errY: 425,      // 异常分支横穿高度
    uLeft: 60,      // 左列尾→中列首的大 U 左边界
    uTop: 25,       // 大 U 顶部
    uBottom: 650,   // 大 U 底部
    tailY: 670,     // 异常通道汇入结束节点的底部通道
  }
  // 异常框的进/出位置：入口偏左 1/4，纵向主干偏右 3/4，两者互不重叠
  const IN_AT = 0.25, TRUNK_AT = 0.75

  return {
    id: '08-flowchart',
    name: '图5-12 文件上传流程图',
    width: 1000,
    height: 700,

    nodes: [
      // ---- 左列：主流程前半 ----
      { id: 'start',   shape: 'terminator', cx: LX, cy: 60,  label: '开始' },
      { id: 'choose',  shape: 'rect',       cx: LX, cy: 135, label: '用户选择文件' },
      { id: 'feCheck', shape: 'diamond',    cx: LX, cy: 220, label: '前端校验类型/大小?' },
      { id: 'buildFD', shape: 'rect',       cx: LX, cy: 310, label: '构造 FormData' },
      { id: 'postReq', shape: 'io',         cx: LX, cy: 390, label: 'POST /api/file/upload' },
      { id: 'jwt',     shape: 'diamond',    cx: LX, cy: 475, label: 'JWT 拦截器校验?' },
      { id: 'svc',     shape: 'diamond',    cx: LX, cy: 570, label: '服务端二次校验?' },

      // ---- 中列：主流程后半 ----
      { id: 'genUUID',  shape: 'rect',       cx: MX, cy: 60,  label: '生成 UUID 文件名' },
      { id: 'saveDisk', shape: 'rect',       cx: MX, cy: 135, label: '按日期分目录保存' },
      { id: 'respURL',  shape: 'io',         cx: MX, cy: 210, label: '返回 {url, fileName}' },
      { id: 'feShow',   shape: 'rect',       cx: MX, cy: 285, label: '前端展示上传成功' },
      { id: 'end',      shape: 'terminator', cx: MX, cy: 380, label: '结束' },

      // ---- 右列：异常通道 ----
      { id: 'err1', shape: 'rect', cx: EX, cy: 220, label: '前端提示错误',     ...ERR },
      { id: 'err2', shape: 'rect', cx: EX, cy: 475, label: '返回 401 未授权',   ...ERR },
      { id: 'err3', shape: 'rect', cx: EX, cy: 570, label: '返回 400 参数错误', ...ERR },
    ],

    links: [
      // ---- 左列主链：同列垂直，端点自动贴边 ----
      { from: 'start',   to: 'choose',  fromSide: 'bottom', toSide: 'top' },
      { from: 'choose',  to: 'feCheck', fromSide: 'bottom', toSide: 'top' },
      { from: 'feCheck', to: 'buildFD', fromSide: 'bottom', toSide: 'top',
        label: '合法', dx: 26 },
      { from: 'buildFD', to: 'postReq', fromSide: 'bottom', toSide: 'top' },
      { from: 'postReq', to: 'jwt',     fromSide: 'bottom', toSide: 'top' },
      { from: 'jwt',     to: 'svc',     fromSide: 'bottom', toSide: 'top',
        label: '有效', dx: 26 },

      // ---- 中列主链 ----
      { from: 'genUUID',  to: 'saveDisk', fromSide: 'bottom', toSide: 'top' },
      { from: 'saveDisk', to: 'respURL',  fromSide: 'bottom', toSide: 'top' },
      { from: 'respURL',  to: 'feShow',   fromSide: 'bottom', toSide: 'top' },
      { from: 'feShow',   to: 'end',      fromSide: 'bottom', toSide: 'top' },

      // ---- 异常分支：判断框右顶点引出 ----
      // feCheck 需绕开中列，走 errIn 通道下行再横穿到 err1 底部偏左处
      { points: ['feCheck.right', { x: CH.errIn, y: 220 },
                 { x: CH.errIn, y: CH.errY }, { x: EX - ERR.w * (0.5 - IN_AT), y: CH.errY },
                 'err1.bottom@' + IN_AT],
        label: '不合法', labelAt: 0.08, dy: -12 },
      // jwt / svc 与对应 err 同高，直接水平过去
      { from: 'jwt', to: 'err2', fromSide: 'right', toSide: 'left',
        label: '失效', dy: -12 },
      { from: 'svc', to: 'err3', fromSide: 'right', toSide: 'left',
        label: '非法', dy: -12 },

      // 异常通道串联（纯连接，无箭头），走右侧主干避开上方汇入线
      { from: 'err1', to: 'err2', fromSide: 'bottom', toSide: 'top',
        fromAt: TRUNK_AT, toAt: TRUNK_AT, arrow: false },
      { from: 'err2', to: 'err3', fromSide: 'bottom', toSide: 'top',
        fromAt: TRUNK_AT, toAt: TRUNK_AT, arrow: false },

      // ---- 左列尾 → 中列首：绕画布左侧的大 U ----
      { points: ['svc.bottom', { x: LX, y: CH.uBottom }, { x: CH.uLeft, y: CH.uBottom },
                 { x: CH.uLeft, y: CH.uTop }, { x: MX, y: CH.uTop }, 'genUUID.top'],
        label: '合法', labelAt: 0.04, dx: 26 },
      // ---- 异常通道汇入结束节点：走画布下方 ----
      { points: ['err3.bottom', { x: EX, y: CH.tailY }, { x: MX, y: CH.tailY }, 'end.bottom'] },
    ],
  }
})()
