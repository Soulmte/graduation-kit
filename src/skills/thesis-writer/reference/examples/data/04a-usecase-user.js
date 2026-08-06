/**
 * 图 3-1 普通用户用例图
 * 实线 = 参与者关联，虚线 = <<include>> / <<extend>>
 * 改动方式：改 nodes 坐标与 links，或用编辑器拖拽后导出坐标。
 */
DIAGRAMS['04a-usecase-user'] = {
  id: '04a-usecase-user',
  name: '图3-1 普通用户用例图',
  width: 860,
  height: 570,

  nodes: [
    { id: 'boundary', shape: 'boundary', cx: 470, cy: 285, w: 700, h: 490,
      label: '系统管理平台 - 普通用户视角', fontSize: 16 },

    { id: 'user', shape: 'actor', cx: 60, cy: 250, label: '普通用户' },

    { id: 'register', shape: 'ellipse', cx: 240, cy: 120, w: 150, h: 60, label: '注册' },
    { id: 'login',    shape: 'ellipse', cx: 240, cy: 210, w: 150, h: 60, label: '登录' },
    { id: 'view',     shape: 'ellipse', cx: 240, cy: 300, w: 150, h: 60, label: '查看公告' },
    { id: 'edit',     shape: 'ellipse', cx: 240, cy: 400, w: 170, h: 60, label: '修改个人信息' },
    { id: 'avatar',   shape: 'ellipse', cx: 470, cy: 400, w: 150, h: 60, label: '上传头像' },
    { id: 'auth',     shape: 'ellipse', cx: 700, cy: 210, w: 150, h: 60, label: '校验凭证' },
  ],

  links: [
    // 参与者关联（实线，无箭头）；形状由渲染器根据节点 shape 自动判定
    { from: 'user', to: 'register', arrow: false },
    { from: 'user', to: 'login',    arrow: false },
    { from: 'user', to: 'view',     arrow: false },
    { from: 'user', to: 'edit',     arrow: false },

    // 依赖（虚线 + 箭头）
    { from: 'login',  to: 'auth', dashed: true, label: '<<include>>' },
    { from: 'avatar', to: 'edit', dashed: true, label: '<<extend>>' },
  ],
}
