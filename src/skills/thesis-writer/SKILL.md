---
name: thesis-writer
description: 仅用于本科毕业论文与毕设项目，非论文/非毕设项目不要加载。本科毕业论文全流程自动化：写章节正文、检索并引用近五年文献、生成摘要、绘制论文插图、自动截图、转换 Word。当用户提到写论文、毕业论文、毕设、开题、写某一章、写摘要、改论文措辞、论文查重降 AI 味，或需要绘制/修改论文配图（架构图、ER 图、用例图、流程图、时序图、功能模块图、技术栈图、性能对比图），或需要把 Markdown 论文转成 docx 时，必须使用本 skill。文献检索一律交给 literature-review（真实检索 + 在线核验），本 skill 只负责引用标注与格式校验，禁止编造文献。它包含强制格式规范（三线表、图表编号、参考文献与引用校验）、写作风格约束（禁用词黑名单、句长上限、被动率上限）、带校验的 Canvas 绘图系统，以及系统页面自动截图与 Word 自动嵌图。English keywords — write thesis, thesis chapter, abstract, thesis figure, convert to Word.
version: 1.6.0
priority: 90
triggers: triggers.yaml
---

# thesis-writer v2.0

本科毕业论文写作专用 skill，配套本项目（6 后端 + 7 前端多技术栈脚手架）。

> **适用范围**：仅用于本科毕业论文或毕设项目。其他项目不要使用本 skill。
> **前置依赖**：文献必须先由 `literature-review` 真实检索并核验，本 skill 不负责找文献。缺少该 skill 时停下来，让用户执行 `npx graduation-kit install --only literature-review`。
> **版本门禁**：读 `.agents/skills/.graduation-kit.json`，其 `version` 必须等于本文件 frontmatter 的 `version`；缺失或不一致时停止使用，先让用户执行 `npx graduation-kit update`。
> 触发：写论文 / 写第X章 / 写摘要 / 改措辞降 AI 味 / 画论文配图 / 转 Word。
> 不触发：写业务代码、改数据库表、设计接口、前端样式调整。
> 关键词与冲突裁决见 `../triggers.yaml`。
>
> **绘图前必须先把模板复制到工作目录**，不要直接改 skill 目录里的文件，见下方「绘图规范」与 `reference/drawing.md`。

---

## ⚠️ 铁律（AI 执行前必读，违反即重写）

1. **参考文献必须真实可追溯，且配额硬性**。检索与核验一律走 `literature-review`，不许自己“想”文献；**全篇 ≥ 22 条，英文 ≥ 6 条且附中文译名，中文 ≥ 15 条，主题类与技术类各 ≥ 5 条**；每条文献必须有原文摘录与链接，正文用 `[n]` 标注；写完先跑 `literature-review/reference/verify-refs.mjs`（查真实性），再跑 `reference/check-refs.mjs`（查格式与配额）。凑不够就如实报缺口，禁止编造补齐
2. **禁止写目录章节**。目录由 Word 自动生成
3. **图表必须有编号和标题**。图下方标注"图X-Y 标题"，表上方标注"表X-Y 标题"
4. **图片文件按编号命名**。`图X-Y 名称.png`，编号 X=章号, Y=章内序号。**图注文字必须与文件名逐字一致**
5. **三线表只有顶线、表头下线、底线三条线**。数据行之间无横线，无竖线
6. **摘要必须写 frontmatter**（`type: abstract_cn` / `abstract_en`），关键词放 `keywords` 字段不写进正文
7. **正文里不能出现单独一行的 `---`**。转换脚本拿它当章节分隔符，会把一章切成两截
8. **按章节分文件**。每章一个独立 .md 文件，放在 `docs/thesis/` 目录下
9. **生成完 MD 后必须自动运行** `convert/convert_to_docx.py` 生成 Word
10. **截图必须由脚本自动完成**，不要让用户自己截；转换器会自动嵌图并按版心宽度等比缩放

---

## 自动编排（用户只说一句“写论文”，也要自己跑完）

用户不会替你拆步骤。命中本 skill 后按下面走，**不要反问“文献定了吗”“要不要先找文献”**：

| 用户说的 | 你自己接着做 | 不用问 |
|---|---|---|
| 写论文 / 写第X章 / 写摘要 | 查文献 → 缺就补 → 写正文 → 跑两个校验 → 不过就改 → 转 Word | 编号怎么排、要不要跑校验 |
| 画图 | 复制模板 → 改 `figure-kit/data/` → `verify.js` → 导出 | 用哪套模板 |
| 转 Word | 跑转换脚本 → 报告缺图/缺引用 | 要不要嵌图 |

