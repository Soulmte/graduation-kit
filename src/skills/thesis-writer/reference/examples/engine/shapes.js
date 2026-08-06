/**
 * 图元层：所有形状的 Canvas 绘制函数
 * 约定：每个函数接收 (ctx, 几何参数, opts)，不持有状态。
 * 节点类型统一返回锚点，供连线层取用。
 */

/**
 * 各形状的默认尺寸。
 * 渲染器预登记锚点与图元绘制必须用同一套默认值，
 * 否则连线端点会落在框外（空隙）或框内（穿入）。
 */
const SHAPE_SIZE = {
  rect: [200, 46],
  terminator: [140, 40],
  diamond: [200, 72],
  io: [200, 46],
  ellipse: [180, 60],
  actor: [60, 120],
  vtext: [32, 100],
  lane: [140, 42],
  activation: [10, 60],
  group: [300, 120],
  boundary: [300, 120],
  bar: [40, 60],
  axis: [300, 200],
  label: [null, null],      // 随文字内容
  message: [null, null],    // 由两端决定
  selfloop: [null, null],
}

const VTEXT_PAD = 8

/** 竖排文字的字距：默认 1.3 倍字号，随字号缩放 */
function vtextLineHeight(opts) {
  return resolveLineHeight(opts.lineHeight, opts.fontSize, 1.3)
}

/** 取节点的实际宽高（写了就用写的，否则回退到形状默认）
 *  vtext 高度未指定时按字数乘字距算，改字号时框跟着变高
 */
function resolveSize(n) {
  const d = SHAPE_SIZE[n.shape || 'rect'] || [200, 46]
  if (n.shape === 'vtext' && n.h == null && n.label) {
    const chars = [...String(n.label)].length
    return { w: n.w == null ? d[0] : n.w, h: chars * vtextLineHeight(n) + VTEXT_PAD * 2 }
  }
  return {
    w: n.w == null ? d[0] : n.w,
    h: n.h == null ? d[1] : n.h,
  }
}

/** 计算矩形四边锚点 */
function anchors(cx, cy, w, h) {
  return {
    cx, cy, w, h,
    top: { x: cx, y: cy - h / 2 },
    bottom: { x: cx, y: cy + h / 2 },
    left: { x: cx - w / 2, y: cy },
    right: { x: cx + w / 2, y: cy },
  }
}

/**
 * 沿指定边取点，t 为 0..1 的比例（0.5 即边中点）。
 * top/bottom 从左到右，left/right 从上到下。
 * 菱形等非矩形仍按包围盒计算，因为流程图的分支惯例就是从顶点引出。
 */
function anchorAt(box, side, t) {
  if (t == null || side === undefined) return box[side] || { x: box.cx, y: box.cy }
  const hw = Math.abs(box.w) / 2, hh = box.h / 2
  const r = Math.max(0, Math.min(1, t))
  switch (side) {
    case 'top': return { x: box.cx - hw + box.w * r, y: box.cy - hh }
    case 'bottom': return { x: box.cx - hw + box.w * r, y: box.cy + hh }
    case 'left': return { x: box.cx - hw, y: box.cy - hh + box.h * r }
    case 'right': return { x: box.cx + hw, y: box.cy - hh + box.h * r }
    default: return { x: box.cx, y: box.cy }
  }
}

/** 在 [leftX,rightX] 内均匀排布 count 个宽 cardW 的卡片，首尾贴边 */
function distribute(leftX, rightX, count, cardW) {
  if (count === 1) return [leftX + (rightX - leftX - cardW) / 2]
  const gap = (rightX - leftX - count * cardW) / (count - 1)
  return Array.from({ length: count }, (_, i) => leftX + i * (cardW + gap))
}

function setFont(ctx, size = THEME.fontSize, bold = false, italic = false) {
  const style = italic ? 'italic ' : ''
  ctx.font = `${style}${bold ? 'bold ' : ''}${size}px ${THEME.font}`
}

