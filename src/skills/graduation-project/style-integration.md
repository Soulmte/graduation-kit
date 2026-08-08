# 前端风格选型集成

本文件定义：**如何为毕设项目确定前端配色与风格方案**。

> 前置阅读：本文件只管风格选型。需求怎么定看 `requirement-workflow.md`（配合 `feature-forge` skill），代码怎么写看 `code-standards.md`。
>
> 路径里的 `<FE>` 指项目的前端目录（默认 `frontend/`），定义见 `SKILL.md` §1.5。

> **先读一下 §0.1**。脚手架已经有完整配色体系，本文件做的是**换色**而不是从零设计。没搞清这个很容易新建一套平行变量，导致改了不生效。

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
3. **配色克制**：5 色以内，禁止紫色/粉色渐变，禁止霾虹色
4. **务实的审美**：导师看重功能完整性 > 视觉炫技

### 0.1 两个先确认的前提

**一、脚手架已经有一套完整配色了**。本文件说的“选型”实际上是**换掉已有主色**，不是从零搭建。四个前端的现状：

| 项目 | 现有主色 | 备注 |
|---|---|---|
| react / vue-antd / vue-elementplus | `#1890ff` Ant Design Blue | 三者 `:root` 变量名完全一致 |
| vue-naive | `#18a058` 绿色系 | 连阴影、背景、悬停色都是绿调 |

如果题目本来就适合蓝（教育/企业/医疗）或适合绿（环保/农业），**直接用脚手架自带色是完全合理的选择**，跳过本文件不扣分。只有当题目需要明确不同的调子（红色系的电商、棕色系的图书）才需要换。

**二、vue-naive 自带暗色模式，这不算违反原则 2**。`App.vue` 里有 `isDark` + `darkTheme` + localStorage 持久化，默认亮色，靠用户手动切。处理方式：

- **不要删这个功能**，它是现成的加分项，可以写进论文的特色功能
- **答辩演示时保持亮色**，不要当场切暗色
- §6 的“禁用全站深色主题”指的是**把深色当默认**，不是禁止提供切换

实现机制（新写样式时必须遵守）：`App.vue` 给 `<html>` 加 `dark` 类，`global.css` 里的 `html.dark {}` 重定义 14 个 `--color-*` / `--shadow-*` 变量，naive 组件走 `darkTheme`、自定义 `.a-*` / `.u-*` 走变量，两套一起切。切换入口是两个 layout 头部的图标按钮，靠 `inject('toggleDark')` 拿到方法。

**所以 vue-naive 上新增样式时，颜色一律用变量，不要写死 `#fff` / `#333` 这类字面量**，否则亮色下正常、暗色下变白底白字。其余三版没有暗色模式，此约束只对 naive 是硬性的（但用变量本身是四版通用的好习惯）。

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

**Windows 上用 `python` 不是 `python3`**。实测 `python3 --version` 退出码 49（命令不存在），`python --version` 正常。先试一次确认用哪个，不要硬写：

```bash
# 方案 A: ui-ux-pro-max（推荐首选）
# Windows 用 python，macOS/Linux 用 python3
python vendor/ui-ux-pro-max/scripts/search.py "<关键词>" --design-system -p "<项目名>"

# 方案 B: taste-skill 子技能（备选风格参考）
# 读取 vendor/taste-skill/minimalist-skill/SKILL.md 获取极简风格约束
# 读取 vendor/taste-skill/soft-skill/SKILL.md 获取高端柔和风格约束
# 读取 vendor/taste-skill/taste-skill/SKILL.md 获取设计品味评估基准

# 方案 C: 内置毕设配色速查表（无需外部 skill，见 §5）
```

**脚本必须在 skill 根目录下跑**（即 `vendor/` 的父目录），它依赖相对路径读 `vendor/ui-ux-pro-max/data/`。从项目根直接拉长路径调也能跑，但先 `cd` 过去更保险。

