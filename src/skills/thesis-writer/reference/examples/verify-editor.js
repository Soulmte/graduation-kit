/**
 * 编辑器交互校验（Node 环境）
 * 用假 DOM 加载 editor.js，然后模拟鼠标/键盘事件，检查多选、拖拽、
 * 对齐分布、撤销重做、增删复制是否真的改到了 spec.nodes。
 * 运行：node verify-editor.js
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const dir = __dirname

let fail = 0
function ok(name, cond, extra) {
  console.log(`${cond ? '✓' : '✗'} ${name}${extra ? '  ' + extra : ''}`)
  if (!cond) fail++
}

// --- 假 Canvas ctx ---
function makeCtx() {
  const noop = () => {}
  return {
    canvas: { width: 0, height: 0, style: {} },
    setTransform: noop, scale: noop, save: noop, restore: noop,
    translate: noop, rotate: noop, beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, ellipse: noop,
    rect: noop, fill: noop, stroke: noop, fillRect: noop, strokeRect: noop,
    setLineDash: noop, fillText: noop,
    measureText: t => ({ width: String(t).length * 7 }),
  }
}

// --- 假 DOM：只实现 editor.js 用到的部分 ---
function makeEl(id) {
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    type: '',
    tagName: 'DIV',
    checked: false,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    listeners: {},
    addEventListener(k, fn) { (this.listeners[k] = this.listeners[k] || []).push(fn) },
    fire(k, ev) { (this.listeners[k] || []).forEach(fn => fn(ev || {})) },
    appendChild() {},
    removeChild() {},
    querySelectorAll: () => [],
    getBoundingClientRect() { return { left: 0, top: 0, width: this._w || 100, height: this._h || 100 } },
    getContext: () => makeCtx(),
    toBlob(cb) { cb({}) },
    click() {},
  }
}

const els = {}
const getEl = id => (els[id] = els[id] || makeEl(id))

const store = {}
const sandbox = {
  console,
  document: {
    getElementById: getEl,
    createElement: tag => makeEl(tag),
    body: { appendChild() {}, removeChild() {} },
    activeElement: null,
  },
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v },
    removeItem: k => { delete store[k] },
  },
  navigator: {},
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  Blob: function Blob() {},
  setTimeout: () => {},
  clearTimeout: () => {},
  confirm: () => true,
}
const keyHandlers = []
sandbox.addEventListener = (k, fn) => { if (k === 'keydown') keyHandlers.push(fn) }
sandbox.window = sandbox
sandbox.globalThis = sandbox
vm.createContext(sandbox)

const files = [
  'engine/core.js', 'engine/shapes.js', 'engine/links.js',
  'engine/constraints.js', 'engine/renderer.js', 'engine/svg-export.js',
  'data/_entity-factory.js',
  'data/01-framework.js', 'data/02-architecture.js', 'data/03-module.js',
  'data/04a-usecase-user.js', 'data/04b-usecase-admin.js',
  'data/05a-entity-user.js', 'data/05b-entity-log.js', 'data/05c-entity-file.js',
  'data/05d-entity-role.js', 'data/05e-entity-token.js',
  'data/06-er.js', 'data/08-flowchart.js', 'data/09-sequence.js', 'data/10-chart.js',
  'editor.js',
]

const EXPORTS = [
  'get spec() { return spec }',
  'get selection() { return selection }',
  'get selected() { return selected }',
  'get undoStack() { return undoStack }',
  'get redoStack() { return redoStack }',
  'setSelection, align, distributeSel, matchSize, snapToGrid, addNode',
  'deleteSelected, duplicateSelected, doUndo, doRedo, load, redraw, buildPanel',
  'serializeSpec, edges, hit, DIAGRAMS, renderSVG',
  'get selLink() { return selLink }, set selLink(v) { selLink = v }',
  'hitLink, hitVertex, flipLink, deleteLink, linkSelection, convertToPolyline',
  'hitEndpoint, projectToSide, setEndpoint, endpointNodeId',
  'distToPolyline, get rd() { return renderer }',
]

const bundle = files
  .map(f => `// ===== ${f} =====\n` + fs.readFileSync(path.join(dir, f), 'utf8'))
  .join('\n')
  + `\n;globalThis.__E = { ${EXPORTS.join(', ')} };`

try {
  vm.runInContext(bundle, sandbox, { filename: 'editor-bundle.js' })
} catch (e) {
  console.error('✗ 加载异常: ' + e.message)
  console.error(e.stack.split('\n').slice(0, 8).join('\n'))
  process.exit(1)
}

const E = sandbox.__E
const cv = getEl('cv')

// stage.toLocal 依赖 getBoundingClientRect，让它与逻辑尺寸一致（缩放比 1:1）
function syncRect() {
  cv._w = E.spec.width
  cv._h = E.spec.height
}

const down = (x, y, opt) => { syncRect(); cv.fire('mousedown', Object.assign({ clientX: x, clientY: y }, opt)) }
const move = (x, y, opt) => { syncRect(); cv.fire('mousemove', Object.assign({ clientX: x, clientY: y }, opt)) }
const up = () => cv.fire('mouseup', {})
const press = (k, opt) => keyHandlers.forEach(fn =>
  fn(Object.assign({ key: k, preventDefault() {} }, opt)))

/** 拖一个完整手势 */
function drag(x0, y0, x1, y1, opt) {
  down(x0, y0, opt)
  move(x1, y1, opt)
  up()
}

