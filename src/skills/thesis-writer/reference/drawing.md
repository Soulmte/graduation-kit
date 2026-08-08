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
| `bindX` / `bindY` / `bindTop` / `bindBottom` | 位置绑定，见下一节 |
| `anchorFrom` / `anchorTo` | 两端各绑一个节点，见下一节 |
| `dx` / `dy` | 绑定后的偏移量，只配合上面两行的字段生效 |

### 位置绑定字段

绑定由 `engine/constraints.js` 求值：每次渲染前跑一次，按依赖拓扑排序，
所以 A 绑 B、B 绑 C 也能算对。被绑住的那个维度在编辑器里拖不动，
松手后会被重新算回去，这是预期行为不是 bug。

| 字段 | 计算结果 | 典型用途 |
|------|----------|----------|
| `bindX: 'id'` | `cx = 目标.cx + (dx \|\| 0)` | 竖向对齐，只剩上下能拖 |
| `bindY: 'id'` | `cy = 目标.cy + (dy \|\| 0)` | 横向对齐，只剩左右能拖 |
| `bindTop: 'id'` | `cx = 目标.cx + (dx \|\| 0)`，`cy = 目标.cy - 目标.h/2 + (dy \|\| 0)` | 贴目标上边缘外侧，柱状图顶部数值标签 |
| `bindBottom: 'id'` | `cx` 同上，`cy = 目标.cy + 目标.h/2 + (dy \|\| 0)` | 贴目标下边缘外侧，柱状图类别名 |

`bindTop` / `bindBottom` 把 `cx` `cy` 两个维度一起接管了，不用再配 `bindX`。
想让标签偏开柱子中线就改 `dx`，想调高低就改 `dy`（往上抬用负值）。
注意编辑器的“已绑定 x”判定没把这两个字段算进去，所以横向看起来能拖，
但下一帧就会被算回去，属于此类约束的固有表现。

`anchorFrom` 和 `anchorTo` 必须成对出现，专给 `message` 形状用：

```js
{ id: 'm1', shape: 'message', anchorFrom: 'lifeA', anchorTo: 'lifeB', cy: 200 }
```

- `cx = (from.cx + to.cx) / 2`，`w = to.cx - from.cx`
- `w` 为负值表示消息指向左侧，渲染器据此画反向箭头，不要手动改成正数
- 两端都绑住了，所以这类节点只能上下拖，改的是 `cy`（消息在时间轴上的先后）

两个失效场景都只 `console.warn` 不抛错，画面照旧渲染，容易漏看：
目标 `id` 写错或不存在；绑定成环（A 绑 B 且 B 绑 A）时保留原始顺序不做求值。
改完打开浏览器控制台确认没有 warn。

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

`data/` 下 14 个文件，9 种图型。**改图前先打开对应文件看现有写法，比照文档猜快得多。**

| 图型 | 关键规则 | 数据文件 |
|------|---------|---------|
| 技术栈图 | 分层虚线框，层间箭头引用框锚点 | `01-framework.js` |
| 架构图 | 从上到下分层，虚线分组框内边距不小于 20px | `02-architecture.js` |
| 功能模块图 | 三层树，二级功能用竖排文字（`vtext`），同层横干高度用 `midY` 统一 | `03-module.js` |
| 用例图 | 按角色分文件；include 虚线指向被包含用例，extend 指向基用例 | `04a-usecase-user.js` / `04b-usecase-admin.js` |
| ER 属性图 | 实体居中，属性椭圆辐射排列，主键加下划线 | `05a`–`05e`（5 个） |
| ER 整体图 | 只含实体 + 关系 + 基数，不含属性 | `06-er.js` |
| 流程图 | 圆角矩形=起止，矩形=处理，菱形=判断；异常分支单独成列 | `08-flowchart.js` |
| 时序图 | 泳道顶部矩形 + 竖虚线生命线；实线=调用，虚线=返回 | `09-sequence.js` |
| 性能图 | 柱状/折线，必须带数值标注，坐标轴有刻度和单位 | `10-chart.js` |

**没有 `07-`。** 编号是历史遗留的空号，不用补，也不要以为少了一个文件。

五个实体属性图共用 `_entity-factory.js` 构造器，数据文件只提供实体名与属性坐标。**新增表时复制 `05a-entity-user.js` 改内容最快**，文件名接着 `05f` 往后排。

三个文件带自动计算逻辑，改数据后布局会自己重排，不用手调坐标：

- `02-architecture.js` — 改 `LAYERS` 后刷新，分层框自动重排
- `09-sequence.js` — 改 `LANES` 与 `STEPS` 后刷新，泳道与消息线自动重排
- `10-chart.js` — 改 `DATA` 后刷新，柱高按最大值自动重算

## 校验脚本各管什么

三个脚本职责不重叠，**改完图三个都要跑**：

| 脚本 | 查什么 | 什么时候必跑 |
|---|---|---|
| `verify.js` | 渲染成功、连线贴合度、连线穿插、字号缩放时行距跟随、标签遮罩 | 每次改 `data/` |
| `verify-editor.js` | 编辑器交互（拖拽、对齐分布、撤销重做、增删复制、拖箭头端点）是否真的写回 `spec` | 改 `editor.js` 或 `engine/` |
| `audit.js` | 声明式覆盖率，列出每张图的节点数/连线数，检出 `custom()` 钩子 | 新增图后 |

在 `reference/examples/` 目录下执行：

```bash
node verify.js && node verify-editor.js && node audit.js
```

三个都输出「全部通过」才算完成。**该目录的 `package.json` 里有 `"type": "commonjs"`，用于隔断仓库根的 `"type": "module"`，不要删。**

## 验收清单

前四项由 `node verify.js` 自动把关，不要手工目测：

- [ ] 连线端点紧贴元素边界，无空隙也无穿入
- [ ] 连线不穿过无关节点
- [ ] 改字号时行距跟着缩放
- [ ] 标签白底遮罩不盖掉节点轮廓

人工确认：

- [ ] 字号 14-16px（标签 12px）
- [ ] 黑白无灰色
- [ ] 画布内无图标题与图注
- [ ] 虚线分组框完整包住子内容
- [ ] 底部无多余空白
- [ ] 导出文件名与正文引用一致

## 常见问题

**新建的图在编辑器里看不到？**
→ 忘了在 `editor.html` 的 script 列表里注册。`data/` 里放了文件不等于会被加载。

**连线和节点之间有空隙，或箭头扎进了节点？**
→ 用了显式坐标（`points` 里写死 `{x, y}`）而不是 `id.side` 锚点写法。改成 `{ from, to, fromSide, toSide }`，引擎会按真实几何求交。

**拖动节点后连线脱开？**
→ 同上，手写端点坐标不会跟随节点。

**改了 `SHAPE_SIZE` 后连线全乱？**
→ 渲染器会预登记锚点，改默认尺寸必须同步 `shapes.js` 的 `SHAPE_SIZE` 表，否则登记的锚点与实际绘制不一致。

**文字超出框外？**
→ 长文字不会自动折行（见已知局限），手动在 `label` 里插 `\n`。

## 已知局限

- `wrapText` 已实现但未接入图元（`renderer.js` 只 import 了没调用），长文字不会自动折行，需手写 `\n`
- 除 `vtext` 外，改字号不会自动调整框尺寸，字大了要手动调 `w` / `h`
- 校验是几何层面的，无法判断视觉美观度。最终还是要打开 `editor.html` 用眼睛看一遍
