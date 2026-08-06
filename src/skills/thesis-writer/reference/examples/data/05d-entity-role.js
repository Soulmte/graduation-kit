/** 图 4-6 角色实体属性图（5 个属性辐射分布） */
DIAGRAMS['05d-entity-role'] = entityDiagram({
  id: '05d-entity-role',
  name: '图4-6 角色实体属性图',
  width: 820,
  height: 440,
  entity: { cx: 410, cy: 220, w: 100, h: 64, label: '角色' },
  attrs: [
    { cx: 250, cy: 130, label: '角色编码', pk: true },
    { cx: 570, cy: 130, label: '角色名称' },
    { cx: 180, cy: 220, label: '权限列表' },
    { cx: 640, cy: 220, label: '角色描述' },
    { cx: 410, cy: 390, label: '创建时间' },
  ],
})
