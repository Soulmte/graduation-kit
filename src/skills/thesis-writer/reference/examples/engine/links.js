/**
 * 连线层：箭头、折线、边缘求交、连线标签
 */

/** 实心三角箭头，ang 为线段方向弧度 */
function arrowHead(ctx, x, y, ang, size = THEME.arrow) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - size * Math.cos(ang - Math.PI / 6), y - size * Math.sin(ang - Math.PI / 6))
  ctx.lineTo(x - size * Math.cos(ang + Math.PI / 6), y - size * Math.sin(ang + Math.PI / 6))
  ctx.closePath()
  ctx.fillStyle = THEME.fg
  ctx.fill()
}

/** 空心三角箭头（UML 泛化 / 继承） */
function hollowHead(ctx, x, y, ang, size = 12) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - size * Math.cos(ang - Math.PI / 7), y - size * Math.sin(ang - Math.PI / 7))
  ctx.lineTo(x - size * Math.cos(ang + Math.PI / 7), y - size * Math.sin(ang + Math.PI / 7))
  ctx.closePath()
  ctx.fillStyle = THEME.bg
  ctx.fill()
  ctx.strokeStyle = THEME.fg
  ctx.lineWidth = THEME.line
  ctx.setLineDash([])
  ctx.stroke()
}

/** 沿折线按总长比例 t 取点，兼返该处的方向 */
function pointAtFraction(pts, t) {
  const segs = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    segs.push(len)
    total += len
  }
  if (!total) return { x: pts[0].x, y: pts[0].y, ang: 0 }
  let want = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < segs.length; i++) {
    if (want <= segs[i] || i === segs.length - 1) {
      const r = segs[i] ? want / segs[i] : 0
      const a = pts[i], b = pts[i + 1]
      return {
        x: a.x + (b.x - a.x) * r,
        y: a.y + (b.y - a.y) * r,
        ang: Math.atan2(b.y - a.y, b.x - a.x),
      }
    }
    want -= segs[i]
  }
  const last = pts[pts.length - 1]
  return { x: last.x, y: last.y, ang: 0 }
}

/**
 * 折线，points 为 [{x,y}...]
 *   opts.arrow      false 为不画箭头
 *   opts.hollow     空心三角（UML 泛化）
 *   opts.arrowStart 起端也画箭头（双向）
 *   opts.arrowSize  箭头尺寸
 * 返回实际绘制的点列，供渲染器登记供编辑器命中。
 */
function polyline(ctx, points, opts = {}) {
  if (points.length < 2) return points
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.strokeStyle = opts.stroke || THEME.fg
  ctx.lineWidth = opts.lineWidth || THEME.line
  ctx.setLineDash(opts.dashed ? THEME.dashLine : (opts.dash || []))
  ctx.stroke()
  ctx.setLineDash([])

  const size = opts.arrowSize || opts.size
  if (opts.arrow !== false) {
    const p1 = points[points.length - 2]
    const p2 = points[points.length - 1]
    const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    if (opts.hollow) hollowHead(ctx, p2.x, p2.y, ang, size || 12)
    else arrowHead(ctx, p2.x, p2.y, ang, size)
  }
  if (opts.arrowStart) {
    const q1 = points[1]
    const q2 = points[0]
    const ang = Math.atan2(q2.y - q1.y, q2.x - q1.x)
    if (opts.hollow) hollowHead(ctx, q2.x, q2.y, ang, size || 12)
    else arrowHead(ctx, q2.x, q2.y, ang, size)
  }
  return points
}

/** 直线箭头简写 */
function arrow(ctx, x1, y1, x2, y2, opts = {}) {
  polyline(ctx, [{ x: x1, y: y1 }, { x: x2, y: y2 }], opts)
}

/** 连线标签：白底遮罩紧贴文字，避免压线 */
function linkLabel(ctx, x, y, str, opts = {}) {
  if (!str) return
  const fs = opts.fontSize || 12
  const lines = String(str).split('\n')
  const lh = resolveLineHeight(opts.lineHeight, fs, 1.3)
  const w = Math.max(...lines.map(L => measureText(L, fs, opts.bold))) + 8
  const top = y - (lines.length * lh) / 2
  ctx.fillStyle = THEME.bg
  ctx.fillRect(x - w / 2, top, w, lines.length * lh)
  lines.forEach((L, i) => {
    drawText(ctx, x, top + lh * (i + 0.5), L, { fontSize: fs, bold: opts.bold })
  })
}