**方案 B 里的子技能目录名要先 `ls` 确认**。`vendor/taste-skill/` 下实际有 12 个条目（`minimalist-skill` `soft-skill` `brutalist-skill` `taste-skill` `redesign-skill` `stitch-skill` `output-skill` `brandkit` `gpt-tasteskill` `image-to-code-skill` `imagegen-frontend-web` `imagegen-frontend-mobile`），上游更新可能增删。

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

先 `cd` 到 skill 根目录，再执行（Windows 把 `python3` 换成 `python`）：

```bash
python vendor/ui-ux-pro-max/scripts/search.py \
  "<产品类型关键词>" \
  --design-system \
  -p "<项目名称>"
```

**示例**：
```bash
python vendor/ui-ux-pro-max/scripts/search.py \
  "education learning management" \
  --design-system \
  -p "在线学习平台"
```

### Step 2：从输出中提取核心选型

`--design-system` 的实际输出是一个框线表格，包含七个分区：

```
├─── PATTERN ───      页面结构模式（Name + CTA 位置 + Sections 列表）
├─── STYLE ─────      UI 风格（Name + Mode Support + Keywords + Best For + 性能/无障碍）
├─── COLORS ────     10 个色位，带推荐变量名（--color-primary 等）
├─── TYPOGRAPHY ─     字体搭配 + Google Fonts 链接 + CSS Import
├─── KEY EFFECTS ─    动画与视觉效果
├─── AVOID ─────      反模式
├─── PRE-DELIVERY CHECKLIST ─  交付前自检项
```

**两个预期管理**：

1. **COLORS 是 10 色不是 6 色**（primary / on-primary / secondary / accent / background / foreground / muted / border / destructive / ring）。毕设只需取前 6 个，剩下的映射到脚手架已有变量（见 §3）
2. **它推荐的变量名 `--color-primary` 正好与脚手架一致**，但 `--color-accent` `--color-muted` `--color-ring` 这些脚手架没有。**不要为了对齐它而新增变量**，用不上就丢

### Step 3：覆盖深色/不合规方案

ui-ux-pro-max 面向的是商业产品，**它很可能推荐不适合毕设的方案，必须逐项检查并覆盖**：

| 推荐了… | 覆盖为… |
|---------|--------|
| Dark Mode / OLED Dark | 同风格的浅色版本（白底 + 对应主色） |
| AI-Native UI（紫色系） | 改为同产品类型的常规浅色方案 |
| 霾虹色 / 渐变背景 | 改为纯色背景 + 保守主色 |
| 超过 5 种主题色 | 精简为主色 + 辅色 + 背景 + 文字 + 强调色 |
| 深色侧边栏 + 深色内容区 | 可保留深色侧边栏，内容区必须浅色 |
| Claymorphism / Glassmorphism / Neumorphism | 改为扁平卡片 + `--shadow-sm`，多层阴影堆叠在投影仪上发灸 |
| Google Fonts 英文字体（如 Baloo 2 / Comic Neue） | 一律不引，用脚手架的 `--font-sans`（中文无法覆盖，反而拖慢首屏） |
| Reanimated / Haptics / BlurView 等原生能力 | 直接删除，这些是 React Native 的，网页用不了 |
| borderRadius 40–50 | 改为 `--radius-md`（6px），过大圆角不适合管理后台 |

**实测提醒**：搜 `education learning management` 得到的是 Claymorphism（童趣黏土风）+ `#EC4899` 粉色 CTA + 儿童字体，它把“教育”归类到了少儿应用。这就是上表不能略过的原因——**它的输出默认不能直接用**。产出卡片里把覆盖项列清楚，让用户知道你改了什么。

另外它的关键词匹配很模糊（搜 `healthcare medical` 返回的 PATTERN 是 Social Proof-Focused）。拿不到合理结果时**直接走 §5 的速查表**，不要反复换关键词试。

### Step 4：输出风格确认卡片