自动调用规则：

- **文献环节**：`docs/thesis/refs-source.json` 不存在、`verify-refs.mjs` 有 FAIL、或数量不足（<22 / 英<6 / 中<15 / 主题·技术各<5）→ **先调 `literature-review`**，补齐再写。
- **事实环节**：写需求/数据库/接口章节时，表结构与接口从 `docs/` 的建表 SQL、后端 `api/` 目录读，**不要问用户要字段**。
- **收尾环节**：正文写完 → `verify-refs.mjs` → `check-refs.mjs` → `convert_to_docx.py` → 一次汇报结果。

只有三种情况停下来问用户：

1. 论文题目或章节范围完全没给；
2. `literature-review` 补检后仍达不到配额（按 `reference/citation-policy.md` §6 报缺口 + 关键词）；
3. 用户口述的技术栈与代码里实际用的对不上。

---

## 工作流（严格按顺序执行）

### Step 1：确认输出目录

在项目根目录创建以下结构，如果不存在就创建：

```
docs/thesis/
├── images/             ← 插图与截图（PNG / SVG）
├── figure-kit/         ← 绘图工作副本（从 skill 模板复制，所有改图都在这里）
├── refs-source.json    ← 文献证据：原文摘录、链接、译名（见 citation-policy.md）
└── screenshots.json    ← 系统截图配置（从 screenshots.example.json 复制）
```

**绘图工作副本必须先复制，不能直接改 skill 目录：**

```bash
node .agents/skills/thesis-writer/reference/copy-template.mjs
```

复制一次就够。之后重跑加 `--force` 只刷新引擎与校验脚本，已改的 `data/` 不会丢。
`docs/thesis/` 下只收最终导出的图片，数据源文件住在 `figure-kit/data/`。

### Step 2：按章节生成（每章一个文件）

生成以下文件，严格按字数预算：

| 文件 | 章节 | 建议字数 | 核心内容 |
|------|------|---------|---------|
| `docs/thesis/00-摘要.md` | 摘要 | ~400字中文 + 英文 | 背景、方法、结果、关键词 |
| `docs/thesis/01-绪论.md` | 一、绪论 | ~2000字 | 背景意义、研究现状、内容目标、组织结构 |
| `docs/thesis/02-相关技术.md` | 二、相关技术 | ~2000字 | 技术选型理由、后端/前端/数据库简介 |
| `docs/thesis/03-需求分析.md` | 三、需求分析 | ~2500字 | 可行性、功能需求、非功能需求、用例分析 |
| `docs/thesis/04-系统设计.md` | 四、系统设计 | ~3000字 | 架构、功能模块、数据库（ER+表）、API接口 |
| `docs/thesis/05-系统实现.md` | 五、系统实现 | ~3800字 | 开发环境、后端/前端实现、关键技术 |
| `docs/thesis/06-系统测试.md` | 六、系统测试 | ~1500字 | 功能测试、性能测试、兼容性测试 |
| `docs/thesis/07-总结与展望.md` | 七、总结与展望 | ~800字 | 工作总结、不足、展望 |
| `docs/thesis/08-参考文献.md` | 八、参考文献 | 不计入正文字数 | 按 `reference/citation-policy.md` 生成 |
| `docs/thesis/致谢.md` | 致谢 | ~300字 | 致谢 |

**全文总字数：12,000 - 20,000 字（本科标准）**。超出上限就压缩，不凑字数。

### Step 3：合并与转换

所有章节写完并确认后，执行：

```bash
cat docs/thesis/00-摘要.md docs/thesis/01-绪论.md docs/thesis/02-相关技术.md docs/thesis/03-需求分析.md docs/thesis/04-系统设计.md docs/thesis/05-系统实现.md docs/thesis/06-系统测试.md docs/thesis/07-总结与展望.md docs/thesis/08-参考文献.md docs/thesis/致谢.md > docs/thesis/full.md
python .agents/skills/thesis-writer/convert/convert_to_docx.py docs/thesis/full.md docs/thesis/毕业论文.docx
```

命令行参数固定为两个（输入 md、输出 docx），少一个会直接报用法退出。依赖先装：`pip install -r .agents/skills/thesis-writer/convert/requirements.txt`。

### Step 4：截图、嵌图与验收（全自动，不要让用户手动操作）

#### 4.1 系统截图

先确认前端已启动、演示账号能登录，再准备 `docs/thesis/screenshots.json`：

