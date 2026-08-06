/**
 * 渲染器：把数据文件里的声明式描述翻译成图元调用
 *
 * 数据文件挂到 DIAGRAMS 上一个对象：
 * {
 *   id, name, width, height,
 *   nodes: [{ id, shape, cx, cy, w, h, label, fontSize, lineWidth, bold, z }],
 *   links: [{ from, to, ... } | { points: [...] }],
 *   custom: (ctx, api) => {}   // 仅用于依赖其他节点实时位置的绘制
 * }
 *
 * 所有可见元素都应当写在 nodes 里，这样编辑器才能选中并拖拽。
 */
const DIAGRAMS = {}

/** 尺寸解析简写 */
const sz = n => resolveSize(n)

const SHAPE_DRAWERS = {
  rect: (ctx, n) => nodeRect(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  terminator: (ctx, n) => nodeTerminator(ctx, n.cx, n.cy, n.label, n),
  diamond: (ctx, n) => nodeDiamond(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  io: (ctx, n) => nodeIO(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  ellipse: (ctx, n) => nodeEllipse(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  actor: (ctx, n) => nodeActor(ctx, n.cx, n.cy, n.label, n),
  vtext: (ctx, n) => nodeVText(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  group: (ctx, n) => nodeGroup(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  boundary: (ctx, n) => nodeBoundary(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  lane: (ctx, n) => nodeLane(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  label: (ctx, n) => nodeLabel(ctx, n.cx, n.cy, n.w, n.h, n.label, n),
  bar: (ctx, n) => nodeBar(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  axis: (ctx, n) => nodeAxis(ctx, n.cx, n.cy, sz(n).w, sz(n).h, n.label, n),
  activation: (ctx, n) => {
    const s = sz(n)
    activationBar(ctx, n.cx, n.cy - s.h / 2, n.cy + s.h / 2, s.w)
    return anchors(n.cx, n.cy, s.w, s.h)
  },
  /** 时序消息：cx/cy 为线段中点，w 为跳跃宽度（负值=向左） */
  message: (ctx, n) => {
    const half = n.w / 2
    const x1 = n.cx - half
    const x2 = n.cx + half
    message(ctx, x1, x2, n.cy, n.label, {
      isReturn: n.ret,
      fontSize: n.fontSize,
      barW: n.barW,
    })
    return anchors(n.cx, n.cy, Math.abs(n.w) || 20, (n.fontSize || 13) + 26)
  },
  /** 时序自循环 */
  selfloop: (ctx, n) => {
    selfLoop(ctx, n.cx, n.cy, n.label, {
      radius: n.radius, barW: n.barW, fontSize: n.fontSize,
    })
    const r = n.radius || 18
    return anchors(n.cx + r, n.cy, r * 2 + 20, r * 2)
  },
}

/** 层级：数字小的先画（在底层） */
const SHAPE_Z = {
  group: 0, boundary: 0, axis: 1, lane: 1,
  bar: 2, message: 6, selfloop: 6, activation: 8, label: 9,
}

/** 连线没写 id 时自动补一个稳定的，供编辑器选中与持久化引用 */
function ensureLinkIds(links) {
  const used = new Set(links.map(l => l.id).filter(Boolean))
  links.forEach((l, i) => {
    if (l.id) return
    let base = l.from && l.to ? `L_${l.from}__${l.to}` : `L_${i}`
    let id = base
    let k = 2
    while (used.has(id)) id = base + '_' + k++
    used.add(id)
    l.id = id
  })
}

class Renderer {
  constructor(spec) {
    this.spec = spec
    this.nodes = {}
    this.links = {}      // linkId -> { points, link }
  }

  /** 供数据文件 custom 钩子使用的 API */
  api(ctx) {
    return {
      ctx,
      nodes: this.nodes,
      node: id => this.nodes[id],
      THEME, measureText, distribute, anchors,
      wrapText, estimateText, resolveLineHeight, resolveSize,
      isBoundX, isBoundY, resolveConstraints,
      nodeRect, nodeTerminator, nodeDiamond, nodeIO, nodeEllipse, nodeActor,
      nodeVText, nodeGroup, nodeBoundary, nodeLane, nodeLabel, nodeBar, nodeAxis,
      groupBox, lifeline, activationBar, boundaryBox,
      drawText, drawLines,
      arrow, polyline, connect, treeLink, selfLoop, message,
      linkLabel, arrowHead, hollowHead, rectEdge, ellipseEdge, pointAtFraction,
    }
  }

  draw(stage) {
    const ctx = stage.ctx
    const spec = this.spec
    this.nodes = {}
    this.links = {}

    const list = spec.nodes || []

    // 0. 先求值约束，使绑定元素跟随被依赖者
    resolveConstraints(list)

    // 登记锚点，使连线与绘制顺序无关（尺寸解析与图元一致，否则端点会错位）
    list.forEach(n => {
      const s = sz(n)
      const box = anchors(n.cx, n.cy, s.w == null ? 200 : s.w, s.h == null ? 46 : s.h)
      box.shape = n.shape || 'rect'    // 供 connect 自动选边缘求交函数
      this.nodes[n.id] = box
    })

    // 底层容器先画
    const ordered = list
      .map((n, i) => ({ n, i, z: n.z == null ? (SHAPE_Z[n.shape] == null ? 5 : SHAPE_Z[n.shape]) : n.z }))
      .sort((a, b) => a.z - b.z || a.i - b.i)

    const bg = ordered.filter(o => o.z < 4)
    const fg = ordered.filter(o => o.z >= 4)

    bg.forEach(o => this.drawNode(ctx, o.n))

    // 连线在容器之上、节点之下
    const links = spec.links || []
    ensureLinkIds(links)
    links.forEach(l => {
      const pts = this.drawLink(ctx, l)
      if (pts) this.links[l.id] = { points: pts, link: l }
    })

    fg.forEach(o => this.drawNode(ctx, o.n))

    if (typeof spec.custom === 'function') spec.custom(ctx, this.api(ctx))
  }

  drawNode(ctx, n) {
    if (n.hidden) return
    const drawer = SHAPE_DRAWERS[n.shape || 'rect']
    if (!drawer) {
      console.warn('未知形状：' + n.shape)
      return
    }
    const box = drawer(ctx, n)
    box.shape = n.shape || 'rect'
    this.nodes[n.id] = box
  }

  drawLink(ctx, l) {
    if (l.hidden) return null
    // 显式折线：points 里可写节点锚点引用 "id.bottom" 或裸坐标 {x,y}
    if (l.points) {
      const pts = l.points.map(p => this.resolvePoint(p))
      polyline(ctx, pts, l)
      if (l.label) {
        const at = pointAtFraction(pts, l.labelAt == null ? 0.5 : l.labelAt)
        linkLabel(ctx, at.x + (l.dx || 0), at.y + (l.dy || 0), l.label, l)
      }
      return pts
    }

    const from = this.nodes[l.from]
    const to = this.nodes[l.to]
    if (!from || !to) {
      console.warn('连线端点不存在：' + l.from + ' → ' + l.to)
      return null
    }
    if (l.tree) return treeLink(ctx, from, to, l)
    return connect(ctx, from, to, l)
  }

  /**
   * 锚点引用解析：
   *   "user.bottom"       边中点
   *   "user.bottom@0.25"  沿该边 25% 处（top/bottom 从左到右，left/right 从上到下）
   *   "user"              节点中心
   *   {x,y}               原样返回
   */
  resolvePoint(p) {
    if (typeof p !== 'string') return p
    const [ref, atStr] = p.split('@')
    const [id, side] = ref.split('.')
    const n = this.nodes[id]
    if (!n) {
      console.warn('锚点节点不存在：' + id)
      return { x: 0, y: 0 }
    }
    if (!side) return { x: n.cx, y: n.cy }
    if (atStr == null) return n[side] || { x: n.cx, y: n.cy }
    return anchorAt(n, side, parseFloat(atStr))
  }
}
