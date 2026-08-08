# thesis-writer

本科毕业论文全流程自动化 skill — 写作、配图、格式转换。

## 安装

这个 skill 是 `graduation-kit` 的一部分，在毕设项目根目录跑：

```bash
npx graduation-kit install                      # 整套装，会问装不装三个上游增强
npx graduation-kit install --only thesis-writer  # 只装写论文这一个
```

常用选项：

| 选项 | 作用 |
| --- | --- |
| `-g` `--global` | 装到 `~/.agents/skills/`，所有项目共用 |
| `-f` `--force` | 覆盖已存在的 skill。**不加这个，重装会被整目录跳过**，升级包后必须加 |
| `-y` `--with-upstream` | 不询问，直接带上三个上游增强 |
| `--no-upstream` | 只装六个核心 skill |
| `-d <path>` | 指定项目目录，默认当前目录 |

`--only` 会跳过上游询问，一个上游都不装。thesis-writer 本身不依赖上游，
只装它没问题；想同时要 impeccable 的前端设计能力就别用 `--only`。

装完新开一个会话，agent 才会加载新 skill。

## 快速开始

对 AI 说以下任一句即可：

- “帮我写论文” / “写第 X 章” / “写摘要”
- “画 ER 图 / 用例图 / 流程图 / 架构图”
- “生成毕业论文 Word”

写正文前先把代码写完。论文的章节内容靠 AI 读真实代码提炼，
没代码就只能编，第四、五章会空。

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
        ├── package.json        ← 只有一行 type: commonjs，**不要删**
        ├── verify.js           ← 渲染 + 贴边 + 穿插 + 字号字距 + 遮罩校验
        ├── verify-editor.js    ← 编辑器交互无头测试
        └── audit.js            ← 声明式覆盖率审计
```

## 输出目录

AI 生成的论文内容在项目根目录 `docs/thesis/` 下：

```
docs/thesis/
├── 00-摘要.md                 ← 必须用 frontmatter，见 SKILL.md
├── 01-绪论.md
├── ...
├── 致谢.md
├── full.md                    ← 合并后的完整论文，转换脚本的输入
├── 毕业论文.docx              ← 转换输出，图位置留空待手动插图
└── images/                    ← 从编辑器导出的 PNG / SVG
```

图片不会被脚本嵌进 docx。脚本只把 `![图4-1 xxx](images/...)` 排成一行合规图注，
图由你在 Word 里插到图注上方。这是故意的设计，不要让 AI 去改脚本。

## 绘图系统

三层架构：**引擎**负责画，**数据文件**负责定点和内容，**编辑器**负责微调。

改图只需编辑 `reference/examples/data/` 下的数据文件，然后跑校验：

```bash
cd .agents/skills/thesis-writer/reference/examples
node verify.js          # 必须全绿
node verify-editor.js
node audit.js
```

`verify.js` 把关五类问题：连线端点是否紧贴元素边界、带 `offset` 和各种 `side`
组合时是否仍贴边、连线是否穿过无关节点、改字号时行距与字距是否跟着缩放、
标签白底遮罩是否盖掉节点轮廓。

微调位置直接浏览器打开 `editor.html`。**先点左上角「编辑模式」**，
没开之前点选和拖拽全部不响应，不是坏了。开了之后可以拖元素、拖箭头端点、
双击线上插拐点、改字号线宽、多选对齐分布，撤销重做齐全。

导出图片用「导出 PNG」（倍率下拉可选 2/4/6，默认 4）或「导出 SVG」（真矢量）。

三个必须知道的细节：

1. **「保存」不写回数据文件**，只存浏览器 localStorage。要真正落地得点「导出代码」，
   把得到的内容贴回 `data/` 对应文件。只点保存就去跑 `node verify.js`，
   校验的还是没改过的旧数据，全绿也不代表调好的图是对的。
2. 在 `data/` 新建数据文件后要到 `editor.html` 的 script 列表里注册，否则图不会出现。
3. 绑定了坐标的元素在那个维度上拖不动，是约束生效不是卡住。

字段契约、形状表、位置绑定语义与已知局限见 `reference/drawing.md`。

## 转换脚本

```bash
pip install -r .agents/skills/thesis-writer/convert/requirements.txt

python .agents/skills/thesis-writer/convert/convert_to_docx.py \
  docs/thesis/full.md docs/thesis/毕业论文.docx
```

## 核心规则摘要

- **不写参考文献**：没有 [1][2] 引用标记，没有参考文献章节
- **不写目录**：Word 自动生成
- **摘要必须用 frontmatter**：`type: abstract_cn` / `abstract_en` + `keywords`，
  写成普通的 `## 摘要` 会走错流程导致排版不对
- **正文里不能出现单独一行 `---`**：脚本靠它切章节，会被误切成新章
- **图表编号**：图X-Y 标题在图下方，表X-Y 标题在表上方，均需单独成段
- **三线表**：只保留顶线、表头下线、底线
- **按章节分文件**：每章一个 .md，在 `docs/thesis/` 下
- **自动转换 Word**：写完所有章节后自动运行 convert 脚本
- **禁用词**：综上所述、值得注意的是、随着...的发展 等 AI 味词汇
- **句长不超过 40 字**，被动语态不超过 15%
- **插图黑白线稿**：学位论文规范，禁用灰度和彩色