```bash
cp .agents/skills/thesis-writer/reference/screenshots.example.json docs/thesis/screenshots.json
```

配置要点：

- `baseUrl`：已启动的前端地址，如 `http://localhost:8080`
- `login.mode`：`"api"` 直接调登录接口拿 token 注入 localStorage，适用于登录页有**客户端验证码**、
  单点登录或结构复杂的项目；不写就是表单登录
- `login.tokenPath` / `userPath`：接口响应里的 token 与用户对象路径，默认 `data.token` / `data.userInfo`
- `login.tokenKey` / `userKey`：前端 localStorage 的键名，脚手架默认 `token` / `userInfo`（与 `stores/user.js` 一致）
- `screens`：每项写 `name`（**必须与正文图注逐字一致**）、`url`、`wait`（毫秒）

> 本脚手架的登录页带客户端验证码，自动截图一律用 `mode: "api"`。
> 验证码只在前端校验，登录接口本身不需要验证码。

执行：

```bash
npm i -D puppeteer-core   # 首次
node .agents/skills/thesis-writer/reference/screenshot.mjs --config docs/thesis/screenshots.json
```

- 复用本机 Chrome / Edge，不下载浏览器；找不到浏览器时设 `CHROME_PATH`
- 默认 1440×900、2 倍像素密度，插入 Word 后按 14.5cm 宽输出仍然清晰
- 单页重拍：`--only "图5-1 用户管理页面"`
- 只检查配置不截图：`--check`

**截不到就修环境，不要用占位图。** 图片缺失会让转换器在 Word 里留下红色标记。

#### 4.2 转 Word（自动嵌图）

```bash
python .agents/skills/thesis-writer/convert/convert_to_docx.py docs/thesis/full.md docs/thesis/毕业论文.docx
```

转换器对 `![图X-Y 标题](images/xxx.png)` 的处理：

1. 在图片位置插入 PNG，按版心宽度 14.5cm 等比缩放并居中
2. 图片下方生成居中加粗的图注
3. 找不到图片时插入红色 `[图片缺失: 路径]`，不静默跳过

SVG 自动回退到同名 PNG；网络图片不下载，避免转换依赖外网。

#### 4.3 验收

```bash
node .agents/skills/thesis-writer/reference/check-refs.mjs docs/thesis
cd docs/thesis/figure-kit && node verify.js && node verify-editor.js && node audit.js
```

- 引用校验全绿
- 绘图校验全绿
- 打开 Word 抽查：图片与图注一一对应，无红色缺失标记，图片不超出版心

---

## 格式规范

### 标题层级

论文正文使用以下标题层级，对应 Word 渲染样式：

| Markdown | 层级 | Word 样式 |
|----------|------|----------|
| `## 一、章节标题` | 一级标题 | 黑体小三居中加粗 |
| `### （一）节标题` | 二级标题 | 黑体四号缩进加粗 |
| `#### 1. 小节标题` | 三级标题 | 宋体小四加粗 |
| `**1）条目标题**` | 四级标题 | 宋体小四不加粗 |

### 图表规范

- **图注**：`![图X-Y 标题](images/图X-Y 标题.png)` — 转换后图片自动插入并按版心宽度等比缩放，图注居中加粗排在图片下方（见 Step 4）
- **表注**：`表X-Y 标题` — 单独成段写在表格上方，转换后居中。脚本靠正则 `^(图|表)\d+[-.]?\d*` 识别，**开头必须是“图”或“表”字 + 数字**，写成“如表 4-1 所示”这种句子不会被误认
- **截图标注**：与绘制图同格式，由 `screenshot.mjs` 自动生成 — `![图5-1 景点管理页面](images/图5-1 景点管理页面.png)`。名字必须与 `screenshots.json` 里的 `name` 逐字一致
- **编号**：X 为章号，Y 为章内序号，从 1 连续编号
- **正文引用**：每张图/表前后必须有文字说明。禁止两张图/表之间无文字
- **三线表**：markdown 表格自动渲染为三线表，不要手写分隔线

### 插图配额

工作副本 `docs/thesis/figure-kit/data/` 下有 **14 个现成数据文件**，覆盖 9 种图型。按你论文实际需要挑，不是全都要画。