const byId = id => E.spec.nodes.find(n => n.id === id)
const clickBtn = id => { const b = getEl(id); if (b.onclick) b.onclick({ target: b }) }

// 开启编辑模式
clickBtn('edit')

// ===== 1. 单选 + 拖拽 =====
E.load('01-framework')
const n0 = E.spec.nodes.find(n => n.shape === 'rect')
const startX = n0.cx, startY = n0.cy
drag(n0.cx, n0.cy, n0.cx + 40, n0.cy + 30, { altKey: true })
ok('单击可选中', E.selection.length === 1 && E.selected.id === n0.id)
ok('拖动改变坐标',
  byId(n0.id).cx === startX + 40 && byId(n0.id).cy === startY + 30,
  `${startX},${startY} → ${byId(n0.id).cx},${byId(n0.id).cy}`)

// ===== 2. 撑销 / 重做 =====
E.doUndo()
ok('撑销恢复位置', byId(n0.id).cx === startX && byId(n0.id).cy === startY)
E.doRedo()
ok('重做恢复位置', byId(n0.id).cx === startX + 40)
E.doUndo()

// ===== 3. Shift 加选 =====
E.load('05a-entity-user')
const attrs = E.spec.nodes.filter(n => n.shape === 'ellipse').slice(0, 3)
down(attrs[0].cx, attrs[0].cy); up()
down(attrs[1].cx, attrs[1].cy, { shiftKey: true }); up()
down(attrs[2].cx, attrs[2].cy, { shiftKey: true }); up()
ok('Shift 加选累积', E.selection.length === 3, `已选 ${E.selection.length}`)

down(attrs[1].cx, attrs[1].cy, { shiftKey: true }); up()
ok('Shift 再点可取消', E.selection.length === 2)

// ===== 4. 多选整体拖动 =====
E.load('05a-entity-user')
const g = E.spec.nodes.filter(n => n.shape === 'ellipse').slice(0, 3)
E.setSelection(g)
const before = g.map(n => ({ id: n.id, cx: n.cx, cy: n.cy }))
const lead = E.selected
drag(lead.cx, lead.cy, lead.cx + 25, lead.cy - 15, { altKey: true })
const allMoved = before.every(b =>
  byId(b.id).cx === b.cx + 25 && byId(b.id).cy === b.cy - 15)