/** 从矩形中心朝目标点求边缘交点（E-R 连线用） */
function rectEdge(node, tx, ty) {
  const dx = tx - node.cx
  const dy = ty - node.cy
  if (dx === 0 && dy === 0) return { x: node.cx, y: node.cy }
  const s = Math.min(
    Math.abs(node.w / 2 / (dx || 1e-9)),
    Math.abs(node.h / 2 / (dy || 1e-9))
  )
  return { x: node.cx + dx * s, y: node.cy + dy * s }
}

/** 从椭圆中心朝目标点求边缘交点（用例图连线用） */
function ellipseEdge(node, tx, ty) {
  const dx = tx - node.cx
  const dy = ty - node.cy
  const a = node.w / 2, b = node.h / 2
  const t = Math.hypot(dx / a, dy / b) || 1e-9
  return { x: node.cx + dx / t, y: node.cy + dy / t }
}

/** 从菱形中心朝目标点求边缘交点（E-R 关系菱形、流程图判断框）
 *  菱形边界方程 |x|/a + |y|/b = 1
 */
function diamondEdge(node, tx, ty) {
  const dx = tx - node.cx
  const dy = ty - node.cy
  const a = Math.abs(node.w) / 2, b = node.h / 2
  const t = Math.abs(dx) / a + Math.abs(dy) / b
  if (!t) return { x: node.cx, y: node.cy }
  return { x: node.cx + dx / t, y: node.cy + dy / t }
}

/** 圆角终结符：直边段走矩形，两端半圆段走圆 */
function terminatorEdge(node, tx, ty) {
  const hw = Math.abs(node.w) / 2, hh = node.h / 2
  const r = hh
  const flat = hw - r                     // 中间直边段半长
  const p = rectEdge(node, tx, ty)
  const dx = p.x - node.cx
  if (Math.abs(dx) <= flat) return p       // 落在直边段，矩形结果即可
  // 落在圆弧段：向圆心坐标系归一
  const ccx = node.cx + Math.sign(dx) * flat
  const vx = tx - ccx, vy = ty - node.cy
  const len = Math.hypot(vx, vy) || 1e-9
  return { x: ccx + (vx / len) * r, y: node.cy + (vy / len) * r }
}

const EDGE_FN = {
  ellipse: ellipseEdge,
  diamond: diamondEdge,
  terminator: terminatorEdge,
  rect: rectEdge,
}

/**
 * 指定边 + 指定位置的锚点。
 *   side 为空 → 返回 null，由调用方回退到自动边缘求交
 *   at 为 0..1，默认 0.5（边中点）；top/bottom 从左到右，left/right 从上到下
 */
function anchorSide(node, side, at) {
  if (!side) return null
  if (at == null) return node[side] || null
  return anchorAt(node, side, at)
}

/**
 * 把一个被推开的点拉回指定边上：沿边的那个坐标保留并限在边长内，
 * 垂直于边的坐标强制回到边界，从而不会与节点脉开缝隙。
 */
function slideOnSide(node, side, p) {
  const hw = Math.abs(node.w) / 2, hh = node.h / 2
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  switch (side) {
    case 'top': return { x: clamp(p.x, node.cx - hw, node.cx + hw), y: node.cy - hh }
    case 'bottom': return { x: clamp(p.x, node.cx - hw, node.cx + hw), y: node.cy + hh }
    case 'left': return { x: node.cx - hw, y: clamp(p.y, node.cy - hh, node.cy + hh) }
    case 'right': return { x: node.cx + hw, y: clamp(p.y, node.cy - hh, node.cy + hh) }
    default: return p
  }
}

/** 两节点自动边缘对边缘连线
 *  opts.shape      两端统一形状 'rect' | 'ellipse'
 *  opts.fromShape  单独指定起点形状（优先）
 *  opts.toShape    单独指定终点形状（优先）
 *  opts.fromSide   强制从指定边出 'top'|'bottom'|'left'|'right'
 *  opts.toSide     强制接入指定边
 *  opts.bend       正交拐角：'h' 先水平后垂直，'v' 先垂直后水平
 *  opts.offset     沿法线方向平移整条线（避让重叠连线）
 *  opts.dx/dy      标签微调
 * 返回实际点列。
 */
