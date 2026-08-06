/**
 * 图 3-2 管理员用例图
 * 中列为主用例，左列为 <<extend>> 扩展用例，右列为 <<include>> 被包含用例。
 */
DIAGRAMS['04b-usecase-admin'] = {
  id: '04b-usecase-admin',
  name: '图3-2 管理员用例图',
  width: 960,
  height: 660,

  nodes: [
    { id: 'boundary', shape: 'boundary', cx: 530, cy: 330, w: 740, h: 580,
      label: '系统管理平台 - 管理员视角', fontSize: 16 },

    { id: 'admin', shape: 'actor', cx: 100, cy: 310, label: '管理员' },

    // 中列：主用例
    { id: 'login',  shape: 'ellipse', cx: 530, cy: 120, w: 150, h: 60, label: '登录' },
    { id: 'user',   shape: 'ellipse', cx: 530, cy: 210, w: 150, h: 60, label: '用户管理' },
    { id: 'log',    shape: 'ellipse', cx: 530, cy: 300, w: 150, h: 60, label: '日志管理' },
    { id: 'notice', shape: 'ellipse', cx: 530, cy: 400, w: 150, h: 60, label: '公告管理' },
    { id: 'file',   shape: 'ellipse', cx: 530, cy: 490, w: 150, h: 60, label: '文件管理' },

    // 左列：扩展用例
    { id: 'batch',  shape: 'ellipse', cx: 280, cy: 210, w: 150, h: 60, label: '批量删除' },
    { id: 'filter', shape: 'ellipse', cx: 280, cy: 300, w: 160, h: 60, label: '按条件筛选' },

    // 右列：被包含用例
    { id: 'auth',  shape: 'ellipse', cx: 800, cy: 120, w: 150, h: 60, label: '校验凭证' },
    { id: 'oplog', shape: 'ellipse', cx: 800, cy: 300, w: 170, h: 60, label: '记录操作日志' },
  ],

  links: [
    // 参与者关联（形状由渲染器根据节点 shape 自动判定）
    { from: 'admin', to: 'login',  arrow: false },
    { from: 'admin', to: 'user',   arrow: false },
    { from: 'admin', to: 'log',    arrow: false },
    { from: 'admin', to: 'notice', arrow: false },
    { from: 'admin', to: 'file',   arrow: false },

    // <<include>>：基用例 → 被包含用例
    { from: 'login',  to: 'auth',  dashed: true, label: '<<include>>' },
    { from: 'user',   to: 'oplog', dashed: true, label: '<<include>>', labelAt: 0.4 },
    { from: 'log',    to: 'oplog', dashed: true, label: '<<include>>' },
    { from: 'notice', to: 'oplog', dashed: true, label: '<<include>>', labelAt: 0.6 },
    { from: 'file',   to: 'oplog', dashed: true, label: '<<include>>', labelAt: 0.5 },

    // <<extend>>：扩展用例 → 基用例
    { from: 'batch',  to: 'user', dashed: true, label: '<<extend>>' },
    { from: 'filter', to: 'log',  dashed: true, label: '<<extend>>' },
  ],
}
