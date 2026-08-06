/**
 * 实体属性图工厂（Chen 画法，辐射式）
 * 5 张实体图共用此构造器，各数据文件只提供实体名与属性坐标。
 *
 * 用法：
 *   DIAGRAMS['05a'] = entityDiagram({
 *     id, name, width, height,
 *     entity: { cx, cy, w, h, label },
 *     attrs: [{ cx, cy, label, pk }]
 *   })
 */
function entityDiagram(cfg) {
  const ATTR_W = 120      // 属性椭圆宽（统一，视觉整齐）
  const ATTR_H = 56

  return {
    id: cfg.id,
    name: cfg.name,
    width: cfg.width,
    height: cfg.height,

    nodes: [
      {
        id: 'entity',
        shape: 'rect',
        cx: cfg.entity.cx,
        cy: cfg.entity.cy,
        w: cfg.entity.w || 110,
        h: cfg.entity.h || 64,
        label: cfg.entity.label,
        bold: true,
        fontSize: 16,
      },
      ...cfg.attrs.map((a, i) => ({
        id: 'attr' + i,
        shape: 'ellipse',
        cx: a.cx,
        cy: a.cy,
        w: a.w || ATTR_W,
        h: a.h || ATTR_H,
        label: a.label,
        fontSize: a.fontSize || 15,
        underline: !!a.pk,        // 主键加下划线
      })),
    ],

    // 实体（矩形）→ 属性（椭圆），实线无箭头
    // 形状由渲染器按节点 shape 自动求交，无需显式声明
    links: cfg.attrs.map((a, i) => ({
      from: 'entity',
      to: 'attr' + i,
      arrow: false,
    })),
  }
}