| 数据文件 | 图型 | 建议章节 | 是否必画 |
|---|---|---|---|
| `01-framework.js` | 技术栈全景图 | 第二章 相关技术 | 必画 |
| `02-architecture.js` | 系统整体架构图 | 第四章 系统设计 | 必画 |
| `03-module.js` | 功能模块图 | 第四章 系统设计 | 必画 |
| `04a-usecase-user.js` | 普通用户用例图 | 第三章 需求分析 | 必画 |
| `04b-usecase-admin.js` | 管理员用例图 | 第三章 需求分析 | 必画 |
| `05a-entity-user.js` | 用户实体属性图 | 第四章 数据库设计 | 必画 |
| `05b-entity-log.js` | 操作日志实体属性图 | 第四章 数据库设计 | 必画 |
| `05c-entity-file.js` | 上传文件实体属性图 | 第四章 数据库设计 | 按需 |
| `05d-entity-role.js` | 角色实体属性图 | 第四章 数据库设计 | 按需 |
| `05e-entity-token.js` | JWT Token 实体属性图 | 第四章 数据库设计 | 按需 |
| `06-er.js` | 整体 E-R 图 | 第四章 数据库设计 | 必画 |
| `08-flowchart.js` | 流程图 | 第五章 系统实现 | 必画 |
| `09-sequence.js` | 时序图 | 第五章 系统实现 | 按需 |
| `10-chart.js` | 性能测试柱状图 | 第六章 系统测试 | 按需 |

**「按需」那五张的取舍标准**：

- `05c` / `05d` / `05e` 画的是**逻辑实体而非物理表**（脚手架只有 `user` / `notice` / `operation_log` 三张表，没有 file / role / token 表）。放在「概念模型设计」小节讲逻辑实体是合理的，但**不要说它们对应数据库表**，导师会当场追问建表语句在哪
- 如果你只想讲物理表结构，就只用 `05a` / `05b` 再补一张 notice 的，把 `05c`–`05e` 删掉
- `10-chart.js` 的柱状图只有在你**真的跑过压测**时才用。它默认数据是 6 个后端的 QPS 对比，你实际毕设只用了一个后端，照抄数据等于编数据

**实体属性图的增补方式**：新增数据库表时复制 `05a-entity-user.js` 改实体名与属性坐标，它们都共用 `_entity-factory.js` 构造器。文件名接着 `05f` 往后排，并在 `editor.html` 的 script 列表里注册。

**截图**：应展示核心业务功能，不用登录页、个人信息等通用页面。截图与绘制图共用同一套图注格式（见上方图表规范）。

**不建议画的**：辅助流程（操作日志记录、文件上传的内部步骤）已在正文描述，不必单独出图；公告模块结构过于简单，画图反而显得凑数。

---

## 写作风格

### 段落结构（每段必循）

每段按 3 要素组织：

1. **论点句**（1句）— 本段核心观点
2. **支撑句**（2-4句）— 具体数据、代码实例或研究观察
3. **收束句**（1句）— 回扣论点或引出下段

禁止：纯叙述无论点、论点堆砌无支撑、段尾悬空

### 章节论证差异化

| 章节 | 论证结构 | 避免 |
|------|---------|------|
| 绪论 | 现象→问题→方案 | 从定义开始 |
| 相关技术 | 选型场景→方案对比→本项目选择 | 逐一介绍每个技术 |
| 需求分析 | 用户场景→功能点→验收标准 | 功能列表罗列 |
| 系统设计 | 设计问题→方案→选择理由 | 只画图不解释 |
| 系统实现 | 目标→代码→踩坑→解决 | 只有代码无上下文 |
| 系统测试 | 测试目标→方法→数据→结论 | 只列数据不分析 |

### 连接词替换表

| 禁用的机械化连接词 | 自然替代方式 |
|-------------------|-------------|
| 因此 / 所以 | 前句结论直接引出下句，不加连接词 |
| 此外 / 另外 / 同时 | 用"还"、"也"融入句中，或分新段 |
| 首先...其次...最后 | 按时间线或逻辑链自然递进 |
| 然而 / 但是 | 用"实际测试发现"、"问题在于"等具体转折 |
| 综上所述 / 总之 | 段尾直接给结论，删掉 |
| 显然 / 显而易见 | 删掉，数据说话 |

### 禁用词黑名单（触发即改）

| 禁用词 | 替换为 |
|--------|--------|
| 综上所述 | 段尾直接给结论，不用过渡词 |
| 值得注意的是 / 显而易见 | 删掉，直接说事 |
| 随着...的发展 | 从具体问题切入 |
| 本研究 / 本文旨在 | "本项目做了..." |
| 具有良好的 XX 性 | 换成具体数据 |
| 进行了相应的处理 | 写具体做了什么 |
| 采用了...的方式 | "用了..." |
| 进行了...的处理 | "处理了..." |
| 实现了...的功能 | "做了..." |
| 针对 X 进行 Y | "对 X 做 Y" |
| 不仅...而且... | 拆成两句 |
| 首先...其次...然后...最后 | 用语义递进代替 |
| 因此 / 此外 / 另外 | 用自然转折代替 |
| 得到了广泛应用 | 给具体案例 |
| 具有重要的现实意义 | 给一个真实场景 |

