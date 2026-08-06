/**
 * 图 6-2 性能测试结果图（柱状图）
 * 每根柱子、数值、类别名、轴标题都是独立元素，可分别拖拽与改字号。
 * 改数据：调整 DATA 后刷新页面，柱高自动重算。
 */
DIAGRAMS['10-chart'] = (() => {
  const DATA = [
    { name: 'Spring Boot', value: 1250 },
    { name: 'Express',     value: 980 },
    { name: 'Flask',       value: 620 },
    { name: 'FastAPI',     value: 1180 },
    { name: 'Go',          value: 2450 },
    { name: '.NET',        value: 1520 },
  ]
  const Y_LABEL = 'QPS（请求数/秒）'
  const X_LABEL = '后端技术栈'
  const TICK_UNIT = 500, TICKS = 6, BAR_GAP = 0.35

  const W = 900, H = 520
  const padL = 90, padR = 40, padT = 30, padB = 80
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const baseY = padT + plotH

  const yMax = Math.ceil(Math.max(...DATA.map(d => d.value)) / TICK_UNIT) * TICK_UNIT
  const yStep = yMax / (TICKS - 1)

  const ticks = Array.from({ length: TICKS }, (_, i) => ({
    ratio: (yStep * i) / yMax,
    label: String(yStep * i),
  }))

  const nodes = [
    {
      id: 'axis', shape: 'axis',
      cx: padL + plotW / 2, cy: padT + plotH / 2,
      w: plotW, h: plotH,
      ticks, fontSize: 14,
    },
  ]

  const slot = plotW / DATA.length
  const barW = slot * (1 - BAR_GAP)
  DATA.forEach((d, i) => {
    const cx = padL + slot * i + slot / 2
    const h = (d.value / yMax) * plotH
    nodes.push({
      id: 'bar' + i, shape: 'bar',
      cx, cy: baseY - h / 2, w: barW, h,
    })
    // 数值标签绑定柱顶，拖柱子时自动跟随
    nodes.push({
      id: 'val' + i, shape: 'label',
      cx, cy: baseY - h - 14,
      bindTop: 'bar' + i, dy: -14,
      label: String(d.value), fontSize: 14,
    })
    // 类别名绑定柱底
    nodes.push({
      id: 'cat' + i, shape: 'label',
      cx, cy: baseY + 20,
      bindBottom: 'bar' + i, dy: 20,
      label: d.name, fontSize: 14,
    })
  })

  nodes.push({
    id: 'yLabel', shape: 'label',
    cx: 24, cy: padT + plotH / 2,
    label: Y_LABEL, bold: true, fontSize: 15,
    rotate: -Math.PI / 2,
  })
  nodes.push({
    id: 'xLabel', shape: 'label',
    cx: padL + plotW / 2, cy: baseY + 55,
    label: X_LABEL, bold: true, fontSize: 15,
  })

  return {
    id: '10-chart',
    name: '图6-2 性能测试结果图',
    width: W,
    height: H,
    nodes,
  }
})()
