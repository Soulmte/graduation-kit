/**
 * 约束层：让元素坐标绑定到其他元素，拖动被依赖者时自动跟随。
 *
 * 支持的约束字段（写在节点上）：
 *   anchorFrom / anchorTo   两端绑定（message 用）：x 跨度由两个节点决定
 *   bindX: 'id'             x 跟随目标 cx，可配 dx 偏移
 *   bindY: 'id'             y 跟随目标 cy，可配 dy 偏移
 *   bindTop: 'id'           贴到目标上边缘外侧（如柱顶数值），配 dy
 *   bindBottom: 'id'        贴到目标下边缘外侧（如类别名）
 *
 * 自由维度仍可拖拽：绑了 x 的元素只能上下拖，绑了两端的只能上下拖。
 * 解析在每次渲染前执行一次，按依赖拓扑序求值。
 */

/** 节点是否绑定了某个维度 */
function isBoundX(n) {
  return !!(n.bindX || (n.anchorFrom && n.anchorTo))
}
function isBoundY(n) {
  return !!(n.bindY || n.bindTop || n.bindBottom)
}

/** 收集一个节点依赖的所有目标 id */
function depsOf(n) {
  const d = []
  ;['bindX', 'bindY', 'bindTop', 'bindBottom', 'anchorFrom', 'anchorTo'].forEach(k => {
    if (n[k]) d.push(n[k])
  })
  return d
}

/**
 * 按依赖关系排序，被依赖者先求值。
 * 存在循环时保留原序并告警，避免死循环。
 */
function sortByDeps(nodes) {
  const byId = new Map(nodes.map(n => [n.id, n]))
  const state = new Map()   // id -> 0 未访问 / 1 访问中 / 2 完成
  const out = []

  function visit(n, chain) {
    const st = state.get(n.id) || 0
    if (st === 2) return
    if (st === 1) {
      console.warn('约束存在循环依赖：' + chain.concat(n.id).join(' → '))
      return
    }
    state.set(n.id, 1)
    depsOf(n).forEach(id => {
      const dep = byId.get(id)
      if (dep) visit(dep, chain.concat(n.id))
      else console.warn(`约束目标不存在：${n.id} → ${id}`)
    })
    state.set(n.id, 2)
    out.push(n)
  }

  nodes.forEach(n => visit(n, []))
  return out
}

/**
 * 求值所有约束，把结果写入节点的 cx/cy/w。
 * 返回排序后的节点数组（供渲染按序绘制）。
 */
function resolveConstraints(nodes) {
  const ordered = sortByDeps(nodes)
  const byId = new Map(nodes.map(n => [n.id, n]))

  for (const n of ordered) {
    // 两端绑定：x 跨度由两个目标的中心决定
    if (n.anchorFrom && n.anchorTo) {
      const a = byId.get(n.anchorFrom)
      const b = byId.get(n.anchorTo)
      if (a && b) {
        n.cx = (a.cx + b.cx) / 2
        n.w = b.cx - a.cx          // 负值表示指向左侧
      }
    }

    if (n.bindX) {
      const t = byId.get(n.bindX)
      if (t) n.cx = t.cx + (n.dx || 0)
    }

    if (n.bindY) {
      const t = byId.get(n.bindY)
      if (t) n.cy = t.cy + (n.dy || 0)
    }

    // 贴目标上边缘外侧：常用于柱状图数值标签
    if (n.bindTop) {
      const t = byId.get(n.bindTop)
      if (t) {
        n.cx = t.cx + (n.dx || 0)
        n.cy = t.cy - (t.h || 0) / 2 + (n.dy || 0)
      }
    }

    // 贴目标下边缘外侧：常用于类别名
    if (n.bindBottom) {
      const t = byId.get(n.bindBottom)
      if (t) {
        n.cx = t.cx + (n.dx || 0)
        n.cy = t.cy + (t.h || 0) / 2 + (n.dy || 0)
      }
    }
  }

  return ordered
}