### 句式硬性规则

- **句长**：> 40 字零容忍。优先拆为 2-3 个短句，每句 ≤ 20 字
- **句式多样**：混合简单句、复合句和插入语。避免连续 3 句以上相同结构，避免过于整齐的排比
- **主被动交替**：整章"被"字句 ≤ 15%，主动与被动交替，不堆砌任何一种
- **衔接自然**：禁止"首先/其次/然后/最后/因此/此外"。用问题引导、总结过渡、或语义递进代替
- **术语平实**：用日常用语解释技术概念，生僻词汇改用通俗表达
- **数据具象**：每个结论前必须有具体数字或实例。叙述数据时补充背景信息
- **段落过渡**：段间通过问题引导或上段总结自然过渡
- **核心一致**：重组句式时确保段落核心观点不变，改变的是表达方式而非内容

### 术语统一

| 推荐用法 | 不要用 |
|----------|--------|
| 脚手架 | 骨架、模板项目 |
| 多技术栈并存 | 多框架兼容、异构 |
| 前后端分离 | 解耦（指架构时） |
| 拦截器 | Filter（除非真的指 Servlet Filter） |
| 统一响应 | 通用返回、标准返回 |
| 操作日志 | 系统日志、用户行为记录 |
| 异步写库 | 非阻塞写入、延迟写入 |

### 分章节风格提示

- **摘要**：句子短（≤ 18 字），动词驱动，信息密度高
- **绪论**：不要"随着 XX 技术发展"开头；研究现状写具体项目名（RuoYi、SpringBlade 等）
- **相关技术**：每个框架 2-3 句，选型理由占一半，禁止抄官网文案
- **需求分析**：功能需求用动宾短语；非功能需求带数字（响应 < 200ms、并发 ≥ 500）
- **系统设计**：每个设计选择说一句为什么
- **系统实现**：代码片段 6-10 行，给具体类名/方法名
- **系统测试**：功能测试用表格；性能测试给具体数字
- **总结展望**：用自然文段，不列条目（禁止"一是...二是..."），展望 2-3 个方向各一段
- **致谢**：自然文段，不分点

### 整章自检表（每章写完必须逐项检查）

| 项 | 合格标准 | 检查方法 |
|----|---------|---------|
| 禁用词 | 黑名单词 0 次 | Ctrl+F 搜每个禁用词 |
| 超长句 | > 40 字句子 0 句 | 按句号切分统计 |
| 被动句 | 占比 ≤ 15% | 数"被"字句 |
| 段首套话 | 首句不用 5 类禁用开头 | 扫每段首词 |
| 结论有据 | 每个结论前有数据/例子 | 找"因此/所以"句验证 |
| 引用配额 | 全篇 ≥22 条；英 ≥6；中 ≥15；主题/技术各 ≥5 | 跑 `check-refs.mjs` |
| 引用对得上 | 每条 `[n]` 的句子能被 `quote` 支撑 | 逐条对照 `refs-source.json` |
| 编号顺序 | 正文首现顺序 `1→2→…→N` | 跑 `check-refs.mjs` |
| 字数合规 | 在允许区间内 | 字符计数 |

---

## 引用规则

**找一个文献分两步，缺一步都不算完成：**

| 步骤 | 谁来做 | 干什么 |
|---|---|---|
| 1 检索与核验 | `literature-review` | 真实检索、逐条核验、生成 `docs/thesis/refs-source.json`，跑 `verify-refs.mjs` 到全绿 |
| 2 标注与校验 | 本 skill | 正文按 `[n]` 标注、生成参考文献章节、跑 `check-refs.mjs` |

用户直接说“写第X章”时，若 `refs-source.json` 还不存在，先让 `literature-review` 把文献备好再动笔；不要边写边编引用。

完整规则见 `reference/citation-policy.md`。写完必须跑：

```bash
# 真实性：DOI / 链接 / 标题 / 年份 能不能对上（需联网）
node .agents/skills/literature-review/reference/verify-refs.mjs docs/thesis

# 格式：编号、篇数、译名、正文 [n] 是否对应
node .agents/skills/thesis-writer/reference/check-refs.mjs docs/thesis
```

要点：

