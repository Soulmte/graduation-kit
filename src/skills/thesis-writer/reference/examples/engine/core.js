/**
 * 引擎核心：主题常量、文字度量、Canvas 基础封装
 * 所有绘制走 Canvas 2D，坐标系为逻辑像素，DPR 缩放由 Stage 统一处理。
 */
const THEME = {
  font: "'SimHei','Microsoft YaHei',sans-serif",
  fg: '#000',
  bg: '#fff',
  line: 1.5,
  thin: 1.2,
  fontSize: 14,
  arrow: 9,
  dash: [6, 3],
  dashLine: [6, 4],
  lifeline: [5, 5],
}

/** 字符类别估算（降级方案，无 Canvas 时使用） */
function estimateText(str, fontSize, bold = false) {
  let w = 0
  for (const ch of String(str)) {
    let r
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(ch)) r = 1.0
    else if (/[A-Z]/.test(ch)) r = 0.68
    else if (/[a-z]/.test(ch)) r = 0.56
    else if (/[0-9]/.test(ch)) r = 0.56
    else if (/\s/.test(ch)) r = 0.32
    else r = 0.45
    w += r * fontSize
  }
  return bold ? w * 1.05 : w
}

// 共用测量上下文（离屏，不参与绘制）
let _measureCtx = null
const _measureCache = new Map()

function _getMeasureCtx() {
  if (_measureCtx !== null) return _measureCtx
  try {
    _measureCtx = document.createElement('canvas').getContext('2d')
  } catch (e) {
    _measureCtx = false
  }
  return _measureCtx
}

/**
 * 真实文字宽度（ctx.measureText），带结果缓存。
 * 无 Canvas 环境（如 Node 校验脚本）自动降级为估算。
 */
function measureText(str, fontSize = THEME.fontSize, bold = false) {
  const s = String(str)
  if (!s) return 0
  const key = fontSize + '|' + (bold ? 'b' : 'n') + '|' + s
  const cached = _measureCache.get(key)
  if (cached !== undefined) return cached

  const ctx = _getMeasureCtx()
  let w
  if (ctx) {
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${THEME.font}`
    w = ctx.measureText(s).width
  } else {
    w = estimateText(s, fontSize, bold)
  }
  _measureCache.set(key, w)
  return w
}

/**
 * 行距 / 字距解析：统一按字号比例缩放，避免硬编码像素值在改字号后造成文字重叠。
 *   lineHeight 为数字  → 当作倍率（<4）或绝对像素（>=4，且不小于字号）
 *   未指定           → fontSize * ratio
 * 绝对值仍会取 max(指定值, fontSize * MIN_RATIO)，保证放大字号时不粘连。
 */
function resolveLineHeight(lineHeight, fontSize = THEME.fontSize, ratio = 1.4) {
  const fs = fontSize || THEME.fontSize
  const MIN_RATIO = 1.15
  if (lineHeight == null) return fs * ratio
  const v = lineHeight < 4 ? fs * lineHeight : lineHeight
  return Math.max(v, fs * MIN_RATIO)
}

/** 按最大宽度折行，返回行数组（CJK 逐字断，西文按空格断） */
function wrapText(str, maxWidth, fontSize = THEME.fontSize, bold = false) {
  const paras = String(str).split('\n')
  const out = []
  for (const para of paras) {
    if (measureText(para, fontSize, bold) <= maxWidth) {
      out.push(para)
      continue
    }
    // 先拆成不可分单元：CJK 单字、西文单词
    const units = para.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]|[^\s\u4e00-\u9fa5]+|\s+/g) || []
    let line = ''
    for (const u of units) {
      const test = line + u
      if (line && measureText(test, fontSize, bold) > maxWidth) {
        out.push(line.trim())
        line = /\s/.test(u) ? '' : u
      } else {
        line = test
      }
    }
    if (line.trim()) out.push(line.trim())
  }
  return out
}

/** 舞台：管理 canvas、DPR、坐标换算与导出 */
class Stage {
  constructor(canvas, width, height, scale = 2) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.resize(width, height, scale)
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale || this.scale
    this.canvas.width = width * this.scale
    this.canvas.height = height * this.scale
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'
  }

  /** 每帧重置：清空并铺白底，恢复缩放 */
  begin() {
    const { ctx } = this
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(this.scale, this.scale)
    ctx.fillStyle = THEME.bg
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.strokeStyle = THEME.fg
    ctx.fillStyle = THEME.fg
    ctx.lineWidth = THEME.line
    ctx.lineJoin = 'miter'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.setLineDash([])
  }

  /** 鼠标事件坐标 → 逻辑坐标 */
  toLocal(evt) {
    const r = this.canvas.getBoundingClientRect()
    return {
      x: (evt.clientX - r.left) * (this.width / r.width),
      y: (evt.clientY - r.top) * (this.height / r.height),
    }
  }

  /** 以指定倍率离屏重绘后导出 PNG（不影响屏幕上的画布） */
  exportPNG(name, drawFn, scale = 4) {
    const off = document.createElement('canvas')
    const sub = new Stage(off, this.width, this.height, scale)
    sub.begin()
    drawFn(sub)
    off.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name + '.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }
}
