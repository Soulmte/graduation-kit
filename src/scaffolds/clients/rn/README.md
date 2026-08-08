# React Native 移动端 (Expo + TypeScript + RN Paper)

毕设脚手架的移动端客户端,与其他 5 个 Web 前端、PyQt 桌面端共用同一套后端 API。

## 技术栈

| 层级       | 选型                          | 说明                                        |
|-----------|-------------------------------|---------------------------------------------|
| 框架       | Expo SDK 51                  | 真机扫码即开发, 无需配置 Android/iOS 工具链   |
| 语言       | TypeScript                   | 开启 paths 别名 `@/*` 指向 `src/`           |
| 路由       | expo-router (Stack)          | **未使用 `(tabs)` 括号目录**, Tab 用 BottomNavigation |
| 组件库     | React Native Paper (MD3)     | 业内最常用的 Material Design 实现           |
| 状态管理   | zustand                      | 轻量, 含 `hydrate` 从 AsyncStorage 恢复     |
| 网络       | axios + AsyncStorage         | 统一拦截器, 401 自动登出                    |
| 上传       | expo-image-picker + fetch    | RN 端 FormData 上传                         |

## 目录结构

```
clients/rn/
├─ app/                       expo-router 文件路由
│  ├─ _layout.tsx             根布局(PaperProvider + Stack)
│  ├─ index.tsx               入口分发(根据 token 跳转)
│  ├─ login.tsx               登录页(含验证码)
│  ├─ register.tsx            注册页(完整字段校验)
│  ├─ main.tsx                Tab 容器(BottomNavigation)
│  └─ notice/[id].tsx         公告详情(动态路由)
├─ src/
│  ├─ api/                    接口层
│  │  ├─ request.ts           axios 实例 + 拦截器
│  │  ├─ user.ts              用户相关 API + TS 类型
│  │  ├─ notice.ts            公告 API
│  │  └─ file.ts              文件上传(fetch + FormData)
│  ├─ components/
│  │  └─ Captcha.tsx          纯前端验证码(forwardRef)
│  ├─ screens/                Tab 内的页面(由 main.tsx 装载)
│  │  ├─ HomeTab.tsx          首页
│  │  ├─ NoticeTab.tsx        公告列表(分页 + 搜索)
│  │  └─ ProfileTab.tsx       个人中心(资料/头像/登出)
│  ├─ store/
│  │  └─ user.ts              zustand 用户状态
│  ├─ styles/
│  │  ├─ theme.ts             设计令牌 + Paper MD3 主题
│  │  └─ global.ts            全局复用 StyleSheet (`gs.*`)
│  └─ config.ts               BASE_URL 等
├─ app.json
├─ babel.config.js
├─ tsconfig.json
└─ package.json
```

## 路由设计说明

由于约束 **文件名/目录不能含括号**, 没有使用 expo-router 的路由组语法 `(tabs)/`。
底部 Tab 改由 `app/main.tsx` 内的 `BottomNavigation` 组件实现, 三个 Tab 视图作为
普通组件位于 `src/screens/`。这种方式同样能产生原生底栏体验, 且文件命名干净。

页面路径:

| 路径               | 文件                       | 说明                |
|--------------------|----------------------------|---------------------|
| `/`                | `app/index.tsx`            | 启动分发            |
| `/login`           | `app/login.tsx`            | 登录                |
| `/register`        | `app/register.tsx`         | 注册                |
| `/main`            | `app/main.tsx`             | 主界面(底部 Tab)    |
| `/notice/:id`      | `app/notice/[id].tsx`      | 公告详情            |

## 全局样式

- `src/styles/theme.ts` — 颜色/字号/圆角/间距 + Paper MD3 主题(蓝白配色, 主色 `#1890ff`)
- `src/styles/global.ts` — 通用 StyleSheet 常量集合, 任意页面 `import { gs } from '@/styles/global'` 后即可复用

复用样式键(节选):

- `gs.screen` / `gs.authScreen` — 屏幕容器
- `gs.card` / `gs.banner` / `gs.authCard` — 卡片/Banner/认证卡
- `gs.formField` / `gs.fieldLabel` — 表单
- `gs.text` / `gs.textSub` / `gs.textMute` / `gs.textPrimary` / `gs.textDanger` — 文本
- `gs.noticeItem` / `gs.noticeTitle` / `gs.noticeContent` / `gs.noticeTime` — 公告卡片

## 启动

```bash
cd clients/rn
npm install
npm start          # 扫描 Expo Go 二维码
# 或
npm run web        # 浏览器
npm run android    # Android 模拟器
```

## 切换后端

修改 `src/config.ts`:

```ts
export const BASE_URL    = 'http://localhost:8084/api'   // 8080-Spring / 8081-Express / 8082-Flask / 8083-FastAPI / 8084-Go / 8085-.NET
export const STATIC_BASE = 'http://localhost:8084'
```

> **真机调试** 必须改成开发机的局域网 IP(如 `http://192.168.1.100:8084/api`),
> 因为 `localhost` 在手机上指向手机本身。Android 模拟器可用 `10.0.2.2`。

## 与其他客户端的功能对齐

- **新字段**: nickname / age / gender / phone — 注册页与个人中心均已支持
- **统一响应**: `{code,message,data}` — `request.ts` 拦截器统一解包
- **JWT**: AsyncStorage 持久化, axios 请求头自动携带
- **验证码**: 4 位字符纯前端校验(逻辑同 Web 端 `CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'`)
- **图片上传**: 使用 `/api/file/upload` 公共接口, 头像保存到 `user.avatar`
- **蓝白主题**: 主色 `#1890ff`, 与 React/Vue-Antd/EP/PyQt 一致

## 已知限制

- HTML 富文本公告在 RN 中以纯文本展示(剥离标签), 未引入 `react-native-render-html`
- 未实现 refresh token 无感续签, 401 直接登出
- 未做暗色模式切换(Web 端的 Vue-Naive 已支持)