ok('多选整体平移', allMoved,
  before.map(b => `${b.id}:${byId(b.id).cx - b.cx},${byId(b.id).cy - b.cy}`).join(' '))
E.doUndo()
ok('多选拖动可一步撑销', before.every(b => byId(b.id).cx === b.cx))

// ===== 5. 框选 =====
E.load('05a-entity-user')
E.setSelection([])
drag(0, 0, E.spec.width, E.spec.height, {})
ok('框选全图', E.selection.length === E.spec.nodes.length,
  `${E.selection.length}/${E.spec.nodes.length}`)

E.setSelection([])
drag(0, 0, 1, 1, {})
ok('空白处框选不选中任何元素', E.selection.length === 0)

// ===== 6. 对齐 =====
E.load('05a-entity-user')
const three = E.spec.nodes.filter(n => n.shape === 'ellipse').slice(0, 3)
three[0].cx = 100; three[1].cx = 160; three[2].cx = 230
three.forEach((n, i) => { n.cy = 100 + i * 50 })
E.setSelection(three)
E.align('left')
const lefts = three.map(n => E.edges(n).l)
ok('左对齐', Math.max(...lefts) - Math.min(...lefts) < 1, lefts.map(Math.round).join(','))

E.align('cx')
const cxs = three.map(n => n.cx)
ok('水平居中', new Set(cxs).size === 1, cxs.join(','))

three.forEach((n, i) => { n.cy = 90 + i * 37 })
E.setSelection(three)
E.align('top')
const tops = three.map(n => E.edges(n).t)
ok('顶部对齐', Math.max(...tops) - Math.min(...tops) < 1, tops.map(Math.round).join(','))

// ===== 7. 等间距分布 =====
E.load('05a-entity-user')
const four = E.spec.nodes.filter(n => n.shape === 'ellipse').slice(0, 4)
four.forEach((n, i) => { n.cy = 120; n.cx = 80 + [0, 40, 170, 300][i] })
E.setSelection(four)
const spanBefore = {
  l: Math.min(...four.map(n => E.edges(n).l)),
  r: Math.max(...four.map(n => E.edges(n).r)),
}
E.distributeSel('x')
const sorted = four.slice().sort((a, b) => a.cx - b.cx).map(n => E.edges(n))
const gaps = sorted.slice(1).map((e, i) => e.l - sorted[i].r)
ok('水平等间距', Math.max(...gaps) - Math.min(...gaps) < 1.5, gaps.map(Math.round).join(','))
ok('分布后两端不动',
  Math.abs(sorted[0].l - spanBefore.l) < 1.5
  && Math.abs(sorted[sorted.length - 1].r - spanBefore.r) < 1.5,
  `${Math.round(spanBefore.l)}..${Math.round(spanBefore.r)} → ${Math.round(sorted[0].l)}..${Math.round(sorted[sorted.length - 1].r)}`)

// ===== 8. 统一尺寸 + 网格 =====
E.load('01-framework')
const rects = E.spec.nodes.filter(n => n.shape === 'rect').slice(0, 3)
rects.forEach((n, i) => { n.w = 100 + i * 30; n.h = 40 + i * 5 })
E.setSelection(rects)
E.matchSize('wh')
const refW = E.selected.w, refH = E.selected.h
ok('统一宽高', rects.every(n => n.w === refW && n.h === refH), `${refW}×${refH}`)

rects.forEach(n => { n.cx = 103; n.cy = 207 })
E.setSelection(rects)
E.snapToGrid()
ok('吸到 8px 网格', rects.every(n => n.cx % 8 === 0 && n.cy % 8 === 0),
  `${rects[0].cx},${rects[0].cy}`)

// ===== 9. 增 / 删 / 复制（含撑销）=====
E.load('06-er')
const count0 = E.spec.nodes.length
E.addNode('rect')
ok('添加元素', E.spec.nodes.length === count0 + 1 && E.selection.length === 1)
E.doUndo()
ok('添加可撑销', E.spec.nodes.length === count0, `${E.spec.nodes.length} vs ${count0}`)

