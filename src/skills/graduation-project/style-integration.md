# 前端风格选型集成

本文件定义：**如何调用 ui-ux-pro-max skill 为毕设项目选定前端风格方案**。

> 前置阅读：本文件只管风格选型。需求怎么定看 `requirement-workflow.md`（配合 `feature-forge` skill），代码怎么写看 `code-standards.md`。

---

## 用到的外部 skills

| 阶段 | Skill | 作用 |
|------|-------|------|
| 阶段 0 | `feature-forge` | 确定产品类型 → 决定配色方向 |
| 阶段 1.5 | `ui-ux-pro-max` | 生成设计系统（配色/字体/风格） |
| 阶段 2 | `code-reviewer` | 审查生成的代码配色是否合规 |

---

## 0. 核心原则

1. **风格必须在写代码前定**：任何 .vue / .jsx 创建之前，风格方案必须已确认
2. **避免深色方案**：毕业设计答辩在投影仪上进行，深色看不清。全站浅色主题
3. **配色克制**：5 色以内，禁止紫色/粉色渐变，禁止霓虹色
4. **务实的审美**：导师看重功能完整性 > 视觉炫技

---

## 1. 根据题目确定产品类型

### 1.1 产品类型 → 搜索关键词映射表

| 毕设题目类型 | ui-ux-pro-max 搜索关键词 |
|-------------|-------------------------|
| 在线教育/学习/培训/考试 | `education learning management` |
| 医院/诊所/挂号/病历 | `healthcare medical clinic` |
| 图书管理/借阅/图书馆 | `library management` |
| 电商/商城/二手/购物 | `e-commerce marketplace` |
| 企业OA/办公/人事/考勤 | `enterprise HR management` |
| 博客/论坛/社区/贴吧 | `blog community` |
| 项目管理/任务/协作 | `project management task tracker` |
| 餐厅/点餐/外卖/订座 | `restaurant food delivery` |
| 酒店/民宿/预订/旅游 | `hotel booking travel` |
| 物业/小区/社区服务 | `property management` |
| 财务/记账/账本/收支 | `personal finance accounting` |
| 问卷/调查/投票/表单 | `survey polling` |
| 文件管理/云盘/网盘 | `file management cloud storage` |
| 简历/作品集/展示 | `portfolio personal website` |
| 课程表/排课/教务 | `education scheduling` |
| 运动会/比赛/赛事管理 | `sports event management` |

### 1.2 不确定类型的处理

如果题目在上述列表中没有对应项，提取题目中 2-3 个核心英文关键词。例如：
- "基于区块链的供应链追溯系统" → `supply chain tracking`
- "农产品溯源平台" → `agriculture product tracking`

---

## 2. 完整选型流程

### 0. 风格方向选择（多 skill 对比）

在调用 ui-ux-pro-max 前，根据毕设题目类型推荐合适的风格方向。**同时调用多个第三方 style skill 获取不同方案**，让用户选择：

| 毕设类型 | 推荐风格 | 调用哪个 skill |
|---------|---------|---------------|
| 企业管理/后台 | 稳重专业 | `ui-ux-pro-max` 搜索 `enterprise` + `minimalist-skill`（简洁白） |
| 教育/学习 | 清爽干净 | `ui-ux-pro-max` 搜索 `education` + `soft-skill`（柔和氛围） |
| 医疗/健康 | 洁净安心 | `ui-ux-pro-max` 搜索 `healthcare` + `minimalist-skill` |
| 电商/交易 | 活力热情 | `ui-ux-pro-max` 搜索 `e-commerce` + `taste-skill`（视觉冲击） |
| 社区/社交 | 年轻活泼 | `ui-ux-pro-max` 搜索 `community` + `brutalist-skill`（个性风） |
| 创意/作品集 | 独特个性 | `brutalist-skill` + `taste-skill` |
| 通用毕设 | 稳妥 | `minimalist-skill`（不会出错） |

**调用方式**：

下面的 `vendor/` 是相对于本 skill 目录的路径。实际执行时先确定 skill 根目录：项目级安装在 `<项目>/.agents/skills/graduation-project/`，全局安装在 `~/.agents/skills/graduation-project/`。若 `vendor/` 不存在（用户未安装可选资源），直接走方案 C 的内置速查表，不要报错中断。