```
┌────────────────────────────────────────────────────┐
│  🎨 《XXX》前端风格方案                                │
├────────────────────────────────────────────────────┤
│  产品类型：图书馆管理系统                             │
│  前端项目：vue-antd（原主色 #1890ff）                  │
│  UI 风格：扁平卡片 + 微阴影（沿用脚手架）              │
│                                                       │
│  要修改的 CSS 变量（global.css :root）：               │
│    --color-primary:         #8B6F47  棕色             │
│    --color-primary-hover:   #A08659                   │
│    --color-primary-active:  #6F5836                   │
│    --color-primary-bg:      #F5F0E8                   │
│    --color-primary-bg-deep: #E5D9C3                   │
│                                                       │
│  另需同步修改：                                        │
│    - App.vue 的 a-config-provider 补 :theme          │
│    - Dashboard.vue 的 ECharts 颜色（2 处）            │
│    - SystemStatus.vue 内联色（2 处）                  │
│                                                       │
│  字体：不改，沿用 --font-sans（中文系统字体）           │
│  布局/圆角/状态色/字号：全部不改                      │
│                                                       │
│  ⚠️ 已覆盖 ui-ux-pro-max 的推荐：                     │
│    - 推荐了 Claymorphism → 改为扁平卡片              │
│    - 推荐了粉色 CTA #EC4899 → 删除                    │
│    - 推荐了 Google Fonts → 不引入                     │
│    - 配色从 10 色精简至主色 5 色阶                    │
└────────────────────────────────────────────────────┘
```

卡片要写清楚**“不改什么”**，这比写“改什么”更重要——它告诉用户你不会把脚手架推翻重建。

### Step 5：等待用户确认

输出卡片后等待用户回复。确认后进入阶段 2（代码生成）。

---

## 3. 配色落地（CSS 变量）

**脚手架已经有一整套变量了，不要新建。正确做法是只改 5–6 行颜色值。**

四个前端的 `<FE>/src/styles/global.css` 里都有 `:root`，变量名**四版完全统一**，共 8 组：

| 组 | 变量名 | 换色时要不要改 |
|---|---|---|
| 主色 | `--color-primary` / `-hover` / `-active` / `-bg` / `-bg-deep` | ✅ 改这 5 个 |
| 文字 | `--color-text` / `-sub` / `-mute` / `-disable` | ❌ 不改 |
| 背景边框 | `--color-bg-page` / `-bg-card` / `-bg-hover` / `--color-border` / `-deep` | ⚠ 只在换成非蓝系时微调 `-bg-page` |
| 状态色 | `--color-success` / `-warning` / `-danger` | ❌ 不改（红绿黄是通用语义） |
| 阴影 | `--shadow-sm` / `-md` / `-lg` | ⚠ naive 版的 rgba 带绿调，换色时一并改 |
| 布局 | `--h-header` / `--h-footer` / `--w-sider` / `--w-sider-mini` / `--w-container` | ❌ 绑定布局代码，改了会错位 |
| 圆角 | `--radius-sm` / `-md` / `-lg` | ❌ 不改 |
| 字体 | `--font-sans` / `--font-size-xs…xxl` | ❌ 不改（中文用系统字体） |

**换色只需改这 5 行**（以换成棕色系图书馆为例）：

```css
/* <FE>/src/styles/global.css 的 :root 里，只换主色五色阶 */
:root {
  --color-primary:         #8B6F47;  /* 主色 */
  --color-primary-hover:   #A08659;  /* 适当调亮 */
  --color-primary-active:  #6F5836;  /* 适当调深 */
  --color-primary-bg:      #F5F0E8;  /* 极浅底，用于选中态 */
  --color-primary-bg-deep: #E5D9C3;  /* 次浅底 */
}
```

“配色控制在 5 色以内”指的是**语义色**（主色 / 辅色 / CTA / 背景 / 文字），不是 CSS 变量个数。上面这 5 个都是同一个主色的色阶，算 1 色。

### 3.1 改完变量后还有四处硬编码要扫

脚手架里主色字面值不只在 `:root`。不一并改会出现“大部分换了但图表还是旧色”：