E.setSelection([E.spec.nodes[0], E.spec.nodes[1]])
const gone = E.selection.map(n => n.id)
E.deleteSelected()
ok('批量删除', E.spec.nodes.length === count0 - 2 && E.selection.length === 0)
ok('删除后连线已清理',
  !(E.spec.links || []).some(l => gone.includes(l.from) || gone.includes(l.to)))
E.doUndo()
ok('删除可撑销', E.spec.nodes.length === count0
  && gone.every(id => E.spec.nodes.some(n => n.id === id)))

E.setSelection([E.spec.nodes[0], E.spec.nodes[1]])
E.duplicateSelected()
ok('批量复制', E.spec.nodes.length === count0 + 2 && E.selection.length === 2)
const dupIds = E.spec.nodes.map(n => n.id)
ok('复制后 id 仍唯一', new Set(dupIds).size === dupIds.length)
E.doUndo()
ok('复制可撑销', E.spec.nodes.length === count0)

// ===== 10. 约束维度在拖拽时锁定 =====
E.load('09-sequence')
E.redraw()
const msg = E.spec.nodes.find(n => n.shape === 'message')
const mx = msg.cx, my = msg.cy
E.setSelection([msg])
drag(msg.cx, msg.cy, msg.cx + 60, msg.cy + 40, { altKey: true })
ok('绑定的 X 不可拖', Math.abs(byId(msg.id).cx - mx) < 1, `cx ${mx} → ${byId(msg.id).cx}`)
ok('自由的 Y 可拖', byId(msg.id).cy === my + 40)

// 拖泳道，消息线应该跟随
E.load('09-sequence')
E.redraw()
const lane = E.spec.nodes.find(n => n.shape === 'lane')
const follower = E.spec.nodes.find(n => n.bindX === lane.id || n.anchorFrom === lane.id)
const fx = follower.cx
E.setSelection([lane])
drag(lane.cx, lane.cy, lane.cx + 30, lane.cy, { altKey: true })
E.redraw()
ok('拖泳道时绑定元素跟随', Math.abs(follower.cx - fx) > 1,
  `${follower.id} ${Math.round(fx)} → ${Math.round(follower.cx)}`)

// ===== 11. 保存 / 载入往返 =====
E.load('10-chart')
const bar = E.spec.nodes.find(n => n.shape === 'bar')
E.setSelection([bar])
bar.h = bar.h + 33
E.addNode('label')
E.selected.label = '新增标注'
const expectCount = E.spec.nodes.length
clickBtn('save')
E.load('10-chart')
ok('保存后重载保留新增元素', E.spec.nodes.length === expectCount,
  `${E.spec.nodes.length} vs ${expectCount}`)
ok('保存后重载保留属性修改',
  !!E.spec.nodes.find(n => n.label === '新增标注'))
clickBtn('reset')
ok('重置回到初始状态',
  E.spec.nodes.length === DIAGRAMSLEN('10-chart'),
  `${E.spec.nodes.length}`)
function DIAGRAMSLEN(id) { return E.DIAGRAMS[id].nodes.length }

// ===== 12. 连线：登记与命中 =====
E.load('06-er')
E.redraw()
const linkIds = Object.keys(E.rd.links)
ok('连线已登记几何', linkIds.length === (E.spec.links || []).length,
  `${linkIds.length}/${(E.spec.links || []).length}`)
ok('连线 id 唯一', new Set(linkIds).size === linkIds.length)

// 在第一条连线中点处点一下
const rec0 = E.rd.links[linkIds[0]]
const mid = {
  x: (rec0.points[0].x + rec0.points[1].x) / 2,
  y: (rec0.points[0].y + rec0.points[1].y) / 2,
}
ok('连线可命中', E.hitLink(mid) === rec0.link)
ok('远处不误命中', E.hitLink({ x: mid.x, y: mid.y + 60 }) !== rec0.link)

