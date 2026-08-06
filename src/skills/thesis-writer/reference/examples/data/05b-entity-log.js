/** 图 4-4 操作日志实体属性图（8 个属性辐射分布） */
DIAGRAMS['05b-entity-log'] = entityDiagram({
  id: '05b-entity-log',
  name: '图4-4 操作日志实体属性图',
  width: 900,
  height: 540,
  entity: { cx: 450, cy: 270, w: 140, h: 64, label: '操作日志' },
  attrs: [
    { cx: 200, cy: 135, label: '日志ID', pk: true },
    { cx: 450, cy: 120, label: '操作用户名', w: 140 },
    { cx: 700, cy: 135, label: '操作描述' },
    { cx: 200, cy: 270, label: '方法签名' },
    { cx: 700, cy: 270, label: 'IP地址' },
    { cx: 200, cy: 420, label: '请求参数' },
    { cx: 450, cy: 435, label: '执行耗时' },
    { cx: 700, cy: 420, label: '创建时间' },
  ],
})