function connect(ctx, from, to, opts = {}) {
  // 形状优先级：显式 fromShape/toShape > 统一 shape > 节点自带的 shape > 矩形
  const pick = s => EDGE_FN[s] || rectEdge
  const fromEdge = pick(opts.fromShape || opts.shape || from.shape)
  const toEdge = pick(opts.toShape || opts.shape || to.shape)

  let p1 = anchorSide(from, opts.fromSide, opts.fromAt)
    || fromEdge(from, to.cx, to.cy)
  let p2 = anchorSide(to, opts.toSide, opts.toAt)
    || toEdge(to, from.cx, from.cy)

  // 沿法线平移，用于拆分两节点间的多条并行连线。
  // 平移后必须重新求交，否则端点会被推离边界留下空隙。
  if (opts.offset) {
    const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    const nx = -Math.sin(ang) * opts.offset
    const ny = Math.cos(ang) * opts.offset
    const s1 = { x: p1.x + nx, y: p1.y + ny }
    const s2 = { x: p2.x + nx, y: p2.y + ny }
    // 指定了 side 的端保持贴在该边上（只沿边滑动），否则沿新方向重求边缘交点
    p1 = opts.fromSide ? slideOnSide(from, opts.fromSide, s1)
      : fromEdge(from, s2.x, s2.y)
    p2 = opts.toSide ? slideOnSide(to, opts.toSide, s2)
      : toEdge(to, s1.x, s1.y)
  }

  let pts = [p1, p2]
  if (opts.bend === 'h') pts = [p1, { x: p2.x, y: p1.y }, p2]
  else if (opts.bend === 'v') pts = [p1, { x: p1.x, y: p2.y }, p2]

  polyline(ctx, pts, opts)
  if (opts.label) {
    const at = pointAtFraction(pts, opts.labelAt == null ? 0.5 : opts.labelAt)
    linkLabel(ctx, at.x + (opts.dx || 0), at.y + (opts.dy || 0), opts.label, opts)
  }
  return pts
}

/** 父→子 L 型连线（模块图树形结构，默认不带箭头）
 *  opts.midY 可指定横向干的 y，不传则取两节点中点
 */
function treeLink(ctx, parent, child, opts = {}) {
  const midY = opts.midY == null ? (parent.bottom.y + child.top.y) / 2 : opts.midY
  const pts = [
    parent.bottom,
    { x: parent.cx, y: midY },
    { x: child.cx, y: midY },
    child.top,
  ]
  polyline(ctx, pts, Object.assign({ arrow: false }, opts))
  if (opts.label) {
    const at = pointAtFraction(pts, opts.labelAt == null ? 0.5 : opts.labelAt)
    linkLabel(ctx, at.x + (opts.dx || 0), at.y + (opts.dy || 0), opts.label, opts)
  }
  return pts
}

/** 时序图自循环：右侧半圆弧回到自身 */
function selfLoop(ctx, cx, y, label, opts = {}) {
  const startX = cx + (opts.barW || 10) / 2
  const r = opts.radius || 18
  ctx.beginPath()
  ctx.arc(startX, y, r, -Math.PI / 2, Math.PI / 2, false)
  ctx.strokeStyle = THEME.fg
  ctx.lineWidth = THEME.line
  ctx.setLineDash([])
  ctx.stroke()
  arrowHead(ctx, startX, y + r, Math.PI)
  if (label) {
    const fs = opts.fontSize || 13
    drawText(ctx, startX + r + fs * 0.9, y, label, { anchor: 'start', fontSize: fs })
  }
}

/** 时序图消息：水平箭头，isReturn 走虚线 */
function message(ctx, x1, x2, y, label, opts = {}) {
  const off = (opts.barW || 10) / 2
  const dir = x2 > x1 ? 1 : -1
  const sx = x1 + dir * off
  const ex = x2 - dir * off
  arrow(ctx, sx, y, ex, y, {
    dashed: !!opts.isReturn,
    lineWidth: opts.lineWidth,
    arrowSize: opts.arrowSize,
  })
  if (label) {
    const fs = opts.fontSize || 13
    const mx = (sx + ex) / 2
    const tw = measureText(label, fs)
    // 遮罩与基线偏移按字号缩放，否则大字号时文字会被裁切或压线
    const h = fs * 1.25
    const gap = fs * 0.5
    ctx.fillStyle = THEME.bg
    ctx.fillRect(mx - tw / 2 - 3, y - gap - h, tw + 6, h)
    drawText(ctx, mx, y - gap - h / 2, label, { fontSize: fs })
  }
}