down(mid.x, mid.y); up()
ok('单击可选中连线', E.selLink === rec0.link && E.selection.length === 0)

// ===== 13. 连线属性生效 =====
const L = E.selLink
L.label = '1:N'
L.lineWidth = 3
L.dashed = true
L.arrow = false
E.redraw()
ok('改连线属性不报错', !!E.rd.links[L.id])

L.arrow = undefined
delete L.arrow
L.hollow = true
E.redraw()
ok('空心箭头可渲染', !!E.rd.links[L.id])

// 拐角走线
L.bend = 'h'
E.redraw()
ok('正交拐角产生三个点', E.rd.links[L.id].points.length === 3,
  `${E.rd.links[L.id].points.length} 个点`)
delete L.bend

// 指定出边
const fromNode = E.spec.nodes.find(n => n.id === L.from)
L.fromSide = 'top'
E.redraw()
const p0 = E.rd.links[L.id].points[0]
ok('指定出边生效', Math.abs(p0.y - (fromNode.cy - (fromNode.h || 60) / 2)) < 2,
  `y=${Math.round(p0.y)}`)
delete L.fromSide

// 整体平移：端点被约束在边界上（只沿边滑动），所以看线的中段位移
E.redraw()
const midOf = pts => ({
  x: pts.reduce((a, p) => a + p.x, 0) / pts.length,
  y: pts.reduce((a, p) => a + p.y, 0) / pts.length,
})
const noOff = midOf(E.rd.links[L.id].points)
L.offset = 12
E.redraw()
const withOff = midOf(E.rd.links[L.id].points)
ok('整体平移生效', Math.hypot(withOff.x - noOff.x, withOff.y - noOff.y) > 2,
  `中段位移 ${Math.hypot(withOff.x - noOff.x, withOff.y - noOff.y).toFixed(1)}px`)

// 平移后两端必须仍然贴在节点边界上
const offPts = E.rd.links[L.id].points
const fb = E.rd.nodes[L.from]
const gapX = Math.abs(offPts[0].x - (fb.cx + Math.abs(fb.w) / 2))
ok('平移后端点仍贴边', gapX < 1.5, `离右缘 ${gapX.toFixed(2)}px`)
delete L.offset

// ===== 14. 转自由折线 + 拐点增删拖 =====
E.load('06-er')
E.redraw()
const L2 = E.spec.links[0]
E.selLink = L2
E.convertToPolyline(L2)
E.redraw()
ok('转为自由折线', Array.isArray(L2.points) && L2.points.length === 2
  && !L2.from && !L2.to, JSON.stringify(L2.points))
ok('转折线后仍能渲染', !!E.rd.links[L2.id])

// 双击线中插入拐点
const rp = E.rd.links[L2.id].points
const m2 = { x: (rp[0].x + rp[1].x) / 2, y: (rp[0].y + rp[1].y) / 2 }
syncRect()
cv.fire('dblclick', { clientX: m2.x, clientY: m2.y })
ok('双击插入拐点', L2.points.length === 3, `${L2.points.length} 个点`)
ok('拐点插在中间', typeof L2.points[1] === 'object'
  && typeof L2.points[0] === 'string' && typeof L2.points[2] === 'string')

// 拖拐点
const vpt = E.rd.links[L2.id].points[1]
ok('拐点可命中', E.hitVertex(vpt) === 1, `返回 ${E.hitVertex(vpt)}`)
drag(vpt.x, vpt.y, vpt.x + 35, vpt.y + 25, {})
ok('拐点可拖动',
  L2.points[1].x === Math.round(vpt.x + 35) && L2.points[1].y === Math.round(vpt.y + 25),
  JSON.stringify(L2.points[1]))
E.doUndo()
ok('拖拐点可撑销', E.spec.links[0].points[1].x === Math.round(vpt.x))