```bash
# 把 #1890ff 换成你的旧主色（naive 版是 #18a058）
search_content "1890ff" --path <FE>/src
```

实测命中位置：

| 位置 | 说明 |
|---|---|
| `styles/global.css` | `:root` 变量定义，上一步已改 |
| `views/admin/Dashboard.*` | ECharts 配项里的颜色，ECharts 读不了 CSS 变量，**必须手改字面值** |
| `views/admin/SystemStatus.*` | 内联 style 的语义色（react / vue-antd 有） |
| `vue-naive/src/App.vue` | `themeOverrides` 里 6 处，见 §4.3 |
| `vue-elementplus/src/assets/logo.svg` | logo 描边色，换不换无关紧要 |

**ECharts 颜色是最容易漏的一处**。`Dashboard` 里的图表色写在 JS 对象里，改完 CSS 变量后页面看起来已经换好了，一点开首页图表还是旧色。

---

## 4. 组件库主题覆盖

只改 CSS 变量不够——组件库（按钮、开关、分页器）的主色走自己的主题系统，需要单独覆盖。**四个前端的现状不同，先看清再动手。**

### 4.1 React + Ant Design

现状：`src/main.jsx` 已有 `<ConfigProvider locale={zhCN}>`，**但没传 `theme`**。`src/App.jsx` 里没有 ConfigProvider。

改法：给现有的 ConfigProvider 补一个 `theme` 属性，**不要新套一层**。

```jsx
// src/main.jsx——在现有 ConfigProvider 上加 theme
<ConfigProvider
  locale={zhCN}
  theme={{ token: { colorPrimary: '#8B6F47', borderRadius: 6 } }}
>
  <App />
</ConfigProvider>
```

### 4.2 Vue + Ant Design Vue

现状：`src/App.vue` 已有 `<a-config-provider :locale="zhCN">`，同样**没传 theme**。

```vue
<!-- src/App.vue——给现有标签加 :theme -->
<a-config-provider :locale="zhCN" :theme="theme">
    <router-view />
</a-config-provider>

<script setup>
const theme = { token: { colorPrimary: "#8B6F47", borderRadius: 6 } };
</script>
```

注意这个项目的编码风格是 **4 空格缩进 + 双引号 + 分号**，写新代码要跟上。

### 4.3 Vue + Element Plus

现状：`global.css` 的 `:root` 末尾**已经有一段 Element Plus 变量覆盖**（注释写着“覆盖 Element Plus 主色变量”），共 6 行。不要另开一段，**直接改这 6 行**：

```css
/* global.css :root 末尾已有的那段 */
--el-color-primary:         #8B6F47;
--el-color-primary-light-3: #A08659;
--el-color-primary-light-5: #B59D73;
--el-color-primary-light-7: #CFC0A0;
--el-color-primary-light-9: #F5F0E8;
--el-color-primary-dark-2:  #6F5836;
```

五个 `light-N` 从浅到深的递进关系不要弄反（N 越大越浅），否则 hover 比常态还深。

### 4.4 Vue + Naive UI

现状：`src/App.vue` 里有完整的 `themeOverrides` 对象，包含 `common`（primaryColor 四色阶 + successColor + borderRadius + fontFamily）与 `Menu`（活动项背景/文字/图标共 7 项）。

**不要用 `create({ themeOverrides })`**，这个项目的 `main.js` 根本没 `app.use(naive)`，组件是按需导入的。改就改 `App.vue` 里那个对象：

```js
// src/App.vue
// 注意 Naive 的颜色带 8 位十六进制（末尾 FF 是 alpha），保持这个写法
themeOverrides = {
  common: {
    primaryColor: '#8B6F47FF',
    primaryColorHover: '#A08659FF',
    primaryColorPressed: '#6F5836FF',
    primaryColorSuppl: '#A08659FF',
    successColor: '#18a058FF',    // 状态绿不跟着主色改
    borderRadius: '6px',
    fontFamily: /* 不动 */
  },
  Menu: { /* 7 项 rgba 都要改成新主色的 rgba */ }
}
```