- **配额**：全篇 ≥ 22 条；英文 ≥ 6 条（必须附 `titleZh`）；中文 ≥ 15 条；`scope` 为 `domain` 与 `tech` 的各 ≥ 5 条。不足就是没写完
- **近五年**：文献年份 ≥ 当前年份 − 5
- **一条只引一次、一句只引一条**：同一编号不能在两句话里重复出现，同一句也不能挂两个编号
- **编号严格递增**：正文首次出现顺序必须是 `[1] → [2] → … → [N]`（`numbering: "asc"`）；只有学校模板明确要求从大到小才改成 `"desc"`，改前先问用户
- **引用要撑住论点**：`[n]` 所在的句子必须能被该条 `quote` 支撑；空话、过渡句、常识句不要挂引用
- 每条文献在 `docs/thesis/refs-source.json` 里记录原文摘录 `quote`、`scope` 与链接 `url`／`doi`
- 禁止编造作者、期刊、年份、DOI；打不开的文献直接删掉
- 只有 `verify-refs.mjs` 与 `check-refs.mjs` 都通过，才认为这一章写完

---

## 摘要格式（必须用 frontmatter，否则排版不对）

转换脚本对摘要有专门处理分支，靠 `type` 字段识别。**写成普通 `## 摘要` 标题会走通用章节流程，关键词字体和分页都不对。**

`docs/thesis/00-摘要.md` 的正确写法：

```markdown
---
type: abstract_cn
keywords: 关键词1；关键词2；关键词3；关键词4；关键词5
---

摘  要

[第一段：研究背景与问题，约100字]

[第二段：系统设计与实现概述，约100字]

[第三段：创新点或技术亮点，约100字]

---
type: abstract_en
keywords: keyword1; keyword2; keyword3; keyword4; keyword5
---

[英文摘要约150-200词，不要机翻腔，禁用 This paper presents / This study aims to]
```

三个要点，写错就白排：

1. **关键词写在 frontmatter 的 `keywords` 里，不写进正文**。脚本会自动加「关键词：」黑体加粗标签，中文用 `；` 分隔、英文用 `;` 分隔。正文里再写一遍 `**关键词：**` 会重复
2. **中文摘要的「摘  要」标题要自己写在正文第一行**（脚本不生成）；**英文摘要的 `ABSTRACT` 标题由脚本自动生成**，正文里不要再写
3. **两段之间的 `---` 是章节分隔符**。脚本按 `\n---\n` 切块，所以正文里**不能出现单独一行的 `---`**，会被误切成新章节。需要分隔线时改用文字过渡

摘要处理完后脚本自动插分页符，不用手动加空行。

---

## 绘图规范（速查）

**硬性第一步：先把模板复制到工作目录，不要直接改 skill 目录。**

```bash
node .agents/skills/thesis-writer/reference/copy-template.mjs
cd docs/thesis/figure-kit
```

`.agents/skills/thesis-writer/reference/examples/` 是只读模板，升级 skill 时会被覆盖。
所有改图、跑校验、导出都在 `docs/thesis/figure-kit/` 里做。
完整字段契约、形状表与已知局限见 `reference/drawing.md`。

### 三层结构，改图只动数据层

| 层 | 文件（工作副本内） | 能不能改 |
|---|---|---|
| 编辑器 | `editor.html` / `editor.js` | 不改，浏览器打开即用 |
| 引擎 | `engine/` 六个文件 | **不要改** |
| 数据 | `data/` 每张图一个文件 | **只改这里** |
| 校验 | `verify.js` / `verify-editor.js` / `audit.js` | 不改，只跑 |

### 四条硬约束

1. **黑白线稿**（`#000` 线、`#fff` 底），禁用灰度和彩色。这是学位论文规范，不要加配色主题
2. **所有可见元素必须写进 `nodes`**。禁止用 `custom()` 钩子画内容，否则编辑器选不中也拖不动（`audit.js` 会报）
3. **连线优先用 `{ from, to, fromSide, toSide }`**，端点自动贴边并随节点移动。只有需要绕行时才用 `{ points: [...] }`。**不要手写端点坐标**，拖动节点后连线会脱开
4. **画布内不写图标题、不写图注**，标题交给正文的图注段落

### 新增或修改一张图

以下路径都指工作副本 `docs/thesis/figure-kit/`：

1. 在 `data/` 新建或编辑数据文件，写 `nodes` 与 `links`
2. 在 `editor.html` 的 script 列表里注册新文件（**漏了这步图不会出现在编辑器里**）
3. 跑 `node verify.js`，**必须全绿才算完成**
4. 浏览器打开 `editor.html` 微调，导出到 `docs/thesis/images/`

