/**
 * 编辑器：选中 / 拖拽 / 属性编辑 / 撤销 / 持久化 / 导出
 * 所有修改直接作用于 spec.nodes，导出数据后可粘回数据文件固化。
 */
const cv = document.getElementById('cv')
const pick = document.getElementById('pick')
const panel = document.getElementById('panel')
const hint = document.getElementById('hint')

let stage = null
let renderer = null
let spec = null          // 当前图（深拷贝，不污染原始 DIAGRAMS）
let pristine = null      // 原始快照，用于重置
let editing = false
let selected = null      // 主选中节点（面板展示它的属性）
const selection = []     // 多选集，包含 selected
let dragging = false
let marquee = null       // 框选矩形 { x0, y0, x1, y1 }
let dragOffs = null      // 多选拖动时各节点相对主选的偏移
let snapGrid = false     // 网格吸附
let resizing = null      // 正在缩放的手柄方位
let startBox = null      // 缩放起始几何
let startPt = null
let offX = 0, offY = 0
const undoStack = []
const redoStack = []
const guides = []        // 当前对齐参考线
const GRID = 8           // 网格步长

/** 设置选择集，最后一个作为主选 */
function setSelection(list) {
  selection.length = 0
  ;(list || []).forEach(n => { if (n && !selection.includes(n)) selection.push(n) })
  selected = selection.length ? selection[selection.length - 1] : null
}

function toggleSelection(n) {
  const i = selection.indexOf(n)
  if (i >= 0) selection.splice(i, 1)
  else selection.push(n)
  selected = selection.length ? selection[selection.length - 1] : null
}

function say(msg) { hint.textContent = msg }

// ===== 图表列表 =====
const keys = Object.keys(DIAGRAMS)
keys.forEach(k => {
  const o = document.createElement('option')
  o.value = k
  o.textContent = DIAGRAMS[k].name
  pick.appendChild(o)
})

/** 连线浅拷贝不够：points 数组与里面的坐标对象必须断开引用 */
function cloneLink(l) {
  const o = Object.assign({}, l)
  if (l.points) o.points = l.points.map(p => (typeof p === 'string' ? p : { x: p.x, y: p.y }))
  return o
}

/** 深拷贝 spec，但保留 custom 函数引用 */
function cloneSpec(src) {
  const out = Object.assign({}, src)
  out.nodes = (src.nodes || []).map(n => Object.assign({}, n))
  out.links = (src.links || []).map(cloneLink)
  if (src.messages) out.messages = src.messages.map(m => Object.assign({}, m))
  return out
}

function load(key) {
  spec = cloneSpec(DIAGRAMS[key])
  pristine = cloneSpec(DIAGRAMS[key])
  setSelection([])
  selLink = null
  undoStack.length = 0
  redoStack.length = 0
  stage = new Stage(cv, spec.width, spec.height, 2)
  applySaved()
  stage.resize(spec.width, spec.height)
  redraw()
  buildPanel()
}

function redraw() {
  renderer = new Renderer(spec)
  stage.begin()
  renderer.draw(stage)
  if (editing) {
    drawGuides()
    drawMultiOutlines()
    if (selected) drawSelection()
    if (selLink) drawLinkSelection()
    drawMarquee()
  }
}

/** 选中高亮：蓝色虚线包围盒 + 四角缩放手柄（绑定维度用锁形提示） */
const HANDLE = 7

function selectionBox() {
  return boxOf(selected)
}

/** 指定节点的选中包围盒（带内边距） */
function boxOf(n) {
  const box = n && renderer.nodes[n.id]
  if (!box) return null
  const pad = 5
  return {
    x: box.cx - Math.abs(box.w) / 2 - pad,
    y: box.cy - box.h / 2 - pad,
    w: Math.abs(box.w) + pad * 2,
    h: box.h + pad * 2,
  }
}

/** 四角手柄坐标 */
function handlePoints(b) {
  return [
    { k: 'nw', x: b.x,       y: b.y },
    { k: 'ne', x: b.x + b.w, y: b.y },
    { k: 'sw', x: b.x,       y: b.y + b.h },
    { k: 'se', x: b.x + b.w, y: b.y + b.h },
  ]
}

