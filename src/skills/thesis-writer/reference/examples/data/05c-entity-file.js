/** 图 4-5 上传文件实体属性图（7 个属性辐射分布） */
DIAGRAMS['05c-entity-file'] = entityDiagram({
  id: '05c-entity-file',
  name: '图4-5 上传文件实体属性图',
  width: 900,
  height: 520,
  entity: { cx: 450, cy: 260, w: 140, h: 64, label: '上传文件' },
  attrs: [
    { cx: 200, cy: 135, label: '文件ID', pk: true },
    { cx: 450, cy: 120, label: '原始文件名', w: 140 },
    { cx: 700, cy: 135, label: 'MIME类型' },
    { cx: 200, cy: 260, label: '文件大小' },
    { cx: 700, cy: 260, label: '访问URL' },
    { cx: 350, cy: 420, label: '存储路径' },
    { cx: 550, cy: 420, label: '上传时间' },
  ],
})
