/** 图 4-3 用户实体属性图（9 个属性辐射分布） */
DIAGRAMS['05a-entity-user'] = entityDiagram({
  id: '05a-entity-user',
  name: '图4-3 用户实体属性图',
  width: 900,
  height: 560,
  entity: { cx: 450, cy: 280, w: 110, h: 64, label: '用户' },
  attrs: [
    { cx: 200, cy: 140, label: '用户ID', pk: true },
    { cx: 370, cy: 120, label: '用户名' },
    { cx: 530, cy: 120, label: '邮箱' },
    { cx: 700, cy: 140, label: '角色' },
    { cx: 200, cy: 280, label: '密码' },
    { cx: 700, cy: 280, label: '头像' },
    { cx: 230, cy: 420, label: '创建时间' },
    { cx: 450, cy: 440, label: '更新时间' },
    { cx: 670, cy: 420, label: '逻辑删除标记', w: 150 },
  ],
})