// 双击拐点删除
E.selLink = E.spec.links[0]
E.redraw()
const v2 = E.rd.links[E.selLink.id].points[1]
syncRect()
cv.fire('dblclick', { clientX: v2.x, clientY: v2.y })
ok('双击拐点可删除', E.selLink.points.length === 2, `${E.selLink.points.length} 个点`)

// ===== 15. 反转 / 删除 / 新建 =====
E.load('06-er')
E.redraw()
const L3 = E.spec.links[0]
const fa = L3.from, ta = L3.to
E.selLink = L3
E.flipLink()
ok('反转两端', L3.from === ta && L3.to === fa)
E.doUndo()
ok('反转可撑销', E.spec.links[0].from === fa)

const lc0 = E.spec.links.length
E.selLink = E.spec.links[0]
E.deleteLink()
ok('删除连线', E.spec.links.length === lc0 - 1 && E.selLink === null)
E.doUndo()
ok('删除连线可撑销', E.spec.links.length === lc0)

E.selLink = null
E.setSelection([E.spec.nodes[0], E.spec.nodes[1], E.spec.nodes[2]])
E.linkSelection()
ok('多选串连新建连线', E.spec.links.length === lc0 + 2,
  `${E.spec.links.length} vs ${lc0 + 2}`)
E.redraw()
const allIds = Object.keys(E.rd.links)
ok('新建后 id 仍唯一', new Set(allIds).size === allIds.length
  && allIds.length === E.spec.links.length)
E.doUndo()
ok('新建连线可撑销', E.spec.links.length === lc0)

// ===== 16. 删节点时清理 points 式连线 =====
E.load('08-flowchart')
E.redraw()
const withPts = (E.spec.links || []).find(l => l.points
  && l.points.some(p => typeof p === 'string'))
if (withPts) {
  const refId = withPts.points.find(p => typeof p === 'string').split('.')[0]
  E.setSelection([E.spec.nodes.find(n => n.id === refId)])
  E.deleteSelected()
  const dangling = (E.spec.links || []).some(l =>
    (l.points || []).some(p => typeof p === 'string' && p.split('.')[0] === refId))
  ok('删节点同时清理引用它的折线', !dangling)
} else {
  ok('删节点同时清理引用它的折线', true, '（无锚点式折线，跳过）')
}

// ===== 17. 导出代码包含新增连线字段 =====
E.load('06-er')
E.redraw()
Object.assign(E.spec.links[0], {
  bend: 'v', fromSide: 'right', toSide: 'left', offset: 8,
  arrowStart: true, hollow: true, arrowSize: 14, lineWidth: 2.5,
})
let dumped = ''
sandbox.navigator.clipboard = { writeText: t => { dumped = t; return { catch() {} } } }
clickBtn('dump')
const need = ['bend:', 'fromSide:', 'toSide:', 'offset:', 'arrowStart:', 'hollow:', 'arrowSize:', 'lineWidth:']
const miss = need.filter(k => dumped.indexOf(k) < 0)
ok('导出代码含全部连线字段', miss.length === 0, miss.join(' '))

// ===== 18. 箭头位置可拖 =====
E.load('06-er')
E.redraw()
const LA = E.spec.links[0]
E.selLink = LA
E.redraw()
let recA = E.rd.links[LA.id]
const tail = recA.points[recA.points.length - 1]
ok('箭头端可命中', (E.hitEndpoint(tail) || {}).end === 'to',
  JSON.stringify(E.hitEndpoint(tail)))
ok('起点端可命中', (E.hitEndpoint(recA.points[0]) || {}).end === 'from')
ok('线中不误认为端点', E.hitEndpoint({
  x: (recA.points[0].x + tail.x) / 2, y: (recA.points[0].y + tail.y) / 2 }) === null)

