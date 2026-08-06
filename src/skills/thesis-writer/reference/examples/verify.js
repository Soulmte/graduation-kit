/**
 * 校验脚本（Node 环境，无需浏览器）
 * 用 stub ctx 走一遍每张图的完整绘制流程，捕获引用错误与缺失节点。
 * 运行：node verify.js
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

// --- 最小 Canvas 2D stub：记录调用次数，不做真实绘制 ---
// measureText 必须随 ctx.font 变化，否则测不出与字号相关的布局问题
function stubWidth(str, fontSize, bold) {
  let w = 0
  for (const ch of String(str)) {
    let r
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(ch)) r = 1.0
    else if (/[A-Z]/.test(ch)) r = 0.68
    else if (/[a-z0-9]/.test(ch)) r = 0.56
    else if (/\s/.test(ch)) r = 0.32
    else r = 0.45
    w += r * fontSize
  }
  return bold ? w * 1.05 : w
}

function makeCtx(log) {
  const noop = name => (...a) => { log.calls[name] = (log.calls[name] || 0) + 1 }
  const c = {
    canvas: { width: 0, height: 0, style: {} },
    font: '14px sans-serif',
    setTransform: noop('setTransform'), scale: noop('scale'),
    save: noop('save'), restore: noop('restore'),
    translate: noop('translate'), rotate: noop('rotate'),
    beginPath: noop('beginPath'), closePath: noop('closePath'),
    moveTo: noop('moveTo'), lineTo: noop('lineTo'),
    arc: noop('arc'), arcTo: noop('arcTo'), ellipse: noop('ellipse'),
    rect: noop('rect'), fill: noop('fill'), stroke: noop('stroke'),
    fillRect: noop('fillRect'), setLineDash: noop('setLineDash'),
    fillText: (t, x, y) => {
      log.texts.push(String(t))
      const m = /(\d+(?:\.\d+)?)px/.exec(c.font)
      const fs = m ? parseFloat(m[1]) : 14
      const bold = /bold/.test(c.font)
      log.drawn.push({ t: String(t), x, y, fs, bold,
        w: stubWidth(t, fs, bold), align: c.textAlign })
    },
    measureText(t) {
      const m = /(\d+(?:\.\d+)?)px/.exec(c.font)
      return { width: stubWidth(t, m ? parseFloat(m[1]) : 14, /bold/.test(c.font)) }
    },
  }
  return c
}

/** 新建一份绘制日志容器 */
const newLog = () => ({ calls: {}, texts: [], drawn: [] })

const dir = __dirname

