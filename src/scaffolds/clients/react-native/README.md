# React Native 移动端（Expo + HeroUI Native）

毕设脚手架的移动端客户端，与其他 Web 前端、PyQt 桌面端共用同一套后端 API。

## 技术栈

| 层级 | 选型 | 说明 |
|---|---|---|
| 框架 | Expo SDK 58 / React Native 0.88 | 真机扫码即开发，不用配 Android / iOS 工具链 |
| 语言 | TypeScript | 别名 `@/*` 指向 `src/` |
| 路由 | expo-router（Stack + 自定义底部栏） | 文件即路由，页面全部在 `src/app/` |
| 组件库 | HeroUI Native 1.0.11 | 组合式组件，观感接近 iOS 原生 |
| 样式 | Uniwind（Tailwind CSS v4） | 直接写 `className`，不需要 StyleSheet |
| 字体 | Noto Sans SC（随包内置） | 不读系统字体，换手机、换主题字体都不变 |
| 状态管理 | zustand | 轻量，启动时从 AsyncStorage 恢复登录态 |
| 网络 | axios + AsyncStorage | 统一拦截器，401 自动登出 |
| 上传 | expo-image-picker + expo-file-system | `File.upload` 直传，绕开 RN 的 FormData 限制 |
| 环境变量 | `.env` + `EXPO_PUBLIC_*` | 打包时内联，不用额外装 dotenv |

> **关于 Web**：HeroUI Native 官方只支持 iOS / Android，不保证 Web 表现。
> `npm run web` 能跑起来用于快速看样式，但布局以真机为准。

## 目录结构

只有一个页面目录：`src/app/`。文件路径就是页面路径，不存在第二套 screens 目录。

```
clients/react-native/
├─ src/
│  ├─ app/                        路由（文件 = 页面）
│  │  ├─ _layout.tsx              根布局：手势容器 + 安全区 + HeroUI Provider + 路由栈
│  │  ├─ index.tsx                启动分发：读登录态，决定去首页还是登录页
│  │  ├─ login.tsx                /login
│  │  ├─ register.tsx             /register
│  │  ├─ (tabs)/                  带底部导航的页面组（括号不会出现在 URL 里）
│  │  │  ├─ _layout.tsx           Tab 容器：上面 Slot，下面导航栏
│  │  │  ├─ home.tsx              /home     首页
│  │  │  ├─ notice.tsx            /notice   公告列表
│  │  │  └─ profile.tsx           /profile  我的（只做导航，不直接改资料）
│  │  ├─ notice/[id].tsx          /notice/:id        公告详情
│  │  └─ profile/
│  │     ├─ edit.tsx              /profile/edit       个人资料（二级页）
│  │     ├─ password.tsx          /profile/password   修改密码（二级页）
│  │     ├─ agreement.tsx         /profile/agreement  用户协议 / 隐私政策（二级页，?type= 区分）
│  │     └─ about.tsx             /profile/about      关于应用（二级页）
│  ├─ api/                        接口层
│  │  ├─ request.ts               axios 实例 + 拦截器
│  │  ├─ user.ts                  用户接口 + 类型
│  │  ├─ notice.ts                公告接口
│  │  └─ file.ts                  文件上传
│  ├─ components/                 可复用组件
│  │  ├─ AppButton.tsx            统一按钮（防文字裁剪）
│  │  ├─ Screen.tsx               页面壳（顶部安全区留白）
│  │  ├─ BottomTabBar.tsx         底部导航（样式在 theme/tabbar.css）
│  │  └─ Captcha.tsx              纯前端验证码
│  ├─ hooks/
│  │  └─ useKeyboardAwareScroll.ts  表单键盘避让（输入框不被输入法盖住）
│  ├─ store/user.ts               zustand 登录态
│  ├─ theme/                      主题与样式
│  │  ├─ tokens.css               颜色与尺寸变量（改主色改这里）
│  │  ├─ typography.css           字体锁定（全局字族）
│  │  ├─ layout.css               .page / .page-content / .section-header
│  │  ├─ tabbar.css               底部导航样式
│  │  ├─ fonts.ts                 字体文件加载（expo-font）
│  │  └─ colors.ts                JS 侧取色（图标、状态栏）
│  └─ config.ts                   读环境变量，导出 BASE_URL / STATIC_BASE
├─ global.css                     Tailwind + Uniwind + HeroUI 的汇总入口
├─ metro.config.js                Uniwind 编译配置
├─ uniwind-types.d.ts             Uniwind 生成，提供 className 类型
├─ app.json
├─ tsconfig.json
├─ .env                           实际环境变量（已被 .gitignore 忽略）
├─ .env.example                   环境变量模板
└─ package.json
```

### 页面是怎么对应上的

