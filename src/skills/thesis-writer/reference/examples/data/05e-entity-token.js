/** 图 4-7 JWT Token 实体属性图（6 个属性辐射分布） */
DIAGRAMS['05e-entity-token'] = entityDiagram({
  id: '05e-entity-token',
  name: '图4-7 JWT Token 实体属性图',
  width: 900,
  height: 500,
  entity: { cx: 450, cy: 250, w: 130, h: 64, label: 'JWT Token' },
  attrs: [
    { cx: 200, cy: 135, label: '所属用户ID', pk: true, w: 140 },
    { cx: 450, cy: 120, label: '用户名' },
    { cx: 700, cy: 135, label: '角色标识' },
    { cx: 200, cy: 250, label: '签发时间' },
    { cx: 700, cy: 250, label: '过期时间' },
    { cx: 450, cy: 410, label: '签名' },
  ],
})
