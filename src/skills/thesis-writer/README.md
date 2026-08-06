# thesis-writer

本科毕业论文全流程自动化 skill — 写作、配图、格式转换。

## 快速开始

在 Zed 中对 AI 说以下任一句即可：

- "帮我写论文" / "写第 X 章" / "写摘要"
- "画 ER 图 / 用例图 / 流程图 / 架构图"
- "生成毕业论文 Word"

## 文件结构

```
.agents/skills/thesis-writer/
├── SKILL.md                    ← AI 主指令文件
├── README.md                   ← 本文件
├── convert/
│   ├── convert_to_docx.py      ← Markdown 转 Word 脚本
│   └── requirements.txt        ← Python 依赖
└── reference/
    ├── drawing.md              ← 绘图字段契约与已知局限
    └── examples/               ← 绘图系统
        ├── editor.html         ← 可视化编辑器（浏览器打开即用）
        ├── editor.js
        ├── engine/             ← 绘图引擎（6 个模块，不要改）
        ├── data/               ← 14 张图的纯数据文件（改图只动这里）
        ├── verify.js           ← 渲染 + 贴合度 + 穿插 + 字号校验
        ├── verify-editor.js    ← 编辑器交互无头测试
        └── audit.js            ← 声明式覆盖率审计
```

## 输出目录

AI 生成的论文内容在项目根目录 `docs/thesis/` 下：

```
docs/thesis/
├── 00-摘要.md
├── 01-绪论.md
├── ...
├── 致谢.md
├── full.md                    ← 合并后的完整论文
├── 毕业论文.docx              ← 转换后的 Word
└── images/                    ← 所有导出的 PNG / SVG
```

## 绘图系统

三层架构：**引擎**负责画，**数据文件**负责定点和内容，**编辑器**负责微调。

改图只需编辑 `reference/examples/data/` 下的数据文件，然后跑校验：

```bash
cd .agents/skills/thesis-writer/reference/examples
node verify.js          # 必须全绿
node verify-editor.js
node audit.js
```

`verify.js` 自动把关四类问题：连线端点是否紧贴元素边界、连线是否穿过无关节点、
改字号时行距是否跟着缩放、标签白底遮罩是否瞎掉节点轮廓。

微调位置直接浏览器打开 `editor.html`：拖元素、拖箭头端点、双击线上插拐点、
改字号线宽、多选对齐分布，撤销重做齐全，改完导出 PNG（4 倍率）或 SVG（真矢量）。

字段契约见 `reference/drawing.md`。

## 转换脚本

```bash
pip install -r .agents/skills/thesis-writer/convert/requirements.txt

python .agents/skills/thesis-writer/convert/convert_to_docx.py \
  docs/thesis/full.md docs/thesis/毕业论文.docx
```

## 核心规则摘要

- **不写参考文献**：没有 [1][2] 引用标记，没有参考文献章节
- **不写目录**：Word 自动生成
- **图表编号**：图X-Y 标题在图下方，表X-Y 标题在表上方
- **三线表**：只保留顶线、表头下线、底线
- **按章节分文件**：每章一个 .md，在 `docs/thesis/` 下
- **自动转换 Word**：写完所有章节后自动运行 convert 脚本
- **禁用词**：综上所述、值得注意的是、随着...的发展 等 AI 味词汇
- **句长不超过 40 字**，被动语态不超过 15%
- **插图黑白线稿**：学位论文规范，禁用灰度和彩色