| 文件 | 访问路径 | 出现在底部导航 |
|---|---|---|
| `src/app/index.tsx` | `/` | 否（只做跳转） |
| `src/app/login.tsx` | `/login` | 否 |
| `src/app/register.tsx` | `/register` | 否 |
| `src/app/(tabs)/home.tsx` | `/home` | 是 |
| `src/app/(tabs)/notice.tsx` | `/notice` | 是 |
| `src/app/(tabs)/profile.tsx` | `/profile` | 是 |
| `src/app/notice/[id].tsx` | `/notice/123` | 否（压栈打开） |
| `src/app/profile/edit.tsx` | `/profile/edit` | 否（压栈打开） |
| `src/app/profile/password.tsx` | `/profile/password` | 否（压栈打开） |
| `src/app/profile/agreement.tsx` | `/profile/agreement?type=user` | 否（压栈打开） |
| `src/app/profile/about.tsx` | `/profile/about` | 否（压栈打开） |

`(tabs)` 是路由组，只影响布局嵌套，不影响 URL；`[id]` 是动态段。

一级页面只做展示与导航，所有编辑/表单动作都放到二级页面，从一级页面 `router.push` 进入。

## 启动

```bash
cd clients/react-native
npm install
npm start               # 扫 Expo Go 二维码
# 或
npm run android         # Android 模拟器
npm run web             # 浏览器（仅调试样式）
```

`npm install` 之后可用 `npm run type-check` 检查类型。

`uniwind-types.d.ts` 是 Uniwind 生成的文件（已随脚手架提供），首次运行 Metro 时会重新生成；`className` 的补全与类型检查依赖它。

## 环境变量

接口地址写在项目根 `.env`，`src/config.ts` 负责读取：

| 变量 | 含义 |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | 接口根地址，含 `/api` 后缀 |
| `EXPO_PUBLIC_STATIC_BASE_URL` | 静态资源根地址，用于头像等文件 |

规则：

1. 只有 `EXPO_PUBLIC_` 前缀的变量会被内联进客户端，其余变量在 RN 里读不到。
2. 改完 `.env` 要重启 dev server，必要时加 `--clear` 清缓存：`npm start -- --clear`。
3. `.env` 已在 `.gitignore` 里，换机器后从 `.env.example` 复制一份。
4. 不要把密钥写进 `.env`，`EXPO_PUBLIC_*` 会随包发出。

### 切换后端

```bash
# 8080 Spring / 8081 Express / 8082 Flask / 8083 FastAPI / 8084 Go / 8085 .NET
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080/api
EXPO_PUBLIC_STATIC_BASE_URL=http://192.168.1.100:8080
```

> **真机调试**必须用开发机的局域网 IP，`localhost` 在手机上指向手机自己。
> Android 模拟器访问宿主机用 `10.0.2.2`。

## 换主题

样式分三层，登录、首页、导航栏都从这三层取值：

| 层 | 文件 | 放什么 |
|---|---|---|
| 变量 | `src/theme/tokens.css` | 主色、尺寸（导航高、字号） |
| 字体 | `src/theme/typography.css` | 全局字族，锁成内置的 Noto Sans SC |
| 通用布局 | `src/theme/layout.css` | `.page`、`.page-content`、`.section-header` |
| 组件样式 | `src/theme/tabbar.css` | 底部导航的布局、分割线、选中色 |

`global.css` 只负责把 Tailwind、Uniwind、HeroUI 和四份主题文件串起来：

```css
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';
@import './src/theme/tokens.css';
@import './src/theme/typography.css';
@import './src/theme/layout.css';
@import './src/theme/tabbar.css';
```

改主色只改 `tokens.css` 一处：

```css
:root {
  --accent: #1890ff;
  --accent-foreground: #ffffff;
  --focus: #1890ff;
}
```

页面里用类名取色，不要写死十六进制：

| 用途 | 类名 |
|---|---|
| 页面根容器 | `.page`（已含 `flex-1 bg-background`） |
| 滚动区域 | `.page-content`（16px 内边距 + 16px 间距） |
| 卡片 / 输入框底 | `bg-surface`、`bg-surface-secondary` |
| 主文字 / 次要文字 | `text-foreground`、`text-muted` |
| 分割线 | `border-border` |
| 主色按钮、强调文字 | `bg-accent`、`text-accent` |
| 状态色 | `bg-success` / `bg-warning` / `bg-danger` |

只有拿不到 CSS 变量的地方（图标 `color`、`RefreshControl`、`StatusBar`）才用 `src/theme/colors.ts` 里的常量，换主题时两个文件一起改。

> 自定义类（`.tabbar`、`.page-content` 等）必须写在 `@layer components` 里才能被 Uniwind 编译成 RN 样式。

## 组件速查

### 全局提示 Toast