字号 14-16px（连线标签 12px），PNG 导出 4 倍率，SVG 为真矢量。行距自动随字号缩放，不要写硬编码像素值。

九种图型各自的构图规则、14 个数据文件的用途，见 `reference/drawing.md`。

---
## 常见问题速查

**Q: 用户说"帮我写论文"但没给目录？**
→ 按本文件 §工作流 Step 2 的默认 10 个文件推进（8 章 + 参考文献 + 致谢）。

**Q: 参考文献怎么处理？**
→ 必须真实检索，不能编。先建 `docs/thesis/refs-source.json`（原文摘录 + 链接 + 译名），
再在正文写 `[n]`，最后跑 `check-refs.mjs`。规则见 `reference/citation-policy.md`。

**Q: 字数超出 20% 怎么办？**
→ 用短句化规则精简：找超长句拆短，去掉冗余修饰词。

**Q: 写完某章不确定质量？**
→ 逐项走一遍 §写作风格 的自检表，≥ 2 项不合格就重写。

**Q: 关键流程图具体怎么画？**
→ 照着工作副本 `docs/thesis/figure-kit/data/08-flowchart.js` 改，它是三列布局（主流程前半、后半、异常通道）的现成范例。

**Q: 转换出来的 Word 里没有图片？**
→ 先看 `docs/thesis/images/` 下有没有与图注同名的 PNG。有图但没嵌入，检查转换器是否为新版；
没图则跑 `screenshot.mjs` 或从 figure-kit 导出。Word 里的红色 `[图片缺失: 路径]` 会直接指出缺哪张。

**Q: 系统截图怎么来？**
→ 启动前端，复制 `screenshots.example.json` 到 `docs/thesis/screenshots.json`，
跑 `node .agents/skills/thesis-writer/reference/screenshot.mjs --config docs/thesis/screenshots.json`。
不要让用户自己截。

**Q: 转换后摘要的关键词格式不对？**
→ 检查 `00-摘要.md` 有没有写 frontmatter（`type: abstract_cn` + `keywords`）。少了 frontmatter 摘要就会按普通章节排版。

**Q: 某一章内容莫名被切成两截？**
→ 章节正文里出现了单独一行的 `---`。脚本按 `\n---\n` 分割章节块，正文中不能用它当分隔线。

**Q: 图注写了但转换后没居中加粗？**
→ 图注必须**单独成段**且以「图」或「表」+ 数字开头。写成"如图 4-1 所示，系统分为三层"这种句子是正文，不会被识别为图注（这是对的）。

---

## 项目背景（硬编码，勿改）
## 项目背景（脚手架事实，写论文时按实际选型删减）

本项目是一个"多技术栈并存"的 Web 脚手架系统。**下表列的是脚手架全集，你的毕设只用了其中一个后端 + 一个前端，论文里不要把没用到的也写进去。**

### 后端（6 个）

| 端口 | 框架 | 语言 | 状态 |
|------|------|------|------|
| 8080 | Spring Boot 3.x | Java 17 | 完整可用 |
| 8081 | Express | Node.js | 完整可用 |
| 8082 | Flask | Python | 完整可用 |
| 8083 | FastAPI | Python | 未完善 |
| 8084 | Gin | Go | 未完善 |
| 8085 | Minimal API | .NET | 未完善 |

**只有前三个是完整实现的**，选后三个之前先确认代码跑得起来。

### 前端（6 个）

| 技术栈 | 端口 | 类型 |
|---|---|---|
| Vue 3 + Ant Design Vue | 5174 | Web |
| Vue 3 + Element Plus | 5175 | Web |
| React + Ant Design | 5176 | Web |
| Vue 3 + Naive UI | 5177 | Web |
| uni-app | — | H5 + 小程序跨端 |
| 微信小程序原生 | — | 小程序 |

另有两个客户端：`clients/pyqt`（Python 桌面端）、`clients/react-native`（React Native）。

### 数据库（MySQL，库名 `scaffold_db`）

| 表 | 字段数 | 字段 |
|---|---|---|
| `user` | 13 | id, username, password, nickname, age, gender, phone, email, role, avatar, create_time, update_time, deleted |
| `notice` | 7 | id, title, content, create_by, create_time, update_time, deleted |
| `operation_log` | 8 | id, username, operation, method, params, execute_time, ip, create_time |

三个细节写论文时要注意，导师容易问：