```bash
# 方案 A: ui-ux-pro-max（推荐首选）
python3 vendor/ui-ux-pro-max/scripts/search.py "<关键词>" --design-system -p "<项目名>"

# 方案 B: taste-skill 子技能（备选风格参考）
# 读取 vendor/taste-skill/minimalist-skill/SKILL.md 获取极简风格约束
# 读取 vendor/taste-skill/soft-skill/SKILL.md 获取高端柔和风格约束
# 读取 vendor/taste-skill/taste-skill/SKILL.md 获取设计品味评估基准

# 方案 C: 内置毕设配色速查表（无需外部 skill，见 §5）
```

**比较输出**：给用户展示 2-3 个方案的对比卡片，让用户选择：

```
┌─────────────────────┐  ┌─────────────────────┐
│ 方案A: 稳重专业       │  │ 方案B: 柔和现代       │
│ 来源: ui-ux-pro-max  │  │ 来源: soft-skill     │
│ 主色: #3B5998 深蓝   │  │ 主色: #6C8EBF 雾蓝   │
│ 风格: Flat Design    │  │ 风格: Soft UI        │
│ 特点: 正式、严谨      │  │ 特点: 轻盈、亲和      │
└─────────────────────┘  └─────────────────────┘
```

### Step 1：调用 ui-ux-pro-max 设计系统生成器

```bash
python3 vendor/ui-ux-pro-max/scripts/search.py \
  "<产品类型关键词>" \
  --design-system \
  -p "<项目名称>"
```

**示例**：
```bash
python3 vendor/ui-ux-pro-max/scripts/search.py \
  "education learning management" \
  --design-system \
  -p "在线学习平台"
```

### Step 2：从输出中提取四个核心选型

ui-ux-pro-max 的 --design-system 输出包含：

```
PATTERN:  <页面结构模式>
STYLE:    <UI 风格>
COLORS:   <配色方案（6 色）>
TYPOGRAPHY: <字体搭配>
KEY EFFECTS: <动画效果>
AVOID:    <需要避免的反模式>
```

### Step 3：覆盖深色/不合规方案

ui-ux-pro-max 可能推荐不符合毕设要求的方案，**必须逐项检查并覆盖**：

| 推荐了… | 覆盖为… |
|---------|--------|
| Dark Mode / OLED Dark | 同风格的浅色版本（白底 + 对应主色） |
| AI-Native UI（紫色系） | 改为同产品类型的常规浅色方案 |
| 霓虹色 / 渐变背景 | 改为纯色背景 + 保守主色 |
| 超过 5 种主题色 | 精简为主色 + 辅色 + 背景 + 文字 + 强调色 |
| 深色侧边栏 + 深色内容区 | 可保留深色侧边栏，内容区必须浅色 |

### Step 4：输出风格确认卡片

```
┌──────────────────────────────────────────────────────┐
│  🎨 《XXX》前端风格方案                                │
├──────────────────────────────────────────────────────┤
│  产品类型：在线教育平台                                 │
│  页面结构：Feature-Rich Showcase                       │
│  UI 风格：Soft UI Evolution（浅色版本）                  │
│                                                       │
│  配色方案：                                            │
│    主色：#4A90D9（稳重蓝）                              │
│    辅色：#67B26B（柔和绿，用于成功状态）                   │
│    CTA ：#F5A623（暖橙，用于重要按钮）                    │
│    背景：#F7F8FA（浅灰白）                               │
│    文字：#2C3E50（深蓝灰）                               │
│                                                       │
│  字体：系统默认（中文无需引入 Google Fonts）             │
│                                                       │
│  效果：悬浮微阴影 + 200ms 过渡                           │
│                                                       │
│  ⚠️ 已覆盖项：                                         │
│    - 推荐了 Dark Mode → 改为浅色                         │
│    - 推荐了紫色渐变 → 改为稳重蓝                          │
│    - 配色从 6 色精简至 5 色                              │
└──────────────────────────────────────────────────────┘
```

### Step 5：等待用户确认

输出卡片后等待用户回复。确认后进入阶段 2（代码生成）。

---

## 3. 配色落地（CSS 变量）

风格确认后，**先读 `styles/global.css` 检查是否已有变量定义**。有则沿用已有变量名，只改值；无则按下面新建。

> “配色控制在 5 色以内”指的是**语义色**（主色 / 辅色 / CTA / 背景 / 文字），不是 CSS 变量个数。hover / active 态、边框色、语义反馈色（danger / success）都是从这 5 色派生的，不计入配额。