/** 极简 XML 良好性检查：标签栈匹配 + 属性引号成对 */
function checkWellFormed(xml, bad) {
  const body = xml.replace(/<\?[\s\S]*?\?>/g, '')
  const stack = []
  const re = /<(\/?)([A-Za-z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g
  let m, last = 0
  while ((m = re.exec(body))) {
    // 标签之间不得出现裸 < 或 >
    const between = body.slice(last, m.index)
    if (/[<>]/.test(between)) { bad.push('文本节点含未转义的 < 或 >'); return false }
    last = m.index + m[0].length
    const [, slash, name, attrs, selfClose] = m
    if ((attrs.match(/"/g) || []).length % 2) { bad.push(`<${name}> 属性引号不成对`); return false }
    if (slash) {
      if (stack.pop() !== name) { bad.push(`</${name}> 未匹配`); return false }
    } else if (!selfClose) {
      stack.push(name)
    }
  }
  if (/[<>]/.test(body.slice(last))) { bad.push('尾部含游离的 < 或 >'); return false }
  if (stack.length) { bad.push('未闭合标签：' + stack.join(',')); return false }
  return true
}
const sandbox = {
  console,
  document: {
    createElement: () => ({ getContext: () => makeCtx(newLog()), style: {}, toBlob() {} }),
    getElementById: () => null,
  },
  window: {},
}
sandbox.window = sandbox
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
]

let loadFail = 0
const sources = []
for (const f of files) {
  try {
    sources.push(`// ===== ${f} =====\n` + fs.readFileSync(path.join(dir, f), 'utf8'))
  } catch (e) {
    console.error(`✗ 读取失败 ${f}\n  ${e.message}`)
    loadFail++
  }
}
if (loadFail) process.exit(1)

// 拼成单个脚本执行，使顶层 const/class 共享作用域（同浏览器多 script 行为）
// 末尾显式导出供校验使用
const bundle = sources.join('\n') + '\n;globalThis.__out = { DIAGRAMS, Renderer, Stage, renderSVG, resolveSize, anchors, pointAtFraction, measureText, resolveLineHeight };'
try {
  vm.runInContext(bundle, sandbox, { filename: 'bundle.js' })
} catch (e) {
  console.error('✗ 执行异常: ' + e.message)
  console.error(e.stack.split('\n').slice(0, 6).join('\n'))
  process.exit(1)
}

const { DIAGRAMS, Renderer, Stage, renderSVG, resolveSize, anchors,
  pointAtFraction, measureText, resolveLineHeight } = sandbox.__out
const ids = Object.keys(DIAGRAMS)
console.log(`已注册 ${ids.length} 张图\n`)

let fail = 0
const warns = []
const origWarn = console.warn
console.warn = (...a) => warns.push(a.join(' '))

for (const id of ids) {
  const spec = DIAGRAMS[id]
  const log = newLog()
  const ctx = makeCtx(log)
  const stage = { ctx, width: spec.width, height: spec.height, scale: 1 }
  const before = warns.length
  try {
    const r = new Renderer(spec)
    r.draw(stage)
    const drawn = Object.values(log.calls).reduce((a, b) => a + b, 0)
    const w = warns.length - before
    const nodeCount = (spec.nodes || []).length

    // 可拖拽校验：每个节点必须有 id、数字坐标，且渲染后能拿到包围盒
    const bad = []
    ;(spec.nodes || []).forEach(n => {
      if (!n.id) return bad.push('缺 id')
      if (typeof n.cx !== 'number' || typeof n.cy !== 'number') return bad.push(n.id + ' 坐标非数字')
      const box = r.nodes[n.id]
      if (!box) return bad.push(n.id + ' 无包围盒')
      if (!(box.w > 0 && box.h > 0)) bad.push(n.id + ' 尺寸无效')
    })
    const ids2 = (spec.nodes || []).map(n => n.id)
    const dup = ids2.filter((v, i) => ids2.indexOf(v) !== i)
    if (dup.length) bad.push('id 重复: ' + [...new Set(dup)].join(','))

    const flag = (w || bad.length) ? '⚠' : '✓'
    console.log(`${flag} ${id.padEnd(22)} ${String(spec.width).padStart(4)}×${String(spec.height).padEnd(4)} 可拖元素 ${String(nodeCount).padStart(3)}  图元 ${drawn}`)
    if (bad.length) {
      bad.forEach(b => console.error('   ✗ ' + b))
      fail += bad.length
    }
    if (!drawn) { console.error('   ✗ 未产生任何绘制调用'); fail++ }
    if (!nodeCount) { console.error('   ✗ 没有可拖拽节点'); fail++ }
    if (!spec.name || !spec.width || !spec.height) { console.error('   ✗ 缺少 name/width/height'); fail++ }
  } catch (e) {
    console.error(`✗ ${id} 渲染异常: ${e.message}`)
    fail++
  }
}
console.warn = origWarn

// --- 额外校验：PNG 导出路径 ---
try {
  const spec = DIAGRAMS[ids[0]]
  const log = newLog()
  let blobbed = false
  const fake = {
    getContext: () => makeCtx(log),
    style: {},
    toBlob(cb) { blobbed = true },
  }
  sandbox.document.createElement = tag => (tag === 'canvas' ? fake : { style: {}, click() {} })
  sandbox.document.body = { appendChild() {}, removeChild() {} }
  sandbox.URL = { createObjectURL: () => 'blob:x', revokeObjectURL() {} }
  sandbox.setTimeout = () => {}

  const stage = new Stage(fake, spec.width, spec.height, 2)
  stage.exportPNG(spec.name, s => new Renderer(spec).draw(s), 4)
  console.log(blobbed ? '\n✓ PNG 导出路径正常' : '\n✗ PNG 导出未触发 toBlob')
  if (!blobbed) fail++
} catch (e) {
  console.error('\n✗ PNG 导出异常: ' + e.message)
  fail++
}

// --- 额外校验：SVG 导出（标签配对 + 可解析 + 内容齐全）---
console.log('\n--- SVG 导出 ---')
for (const id of ids) {
  const spec = DIAGRAMS[id]
  try {
    const svg = renderSVG(spec)
    const bad = []
    const open = (svg.match(/<g[ >]/g) || []).length
    const close = (svg.match(/<\/g>/g) || []).length
    if (open !== close) bad.push(`<g> 不配对：${open} 开 / ${close} 闭`)
    if (!checkWellFormed(svg, bad)) { /* 错误已入 bad */ }
    if (/NaN|undefined|Infinity/.test(svg)) bad.push('含 NaN/undefined/Infinity')

    // 内容齐全：每个有 label 的节点都应能在 SVG 里找到文本
    // 注意：vtext 逐字符输出，字符实体需还原，所以拉直后做子串匹配
    const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    const texts = (svg.match(/<text[^>]*>([^<]*)<\/text>/g) || [])
      .map(t => unesc(t.replace(/<[^>]*>/g, '')))
    const flat = texts.join('').replace(/\s+/g, '')
    const missing = (spec.nodes || []).filter(n => {
      if (!n.label || n.hidden) return false
      return flat.indexOf(String(n.label).replace(/\s+/g, '')) < 0
    }).map(n => n.id)
    if (missing.length) bad.push('文本缺失：' + missing.join(','))

    const paths = (svg.match(/<path/g) || []).length
    console.log(`${bad.length ? '✗' : '✓'} ${id.padEnd(22)} ${String(svg.length).padStart(6)}B  path ${String(paths).padStart(3)}  text ${String(texts.length).padStart(3)}`)
    bad.forEach(b => { console.error('   ✗ ' + b); fail++ })
  } catch (e) {
    console.error(`✗ ${id} SVG 异常: ${e.message}`)
    fail++
  }
}

// --- 额外校验：连线端点是不是紧贴节点边界 ---
console.log('\n--- 连线贴合度 ---')
const GAP_TOL = 1.0

/** 点到矩形边界的有向距离：>0 在外（空隙），<0 在内（穿入） */
function gapToBox(p, box) {
  const hw = Math.abs(box.w) / 2, hh = box.h / 2
  const dx = Math.abs(p.x - box.cx) - hw
  const dy = Math.abs(p.y - box.cy) - hh
  return Math.max(dx, dy)
}

/** 点到椭圆边界：归一半径 -1 再乘尺度，近似得到像素偏差 */
function gapToEllipse(p, box) {
  const a = Math.abs(box.w) / 2, b = box.h / 2
  const dx = (p.x - box.cx) / a, dy = (p.y - box.cy) / b
  const rho = Math.hypot(dx, dy)
  return (rho - 1) * Math.min(a, b)
}

/** 点到菱形边界：|x|/a + |y|/b = 1 */
function gapToDiamond(p, box) {
  const a = Math.abs(box.w) / 2, b = box.h / 2
  const v = Math.abs(p.x - box.cx) / a + Math.abs(p.y - box.cy) / b
  return (v - 1) * Math.min(a, b)
}

/** 圆角终结符：中间矩形 + 两端半圆 */
function gapToTerminator(p, box) {
  const hw = Math.abs(box.w) / 2, hh = box.h / 2
  const r = hh
  const dx = Math.abs(p.x - box.cx), dy = Math.abs(p.y - box.cy)
  if (dx <= hw - r) return dy - hh              // 直边段
  return Math.hypot(dx - (hw - r), dy) - r     // 圆弧段
}

const GAP_FN = {
  ellipse: gapToEllipse,
  diamond: gapToDiamond,
  terminator: gapToTerminator,
}

/** 按形状选用对应的边界函数 */
function gapTo(p, box, shape) {
  return (GAP_FN[shape] || gapToBox)(p, box)
}

for (const id of ids) {
  const spec = DIAGRAMS[id]
  const log = newLog()
  const r = new Renderer(spec)
  r.draw({ ctx: makeCtx(log), width: spec.width, height: spec.height, scale: 1 })

  const bad = []
  const shapeOf = nid => (spec.nodes.find(n => n.id === nid) || {}).shape || 'rect'
  ;(spec.links || []).forEach(l => {
    const rec = r.links[l.id]
    if (!rec) return
    const pts = rec.points
    // 逐个检查连线引用的锚点：points 式用字符串，from/to 式用首尾
    const checks = []
    if (l.points) {
      l.points.forEach((p, i) => {
        if (typeof p !== 'string') return
        const nid = p.split('.')[0]
        if (r.nodes[nid]) checks.push({ p: pts[i], box: r.nodes[nid], nid })
      })
    } else {
      // from/to 式连线的形状可被 fromShape/toShape 覆盖
      if (r.nodes[l.from]) {
        checks.push({ p: pts[0], box: r.nodes[l.from], nid: l.from,
          shape: l.fromShape || l.shape })
      }
      if (r.nodes[l.to]) {
        checks.push({ p: pts[pts.length - 1], box: r.nodes[l.to], nid: l.to,
          shape: l.toShape || l.shape })
      }
    }
    checks.forEach(c => {
      const g = gapTo(c.p, c.box, c.shape || shapeOf(c.nid))
      if (Math.abs(g) > GAP_TOL) {
        bad.push(`${l.id} 的端点与 ${c.nid} ${g > 0 ? '留空隙' : '穿入'} ${Math.abs(g).toFixed(1)}px`)
      }
    })
  })

  const total = (spec.links || []).length
  console.log(`${bad.length ? '✗' : '✓'} ${id.padEnd(22)} 连线 ${String(total).padStart(3)}`
    + (bad.length ? `  问题 ${bad.length}` : '  全部贴合'))
  bad.slice(0, 6).forEach(b => { console.error('   ✗ ' + b); fail++ })
  if (bad.length > 6) { console.error(`   ……共 ${bad.length} 处`); fail += bad.length - 6 }
}

// --- 额外校验：连线是不是穿过与它无关的节点 ---
checkCrossings()

// --- 额外校验：改字号后行距/字距是否跟着缩放 ---
checkFontScaling()

// --- 额外校验：offset / 各种 side 组合下端点仍然贴边 ---
checkOffsetAdhesion()

// --- 额外校验：连线标签的白底遮罩是否瞎掉了节点轮廓 ---
checkLabelOverlap()

if (warns.length) {
  console.log('\n--- 警告明细 ---')
  warns.forEach(w => console.log('  ' + w))
}
console.log(fail ? `\n失败 ${fail} 项` : '\n全部通过')
process.exit(fail ? 1 : 0)

/** 线段与轴向矩形是否相交（Liang-Barsky），内缩 pad 避开贴边的合法端点 */
function segHitsBox(p1, p2, box, pad) {
  const hw = Math.abs(box.w) / 2 - pad
  const hh = box.h / 2 - pad
  if (hw <= 0 || hh <= 0) return false
  const xmin = box.cx - hw, xmax = box.cx + hw
  const ymin = box.cy - hh, ymax = box.cy + hh
  let t0 = 0, t1 = 1
  const dx = p2.x - p1.x, dy = p2.y - p1.y
  const clip = (num, den) => {
    if (den === 0) return num <= 0
    const t = num / den
    if (den < 0) { if (t > t1) return false; if (t > t0) t0 = t }
    else { if (t < t0) return false; if (t < t1) t1 = t }
    return true
  }
  return clip(xmin - p1.x, dx) && clip(p1.x - xmax, -dx)
    && clip(ymin - p1.y, dy) && clip(p1.y - ymax, -dy)
}

/**
 * 收集参与穿插判定的「走线」：
 *   普通连线 → 渲染器登记的点列
 *   时序消息 → message 节点的水平线段（它也是走线，只是存为节点）
 * own 为该线自己引用的节点，不算穿插。
 */
function collectWires(spec, r) {
  const wires = []

  ;(spec.links || []).forEach(l => {
    const rec = r.links[l.id]
    if (!rec) return
    const own = new Set([l.from, l.to].filter(Boolean))
    if (l.points) {
      l.points.forEach(p => {
        if (typeof p === 'string') own.add(p.split('@')[0].split('.')[0])
      })
    }
    wires.push({ id: l.id, pts: rec.points, own })
  })

  // 消息线：cx 加减 w/2 为两端，端点已按激活条宽度内缩
  ;(spec.nodes || []).forEach(n => {
    if (n.shape !== 'message' || n.hidden || !n.w) return
    const half = n.w / 2
    const own = new Set([n.id, n.anchorFrom, n.anchorTo].filter(Boolean))
    // 绑定到自己两端泳道的激活条也不算穿插
    ;(spec.nodes || []).forEach(m => {
      if (m.bindX && own.has(m.bindX)) own.add(m.id)
    })
    wires.push({
      id: n.id,
      pts: [{ x: n.cx - half, y: n.cy }, { x: n.cx + half, y: n.cy }],
      own,
    })
  })

  return wires
}

/** 容器类形状不参与穿插判定（连线本就要穿过它们） */
function checkCrossings() {
  // message/selfloop 本身是线不是框，不作为被穿对象；
  // activation 留在判定范围内，消息线跨越无关激活条是真问题
  const PASS_THROUGH = new Set(['group', 'boundary', 'lane', 'axis', 'label',
    'message', 'selfloop', 'vtext'])
  console.log('\n--- 连线穿插检查 ---')
  const PAD = 3
  for (const id of ids) {
    const spec = DIAGRAMS[id]
    const log = newLog()
    const r = new Renderer(spec)
    r.draw({ ctx: makeCtx(log), width: spec.width, height: spec.height, scale: 1 })

    const bad = []
    const wires = collectWires(spec, r)
    wires.forEach(wire => {
      const pts = wire.pts
      ;(spec.nodes || []).forEach(n => {
        if (n.hidden || wire.own.has(n.id)) return
        if (PASS_THROUGH.has(n.shape || 'rect')) return
        const box = r.nodes[n.id]
        if (!box) return
        for (let i = 1; i < pts.length; i++) {
          if (segHitsBox(pts[i - 1], pts[i], box, PAD)) {
            bad.push(`${wire.id} 穿过 ${n.id}`)
            return
          }
        }
      })
    })

    console.log(`${bad.length ? '✗' : '✓'} ${id.padEnd(22)} 走线 ${String(wires.length).padStart(3)}  `
      + (bad.length ? `穿插 ${bad.length} 处` : '无穿插'))
    bad.slice(0, 6).forEach(b => { console.error('   ✗ ' + b); fail++ })
    if (bad.length > 6) { console.error(`   ……共 ${bad.length} 处`); fail += bad.length - 6 }
  }
}

/**
 * offset 与 side 组合的贴边回归。
 * offset 本质是沿法线推开整条线，早先的实现会把端点一同推离边界留下空隙。
 * 这里取一张矩形 + 一张椭圆图，穷举 side 与 offset 组合逐一验证。
 */
function checkOffsetAdhesion() {
  console.log('\n--- offset 贴边 ---')
  const CASES = [
    { id: '06-er', from: 'user', to: 'relPub' },
    { id: '04a-usecase-user', from: 'login', to: 'auth' },
  ]
  const SIDES = [null, 'top', 'bottom', 'left', 'right']
  const OFFSETS = [0, 9, -13]

  for (const cs of CASES) {
    const base = DIAGRAMS[cs.id]
    if (!base) continue
    const bad = []
    let n = 0

    for (const fromSide of SIDES) {
      for (const toSide of SIDES) {
        for (const offset of OFFSETS) {
          const link = { id: 'T', from: cs.from, to: cs.to, offset }
          if (fromSide) link.fromSide = fromSide
          if (toSide) link.toSide = toSide
          const spec = Object.assign({}, base, { links: [link], custom: undefined })
          const r = new Renderer(spec)
          r.draw({ ctx: makeCtx(newLog()),
            width: spec.width, height: spec.height, scale: 1 })
          const rec = r.links.T
          if (!rec) continue
          n++
          const pts = rec.points
          const shapeOf = nid =>
            (spec.nodes.find(x => x.id === nid) || {}).shape || 'rect'
          // 指定了 side 时按包围盒判（锚点就定义在边上），否则按真实形状
          const g1 = fromSide
            ? gapToBox(pts[0], r.nodes[cs.from])
            : gapTo(pts[0], r.nodes[cs.from], shapeOf(cs.from))
          const g2 = toSide
            ? gapToBox(pts[pts.length - 1], r.nodes[cs.to])
            : gapTo(pts[pts.length - 1], r.nodes[cs.to], shapeOf(cs.to))
          const tag = `${fromSide || 'auto'}->${toSide || 'auto'} offset ${offset}`
          if (Math.abs(g1) > GAP_TOL) {
            bad.push(`${tag}：起点偏离 ${g1.toFixed(1)}px`)
          }
          if (Math.abs(g2) > GAP_TOL) {
            bad.push(`${tag}：终点偏离 ${g2.toFixed(1)}px`)
          }
        }
      }
    }

    console.log(`${bad.length ? '✗' : '✓'} ${cs.id.padEnd(22)} 组合 ${String(n).padStart(3)}  `
      + (bad.length ? `问题 ${bad.length} 处` : '全部贴合'))
    bad.slice(0, 5).forEach(b => { console.error('   ✗ ' + b); fail++ })
    if (bad.length > 5) { console.error(`   ……共 ${bad.length} 处`); fail += bad.length - 5 }
  }
}
/**
 * 连线标签带白底遮罩（防止压线），但遮罩落到节点上时会瞎掉一段轮廓。
 * 按真实形状判定（椭圆/菱形不能用包围盒，否则大量误报）。
 */
function checkLabelOverlap() {
  console.log('\n--- 标签遮罩 ---')
  const SOLID = new Set(['rect', 'diamond', 'io', 'ellipse', 'terminator', 'vtext'])

  for (const id of ids) {
    const spec = DIAGRAMS[id]
    const r = new Renderer(spec)
    r.draw({ ctx: makeCtx(newLog()),
      width: spec.width, height: spec.height, scale: 1 })

    const bad = []
    for (const l of spec.links || []) {
      if (!l.label) continue
      const rec = r.links[l.id]
      if (!rec) continue
      const at = pointAtFraction(rec.points, l.labelAt == null ? 0.5 : l.labelAt)
      const fs2 = l.fontSize || 12
      const lines = String(l.label).split('\n')
      const lh = resolveLineHeight(l.lineHeight, fs2, 1.3)
      const lw = Math.max(...lines.map(s => measureText(s, fs2, l.bold))) + 8
      const cx = at.x + (l.dx || 0)
      const cy = at.y + (l.dy || 0)
      const hw = lw / 2, hh = lines.length * lh / 2

      for (const n of spec.nodes || []) {
        if (n.hidden || !SOLID.has(n.shape || 'rect')) continue
        const box = r.nodes[n.id]
        if (!box) continue
        const shape = n.shape || 'rect'
        // 取遮罩矩形四角与四边中点，看是否有点落在节点内部
        const probes = []
        for (const sx of [-1, 0, 1]) {
          for (const sy of [-1, 0, 1]) {
            probes.push({ x: cx + hw * sx, y: cy + hh * sy })
          }
        }
        const inside = probes.filter(p => gapTo(p, box, shape) < -1.5)
        if (inside.length) {
          bad.push(`${l.id} 的标签遮罩瞎掉 ${n.id} 的轮廓`)
          break
        }
      }
    }

    console.log(`${bad.length ? '✗' : '✓'} ${id.padEnd(22)} `
      + (bad.length ? `压框 ${bad.length} 处` : '无压框'))
    bad.slice(0, 5).forEach(b => { console.error('   ✗ ' + b); fail++ })
    if (bad.length > 5) { console.error(`   ……共 ${bad.length} 处`); fail += bad.length - 5 }
  }
}
/**
 * 字号缩放回归：把每个带文字的节点单独重绘于多个字号，
 * 检查相邻文字行的基线间距是不是随字号一同变大。
 * 硬编码行距（如旧的 lh = 18）在字号变大后会造成文字重叠，此处能捕获。
 */
function checkFontScaling() {
  console.log('\n--- 字号缩放 ---')
  const SIZES = [12, 20, 32]

  for (const id of ids) {
    const spec = DIAGRAMS[id]
    const bad = []

    for (const n of (spec.nodes || [])) {
      if (!n.label || n.hidden) continue
      const multi = /\n/.test(String(n.label)) || n.shape === 'vtext'
      if (!multi) continue           // 单行文字不涉及行距

      let prev = null
      for (const fs of SIZES) {
        const log = newLog()
        const one = Object.assign({}, spec, {
          nodes: [Object.assign({}, n, { fontSize: fs, h: undefined })],
          links: [],
          custom: undefined,
        })
        new Renderer(one).draw({ ctx: makeCtx(log),
          width: spec.width, height: spec.height, scale: 1 })

        // 取同一列上相邻两行的基线间距
        const ys = log.drawn.map(d => d.y).sort((a, b) => a - b)
        if (ys.length < 2) break
        let gap = Infinity
        for (let i = 1; i < ys.length; i++) gap = Math.min(gap, ys[i] - ys[i - 1])
        if (!isFinite(gap)) break

        // 行距必须大于字号，否则上下行字形相接
        if (gap < fs * 1.05) {
          bad.push(`${n.id} 字号 ${fs} 时行距 ${gap.toFixed(1)} 小于字高`)
        }
        // 字号变大行距必须跟着变大
        if (prev && gap <= prev.gap + 0.01) {
          bad.push(`${n.id} 字号 ${prev.fs}→${fs} 行距未随之放大`
            + `（${prev.gap.toFixed(1)} → ${gap.toFixed(1)}）`)
        }
        prev = { fs, gap }
      }
    }

    console.log(`${bad.length ? '✗' : '✓'} ${id.padEnd(22)} `
      + (bad.length ? `问题 ${bad.length} 处` : '行距随字号缩放'))
    bad.slice(0, 4).forEach(b => { console.error('   ✗ ' + b); fail++ })
    if (bad.length > 4) { console.error(`   ……共 ${bad.length} 处`); fail += bad.length - 4 }
  }
}