- **`operation_log` 没有 `deleted` 字段**，日志只写入与查询，不做逻辑删除
- **`notice.create_by` 存的是用户名字符串而非用户 ID**，这是故意的反范式设计（避免每次查列表都关联 user 表），论文里可以当作"性能与规范的权衡"来写
- **`user` 的唯一约束是 `(username, deleted)` 复合键**，这样逻辑删除后同名用户可以重新注册

### 统一 REST API

- `/api/user/*` — 用户管理（登录注册、CRUD、改密码）
- `/api/notice/*` — 公告管理（富文本）
- `/api/log/*` — 操作日志（自动记录）
- `/api/file/*` — 文件上传（校验 + UUID 重命名）
- `/api/health` — 健康检查（同时探测数据库连通性）

响应格式统一为 `{code, message, data}`，HTTP 状态码一律 200，只有 Token 失效返 401。

### 核心功能

- **用户管理**：JWT Token 认证、CRUD、角色分配、逻辑删除
- **公告管理**：富文本编辑、分页查询、逻辑删除
- **操作日志**：自动记录请求与耗时、条件筛选。Spring Boot 用 AOP 切面 + `@Async` 异步写库；Express / Flask 用中间件同步写库，**没有异步**，论文里别写错
- **文件上传**：类型校验、大小限制、UUID 重命名、日期分目录

### 必须在论文里承认的不足

**密码是明文存储的**（`user.password` 存 `123456` 这种原文）。这是毕设 demo 的取舍，但**不能不提**——审阅老师一看建表语句就知道。正确做法是在第七章「系统不足」里主动写清：当前为演示便利未做加密，生产环境应改用 BCrypt 加盐哈希。主动承认比被问出来好。

---

## 文件索引（人类/AI 参考）

```
.agents/skills/thesis-writer/
├── SKILL.md                    ← AI 主指令文件
├── README.md                   ← 人类可读说明
├── convert/
│   ├── convert_to_docx.py      ← Markdown 转 Word 脚本
│   └── requirements.txt        ← Python 依赖
└── reference/
    ├── drawing.md              ← 绘图字段契约与已知局限
    ├── copy-template.mjs       ← 把绘图模板复制到工作目录
    ├── screenshot.mjs          ← 系统页面自动截图
    ├── screenshots.example.json← 截图配置模板
    ├── citation-policy.md      ← 引用与参考文献规范
    ├── check-refs.mjs          ← 引用格式校验
    └── examples/               ← 只读模板（引擎 + 14 张图数据 + 校验）

.agents/skills/literature-review/   ← 前置依赖，负责真实检索
└── reference/
    └── verify-refs.mjs         ← 文献真实性核验（联网查 DOI / 链接）
```

工作副本在项目里：`docs/thesis/figure-kit/`，结构与 `examples/` 一致。

写论文只需读 SKILL.md。**动手画图前先读 `reference/drawing.md`，并先把模板复制到工作目录。**

---
## 给 AI 的最后叮嘱

1. **写正文只需读本文件**。所有格式与风格规则已嵌入；但**画图前必须先读 `reference/drawing.md`，并先复制模板到工作目录**
2. **先确认目录再动笔**。`docs/thesis/` 和 `docs/thesis/images/` 不存在就先创建
3. **按顺序写**。从摘要开始，到致谢结束，别跳章
4. **写完一章自查一章**。走完自检表再进入下一章
5. **摘要必须带 frontmatter**（`type: abstract_cn` / `abstract_en` + `keywords`），否则排版不对
6. **正文里不能出现单独一行的 `---`**，转换脚本拿它当章节分隔符
7. **画图前先复制模板**：`node .agents/skills/thesis-writer/reference/copy-template.mjs`，之后只改工作副本 `docs/thesis/figure-kit/data/` 下的文件，改完跑 `node verify.js`，必须全绿。**不要改 skill 目录里的模板**
8. **截图与嵌图全自动**：先跑 `screenshot.mjs`，再转换 Word；转换器会自动嵌图并缩放。不要让用户自己截图，也不要手改脚本
9. **字数不是越多越好**。本科论文 12000-20000，超了就压缩
10. **所有章节完成后自动运行转换脚本**，并跑 `check-refs.mjs`；报告图片数量与缺失项
11. **文献一律先搜后写**。没有 `refs-source.json`，或 `verify-refs.mjs` 没跑绿，就不要开始写带引用的章节
12. **只写项目真实用到的技术栈**。脚手架有 6 后端 7 前端，但你的毕设只用了一套，不要把没用的也写进论文
13. **禁止在 skills 目录下生成任何论文内容**。输出目录永远是 `docs/thesis/`