Menu 里的 `rgba(24, 160, 88, 0.1)` 是旧绿色的 RGB，换主色时要把三个数字换成新主色的 RGB。漏了这一块，侧边栏选中项会还是绿底。

---

## 4.5 换色完成后的验收

改完上面所有内容，跑一遍旧主色搜索，**预期只剩下你有意保留的那几处**（如 logo.svg）：

```bash
search_content "1890ff|18a058" --path <FE>/src
```

然后开页面实际看三个地方：侧边栏选中项、主按钮、**首页 Dashboard 的图表**。前两个靠变量/主题，第三个靠手改 ECharts 配项，三者来源不同，造成“改了一半”的观感就是这里漏的。

---

## 5. 毕设友好配色速查（免搜索方案）

如果 ui-ux-pro-max 不可用、关键词匹配不准，或用户不想走选型流程，直接按产品类型用下面的预设。每行都给了完整五色阶，**可以直接贴进 `:root` 的主色 5 行**：

| 产品类型 | primary | -hover | -active | -bg | -bg-deep |
|---|---|---|---|---|---|
| 教育/学习 | `#1890ff` | `#40a9ff` | `#096dd9` | `#e6f4ff` | `#bae0ff` |
| 医疗/健康 | `#13a8a8` | `#36c2c2` | `#0e8585` | `#e6f7f7` | `#b5e8e8` |
| 企业管理 | `#2f54eb` | `#597ef7` | `#1d39c4` | `#f0f5ff` | `#adc6ff` |
| 电商/交易 | `#f5222d` | `#ff4d4f` | `#cf1322` | `#fff1f0` | `#ffccc7` |
| 图书/文化 | `#8b6f47` | `#a08659` | `#6f5836` | `#f5f0e8` | `#e5d9c3` |
| 社区/社交 | `#1da1f2` | `#4db5f5` | `#1681c4` | `#e8f5fd` | `#b8dffa` |
| 餐饮/美食 | `#fa8c16` | `#ffa940` | `#d46b08` | `#fff7e6` | `#ffd591` |
| 环保/农业 | `#18a058` | `#36ad6a` | `#0c7a43` | `#e8f5ec` | `#c3e6cd` |
| 政府/公共 | `#c0392b` | `#d0574a` | `#9c2d21` | `#fbeceb` | `#f0c6c1` |

**两个现成便宜**：

- 教育/学习那行就是 **react / vue-antd / vue-elementplus 的现有值**，选它等于一行不改
- 环保/农业那行就是 **vue-naive 的现有值**

辅色与 CTA 在脚手架里**没有对应变量**（只有主色 + 状态三色）。确实需要 CTA 强调色时，直接复用 `--color-warning`（橙黄），**不要新增 `--cta` 变量**，多一套命名反而乱。

---

## 6. 禁止使用的配色特征

以下特征**在毕设项目中一律禁用**：

| 禁用特征 | 原因 |
|---------|------|
| 把深色作为默认主题 | 投影仪对比度不足，答辩时看不清 |
| 紫色 + 粉色渐变 | AI 生成痕迹太重，导师反感 |
| 霾虹色（#FF00FF / #00FFFF） | 毕设不是赛博朋克风格展览 |
| 超过 5 种主题色 | 显得不专业、杂乱 |
| 彩虹渐变背景 | 同上 |
| 纯黑背景（#000） | 即使是深色侧边栏也用 #001529 而非纯黑 |
| 荧光色文字 | 可读性差 |
| > 3 种字体混用 | 中文正文统一系统默认字体 |
| 为中文引入 Google Fonts | 中文字库几 MB，首屏变慢且国内网络常加载失败 |

**第一条不等于禁止深色切换功能**。vue-naive 自带的 `isDark` 切换（默认亮色、用户手动切、存 localStorage）是合规的，且是个可以写进论文的功能点。判定标准只有一条：**打开系统的第一眼必须是浅色。**