/** 单行文字，可选下划线（主键属性用） */
function drawText(ctx, x, y, str, opts = {}) {
  setFont(ctx, opts.fontSize, opts.bold, opts.italic)
  ctx.fillStyle = opts.fill || THEME.fg
  ctx.textAlign = opts.anchor || 'center'
  ctx.textBaseline = opts.baseline || 'middle'
  ctx.fillText(str, x, y)
  if (opts.underline) {
    const fs = opts.fontSize || THEME.fontSize
    const w = measureText(str, fs, opts.bold)
    const ux = opts.anchor === 'start' ? x : x - w / 2
    ctx.save()
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(ux, y + fs * 0.62)
    ctx.lineTo(ux + w, y + fs * 0.62)
    ctx.stroke()
    ctx.restore()
  }
  ctx.textAlign = 'center'
}

/** 多行文字：以 \n 分行，垂直居中（行距随字号缩放） */
function drawLines(ctx, x, y, str, opts = {}) {
  const lines = String(str).split('\n')
  const lh = resolveLineHeight(opts.lineHeight, opts.fontSize)
  const startY = y - ((lines.length - 1) * lh) / 2
  lines.forEach((ln, i) => drawText(ctx, x, startY + i * lh, ln, opts))
}

/** 描边+填白的通用收尾 */
function stroked(ctx, opts = {}) {
  ctx.fillStyle = opts.fill || THEME.bg
  if (opts.fill !== 'none') ctx.fill()
  ctx.strokeStyle = opts.stroke || THEME.fg
  ctx.lineWidth = opts.lineWidth || THEME.line
  ctx.setLineDash(opts.dash || [])
  ctx.stroke()
  ctx.setLineDash([])
}

/** 矩形节点（处理框 / 实体框 / 普通卡片） */
function nodeRect(ctx, cx, cy, w, h, label, opts = {}) {
  ctx.beginPath()
  ctx.rect(cx - w / 2, cy - h / 2, w, h)
  stroked(ctx, opts)
  if (label) drawLines(ctx, cx, cy, label, opts)
  return anchors(cx, cy, w, h)
}

/** 圆角终结符（开始 / 结束） */
function nodeTerminator(ctx, cx, cy, label, opts = {}) {
  const s = resolveSize(Object.assign({ shape: 'terminator' }, opts))
  const w = s.w, h = s.h, r = h / 2
  const x = cx - w / 2, y = cy - h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  stroked(ctx, opts)
  drawLines(ctx, cx, cy, label, Object.assign({ bold: true }, opts))
  return anchors(cx, cy, w, h)
}

/** 菱形（判断 / E-R 关系） */
function nodeDiamond(ctx, cx, cy, w, h, label, opts = {}) {
  ctx.beginPath()
  ctx.moveTo(cx, cy - h / 2)
  ctx.lineTo(cx + w / 2, cy)
  ctx.lineTo(cx, cy + h / 2)
  ctx.lineTo(cx - w / 2, cy)
  ctx.closePath()
  stroked(ctx, opts)
  if (label) drawLines(ctx, cx, cy, label, opts)
  return anchors(cx, cy, w, h)
}

/** 平行四边形（输入 / 输出） */
function nodeIO(ctx, cx, cy, w, h, label, opts = {}) {
  const s = opts.slant || 14
  const x = cx - w / 2, y = cy - h / 2
  ctx.beginPath()
  ctx.moveTo(x + s, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w - s, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
  stroked(ctx, opts)
  if (label) drawLines(ctx, cx, cy, label, opts)
  return anchors(cx, cy, w, h)
}

/** 椭圆（用例 / 属性） */
function nodeEllipse(ctx, cx, cy, w, h, label, opts = {}) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
  stroked(ctx, opts)
  if (label) drawLines(ctx, cx, cy, label, opts)
  return anchors(cx, cy, w, h)
}