function drawSelection() {
  const ctx = stage.ctx
  const b = selectionBox()
  if (!b) return

  ctx.save()
  ctx.strokeStyle = '#1976d2'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 3])
  ctx.strokeRect(b.x, b.y, b.w, b.h)
  ctx.setLineDash([])

  // 可缩放的形状才画手柄（多选时不画，避免误操作）
  if (selection.length <= 1 && canResize(selected)) {
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#1976d2'
    ctx.lineWidth = 1.5
    handlePoints(b).forEach(p => {
      ctx.beginPath()
      ctx.rect(p.x - HANDLE / 2, p.y - HANDLE / 2, HANDLE, HANDLE)
      ctx.fill()
      ctx.stroke()
    })
  }

  // 绑定维度提示
  const locks = []
  if (isBoundX(selected)) locks.push('X 已绑定')
  if (isBoundY(selected)) locks.push('Y 已绑定')
  if (locks.length) {
    ctx.fillStyle = '#1976d2'
    ctx.font = `11px ${THEME.font}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(locks.join('  '), b.x, b.y - 4)
  }
  ctx.restore()
}

/** 非主选的其余选中项：细实线轮廓 */
function drawMultiOutlines() {
  if (selection.length < 2) return
  const ctx = stage.ctx
  ctx.save()
  ctx.strokeStyle = '#64b5f6'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  selection.forEach(n => {
    if (n === selected) return
    const b = boxOf(n)
    if (b) ctx.strokeRect(b.x, b.y, b.w, b.h)
  })
  ctx.restore()
}

/** 选中的连线：蓝色加粗覆盖 + 两端小圆点 */
function drawLinkSelection() {
  const rec = renderer.links[selLink.id]
  if (!rec) return
  const pts = rec.points
  const ctx = stage.ctx
  ctx.save()
  ctx.strokeStyle = '#1976d2'
  ctx.lineWidth = (selLink.lineWidth || THEME.line) + 3
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.stroke()

  // 端点与拐点：自由拐点画实心方块，可拖的端点画实心圆，其余画空心圆
  ctx.lineWidth = 1.5
  const lastIdx = pts.length - 1
  pts.forEach((p, i) => {
    const freeVertex = selLink.points && typeof selLink.points[i] !== 'string'
    const isEnd = i === 0 || i === lastIdx
    ctx.beginPath()
    if (freeVertex) {
      ctx.fillStyle = '#1976d2'
      ctx.rect(p.x - 4, p.y - 4, 8, 8)
    } else if (isEnd) {
      // 箭头端：拖它可改接入位置
      ctx.fillStyle = '#ff6d00'
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    } else {
      ctx.fillStyle = '#fff'
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.stroke()
  })
  ctx.restore()
}

/** 框选矩形 */
function drawMarquee() {
  if (!marquee) return
  const ctx = stage.ctx
  const x = Math.min(marquee.x0, marquee.x1)
  const y = Math.min(marquee.y0, marquee.y1)
  const w = Math.abs(marquee.x1 - marquee.x0)
  const h = Math.abs(marquee.y1 - marquee.y0)
  ctx.save()
  ctx.fillStyle = 'rgba(25,118,210,.10)'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = '#1976d2'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

/** 文字类与固定尺寸类不提供缩放 */
function canResize(n) {
  return !['label', 'actor', 'terminator', 'selfloop', 'message'].includes(n.shape)
}

/** 命中手柄返回方位，否则 null */
function hitHandle(pt) {
  if (!selected || !canResize(selected)) return null
  const b = selectionBox()
  if (!b) return null
  const r = HANDLE + 2
  for (const p of handlePoints(b)) {
    if (Math.abs(pt.x - p.x) <= r && Math.abs(pt.y - p.y) <= r) return p.k
  }
  return null
}

// ===== 命中测试 =====
/** 容器类形状（大框）优先级最低，避免遮挡内部小元素 */
const LOW_PRIORITY = { group: 1, boundary: 1, axis: 1 }

function hit(pt) {
  const list = spec.nodes || []
  const cands = []
  list.forEach((n, i) => {
    if (n.hidden) return
    const box = renderer.nodes[n.id]
    if (!box) return
    const hw = Math.abs(box.w) / 2 + 3
    const hh = box.h / 2 + 3
    if (Math.abs(pt.x - box.cx) <= hw && Math.abs(pt.y - box.cy) <= hh) {
      cands.push({
        n, i,
        low: LOW_PRIORITY[n.shape] || 0,
        area: Math.abs(box.w) * box.h,
      })
    }
  })
  if (!cands.length) return null
  // 非容器优先；同类取面积最小（最内层）
  cands.sort((a, b) => a.low - b.low || a.area - b.area)
  return cands[0].n
}

// ===== 连线命中 =====
const LINK_TOL = 6       // 点到线段的容差（逻辑像素）

/** 点到线段距离 */
function distToSeg(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y
  const len2 = vx * vx + vy * vy
  if (!len2) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t))
}

/** 点到整条折线的最短距离 */
function distToPolyline(p, pts) {
  let best = Infinity
  for (let i = 1; i < pts.length; i++) {
    best = Math.min(best, distToSeg(p, pts[i - 1], pts[i]))
  }
  return best
}

/** 命中连线：取最近的一条 */
function hitLink(pt) {
  let best = null
  Object.keys(renderer.links).forEach(id => {
    const rec = renderer.links[id]
    const d = distToPolyline(pt, rec.points)
    const tol = LINK_TOL + (rec.link.lineWidth || THEME.line)
    if (d <= tol && (!best || d < best.d)) best = { d, link: rec.link }
  })
  return best ? best.link : null
}

/** 当前选中的连线（与节点选择互斥） */
let selLink = null
let dragVertex = -1     // 正在拖的折线拐点下标，-1 表示拖标签
let dragEnd = null      // 正在拖的连线端点 { end, idx }

/** 命中已选连线的可拖拐点（仅裸坐标点可拖，锚点引用由节点决定） */
function hitVertex(pt) {
  if (!selLink || !selLink.points) return -1
  const rec = renderer.links[selLink.id]
  if (!rec) return -1
  for (let i = 0; i < rec.points.length; i++) {
    if (typeof selLink.points[i] === 'string') continue   // 锚点引用，不可直接拖
    const p = rec.points[i]
    if (Math.hypot(pt.x - p.x, pt.y - p.y) <= 7) return i
  }
  return -1
}

// ===== 连线端点（箭头位置）拖拽 =====
/**
 * 端点可拖的情形：
 *   from/to 式连线   → 写入 fromSide/fromAt 或 toSide/toAt
 *   points 式锚点引用 → 重写 'id.side@at'
 * 返回 { end: 'from'|'to', idx } 或 null
 */
function hitEndpoint(pt) {
  if (!selLink) return null
  const rec = renderer.links[selLink.id]
  if (!rec) return null
  const pts = rec.points
  const near = p => Math.hypot(pt.x - p.x, pt.y - p.y) <= 7

  if (selLink.points) {
    for (const i of [0, selLink.points.length - 1]) {
      if (typeof selLink.points[i] === 'string' && near(pts[i])) {
        return { end: i === 0 ? 'from' : 'to', idx: i }
      }
    }
    return null
  }
  if (near(pts[0])) return { end: 'from', idx: 0 }
  if (near(pts[pts.length - 1])) return { end: 'to', idx: pts.length - 1 }
  return null
}

/** 端点归属的节点 id */
function endpointNodeId(end) {
  if (!selLink.points) return end === 'from' ? selLink.from : selLink.to
  const i = end === 'from' ? 0 : selLink.points.length - 1
  const ref = selLink.points[i]
  return typeof ref === 'string' ? ref.split('@')[0].split('.')[0] : null
}

/** 把一个自由点投影到节点包围盒的最近边，返回 { side, at } */
function projectToSide(box, pt) {
  const hw = Math.abs(box.w) / 2, hh = box.h / 2
  const l = box.cx - hw, r = box.cx + hw
  const t = box.cy - hh, b = box.cy + hh
  const cand = [
    { side: 'top', d: Math.abs(pt.y - t), at: (pt.x - l) / (hw * 2) },
    { side: 'bottom', d: Math.abs(pt.y - b), at: (pt.x - l) / (hw * 2) },
    { side: 'left', d: Math.abs(pt.x - l), at: (pt.y - t) / (hh * 2) },
    { side: 'right', d: Math.abs(pt.x - r), at: (pt.y - t) / (hh * 2) },
  ]
  // 点在框外时，垂直方向的偏离也计入，避免拖到角上选错边
  cand.forEach(c => {
    if (c.side === 'top' || c.side === 'bottom') c.d += Math.max(0, Math.abs(pt.x - box.cx) - hw)
    else c.d += Math.max(0, Math.abs(pt.y - box.cy) - hh)
  })
  cand.sort((a, b2) => a.d - b2.d)
  const best = cand[0]
  return { side: best.side, at: Math.max(0, Math.min(1, best.at)) }
}

/** 把拖动结果写回连线 */
function setEndpoint(end, side, at) {
  const snap = Math.round(at * 20) / 20      // 步长 5%，方便对齐
  const isMid = Math.abs(snap - 0.5) < 1e-6
  if (selLink.points) {
    const i = end === 'from' ? 0 : selLink.points.length - 1
    const id = endpointNodeId(end)
    selLink.points[i] = isMid ? `${id}.${side}` : `${id}.${side}@${snap}`
  } else {
    const sk = end === 'from' ? 'fromSide' : 'toSide'
    const ak = end === 'from' ? 'fromAt' : 'toAt'
    selLink[sk] = side
    if (isMid) delete selLink[ak]
    else selLink[ak] = snap
  }
}

// ===== 拖拽 =====
function snapshot() {
  undoStack.push(captureState())
  if (undoStack.length > 80) undoStack.shift()
  redoStack.length = 0
}

cv.addEventListener('mousedown', e => {
  if (!editing) return
  const pt = stage.toLocal(e)

  // 先判手柄（优先于选中新元素）
  const hk = hitHandle(pt)
  if (hk) {
    snapshot()
    resizing = hk
    startBox = { cx: selected.cx, cy: selected.cy, w: selected.w || 0, h: selected.h || 0 }
    startPt = pt
    return
  }

  // 已选连线的拐点，优先于一切
  const vi = hitVertex(pt)
  if (vi >= 0) {
    snapshot()
    dragging = true
    dragVertex = vi
    dragOffs = null
    return
  }

  // 连线端点（箭头）：拖到节点周边任意位置
  const ep = hitEndpoint(pt)
  if (ep) {
    snapshot()
    dragging = true
    dragEnd = ep
    dragOffs = null
    return
  }

  const found = hit(pt)

  // 没点到节点，先看是不是点在连线上
  if (!found) {
    const link = hitLink(pt)
    if (link) {
      setSelection([])
      selLink = link
      // 拖动连线 = 拖它的标签偏移
      snapshot()
      dragging = true
      offX = pt.x - (link.dx || 0)
      offY = pt.y - (link.dy || 0)
      dragOffs = null
      redraw()
      buildPanel()
      return
    }
  }

  // 选节点或框选时取消连线选中
  selLink = null

  // 空白处按下 → 开始框选
  if (!found) {
    if (!e.shiftKey) setSelection([])
    marquee = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y, add: e.shiftKey }
    redraw()
    buildPanel()
    return
  }

  if (e.shiftKey) {
    toggleSelection(found)
    redraw()
    buildPanel()
    return
  }

  // 点已在选集里的元素：保留多选整体拖动
  if (!selection.includes(found)) setSelection([found])
  else selected = found

  snapshot()
  dragging = true
  offX = pt.x - found.cx
  offY = pt.y - found.cy
  // 记录其余选中项相对主选的偏移
  dragOffs = selection.map(n => ({ n, dx: n.cx - found.cx, dy: n.cy - found.cy }))
  redraw()
  buildPanel()
})

cv.addEventListener('mousemove', e => {
  if (!editing) return
  const pt = stage.toLocal(e)

  if (resizing) {
    doResize(pt)
    return
  }

  if (marquee) {
    marquee.x1 = pt.x
    marquee.y1 = pt.y
    applyMarquee()
    redraw()
    buildPanel()
    return
  }

  if (!dragging) {
    const hk = hitHandle(pt)
    if (hk) {
      cv.style.cursor = (hk === 'nw' || hk === 'se') ? 'nwse-resize' : 'nesw-resize'
    } else if (hit(pt)) {
      cv.style.cursor = 'move'
    } else if (hitVertex(pt) >= 0 || hitEndpoint(pt)) {
      cv.style.cursor = 'grab'
    } else {
      cv.style.cursor = hitLink(pt) ? 'pointer' : 'default'
    }
    return
  }

  // 拖连线：移动它的标签位置
  if (selLink) {
    // 拖端点：投影到最近的边，写入 side + at
    if (dragEnd) {
      const nid = endpointNodeId(dragEnd.end)
      const box = nid && renderer.nodes[nid]
      if (box) {
        const pr = projectToSide(box, pt)
        setEndpoint(dragEnd.end, pr.side, pr.at)
        redraw()
        buildPanel()
        say(`${selLink.id}  ${dragEnd.end === 'from' ? '起点' : '箭头'} → ${pr.side} ${Math.round(pr.at * 100)}%`)
      }
      return
    }
    if (dragVertex >= 0) {
      let vx = Math.round(pt.x)
      let vy = Math.round(pt.y)
      if (snapGrid) {
        vx = Math.round(vx / GRID) * GRID
        vy = Math.round(vy / GRID) * GRID
      }
      selLink.points[dragVertex] = { x: vx, y: vy }
      redraw()
      say(`${selLink.id}  拐点 ${dragVertex} → ${vx}, ${vy}`)
      return
    }
    selLink.dx = Math.round(pt.x - offX)
    selLink.dy = Math.round(pt.y - offY)
    redraw()
    syncInputs()
    say(`${selLink.id}  标签偏移 ${selLink.dx}, ${selLink.dy}`)
    return
  }


  // 拖动：已绑定的维度不响应
  let nx = Math.round(pt.x - offX)
  let ny = Math.round(pt.y - offY)
  if (snapGrid) {
    nx = Math.round(nx / GRID) * GRID
    ny = Math.round(ny / GRID) * GRID
    guides.length = 0
  } else if (!e.altKey) {
    const snapped = snapPosition(selected, nx, ny)
    nx = snapped.x
    ny = snapped.y
  }

  // 多选：整体平移（依主选位移量）
  if (dragOffs && dragOffs.length > 1) {
    const shiftX = nx - selected.cx
    const shiftY = ny - selected.cy
    dragOffs.forEach(o => {
      if (!isBoundX(o.n)) o.n.cx += shiftX
      if (!isBoundY(o.n)) o.n.cy += shiftY
    })
    say(`已选 ${selection.length} 个元素  Δx=${shiftX}  Δy=${shiftY}`)
  } else {
    if (!isBoundX(selected)) selected.cx = nx
    if (!isBoundY(selected)) selected.cy = ny
    const lock = []
    if (isBoundX(selected)) lock.push('X锁')
    if (isBoundY(selected)) lock.push('Y锁')
    say(`${selected.id}  cx=${selected.cx}  cy=${selected.cy}${lock.length ? '  [' + lock.join(' ') + ']' : ''}`)
  }
  redraw()
  syncInputs()
})

/** 框选命中：与选框相交即选中；容器类需完全包含，避免一拉就带上大框 */
function applyMarquee() {
  const x = Math.min(marquee.x0, marquee.x1)
  const y = Math.min(marquee.y0, marquee.y1)
  const X = Math.max(marquee.x0, marquee.x1)
  const Y = Math.max(marquee.y0, marquee.y1)
  const picked = []
  ;(spec.nodes || []).forEach(n => {
    if (n.hidden) return
    const b = renderer.nodes[n.id]
    if (!b) return
    const hw = Math.abs(b.w) / 2, hh = b.h / 2
    const l = b.cx - hw, r = b.cx + hw, t = b.cy - hh, bo = b.cy + hh
    const inside = l >= x && r <= X && t >= y && bo <= Y
    const cross = l <= X && r >= x && t <= Y && bo >= y
    if (LOW_PRIORITY[n.shape] ? inside : cross) picked.push(n)
  })
  if (marquee.add) {
    picked.forEach(n => { if (!selection.includes(n)) selection.push(n) })
    selected = selection.length ? selection[selection.length - 1] : null
  } else {
    setSelection(picked)
  }
  say(picked.length ? `框选 ${selection.length} 个元素` : '')
}

/** 四角缩放：对角固定，反推 cx/cy/w/h */
// ===== 吸附对齐 =====
const SNAP = 6           // 吸附阈值（逻辑像素）

/**
 * 拖动时与其他元素的左/中/右、上/中/下对齐。
 * 返回修正后坐标，并写入 guides 用于绘制参考线。
 * 按住 Alt 可临时禁用。
 */
function snapPosition(node, nx, ny) {
  guides.length = 0
  const self = renderer.nodes[node.id]
  if (!self) return { x: nx, y: ny }
  const hw = Math.abs(self.w) / 2
  const hh = self.h / 2

  // 候选吸附线：自身三个参考位置 vs 其他元素三个位置
  let bestX = null, bestY = null

  for (const other of spec.nodes) {
    if (other.id === node.id || other.hidden) continue
    const o = renderer.nodes[other.id]
    if (!o) continue
    const ow = Math.abs(o.w) / 2
    const oh = o.h / 2

    // X 方向：中忹中、左对左、右对右
    const xPairs = [
      [nx, o.cx], [nx - hw, o.cx - ow], [nx + hw, o.cx + ow],
    ]
    xPairs.forEach(([mine, target], i) => {
      const d = Math.abs(mine - target)
      if (d <= SNAP && (!bestX || d < bestX.d)) {
        bestX = { d, delta: target - mine, line: target }
      }
    })

    // Y 方向
    const yPairs = [
      [ny, o.cy], [ny - hh, o.cy - oh], [ny + hh, o.cy + oh],
    ]
    yPairs.forEach(([mine, target]) => {
      const d = Math.abs(mine - target)
      if (d <= SNAP && (!bestY || d < bestY.d)) {
        bestY = { d, delta: target - mine, line: target }
      }
    })
  }

  let rx = nx, ry = ny
  if (bestX) {
    rx = Math.round(nx + bestX.delta)
    guides.push({ vertical: true, at: bestX.line })
  }
  if (bestY) {
    ry = Math.round(ny + bestY.delta)
    guides.push({ vertical: false, at: bestY.line })
  }
  return { x: rx, y: ry }
}

/** 绘制对齐参考线（橙色细虚线） */
function drawGuides() {
  if (!guides.length) return
  const ctx = stage.ctx
  ctx.save()
  ctx.strokeStyle = '#ff6d00'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  guides.forEach(g => {
    ctx.beginPath()
    if (g.vertical) {
      ctx.moveTo(g.at, 0)
      ctx.lineTo(g.at, stage.height)
    } else {
      ctx.moveTo(0, g.at)
      ctx.lineTo(stage.width, g.at)
    }
    ctx.stroke()
  })
  ctx.restore()
}

/** 四角缩放：对角固定，反推 cx/cy/w/h */
function doResize(pt) {
  const s = startBox
  const dx = pt.x - startPt.x
  const dy = pt.y - startPt.y
  const signX = (resizing === 'ne' || resizing === 'se') ? 1 : -1
  const signY = (resizing === 'sw' || resizing === 'se') ? 1 : -1

  const w = Math.max(8, Math.round(s.w + dx * signX * 2))
  const h = Math.max(8, Math.round(s.h + dy * signY * 2))
  selected.w = w
  selected.h = h
  say(`${selected.id}  w=${w}  h=${h}`)
  redraw()
  syncInputs()
}

function stopDrag() {
  const wasMarquee = !!marquee
  dragging = false
  resizing = null
  marquee = null
  dragOffs = null
  dragVertex = -1
  dragEnd = null
  guides.length = 0
  if (editing) redraw()
  if (wasMarquee) buildPanel()
}
cv.addEventListener('mouseup', stopDrag)
cv.addEventListener('mouseleave', stopDrag)

// 双击连线：在最近的线段上插入一个拐点；双击拐点：删除它
cv.addEventListener('dblclick', e => {
  if (!editing) return
  const pt = stage.toLocal(e)

  const vi = hitVertex(pt)
  if (vi >= 0) {
    // 保留至少两个点
    if (selLink.points.length <= 2) return say('至少需保留两个点')
    snapshot()
    selLink.points.splice(vi, 1)
    redraw()
    buildPanel()
    say('已删除拐点')
    return
  }

  const link = selLink && distToPolyline(pt, (renderer.links[selLink.id] || {}).points || []) <= 10
    ? selLink
    : hitLink(pt)
  if (!link) return

  snapshot()
  selLink = link
  // 两端节点式连线先转成显式折线，才能插入自由拐点
  if (!link.points) convertToPolyline(link)
  const rec = renderer.links[link.id]
  const at = nearestSegment(pt, rec ? rec.points : [])
  link.points.splice(at + 1, 0, { x: Math.round(pt.x), y: Math.round(pt.y) })
  redraw()
  buildPanel()
  say('已插入拐点，拖它调整走线')
})

/** 返回点最靠近的线段起始下标 */
function nearestSegment(p, pts) {
  let best = 0, bd = Infinity
  for (let i = 1; i < pts.length; i++) {
    const d = distToSeg(p, pts[i - 1], pts[i])
    if (d < bd) { bd = d; best = i - 1 }
  }
  return best
}

/** 把 from/to 式连线转为 points 式，两端仍用锚点引用以便跟随节点 */
function convertToPolyline(l) {
  const a = renderer.nodes[l.from]
  const b = renderer.nodes[l.to]
  if (!a || !b) return
  // 选两节点相对方位上最自然的一对边
  const dx = b.cx - a.cx, dy = b.cy - a.cy
  const horiz = Math.abs(dx) > Math.abs(dy)
  const fromSide = l.fromSide || (horiz ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top'))
  const toSide = l.toSide || (horiz ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'top' : 'bottom'))
  l.points = [`${l.from}.${fromSide}`, `${l.to}.${toSide}`]
  ;['from', 'to', 'fromSide', 'toSide', 'fromShape', 'toShape', 'shape', 'bend', 'tree', 'offset']
    .forEach(k => delete l[k])
}

// ===== 快捷键 =====
window.addEventListener('keydown', e => {
  const inField = document.activeElement &&
    /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)

  // 撤销/重做在输入框外生效
  if (!inField && (e.ctrlKey || e.metaKey)) {
    const k = e.key.toLowerCase()
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); return }
    if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); doRedo(); return }
    if (k === 'd' && selected) { e.preventDefault(); duplicateSelected(); return }
    if (k === 's') { e.preventDefault(); document.getElementById('save').click(); return }
    if (k === 'a' && editing) {
      e.preventDefault()
      setSelection((spec.nodes || []).filter(n => !n.hidden))
      redraw(); buildPanel()
      say(`已全选 ${selection.length} 个元素`)
      return
    }
  }

  if (!editing || inField) return

  if (e.key === 'Escape') {
    setSelection([])
    selLink = null
    redraw()
    buildPanel()
    return
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selLink) { e.preventDefault(); deleteLink(); return }
    if (selected) { e.preventDefault(); deleteSelected(); return }
  }

  if (!selected) return
  const step = e.shiftKey ? 10 : 1
  const map = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0],
    ArrowUp: [0, -step], ArrowDown: [0, step],
  }
  const d = map[e.key]
  if (!d) return
  e.preventDefault()
  snapshot()
  selection.forEach(n => {
    if (!isBoundX(n)) n.cx += d[0]
    if (!isBoundY(n)) n.cy += d[1]
  })
  redraw()
  syncInputs()
  say(selection.length > 1
    ? `已移动 ${selection.length} 个元素`
    : `${selected.id}  cx=${selected.cx}  cy=${selected.cy}`)
})

// ===== 增删复制 =====
const BIND_KEYS = ['bindX', 'bindY', 'bindTop', 'bindBottom', 'anchorFrom', 'anchorTo']

function uniqueId(base) {
  let i = 1
  const has = x => (spec.nodes || []).some(n => n.id === x)
  while (has(base + i)) i++
  return base + i
}

function deleteSelected() {
  if (!selection.length) return
  snapshot()
  const gone = selection.map(n => n.id)
  spec.nodes = spec.nodes.filter(n => !selection.includes(n))
  spec.links = (spec.links || []).filter(l =>
    !gone.includes(l.from) && !gone.includes(l.to)
    && !(l.points || []).some(p => typeof p === 'string' && gone.includes(p.split('.')[0])))
  spec.nodes.forEach(n => {
    BIND_KEYS.forEach(k => { if (gone.includes(n[k])) delete n[k] })
  })
  setSelection([])
  redraw()
  buildPanel()
  say(`已删除 ${gone.length} 个：` + gone.join(', '))
}

function duplicateSelected() {
  if (!selection.length) return
  snapshot()
  const copies = selection.map(src => {
    const copy = Object.assign({}, src)
    copy.id = uniqueId((src.shape || 'node') + '_')
    copy.cx += 20
    copy.cy += 20
    BIND_KEYS.forEach(k => delete copy[k])
    spec.nodes.push(copy)
    return copy
  })
  setSelection(copies)
  redraw()
  buildPanel()
  say(`已复制 ${copies.length} 个元素`)
}

const PRESETS = {
  rect: { w: 180, h: 46, label: '新建文本' },
  ellipse: { w: 150, h: 60, label: '新建用例' },
  diamond: { w: 180, h: 72, label: '判断条件' },
  terminator: { w: 140, h: 40, label: '开始' },
  io: { w: 190, h: 46, label: '输入输出' },
  label: { label: '文字标注', fontSize: 14 },
  group: { w: 300, h: 120, label: '分组' },
  actor: { label: '参与者' },
}

function addNode(shape) {
  snapshot()
  const n = Object.assign({
    id: uniqueId(shape + '_'),
    shape,
    cx: Math.round(spec.width / 2),
    cy: Math.round(spec.height / 2),
  }, PRESETS[shape] || { w: 160, h: 46, label: '新建' })
  spec.nodes.push(n)
  setSelection([n])
  redraw()
  buildPanel()
  say('已添加 ' + n.id + '，拖到合适位置')
}

// ===== 对齐与分布 =====
/** 取渲染后的实际边界（自动尺寸的元素 n.w 可能为空） */
function edges(n) {
  const b = renderer.nodes[n.id] || { cx: n.cx, cy: n.cy, w: n.w || 0, h: n.h || 0 }
  const hw = Math.abs(b.w) / 2, hh = b.h / 2
  return { l: b.cx - hw, r: b.cx + hw, t: b.cy - hh, b: b.cy + hh, w: hw * 2, h: hh * 2 }
}

const ALIGNERS = {
  left:   list => { const m = Math.min(...list.map(o => o.e.l)); list.forEach(o => setX(o, m + o.e.w / 2)) },
  right:  list => { const m = Math.max(...list.map(o => o.e.r)); list.forEach(o => setX(o, m - o.e.w / 2)) },
  cx:     list => { const m = avg(list.map(o => o.n.cx)); list.forEach(o => setX(o, m)) },
  top:    list => { const m = Math.min(...list.map(o => o.e.t)); list.forEach(o => setY(o, m + o.e.h / 2)) },
  bottom: list => { const m = Math.max(...list.map(o => o.e.b)); list.forEach(o => setY(o, m - o.e.h / 2)) },
  cy:     list => { const m = avg(list.map(o => o.n.cy)); list.forEach(o => setY(o, m)) },
}

function avg(a) { return Math.round(a.reduce((x, y) => x + y, 0) / a.length) }
function setX(o, v) { if (!isBoundX(o.n)) o.n.cx = Math.round(v) }
function setY(o, v) { if (!isBoundY(o.n)) o.n.cy = Math.round(v) }

function align(mode) {
  if (selection.length < 2) return say('需先选中两个以上元素')
  snapshot()
  ALIGNERS[mode](selection.map(n => ({ n, e: edges(n) })))
  redraw()
  syncInputs()
  say(`已对齐 ${selection.length} 个元素`)
}

/** 等间距分布：两端固定，中间按间隙均分 */
function distributeSel(axis) {
  if (selection.length < 3) return say('等间距需先选中三个以上元素')
  snapshot()
  const horiz = axis === 'x'
  const list = selection.map(n => ({ n, e: edges(n) }))
    .sort((a, b) => (horiz ? a.e.l - b.e.l : a.e.t - b.e.t))
  const first = list[0].e, last = list[list.length - 1].e
  const span = horiz ? last.r - first.l : last.b - first.t
  const total = list.reduce((s, o) => s + (horiz ? o.e.w : o.e.h), 0)
  const gap = (span - total) / (list.length - 1)
  let cursor = horiz ? first.l : first.t
  list.forEach(o => {
    const size = horiz ? o.e.w : o.e.h
    if (horiz) setX(o, cursor + size / 2)
    else setY(o, cursor + size / 2)
    cursor += size + gap
  })
  redraw()
  syncInputs()
  say(`已等间距分布，间隙 ${Math.round(gap)}px`)
}

/** 统一尺寸：以主选为准 */
function matchSize(dim) {
  if (selection.length < 2) return say('需先选中两个以上元素')
  snapshot()
  const ref = edges(selected)
  selection.forEach(n => {
    if (!canResize(n)) return
    if (dim !== 'h') n.w = Math.round(ref.w)
    if (dim !== 'w') n.h = Math.round(ref.h)
  })
  redraw()
  syncInputs()
  say(`已对齐尺寸到 ${selected.id}`)
}

/** 当前选中项坐标吸到网格 */
function snapToGrid() {
  if (!selection.length) return say('未选中元素')
  snapshot()
  selection.forEach(n => {
    if (!isBoundX(n)) n.cx = Math.round(n.cx / GRID) * GRID
    if (!isBoundY(n)) n.cy = Math.round(n.cy / GRID) * GRID
  })
  redraw()
  syncInputs()
  say(`已对齐到 ${GRID}px 网格`)
}

// ===== 撤销 / 重做 =====
/** 整体快照：节点与连线全量克隆，使增/删也可撤销 */
function captureState() {
  return {
    nodes: (spec.nodes || []).map(n => Object.assign({}, n)),
    links: (spec.links || []).map(cloneLink),
  }
}

function restoreState(snap) {
  const keep = selection.map(n => n.id)
  const keepLink = selLink && selLink.id
  spec.nodes = snap.nodes.map(n => Object.assign({}, n))
  spec.links = snap.links.map(cloneLink)
  // 按 id 重建选择集（旧对象引用已失效）
  setSelection(keep.map(id => spec.nodes.find(n => n.id === id)).filter(Boolean))
  selLink = keepLink ? spec.links.find(l => l.id === keepLink) || null : null
}

function doUndo() {
  const prev = undoStack.pop()
  if (!prev) return say('无可撤销的操作')
  redoStack.push(captureState())
  restoreState(prev)
  redraw()
  buildPanel()
  say('已撤销')
}

function doRedo() {
  const next = redoStack.pop()
  if (!next) return say('无可重做的操作')
  undoStack.push(captureState())
  restoreState(next)
  redraw()
  buildPanel()
  say('已重做')
}

// ===== 属性面板 =====
const FIELDS = [
  { key: 'label',     label: '内容文字（\\n 换行）', type: 'textarea' },
  { key: 'fontSize',  label: '字号', type: 'number', min: 6, max: 48, step: 1, half: true },
  { key: 'lineWidth', label: '线条粗细', type: 'number', min: 0.5, max: 6, step: 0.1, half: true },
  { key: 'w',         label: '宽度', type: 'number', min: 4, step: 1, half: true },
  { key: 'h',         label: '高度', type: 'number', min: 4, step: 1, half: true },
  { key: 'cx',        label: '位置 X', type: 'number', step: 1, half: true },
  { key: 'cy',        label: '位置 Y', type: 'number', step: 1, half: true },
]

function buildPanel() {
  if (!editing) {
    panel.innerHTML = '<div class="empty">开启<b>编辑模式</b>后，点选任意元素或连线即可修改。</div>'
    return
  }
  if (selLink) return buildLinkPanel()
  if (!selected) {
    panel.innerHTML = '<div class="empty">未选中元素。<br><br>单击选中（连线也可直接点），空白处拖动可框选，<kbd>Shift</kbd>+单击加选，<kbd>Ctrl</kbd>+<kbd>A</kbd> 全选。<br><br>选中后可拖动，或用 <kbd>←↑↓→</kbd> 微调（<kbd>Shift</kbd> 加速）。</div>'
    return
  }

  const n = selected
  let html = selection.length > 1
    ? `<h3>已选 ${selection.length} 个元素</h3>`
      + `<div class="sub">面板显示主选 <b>${n.id}</b>；字号 / 线宽 / 宽高 / 粗体会批量应用</div>`
    : `<h3>${n.shape || 'rect'}</h3><div class="sub">id: ${n.id}</div>`

  // 连续的 half 字段合并进一个两列网格
  let bucket = []
  const flush = () => {
    if (!bucket.length) return
    html += `<div class="grid2">${bucket.join('')}</div>`
    bucket = []
  }

  FIELDS.forEach(f => {
    // 无文字的形状不显示字号/内容
    if ((f.key === 'label' || f.key === 'fontSize') && n.shape === 'bar') return
    if (f.key === 'label' && n.shape === 'activation') return

    const v = n[f.key] == null ? '' : n[f.key]
    if (f.type === 'textarea') {
      flush()
      html += `<div class="row"><label>${f.label}</label>`
        + `<textarea data-k="${f.key}">${String(v).replace(/\n/g, '\\n')}</textarea></div>`
      return
    }

    const lock = f.key === 'cx' ? isBoundX(n) : f.key === 'cy' ? isBoundY(n) : false
    const cell = `<div class="row"><label>${f.label}${lock ? ' （已绑定）' : ''}</label>`
      + `<input type="number" data-k="${f.key}" value="${v}"${lock ? ' disabled' : ''}`
      + `${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}`
      + ` step="${f.step}"></div>`

    if (f.half) bucket.push(cell)
    else { flush(); html += cell }
  })
  flush()

  if (n.shape !== 'bar' && n.shape !== 'activation') {
    html += `<div class="row chk"><input type="checkbox" data-k="bold" id="cbBold"
      ${n.bold ? 'checked' : ''}><label for="cbBold" style="margin:0">粗体</label></div>`
    html += `<div class="row chk"><input type="checkbox" data-k="underline" id="cbUl"
      ${n.underline ? 'checked' : ''}><label for="cbUl" style="margin:0">下划线（主键）</label></div>`
  }

  panel.innerHTML = html
  wirePanel()
}

// ===== 连线面板 =====
const SIDE_OPTS = [
  ['', '自动（最短边缘）'], ['top', '上边'], ['bottom', '下边'],
  ['left', '左边'], ['right', '右边'],
]
const BEND_OPTS = [['', '直线'], ['h', '先水平后垂直'], ['v', '先垂直后水平']]
const HEAD_OPTS = [['solid', '实心箭头'], ['hollow', '空心三角'], ['none', '无箭头']]

function opts(list, cur) {
  return list.map(([v, t]) =>
    `<option value="${v}"${String(cur || '') === v ? ' selected' : ''}>${t}</option>`).join('')
}

function buildLinkPanel() {
  const l = selLink
  const head = l.arrow === false ? 'none' : (l.hollow ? 'hollow' : 'solid')
  const num = (k, v) => (l[k] == null ? v : l[k])

  let html = `<h3>连线</h3><div class="sub">`
    + (l.points ? `显式折线（${l.points.length} 个点）` : `${l.from || '?'} → ${l.to || '?'}`)
    + `<br>id: ${l.id}</div>`

  html += `<div class="row"><label>标签文字</label>`
    + `<textarea data-lk="label">${String(l.label || '').replace(/\n/g, '\\n')}</textarea></div>`

  html += `<div class="grid2">`
    + `<div class="row"><label>线条粗细</label><input type="number" data-lk="lineWidth"`
    + ` value="${num('lineWidth', THEME.line)}" min="0.5" max="6" step="0.1"></div>`
    + `<div class="row"><label>箭头大小</label><input type="number" data-lk="arrowSize"`
    + ` value="${num('arrowSize', THEME.arrow)}" min="4" max="24" step="1"></div>`
    + `<div class="row"><label>标签字号</label><input type="number" data-lk="fontSize"`
    + ` value="${num('fontSize', 12)}" min="6" max="32" step="1"></div>`
    + `<div class="row"><label>标签位置 %</label><input type="number" data-lk="labelAt"`
    + ` value="${num('labelAt', 0.5)}" min="0" max="1" step="0.05"></div>`
    + `<div class="row"><label>标签偏移 X</label><input type="number" data-lk="dx"`
    + ` value="${num('dx', 0)}" step="1"></div>`
    + `<div class="row"><label>标签偏移 Y</label><input type="number" data-lk="dy"`
    + ` value="${num('dy', 0)}" step="1"></div>`
    + `</div>`

  html += `<div class="row"><label>箭头样式</label>`
    + `<select data-lk="__head">${opts(HEAD_OPTS, head)}</select></div>`

  html += `<div class="row chk"><input type="checkbox" data-lk="arrowStart" id="lkAS"`
    + `${l.arrowStart ? ' checked' : ''}><label for="lkAS" style="margin:0">起端也带箭头</label></div>`
  html += `<div class="row chk"><input type="checkbox" data-lk="dashed" id="lkDash"`
    + `${l.dashed ? ' checked' : ''}><label for="lkDash" style="margin:0">虚线</label></div>`

  // 两端节点连线才有走线控制
  if (!l.points) {
    html += `<div class="row"><label>走线方式</label>`
      + `<select data-lk="bend">${opts(BEND_OPTS, l.bend)}</select></div>`
    html += `<div class="grid2">`
      + `<div class="row"><label>起点出边</label>`
      + `<select data-lk="fromSide">${opts(SIDE_OPTS, l.fromSide)}</select></div>`
      + `<div class="row"><label>终点入边</label>`
      + `<select data-lk="toSide">${opts(SIDE_OPTS, l.toSide)}</select></div>`
      + `<div class="row"><label>起点位置 0~1</label><input type="number" data-lk="fromAt"`
      + ` value="${num('fromAt', 0.5)}" min="0" max="1" step="0.05"${l.fromSide ? '' : ' disabled'}></div>`
      + `<div class="row"><label>箭头位置 0~1</label><input type="number" data-lk="toAt"`
      + ` value="${num('toAt', 0.5)}" min="0" max="1" step="0.05"${l.toSide ? '' : ' disabled'}></div>`
      + `</div>`
    html += `<div class="row"><label>整体平移（避让重叠连线）</label>`
      + `<input type="number" data-lk="offset" value="${num('offset', 0)}" step="1"></div>`
    html += `<div class="row chk"><input type="checkbox" data-lk="tree" id="lkTree"`
      + `${l.tree ? ' checked' : ''}><label for="lkTree" style="margin:0">树形 L 型走线</label></div>`
  }

  html += `<div class="row"><button data-lkact="flip" style="width:100%">反转方向</button></div>`
  if (!l.points) {
    html += `<div class="row"><button data-lkact="toPoly" style="width:100%">转为自由折线</button></div>`
  }
  html += `<div class="row"><button data-lkact="del" style="width:100%;background:#c0392b">删除这条连线</button></div>`
  html += `<div class="empty" style="margin-top:10px">双击线上插入拐点，双击拐点删除它。蓝色方块可拖，白圆是跟随节点的锚点。</div>`

  panel.innerHTML = html
  wireLinkPanel()
}

/** 数值类字段；空值表示回到默认（删掉该字段） */
const LINK_NUM = ['lineWidth', 'arrowSize', 'fontSize', 'labelAt', 'dx', 'dy', 'offset', 'fromAt', 'toAt']

function wireLinkPanel() {
  let typingTimer = null
  let typingActive = false
  const step = () => {
    if (!typingActive) { snapshot(); typingActive = true }
    clearTimeout(typingTimer)
    typingTimer = setTimeout(() => { typingActive = false }, 600)
  }

  panel.querySelectorAll('[data-lk]').forEach(inp => {
    const k = inp.dataset.lk
    const isCheck = inp.type === 'checkbox'
    const isSelect = inp.tagName === 'SELECT'

    inp.addEventListener(isCheck || isSelect ? 'change' : 'input', () => {
      if (isCheck || isSelect) snapshot()
      else step()

      if (k === '__head') {
        // 箭头样式三选一，映射到 arrow / hollow 两个字段
        delete selLink.hollow
        delete selLink.arrow
        if (inp.value === 'none') selLink.arrow = false
        else if (inp.value === 'hollow') selLink.hollow = true
      } else if (isCheck) {
        if (inp.checked) selLink[k] = true
        else delete selLink[k]
      } else if (isSelect) {
        if (inp.value) selLink[k] = inp.value
        else delete selLink[k]
        // 边改回「自动」时，沿边位置就没意义了
        if (k === 'fromSide' && !inp.value) delete selLink.fromAt
        if (k === 'toSide' && !inp.value) delete selLink.toAt
        redraw()
        buildPanel()
        return
      } else if (inp.tagName === 'TEXTAREA') {
        const v = inp.value.replace(/\\n/g, '\n')
        if (v) selLink[k] = v
        else delete selLink[k]
      } else {
        if (inp.value === '') { delete selLink[k]; }
        else {
          const v = parseFloat(inp.value)
          if (Number.isNaN(v)) return
          selLink[k] = v
        }
      }
      redraw()
    })
  })

  panel.querySelectorAll('[data-lkact]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.lkact
      if (act === 'flip') flipLink()
      else if (act === 'del') deleteLink()
      else if (act === 'toPoly') {
        snapshot()
        convertToPolyline(selLink)
        redraw()
        buildPanel()
        say('已转为自由折线，双击线上可插入拐点')
      }
    })
  })
}

/** 反转连线方向（两端与侧边一起调） */
function flipLink() {
  snapshot()
  const l = selLink
  if (l.points) {
    l.points = l.points.slice().reverse()
  } else {
    const t = l.from; l.from = l.to; l.to = t
    const s = l.fromSide; l.fromSide = l.toSide; l.toSide = s
    const fs = l.fromShape; l.fromShape = l.toShape; l.toShape = fs
    ;['fromSide', 'toSide', 'fromShape', 'toShape'].forEach(k => {
      if (l[k] === undefined) delete l[k]
    })
  }
  redraw()
  buildPanel()
  say('已反转 ' + l.id)
}

function deleteLink() {
  snapshot()
  const id = selLink.id
  spec.links = (spec.links || []).filter(l => l !== selLink)
  selLink = null
  redraw()
  buildPanel()
  say('已删除连线 ' + id)
}

/** 把当前选中的节点串起来：按选中顺序两两连接 */
function linkSelection() {
  if (selection.length < 2) return say('先选中两个以上元素（Shift+单击）')
  snapshot()
  spec.links = spec.links || []
  const made = []
  for (let i = 1; i < selection.length; i++) {
    const a = selection[i - 1], b = selection[i]
    const l = { from: a.id, to: b.id }
    // 椭圆类节点的边缘求交要用椭圆公式
    if (a.shape === 'ellipse') l.fromShape = 'ellipse'
    if (b.shape === 'ellipse') l.toShape = 'ellipse'
    spec.links.push(l)
    made.push(l)
  }
  redraw()
  selLink = made[made.length - 1]
  setSelection([])
  redraw()
  buildPanel()
  say(`已新建 ${made.length} 条连线`)
}

/** 面板控件绑定；连续输入合并为一次撤销步 */
/** 多选时会批量应用的字段（坐标类不批量，否则元素会重叠） */
const BULK_KEYS = ['fontSize', 'lineWidth', 'w', 'h', 'bold', 'underline']

function wirePanel() {
  let typingTimer = null
  let typingActive = false

  panel.querySelectorAll('[data-k]').forEach(inp => {
    const k = inp.dataset.k
    const isCheck = inp.type === 'checkbox'
    const evt = isCheck ? 'change' : 'input'

    inp.addEventListener(evt, () => {
      // 连续输入只在开头存一次快照
      if (isCheck) {
        snapshot()
      } else {
        if (!typingActive) { snapshot(); typingActive = true }
        clearTimeout(typingTimer)
        typingTimer = setTimeout(() => { typingActive = false }, 600)
      }

      let val
      if (isCheck) {
        val = inp.checked
      } else if (inp.tagName === 'TEXTAREA') {
        val = inp.value.replace(/\\n/g, '\n')
      } else {
        val = parseFloat(inp.value)
        if (Number.isNaN(val)) return
      }

      const bulk = selection.length > 1 && BULK_KEYS.includes(k)
      if (bulk) selection.forEach(n => { n[k] = val })
      else selected[k] = val

      redraw()
      if (bulk) say(`已批量修改 ${selection.length} 个元素的 ${k}`)
    })
  })
}

/** 拖拽后同步面板里的数值 */
function syncInputs() {
  const src = selLink || selected
  if (!src) return
  panel.querySelectorAll('input[type=number]').forEach(inp => {
    const k = inp.dataset.k || inp.dataset.lk
    const v = src[k]
    if (v != null) inp.value = v
  })
}

// ===== 持久化 =====
/** 整图存储（因为可以增删元素，差异存法救不回新增/删除） */
function storeKey() { return 'thesis-diagram:' + spec.id }

function applySaved() {
  const raw = localStorage.getItem(storeKey())
  if (!raw) return
  try {
    const saved = JSON.parse(raw)
    if (Array.isArray(saved.nodes)) {
      spec.nodes = saved.nodes
      if (Array.isArray(saved.links)) spec.links = saved.links
      if (saved.width) spec.width = saved.width
      if (saved.height) spec.height = saved.height
    } else {
      // 旧格式：{ nodeId: { 差异字段 } }
      ;(spec.nodes || []).forEach(n => {
        const s = saved[n.id]
        if (s) Object.assign(n, s)
      })
    }
    say('已载入上次保存的修改')
  } catch (err) {
    console.warn('读取失败', err)
  }
}

/** 当前图序列化为可回写的结构 */
function serializeSpec() {
  return {
    id: spec.id,
    name: spec.name,
    width: spec.width,
    height: spec.height,
    nodes: (spec.nodes || []).map(n => Object.assign({}, n)),
    links: (spec.links || []).map(cloneLink),
  }
}

document.getElementById('save').onclick = () => {
  localStorage.setItem(storeKey(), JSON.stringify(serializeSpec()))
  undoStack.length = 0
  redoStack.length = 0
  say(`已保存 ${(spec.nodes || []).length} 个元素`)
}

document.getElementById('reset').onclick = () => {
  if (!confirm('丢弃当前图的所有修改，恢复到数据文件的初始状态？')) return
  localStorage.removeItem(storeKey())
  spec = cloneSpec(DIAGRAMS[spec.id])
  setSelection([])
  selLink = null
  undoStack.length = 0
  redoStack.length = 0
  stage.resize(spec.width, spec.height)
  redraw()
  buildPanel()
  say('已重置')
}

document.getElementById('undo').onclick = doUndo
document.getElementById('redo').onclick = doRedo
document.getElementById('del').onclick = () => {
  if (selLink) return deleteLink()
  if (!selection.length) return say('先选中一个元素')
  deleteSelected()
}

document.getElementById('link').onclick = () => {
  if (!editing) return say('请先开启编辑模式')
  linkSelection()
}

document.getElementById('addShape').onchange = e => {
  const shape = e.target.value
  e.target.value = ''
  if (!shape) return
  if (!editing) {
    editing = true
    document.getElementById('edit').classList.add('on')
    cv.classList.add('editing')
  }
  addNode(shape)
}

document.getElementById('alignPick').onchange = e => {
  const v = e.target.value
  e.target.value = ''
  if (!v || !editing) return v && say('请先开启编辑模式')
  const [kind, arg] = v.split(':')
  if (kind === 'a') align(arg)
  else if (kind === 'd') distributeSel(arg)
  else if (kind === 's') matchSize(arg === 'wh' ? 'wh' : arg)
  else if (kind === 'g') snapToGrid()
}

document.getElementById('gridBtn').onclick = e => {
  snapGrid = !snapGrid
  e.target.classList.toggle('on', snapGrid)
  say(snapGrid ? `网格吸附已开（${GRID}px）` : '网格吸附已关，恢复元素对齐吸附')
}

document.getElementById('svg').onclick = () => {
  try {
    exportSVG(spec, spec.name)
    say('已导出 SVG（矢量，适合插入论文）')
  } catch (err) {
    console.error(err)
    say('SVG 导出失败，请改用 PNG')
  }
}

document.getElementById('edit').onclick = e => {
  editing = !editing
  e.target.classList.toggle('on', editing)
  cv.classList.toggle('editing', editing)
  if (!editing) { setSelection([]); selLink = null }
  cv.style.cursor = 'default'
  redraw()
  buildPanel()
  say(editing ? '编辑模式已开启，点选元素开始修改' : '编辑模式已关闭')
}

document.getElementById('png').onclick = () => {
  const sc = parseInt(document.getElementById('scale').value, 10)
  // 导出走离屏画布，不包含选中框
  stage.exportPNG(spec.name, s => new Renderer(spec).draw(s), sc)
  say(`已导出 ${sc}× PNG`)
}

/** 导出完整数据（节点 + 连线 + 约束），可直接粘回数据文件 */
document.getElementById('dump').onclick = () => {
  const nodeLines = (spec.nodes || []).map(n => {
    const p = [`id: '${n.id}'`, `shape: '${n.shape || 'rect'}'`, `cx: ${n.cx}`, `cy: ${n.cy}`]
    if (n.w != null) p.push(`w: ${Math.round(n.w)}`)
    if (n.h != null) p.push(`h: ${Math.round(n.h)}`)
    if (n.label != null) p.push(`label: ${JSON.stringify(n.label)}`)
    if (n.fontSize != null) p.push(`fontSize: ${n.fontSize}`)
    if (n.lineWidth != null) p.push(`lineWidth: ${n.lineWidth}`)
    if (n.bold) p.push('bold: true')
    if (n.underline) p.push('underline: true')
    if (n.mask) p.push('mask: true')
    BIND_KEYS.forEach(k => { if (n[k]) p.push(`${k}: '${n[k]}'`) })
    if (n.dx) p.push(`dx: ${n.dx}`)
    if (n.dy) p.push(`dy: ${n.dy}`)
    return '    { ' + p.join(', ') + ' },'
  })

  const linkLines = (spec.links || []).map(l => {
    const p = []
    if (l.from) p.push(`from: '${l.from}'`)
    if (l.to) p.push(`to: '${l.to}'`)
    if (l.points) {
      const pts = l.points.map(pt =>
        typeof pt === 'string' ? `'${pt}'` : `{ x: ${Math.round(pt.x)}, y: ${Math.round(pt.y)} }`
      )
      p.push(`points: [${pts.join(', ')}]`)
    }
    if (l.label) p.push(`label: ${JSON.stringify(l.label)}`)
    if (l.dashed) p.push('dashed: true')
    if (l.arrow === false) p.push('arrow: false')
    if (l.arrowStart) p.push('arrowStart: true')
    if (l.hollow) p.push('hollow: true')
    if (l.tree) p.push('tree: true')
    if (l.bend) p.push(`bend: '${l.bend}'`)
    if (l.fromSide) p.push(`fromSide: '${l.fromSide}'`)
    if (l.toSide) p.push(`toSide: '${l.toSide}'`)
    if (l.fromAt != null) p.push(`fromAt: ${l.fromAt}`)
    if (l.toAt != null) p.push(`toAt: ${l.toAt}`)
    if (l.offset) p.push(`offset: ${l.offset}`)
    if (l.lineWidth != null) p.push(`lineWidth: ${l.lineWidth}`)
    if (l.arrowSize != null) p.push(`arrowSize: ${l.arrowSize}`)
    if (l.fontSize != null) p.push(`fontSize: ${l.fontSize}`)
    if (l.shape) p.push(`shape: '${l.shape}'`)
    if (l.fromShape) p.push(`fromShape: '${l.fromShape}'`)
    if (l.toShape) p.push(`toShape: '${l.toShape}'`)
    if (l.labelAt != null) p.push(`labelAt: ${l.labelAt}`)
    if (l.midY != null) p.push(`midY: ${l.midY}`)
    if (l.dx) p.push(`dx: ${l.dx}`)
    if (l.dy) p.push(`dy: ${l.dy}`)
    return '    { ' + p.join(', ') + ' },'
  })

  let txt = `// ${spec.name}\n`
  txt += `  width: ${spec.width},\n  height: ${spec.height},\n`
  txt += '  nodes: [\n' + nodeLines.join('\n') + '\n  ],\n'
  if (linkLines.length) txt += '  links: [\n' + linkLines.join('\n') + '\n  ],\n'

  navigator.clipboard?.writeText(txt).catch(() => {})
  console.log(txt)
  say('完整数据已复制到剪贴板')
}

// 切图前提醒未保存的修改
pick.onchange = () => {
  if (dirty()) {
    if (!confirm('当前图有未保存的修改，切换后将丢弃。继续？')) {
      pick.value = spec.id
      return
    }
  }
  load(pick.value)
}

/** 当前是否有未保存修改 */
function dirty() {
  return undoStack.length > 0
}

window.addEventListener('beforeunload', e => {
  if (dirty()) {
    e.preventDefault()
    e.returnValue = ''
  }
})

if (keys.length) load(keys[0])
