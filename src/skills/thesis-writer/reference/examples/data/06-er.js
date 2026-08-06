/**
 * 图 4-8 系统整体 E-R 图（只含实体与关系，不含属性）
 * 实体用矩形，关系用菱形，连线标注基数。
 * 改动方式：增删 nodes / links，或用编辑器拖拽后导出坐标。
 */
DIAGRAMS['06-er'] = {
  id: '06-er',
  name: '图4-8 系统整体E-R图',
  width: 900,
  height: 480,

  nodes: [
    // 实体
    { id: 'user',   shape: 'rect', cx: 160, cy: 240, w: 160, h: 72, label: '用户',     bold: true, fontSize: 16 },
    { id: 'notice', shape: 'rect', cx: 740, cy: 130, w: 160, h: 72, label: '公告',     bold: true, fontSize: 16 },
    { id: 'log',    shape: 'rect', cx: 740, cy: 350, w: 180, h: 72, label: '操作日志', bold: true, fontSize: 16 },
    // 关系
    { id: 'relPub', shape: 'diamond', cx: 450, cy: 130, w: 170, h: 88, label: '发布' },
    { id: 'relRec', shape: 'diamond', cx: 450, cy: 350, w: 170, h: 88, label: '记录' },
  ],

  links: [
    { from: 'user',   to: 'relPub', arrow: false, label: '1', labelAt: 0.2 },
    { from: 'relPub', to: 'notice', arrow: false, label: 'N', labelAt: 0.8 },
    { from: 'user',   to: 'relRec', arrow: false, label: '1', labelAt: 0.2 },
    { from: 'relRec', to: 'log',    arrow: false, label: 'N', labelAt: 0.8 },
  ],
}