// 拖箭头到目标节点的上边靠左
const target = E.spec.nodes.find(n => n.id === LA.to)
const tw = target.w || 200, th = target.h || 72
drag(tail.x, tail.y, target.cx - tw * 0.3, target.cy - th / 2 - 4, {})
ok('拖箭头写入 toSide', LA.toSide === 'top', `toSide=${LA.toSide}`)
ok('拖箭头写入 toAt', LA.toAt != null && LA.toAt > 0.1 && LA.toAt < 0.4,
  `toAt=${LA.toAt}`)

E.redraw()
recA = E.rd.links[LA.id]
const newTail = recA.points[recA.points.length - 1]
ok('箭头真的移到了上边', Math.abs(newTail.y - (target.cy - th / 2)) < 1,
  `y=${Math.round(newTail.y)} 期望 ${Math.round(target.cy - th / 2)}`)
ok('箭头水平位置跟随 at',
  Math.abs(newTail.x - (target.cx - tw / 2 + tw * LA.toAt)) < 1,
  `x=${Math.round(newTail.x)}`)

E.doUndo()
ok('拖箭头可撑销', E.spec.links[0].toSide === undefined)

// 中点应该不写 at（保持数据干净）
E.selLink = E.spec.links[0]
E.setEndpoint('to', 'left', 0.5)
ok('边中点不写冗余 at',
  E.selLink.toSide === 'left' && E.selLink.toAt === undefined)

// ===== 19. points 式连线的箭头也可拖 =====
E.load('08-flowchart')
E.redraw()
const LP = E.spec.links.find(l => l.points
  && typeof l.points[l.points.length - 1] === 'string')
E.selLink = LP
E.redraw()
const pTail = E.rd.links[LP.id].points.slice(-1)[0]
ok('折线端点可命中', (E.hitEndpoint(pTail) || {}).end === 'to')
const pNode = E.spec.nodes.find(n => n.id === E.endpointNodeId('to'))
E.setEndpoint('to', 'left', 0.25)
ok('折线端点写成 id.side@at',
  LP.points[LP.points.length - 1] === `${pNode.id}.left@0.25`,
  String(LP.points[LP.points.length - 1]))
E.redraw()
const pEnd = E.rd.links[LP.id].points.slice(-1)[0]
const pBox = E.rd.nodes[pNode.id]
ok('折线端点新位置生效',
  Math.abs(pEnd.x - (pBox.cx - Math.abs(pBox.w) / 2)) < 1
  && Math.abs(pEnd.y - (pBox.cy - pBox.h / 2 + pBox.h * 0.25)) < 1,
  `(${Math.round(pEnd.x)},${Math.round(pEnd.y)}) 期望 (${Math.round(pBox.cx - Math.abs(pBox.w) / 2)},${Math.round(pBox.cy - pBox.h / 2 + pBox.h * 0.25)})`)

// ===== 15. 改字号时竖排文字框跟着变高 =====
E.load('03-module')
E.redraw()
const vt = E.spec.nodes.find(n => n.shape === 'vtext')
const h0 = E.rd.nodes[vt.id].h
E.setSelection([vt])
vt.fontSize = 26
E.redraw()
const h1 = E.rd.nodes[vt.id].h
ok('放大字号后竖排框变高', h1 > h0 + 1,
  `${Math.round(h0)} → ${Math.round(h1)}`)

// 连到它的树形线端点应仍贴在新的顶边
const vLink = (E.spec.links || []).find(l => l.to === vt.id)
if (vLink) {
  const lp = E.rd.links[vLink.id].points.slice(-1)[0]
  const vb = E.rd.nodes[vt.id]
  ok('变高后连线仍贴边', Math.abs(lp.y - (vb.cy - vb.h / 2)) < 1.5,
    `y=${Math.round(lp.y)} 期望 ${Math.round(vb.cy - vb.h / 2)}`)
}

console.log(fail ? `\n失败 ${fail} 项` : '\n全部通过')
process.exit(fail ? 1 : 0)