不依赖 hook，任何地方（包括 `api/request.ts`）都能调：

```tsx
import { showToast } from '@/components/AppToast'

showToast('success', '保存成功')
showToast('error', '上传失败', '网络请求超时')
showToast('warning', '请先授予相册权限')
showToast('info', '提示', '可选副标题')
```

四种类型：`success` / `error` / `warning` / `info`，图标与颜色自动匹配。
渲染由挂在根布局的 `<ToastHost />` 负责，已经接好，不用再管。

### 确认弹窗 ConfirmDialog

替代系统 `Alert.alert`，保证圆角和配色与 App 一致：

```tsx
const [open, setOpen] = useState(false)

<AppButton variant="danger-soft" onPress={() => setOpen(true)}>退出登录</AppButton>

<ConfirmDialog
  isOpen={open}
  title="退出登录"
  description="退出后需要重新登录。"
  confirmText="退出"
  danger
  onConfirm={handleConfirm}
  onCancel={() => setOpen(false)}
/>
```

`danger` 控制确认按钮是否红色，`loading` 控制确认中禁用防重复提交。

### 表单键盘避让

安卓的 `adjustResize` 只会把可视区压小，不会把输入框挪到键盘上方；当表单刚好一屏时也滚不动。
用 `useKeyboardAwareScroll` 补留白 + 聚焦时上滚：

```tsx
const { scrollRef, revealField, keyboardSpacer } = useKeyboardAwareScroll()

<ScrollView ref={scrollRef} contentContainerClassName="page-content">
  <Input onFocus={revealField} />
  {/* 末尾留白，给滚动留余量 */}
  <View style={{ height: keyboardSpacer }} />
</ScrollView>
```

长表单（如注册页）本身有滚动余量，可以只加 `onFocus={revealField}`，不加留白。

### 其他

```tsx
// 按钮（统一封装，避免文字被裁剪）
<AppButton variant="primary" size="lg" onPress={save} isDisabled={saving}>
  保存
</AppButton>

// 表单：Label + Input + FieldError 组合，校验态由 isInvalid 驱动
<TextField isInvalid={!!error} isRequired>
  <Label>用户名</Label>
  <Input value={v} onChangeText={setV} placeholder="请输入" />
  {!!error && <FieldError>{error}</FieldError>}
</TextField>

// 卡片
<Card>
  <Card.Header>
    <Card.Title>标题</Card.Title>
    <Card.Description>副标题</Card.Description>
  </Card.Header>
  <Card.Body>内容</Card.Body>
  <Card.Footer>操作</Card.Footer>
</Card>

// 头像
<Avatar size="lg">
  <Avatar.Image source={{ uri }} />
  <Avatar.Fallback>张</Avatar.Fallback>
</Avatar>
```

## 字体

应用不向系统取字：`Noto Sans SC` 随安装包发布，手机换字体、换主题都不会影响界面。

- 资源与注册：`src/theme/fonts.ts`，只装 400 / 700 两个字面（安装包 +21MB，换来全端字形一致）
- 生效范围：`src/theme/typography.css` 给 `.hero-text` 和 `.input__input` 声明字族，HeroUI 的文本与输入框因此全站生效
- 字号：根布局关掉 `allowFontScaling`，系统「超大字号」不会把按钮文字挤到换行
- 二级页导航栏是原生头，CSS 管不到，在 `src/app/_layout.tsx` 的 `headerTitleStyle` 里单独指定

换字体时三处一起改：`fonts.ts` 的 `APP_FONT`、`typography.css` 的 `font-family`、`_layout.tsx` 的 `headerTitleStyle`。
自带字体覆盖不到的部分：系统弹窗、相册选择器等第三方原生界面。

## 与其他客户端的功能对齐

- **新字段**：nickname / age / gender / phone / email，注册页与个人中心均已支持
- **修改密码**：`PUT /user/updatePassword`，校验原密码，改完自动退出登录
- **用户协议 / 隐私政策**：`/profile/agreement?type=user|privacy`，两份文本共用一页
- **统一响应**：`{ code, message, data }`，`request.ts` 拦截器统一解包
- **JWT**：AsyncStorage 持久化，axios 请求头自动携带
- **验证码**：4 位字符纯前端校验（`CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'`）
- **图片上传**：`/api/file/upload`，头像写入 `user.avatar`
- **主色**：`#1890ff`，与 React / Vue-Antd / EP / PyQt 一致

## 已知限制

- HeroUI Native 官方不支持 Web，`npm run web` 只用于看样式
- 富文本公告按纯文本展示，未引入 `react-native-render-html`
- 未实现 refresh token 无感续签，401 直接登出
- 未做暗色模式切换
- 字体为随包内置的 Noto Sans SC，系统弹窗等原生界面仍用系统字体