```css
/* 先读脚手架 global.css。如果已有 --primary-color 这类命名，就沿用它、只改值，
   不要另起 --primary 又多一套。下面是新建时的命名参考。 */
:root {
  --primary: #4A90D9;        /* 主色 */
  --primary-hover: #357ABD;
  --primary-active: #2A5F9E;
  --secondary: #67B26B;      /* 辅色 */
  --cta: #F5A623;            /* CTA */
  --cta-hover: #E09515;
  --bg: #F7F8FA;             /* 背景 */
  --bg-white: #FFFFFF;
  --text: #2C3E50;           /* 文字 */
  --text-secondary: #7F8C8D;
  --border: #E1E4E8;
  --danger: #E74C3C;
  --success: #27AE60;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

**关键原则**：
- 变量名沿用脚手架已有命名（先读后写）
- 脚手架没有的变量才新增
- 不要覆盖脚手架已有的非配色变量（如布局相关的）

---

## 4. 组件库主题覆盖

### 4.1 Ant Design / Ant Design Vue

在 `App.vue` 或 `main.js` 中通过 `ConfigProvider` 覆盖主题色：

```jsx
// React: App.jsx
import { ConfigProvider } from 'antd'

const theme = {
  token: {
    colorPrimary: '#4A90D9',
    borderRadius: 6,
  }
}

<ConfigProvider theme={theme}>
  <App />
</ConfigProvider>
```

### 4.2 Element Plus

```js
// Vue: main.js
import ElementPlus from 'element-plus'

app.use(ElementPlus)

// 在 styles/global.css 中覆盖 CSS 变量
```

```css
:root {
  --el-color-primary: #4A90D9;
  --el-color-primary-light-3: #6EADE0;
  --el-color-primary-light-5: #93C5EB;
  --el-color-primary-dark-2: #357ABD;
}
```

### 4.3 Naive UI

```js
// Vue: main.js
import { create } from 'naive-ui'

const naive = create({
  themeOverrides: {
    common: {
      primaryColor: '#4A90D9',
      primaryColorHover: '#357ABD',
    }
  }
})
```

---

## 5. 毕设友好配色速查（免搜索方案）

如果 ui-ux-pro-max 不可用或用户不想走选型流程，直接按产品类型用下面的预设：

| 产品类型 | 主色 | 辅色 | 适用场景 |
|---------|------|------|---------|
| 教育/学习 | `#4A90D9` 蓝 | `#67B26B` 绿 | 冷静、可信、专注 |
| 医疗/健康 | `#5C9CE5` 浅蓝 | `#7BC8A4` 薄荷绿 | 专业、清洁、安心 |
| 企业管理 | `#3B5998` 深蓝 | `#8B9DC3` 浅蓝灰 | 正式、严谨 |
| 电商/交易 | `#E74C3C` 红 | `#F39C12` 暖橙 | 活力、促销感 |
| 图书/文化 | `#8B6F47` 棕 | `#D4C5A9` 米色 | 典雅、稳重 |
| 社区/社交 | `#1DA1F2` 天蓝 | `#657786` 灰 | 年轻、轻松 |
| 餐饮/美食 | `#E87532` 暖橙 | `#F5B042` 金黄 | 温暖、食欲 |
| 环保/农业 | `#27AE60` 绿 | `#8BC34A` 浅绿 | 自然、生机 |
| 政府/公共 | `#C0392B` 中国红 | `#34495E` 深灰蓝 | 庄重、权威 |

---

## 6. 禁止使用的配色特征

以下特征**在毕设项目中一律禁用**：

| 禁用特征 | 原因 |
|---------|------|
| 全站深色主题（Dark Mode） | 投影仪对比度不足，答辩时看不清 |
| 紫色 + 粉色渐变 | AI 生成痕迹太重，导师反感 |
| 霓虹色（#FF00FF / #00FFFF） | 毕设不是赛博朋克风格展览 |
| 超过 5 种主题色 | 显得不专业、杂乱 |
| 彩虹渐变背景 | 同上 |
| 纯黑背景（#000） | 即使是深色侧边栏也用 #001529 而非纯黑 |
| 荧光色文字 | 可读性差 |
| > 3 种字体混用 | 中文正文统一系统默认字体 |