/** 用例图参与者：火柴人 + 下方名称 */
function nodeActor(ctx, cx, cy, label, opts = {}) {
  const r = opts.headR || 14
  const bodyTop = cy - r * 0.2
  const bodyBottom = bodyTop + 46
  ctx.lineWidth = opts.lineWidth || THEME.line
  ctx.strokeStyle = THEME.fg
  ctx.setLineDash([])
  // 头
  ctx.beginPath()
  ctx.arc(cx, cy - r - 22, r, 0, Math.PI * 2)
  ctx.fillStyle = THEME.bg
  ctx.fill()
  ctx.stroke()
  // 躯干 + 四肢
  ctx.beginPath()
  ctx.moveTo(cx, bodyTop - 8)
  ctx.lineTo(cx, bodyBottom - 16)
  ctx.moveTo(cx - 22, bodyTop + 6)
  ctx.lineTo(cx + 22, bodyTop + 6)
  ctx.moveTo(cx, bodyBottom - 16)
  ctx.lineTo(cx - 18, bodyBottom + 12)
  ctx.moveTo(cx, bodyBottom - 16)
  ctx.lineTo(cx + 18, bodyBottom + 12)
  ctx.stroke()
  if (label) drawText(ctx, cx, bodyBottom + 32, label, Object.assign({ bold: true }, opts))
  return anchors(cx, cy, 60, 120)
}

/** 分组虚线框，标题带白底遮罩紧贴文字 */
function groupBox(ctx, x, y, w, h, title, opts = {}) {
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  stroked(ctx, { fill: 'none', dash: THEME.dash })
  if (!title) return
  const fs = opts.fontSize || 16
  const tw = measureText(title, fs, true)
  const pad = Math.max(4, fs * 0.25)
  const lh = resolveLineHeight(null, fs, 1.35)
  const lx = x + (opts.titleOffset || 20)
  ctx.fillStyle = THEME.bg
  ctx.fillRect(lx - pad, y - lh / 2, tw + pad * 2, lh)
  drawText(ctx, lx, y, title, { anchor: 'start', fontSize: fs, bold: true })
}

/** 时序图泳道头（黑底白字）+ 生命线 */
function lifeline(ctx, cx, headY, headW, headH, name, bottomY) {
  ctx.fillStyle = THEME.fg
  ctx.fillRect(cx - headW / 2, headY, headW, headH)
  drawText(ctx, cx, headY + headH / 2, name, { bold: true, fontSize: 15, fill: THEME.bg })
  ctx.beginPath()
  ctx.moveTo(cx, headY + headH)
  ctx.lineTo(cx, bottomY)
  ctx.strokeStyle = THEME.fg
  ctx.lineWidth = THEME.thin
  ctx.setLineDash(THEME.lifeline)
  ctx.stroke()
  ctx.setLineDash([])
}

/** 时序图激活条（白底矩形遮盖生命线） */
function activationBar(ctx, cx, yTop, yBottom, w = 10) {
  ctx.beginPath()
  ctx.rect(cx - w / 2, yTop, w, yBottom - yTop)
  stroked(ctx, { lineWidth: THEME.thin })
}

/** 用例图系统边界：实线矩形 + 顶部标题 */
function boundaryBox(ctx, x, y, w, h, title, opts = {}) {
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  stroked(ctx, { fill: 'none', lineWidth: opts.lineWidth || 1.8 })
  if (title) {
    drawText(ctx, x + w / 2, y + (opts.titleY || 22), title,
      { bold: true, fontSize: opts.fontSize || 16 })
  }
}

/** 竖排文字矩形（模块图二级功能，高度随字数）
 *  字距按字号缩放，改字号时不会粘连
 */
function nodeVText(ctx, cx, cy, w, h, label, opts = {}) {
  const chars = [...String(label)]
  const lh = vtextLineHeight(opts)
  ctx.beginPath()
  ctx.rect(cx - w / 2, cy - h / 2, w, h)
  stroked(ctx, opts)
  const startY = cy - ((chars.length - 1) * lh) / 2
  chars.forEach((ch, i) => drawText(ctx, cx, startY + i * lh, ch, opts))
  return anchors(cx, cy, w, h)
}

