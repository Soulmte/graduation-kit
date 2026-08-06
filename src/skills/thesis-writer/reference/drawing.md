# 绘图系统说明

论文插图统一由 `reference/examples/` 下的绘图系统产出。三层结构，**改图只动数据层**。

## 目录结构

```
reference/examples/
├── editor.html / editor.js   可视化编辑器（浏览器打开即用）
├── engine/                   绘图引擎，不要改
│   ├── core.js               主题、文字测量、行距解析、Stage
│   ├── shapes.js             图元绘制 + SHAPE_SIZE 默认尺寸表
│   ├── links.js              连线、箭头、各形状边缘求交
│   ├── constraints.js        绑定约束（元素跟随）
│   ├── renderer.js           声明式描述转图元调用
│   └── svg-export.js         SVG 矢量导出
├── data/                     只改这里，每张图一个纯数据文件
├── verify.js                 渲染 + 贴合度 + 穿插 + 字号缩放校验
├── verify-editor.js          编辑器交互无头测试
└── audit.js                  声明式覆盖率审计
```

## 技术约束

- Canvas 2D 绘制，SVG 矢量导出，拖入 Word 无限缩放不模糊
- 黑白线稿（`#000` 线、`#fff` 底），**禁用灰度和彩色**，这是学位论文规范
- 字号 14-16px，连线标签 12px
- 行距自动随字号缩放，**不要写硬编码像素值**（用 `resolveLineHeight`）
- PNG 导出 4 倍率，SVG 为真矢量
- 画布内无图标题、无图注，标题交给正文

## 新增或修改一张图

1. 在 `data/` 新建或编辑数据文件，写 `nodes` 与 `links`
2. 在 `editor.html` 的 script 列表里注册新文件
3. 跑 `node verify.js`，必须全绿才算完成
4. 浏览器打开 `editor.html` 微调，导出到 `docs/thesis/images/`

**硬约束：所有可见元素必须写进 `nodes`。** 禁止用 `custom()` 钩子画内容，
否则编辑器选不中也拖不动（`audit.js` 会报）。

## 数据文件契约

```js
DIAGRAMS['图id'] = {
  id, name, width, height,
  nodes: [...],
  links: [...],
}
```

### 节点字段

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，连线靠它引用 |
| `shape` | 见下方形状表，默认 `rect` |
| `cx` / `cy` | 中心坐标 |
| `w` / `h` | 宽高，不写则用形状默认值 |
| `label` | 文字，`\n` 换行 |
| `fontSize` / `lineWidth` / `bold` / `underline` | 样式 |
| `mask` | 白底遮罩，压住下方连线 |
| `z` | 层级，数字小的在底层 |
| `hidden` | 不绘制 |
| `bindX` / `bindY` / `bindTop` / `bindBottom` | 绑定到另一节点的对应维度 |
| `anchorFrom` / `anchorTo` | 两端各绑一个节点（时序消息线用） |

### 可用形状

`rect`、`terminator`、`diamond`、`io`、`ellipse`、`actor`、`vtext`、
`group`、`boundary`、`lane`、`label`、`bar`、`axis`、`activation`、
`message`、`selfloop`

默认尺寸定义在 `shapes.js` 的 `SHAPE_SIZE`。改动务必同步该表，
否则渲染器预登记的锚点与实际绘制不一致，连线会留空隙或穿入。

### 连线字段

两种写法。优先用第一种，端点自动贴边并随节点移动：

```js
{ from: 'a', to: 'b', fromSide: 'bottom', toSide: 'top' }
```

需要绕行时才用显式折线：

```js
{ points: ['a.bottom', { x: 400, y: 300 }, 'b.left@0.25'] }
```

| 字段 | 作用 |
|------|------|
| `fromSide` / `toSide` | 强制从指定边出/入 |
| `fromAt` / `toAt` | 沿该边 0..1 位置，箭头精确定位 |
| `bend` | `'h'` 先水平后垂直，`'v'` 先垂直后水平 |
| `offset` | 沿法线平移整条线，拆分重叠连线 |
| `tree` / `midY` | 树形 L 形连线，`midY` 统一横干高度 |
| `dashed` | 虚线 |
| `arrow: false` | 不画箭头 |
| `arrowStart` | 起端也带箭头 |
| `hollow` | 空心三角（UML 泛化） |
| `arrowSize` / `lineWidth` / `fontSize` | 尺寸 |
| `label` / `labelAt` / `dx` / `dy` | 标签与位置微调 |

形状无需声明。渲染器会把节点的 `shape` 传给连线层，
菱形、椭圆、圆角终结符都按真实几何求交。

## 各图型规则

| 图型 | 关键规则 | 数据文件 |
|------|---------|---------|
| 技术栈图 | 分层虚线框，层间箭头引用框锚点 | `01-framework.js` |
| 架构图 | 从上到下分层，虚线分组框内边距不小于 20px | `02-architecture.js` |
| 功能模块图 | 三层树，二级功能用竖排文字，同层横干高度用 `midY` 统一 | `03-module.js` |
| 用例图 | 按角色分文件；include 虚线指向被包含用例，extend 指向基用例 | `04a` / `04b` |
| ER 属性图 | 实体居中，属性椭圆辐射排列，主键加下划线 | `05a`-`05e` |
| ER 整体图 | 只含实体 + 关系 + 基数，不含属性 | `06-er.js` |
| 流程图 | 圆角矩形=起止，矩形=处理，菱形=判断；异常分支单独成列 | `08-flowchart.js` |
| 时序图 | 泳道顶部矩形 + 竖虚线生命线；实线=调用，虚线=返回 | `09-sequence.js` |
| 性能图 | 柱状/折线，必须带数值标注，坐标轴有刻度和单位 | `10-chart.js` |

## 验收清单

前四项由 `node verify.js` 自动把关，不要手工目测：

- [ ] 连线端点紧贴元素边界，无空隙也无穿入
- [ ] 连线不穿过无关节点
- [ ] 改字号时行距跟着缩放
- [ ] 标签白底遮罩不瞎掉节点轮廓

人工确认：

- [ ] 字号 14-16px（标签 12px）
- [ ] 黑白无灰色
- [ ] 画布内无图标题与图注
- [ ] 虚线分组框完整包住子内容
- [ ] 底部无多余空白
- [ ] 导出文件名与正文引用一致

## 已知局限

- `wrapText` 已实现但未接入图元，长文字不会自动折行，需手写 `\n`
- 除 `vtext` 外，改字号不会自动调整框尺寸
- 校验是几何层面的，无法判断视觉美观度
