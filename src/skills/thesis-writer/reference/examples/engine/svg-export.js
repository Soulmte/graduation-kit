/**
 * SVG 导出：用一个「录制型 ctx」代理 Canvas 2D 调用，转写成 SVG 元素。
 * 好处是图元代码只写一份（shapes.js），Canvas 用于编辑、SVG 用于交付。
 *
 * 两个易错点已处理：
 *  - save/translate/rotate 都会开 <g>，用「帧计数」保证 restore 时全部闭合
 *  - arcTo 按真实切线求解圆弧，不再用二次贝塞尔糊过去
 */
function createSVGRecorder(width, height) {
  const parts = []
  let path = []                    // 当前路径的 d 片段
  let cur = { x: 0, y: 0 }         // 当前点（arcTo 需要）
  let start = { x: 0, y: 0 }       // 子路径起点（closePath 需要）
  let baseOpen = 0                 // 不在 save 帧内开出的 <g> 数
  const stack = []                 // [{ state, opened }]

  const state = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1.5,
    font: "14px 'SimHei'",
    textAlign: 'center',
    textBaseline: 'middle',
    dash: [],
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function num(v) {
    if (!isFinite(v)) return 0
    return Math.round(v * 100) / 100
  }

  /** 记一次 <g> 开启，归属到当前 save 帧 */
  function openGroup(tag) {
    parts.push(tag)
    if (stack.length) stack[stack.length - 1].opened++
    else baseOpen++
  }

  /** 解析 font 字符串，取字号、粗体、斜体 */
  function parseFont(f) {
    return {
      bold: /bold/.test(f),
      italic: /italic/.test(f),
      size: (String(f).match(/(\d+(?:\.\d+)?)px/) || [, 14])[1],
    }
  }

  const anchorMap = { center: 'middle', left: 'start', right: 'end', start: 'start', end: 'end' }
  const baselineMap = { middle: 'central', top: 'hanging', bottom: 'auto', alphabetic: 'auto' }

  function dashAttr() {
    return state.dash && state.dash.length ? ` stroke-dasharray="${state.dash.join(',')}"` : ''
  }

  function emitPath(mode) {
    if (!path.length) return
    const isFill = mode === 'fill'
    const attrs = [
      `d="${path.join(' ')}"`,
      `fill="${isFill ? esc(state.fillStyle) : 'none'}"`,
      `stroke="${isFill ? 'none' : esc(state.strokeStyle)}"`,
    ]
    if (!isFill) {
      attrs.push(`stroke-width="${num(state.lineWidth)}"`)
      attrs.push('stroke-linejoin="miter"')
    }
    parts.push(`<path ${attrs.join(' ')}${isFill ? '' : dashAttr()}/>`)
  }

  /** 圆弧片段：由起点、终点、半径、方向拼 A 指令 */
  function arcSeg(x0, y0, x1, y1, r, sweep) {
    const large = 0
    return `A ${num(r)} ${num(r)} 0 ${large} ${sweep} ${num(x1)} ${num(y1)}`
  }

  const ctx = {
    canvas: { width, height, style: {} },

    set fillStyle(v) { state.fillStyle = v },
    get fillStyle() { return state.fillStyle },
    set strokeStyle(v) { state.strokeStyle = v },
    get strokeStyle() { return state.strokeStyle },
    set lineWidth(v) { state.lineWidth = v },
    get lineWidth() { return state.lineWidth },
    set font(v) { state.font = v },
    get font() { return state.font },
    set textAlign(v) { state.textAlign = v },
    get textAlign() { return state.textAlign },
    set textBaseline(v) { state.textBaseline = v },
    get textBaseline() { return state.textBaseline },
    set lineJoin(v) {},
    set lineCap(v) {},
    set imageSmoothingEnabled(v) {},
    set imageSmoothingQuality(v) {},

    setLineDash(d) { state.dash = d || [] },

    save() {
      stack.push({ state: Object.assign({}, state), opened: 0 })
    },
    restore() {
      const f = stack.pop()
      if (!f) return
      for (let i = 0; i < f.opened; i++) parts.push('</g>')
      Object.assign(state, f.state)
    },

    setTransform() {},
    scale() {},
    translate(x, y) { openGroup(`<g transform="translate(${num(x)},${num(y)})">`) },
    rotate(a) { openGroup(`<g transform="rotate(${num(a * 180 / Math.PI)})">`) },

    // --- 路径 ---
    beginPath() { path = [] },
    closePath() { path.push('Z'); cur = { x: start.x, y: start.y } },
    moveTo(x, y) {
      path.push(`M ${num(x)} ${num(y)}`)
      cur = { x, y }
      start = { x, y }
    },
    lineTo(x, y) {
      if (!path.length) return this.moveTo(x, y)
      path.push(`L ${num(x)} ${num(y)}`)
      cur = { x, y }
    },
    rect(x, y, w, h) {
      path.push(`M ${num(x)} ${num(y)} H ${num(x + w)} V ${num(y + h)} H ${num(x)} Z`)
      cur = { x, y }
      start = { x, y }
    },

    arc(cx, cy, r, a0, a1, ccw) {
      let delta = a1 - a0
      if (!ccw && delta < 0) delta += Math.PI * 2
      if (ccw && delta > 0) delta -= Math.PI * 2
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
      if (Math.abs(Math.abs(delta) - Math.PI * 2) < 1e-6) {
        path.push(`M ${num(cx - r)} ${num(cy)} a ${num(r)} ${num(r)} 0 1 0 ${num(r * 2)} 0`
          + ` a ${num(r)} ${num(r)} 0 1 0 ${num(-r * 2)} 0 Z`)
        cur = { x: cx - r, y: cy }
        start = { x: cx - r, y: cy }
        return
      }
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
      if (!path.length) { path.push(`M ${num(x0)} ${num(y0)}`); start = { x: x0, y: y0 } }
      else path.push(`L ${num(x0)} ${num(y0)}`)
      const sweep = delta > 0 ? 1 : 0
      // 弧长 > 180° 时拆两段，避开 large-arc 歧义
      if (Math.abs(delta) > Math.PI) {
        const am = a0 + delta / 2
        const xm = cx + r * Math.cos(am), ym = cy + r * Math.sin(am)
        path.push(arcSeg(x0, y0, xm, ym, r, sweep))
        path.push(arcSeg(xm, ym, x1, y1, r, sweep))
      } else {
        path.push(arcSeg(x0, y0, x1, y1, r, sweep))
      }
      cur = { x: x1, y: y1 }
    },

    /** 标准 arcTo：在 cur→(x1,y1) 与 (x1,y1)→(x2,y2) 两条切线间倒半径 r 的圆角 */
    arcTo(x1, y1, x2, y2, r) {
      const v0x = cur.x - x1, v0y = cur.y - y1
      const v1x = x2 - x1, v1y = y2 - y1
      const l0 = Math.hypot(v0x, v0y), l1 = Math.hypot(v1x, v1y)
      if (!l0 || !l1 || !r) return this.lineTo(x1, y1)
      const u0x = v0x / l0, u0y = v0y / l0
      const u1x = v1x / l1, u1y = v1y / l1
      const cosT = Math.max(-1, Math.min(1, u0x * u1x + u0y * u1y))
      const theta = Math.acos(cosT)
      if (theta < 1e-6 || Math.abs(theta - Math.PI) < 1e-6) return this.lineTo(x1, y1)
      const d = Math.min(r / Math.tan(theta / 2), l0, l1)
      const t0x = x1 + u0x * d, t0y = y1 + u0y * d
      const t1x = x1 + u1x * d, t1y = y1 + u1y * d
      this.lineTo(t0x, t0y)
      // 叉积定旋转方向（SVG y 轴向下，叉积 < 0 为顺时针）
      const cross = u0x * u1y - u0y * u1x
      path.push(arcSeg(t0x, t0y, t1x, t1y, r, cross < 0 ? 1 : 0))
      cur = { x: t1x, y: t1y }
    },

    ellipse(cx, cy, rx, ry) {
      path.push(`M ${num(cx - rx)} ${num(cy)} a ${num(rx)} ${num(ry)} 0 1 0 ${num(rx * 2)} 0`
        + ` a ${num(rx)} ${num(ry)} 0 1 0 ${num(-rx * 2)} 0 Z`)
      cur = { x: cx - rx, y: cy }
      start = { x: cx - rx, y: cy }
    },

    fill() { emitPath('fill') },
    stroke() { emitPath('stroke') },

    fillRect(x, y, w, h) {
      parts.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"`
        + ` fill="${esc(state.fillStyle)}"/>`)
    },
    strokeRect(x, y, w, h) {
      parts.push(`<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"`
        + ` fill="none" stroke="${esc(state.strokeStyle)}"`
        + ` stroke-width="${num(state.lineWidth)}"${dashAttr()}/>`)
    },

    fillText(t, x, y) {
      const f = parseFont(state.font)
      const attrs = [
        `x="${num(x)}"`, `y="${num(y)}"`,
        `fill="${esc(state.fillStyle)}"`,
        `font-family="SimHei, 'Microsoft YaHei', sans-serif"`,
        `font-size="${f.size}"`,
        `text-anchor="${anchorMap[state.textAlign] || 'middle'}"`,
        `dominant-baseline="${baselineMap[state.textBaseline] || 'central'}"`,
      ]
      if (f.bold) attrs.push('font-weight="bold"')
      if (f.italic) attrs.push('font-style="italic"')
      parts.push(`<text ${attrs.join(' ')}>${esc(t)}</text>`)
    },

    measureText(t) {
      const f = parseFont(state.font)
      return { width: measureText(t, Number(f.size), f.bold) }
    },
  }

  function serialize() {
    // 收尾：补齐所有未闭合的 <g>（正常流程不应该走到这里）
    let open = baseOpen
    stack.forEach(f => { open += f.opened })
    const close = new Array(open).fill('</g>').join('\n')
    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
      + `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`
      + ` viewBox="0 0 ${width} ${height}">\n`
      + `<rect width="${width}" height="${height}" fill="#fff"/>\n`
      + parts.join('\n') + (close ? '\n' + close : '') + '\n</svg>\n'
  }

  return { ctx, serialize }
}

/** 用当前 spec 渲染出 SVG 字符串 */
function renderSVG(spec) {
  const rec = createSVGRecorder(spec.width, spec.height)
  const stage = { ctx: rec.ctx, width: spec.width, height: spec.height, scale: 1 }
  rec.ctx.font = `${THEME.fontSize}px ${THEME.font}`
  new Renderer(spec).draw(stage)
  return rec.serialize()
}

/** 下载 SVG */
function exportSVG(spec, name) {
  const blob = new Blob([renderSVG(spec)], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (name || spec.name || spec.id) + '.svg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