/** 时序图泳道：黑底头 + 生命线（cx/cy 为头部中心，便于拖拽） */
function nodeLane(ctx, cx, cy, w, h, label, opts = {}) {
  const bottom = opts.laneBottom == null ? cy + h / 2 + 400 : opts.laneBottom
  ctx.fillStyle = THEME.fg
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h)
  drawText(ctx, cx, cy, label, {
    bold: true,
    fontSize: opts.fontSize || 15,
    fill: THEME.bg,
  })
  ctx.beginPath()
  ctx.moveTo(cx, cy + h / 2)
  ctx.lineTo(cx, bottom)
  ctx.strokeStyle = THEME.fg
  ctx.lineWidth = opts.lineWidth || THEME.thin
  ctx.setLineDash(THEME.lifeline)
  ctx.stroke()
  ctx.setLineDash([])
  return anchors(cx, cy, w, h)
}

/** 分组虚线框节点包装（cx/cy 为框中心，可拖拽） */
function nodeGroup(ctx, cx, cy, w, h, label, opts = {}) {
  groupBox(ctx, cx - w / 2, cy - h / 2, w, h, label, opts)
  return anchors(cx, cy, w, h)
}

/** 系统边界节点包装 */
function nodeBoundary(ctx, cx, cy, w, h, label, opts = {}) {
  boundaryBox(ctx, cx - w / 2, cy - h / 2, w, h, label, opts)
  return anchors(cx, cy, w, h)
}

/** 纯文字节点（轴标题、数值标注等），mask 为真时先铺白底遮住连线 */
function nodeLabel(ctx, cx, cy, w, h, label, opts = {}) {
  const fs = opts.fontSize || THEME.fontSize
  const lines = String(label).split('\n')
  const lh = resolveLineHeight(opts.lineHeight, fs)
  const textW = Math.max(...lines.map(l => measureText(l, fs, opts.bold))) + 8
  const textH = lines.length * lh + 4

  if (opts.mask) {
    ctx.fillStyle = THEME.bg
    ctx.fillRect(cx - textW / 2, cy - textH / 2, textW, textH)
  }
  if (opts.rotate) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(opts.rotate)
    drawLines(ctx, 0, 0, label, opts)
    ctx.restore()
    // 旋转后包围盒交换宽高（仅支持 ±90°，这是轴标题的唯一用法）
    return anchors(cx, cy, w || textH, h || textW)
  }
  drawLines(ctx, cx, cy, label, opts)
  return anchors(cx, cy, w || textW, h || textH)
}

/** 实心矩形柱（柱状图），cy 为柱体中心 */
function nodeBar(ctx, cx, cy, w, h, label, opts = {}) {
  ctx.fillStyle = opts.barFill || THEME.fg
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h)
  return anchors(cx, cy, w, h)
}

/** 坐标轴（L 形）+ Y 刻度 */
function nodeAxis(ctx, cx, cy, w, h, label, opts = {}) {
  const x0 = cx - w / 2
  const y1 = cy + h / 2
  ctx.beginPath()
  ctx.moveTo(x0, cy - h / 2)
  ctx.lineTo(x0, y1)
  ctx.lineTo(cx + w / 2, y1)
  ctx.strokeStyle = THEME.fg
  ctx.lineWidth = opts.lineWidth || THEME.line
  ctx.setLineDash([])
  ctx.stroke()
  ;(opts.ticks || []).forEach(t => {
    const y = y1 - t.ratio * h
    drawText(ctx, x0 - 8, y, t.label, { anchor: 'end', fontSize: opts.fontSize || 14 })
    ctx.beginPath()
    ctx.moveTo(x0 - 4, y)
    ctx.lineTo(x0, y)
    ctx.stroke()
  })
  return anchors(cx, cy, w, h)
}
