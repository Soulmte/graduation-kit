# 跨端项目代码规范（uniapp / wxapp）

本文件定义：**基于 uniapp / wxapp 脚手架的代码编写规范**。

> **使用前提**：只有项目用的是 `uniapp` 或 `wxapp` 脚手架时才读本文件。用 react / vue-antd / vue-elementplus / vue-naive 的请读 `code-standards.md`，**不要读本文件**。

跨端项目不是 Web 前端，`code-standards.md` 里的 API 层 / request / Store / 路由 / 页面 / 样式规范大部分不适用。以下两类内容仍然适用，需要回去读：

- **`code-standards.md §0.3`** —— 27 条接口清单与 `{code, message, data}` 响应协议，三个后端与全部前端统一
- **`code-standards.md §8`、`§9`** —— 注释红线与变量命名规范，跨端也要遵守

uniapp 和 wxapp 之间差别也很大，**别把 uniapp 的写法搬到 wxapp**。

---

## 1. 目录结构：没有 `src/`

目录都**直接摊在项目根**，不要按 Web 前端的路径去找文件。

**uniapp**：`api/` `components/` `config/` `pages/` `static/` `store/`（**单数**）+ `App.vue` `main.js` `pages.json` `manifest.json` `jsconfig.json`

**wxapp**：`api/` `config/` `pages/` `static/` `utils/` + `app.js` `app.json` `app.wxss` `project.config.json` `sitemap.json`

页面文件的命名规则不一样，写路径时容易错：

| | 页面目录 | 页面文件名 | 登录页路径 |
|---|---|---|---|
| uniapp | 6 个：`index` `login` `register` `notice` `profile` `edit` | 一律 `index.vue`；`notice/` 例外，是 `list.vue` + `detail.vue` | `/pages/login/index` |
| wxapp | 5 个（无 `edit`）| **与目录同名**，如 `login/login.js`，四件套 `.js` `.json` `.wxml` `.wxss` | `/pages/login/login` |

## 2. 与 Web 前端的核心差异

| 差异点 | 说明 |
|---|---|
| 路由 | 不用 Vue Router。uniapp 在 `pages.json` 的 `pages` 数组注册，tabBar 在同文件 `tabBar` 节点；wxapp 在 `app.json` 的 `pages` 数组，`window` / `tabBar` 也在这里 |
| 标签 | 只能用 `<view>` `<text>` `<image>` `<navigator>`，**不能用 `<div>` `<span>` `<a>`** |
| 样式单位 | 用 `rpx`（750rpx = 屏幕宽度），不用 `px`；也没有 `styles/` 三件套和 `--color-*` 变量 |
| 网络请求 | 不能用 axios。uniapp 用 `uni.request()`，wxapp 用 `wx.request()`，都已在 `api/request.js` 里包好 Promise |
| 本地存储 | `uni.getStorageSync()` / `wx.getStorageSync()`，不是 `localStorage` |
| 提示 | `uni.showToast({ title, icon: 'none' })` / `wx.showToast(...)`，没有组件库的 message |
| 跳转登录 | `reLaunch` 清栈跳绝对路径，注意两端路径名不同（见上表） |
| 富文本 | `<rich-text :nodes="html">`，不能用 `v-html` |
| 条件编译 | 仅 uniapp 有：`// #ifdef H5` / `// #ifdef MP-WEIXIN` / `// #ifndef H5` / `// #endif` |
| 模块语法 | uniapp 用 ES module（`import` / `export`）；**wxapp 全部用 `require` / `module.exports`** |

## 3. 状态管理：两端各一套，都不是 Pinia

**uniapp —— `store/user.js`，Vue 3 `reactive()` 轻量单例**（注释写明"避免引入 pinia"）：

- **直接 import 对象用**：`import { userStore } from '@/store/user'`，然后 `userStore.token`。**不是** `useUserStore()` 调用
- 方法是 `setLogin(token, userInfo)` / `updateUserInfo(userInfo)` / `logout()` / `isLoggedIn()`。注意登录方法叫 `setLogin` 不叫 Web 版的 `login`
- `updateUserInfo` 是**合并语义**（内部 `{ ...this.userInfo, ...userInfo }`），可以只传要改的字段。与 wxapp 同名方法语义相反，别混用
- `uni.setStorageSync` 能直接存对象，不用 `JSON.stringify`

**wxapp —— `utils/store.js`，`module.exports` 的纯函数集合**，没有响应式：

- 方法是 `getToken()` / `getUserInfo()` / `setAuth(token, userInfo)` / `logout()` / `updateUserInfo(info)`
- 登录方法叫 `setAuth`；`updateUserInfo(info)` 是**整体覆盖**，要传完整对象
- 读写都直接落 storage，页面拿到值后还要 `this.setData()` 才会渲染

三端对照（**跨端复制代码前先确认当前项目是哪一套**）：

| | 登录 | 更新信息 | 语义 |
|---|---|---|---|
| Web 四版（Pinia）| `login` | `updateUserInfo` | 合并 |
| uniapp（reactive）| `setLogin` | `updateUserInfo` | 合并 |
| wxapp（纯函数）| `setAuth` | `updateUserInfo` | **整体覆盖** |

`updateUserInfo` 三端同名但 wxapp 语义相反，在 wxapp 里必须先 `{ ...userInfo, ...改动 }` 再传。

## 4. 后端地址配置

两端都在 `config/index.js`，但机制不同，不要在 `request.js` 里写死地址。

**uniapp**（`export default`）：只有 `BASE_URL`，按环境算 —— H5 走 `/api`（devServer 代理配在 `manifest.json` 的 `h5.devServer.proxy`），小程序端用完整地址，生产环境读 `PROD_BASE_URL`。**部署前要改 `PROD_BASE_URL` 常量。**

**wxapp**（`module.exports`）：两个常量 —— `BASE_URL`（接口地址）和 `UPLOAD_BASE`（对应后端 `uploads` 目录）。小程序不支持 `/api` 代理，所以没有环境判断。

**图片地址必须拼完整 URL。** 后端返回的头像是 `/uploads/xxx.jpg` 相对路径，小程序的 `<image src>` 不认，wxapp 里用 `config.UPLOAD_BASE` 拼。

**小程序真机调试连不上 localhost。** 需要局域网 IP 或内网穿透，并在微信开发者工具里勾"不校验合法域名"。答辩前先在真机上试一次。

## 5. 请求封装：调用方式两端不同

**uniapp**：`api/request.js` 默认导出 `request(options)`，传对象。业务 API 写成：

`export const login = (username, password) => request({ url: '/user/login', method: 'POST', data: { username, password } })`

同文件还命名导出了 `upload(filePath)`，走 `uni.uploadFile`，字段名 `file`，接口 `/file/upload`。

**wxapp**：`api/request.js` 导出的是 `{ get, post, put, delete }` 四个快捷方法，业务 API 写成：

`login: (username, password) => request.post('/user/login', { username, password })`

响应处理三个分支两端一致，与 Web 版对齐：`code === 200` resolve；`code === 401` 清登录态 + `reLaunch` 到登录页；其他 `showToast` 弹错误。`fail` 回调里提示网络错误（wxapp 额外判了 `err.statusCode === 401`）。

**已有接口覆盖不全，缺的要自己补。** uniapp 的 `api/` 有 `user` `notice` `log` `file` 四个文件；wxapp 只有 `user` `notice`，且 `user.js` 只封了登录、注册、更新、改密码、分页五个方法，删除和详情都没有。补新方法先回 `code-standards.md §0.3` 对路径。

**改密码必须走 `PUT /user/updatePassword`（`{ oldPassword, newPassword }`，错误码 1004）。** `updateUser` 不接受 `password` 字段，别把密码混进个人信息表单一起提交。两端都把它做成独立弹窗：uniapp 在 `pages/edit/index.vue`，wxapp 在 `pages/profile/profile`（无 edit 页）。

## 6. wxapp 的额外注意

- **页面是 `Page({})` 而非组件**，数据放 `data`，改数据只能 `this.setData({})`，直接赋值不会触发渲染
- **生命周期是 `onLoad(options)` / `onShow()`**，路径参数从 `onLoad` 的 `options` 里取，如 `/pages/notice/notice?id=1`
- `utils/util.js` 里有现成的 `formatTime(date)`，格式化时间别另写一份
- 新增页面要**同时**建四个文件并在 `app.json` 的 `pages` 里注册，缺一个就白屏
- **没有组件库弹窗**。`wx.showModal` 只能放文字，要输入框就自绘：`<view wx:if>` 做遮罩 + 弹窗。遮罩上 `bindtap` 关闭，弹窗本体必须用 **`catchtap`** 拦住冒泡，否则点输入框会把弹窗关掉
- **页面公共样式在 `app.wxss`**（`.container` `.card` `.section-title` `.input-group` `.btn-primary` `.text-muted` 等），先查再写，不要在页面 `.wxss` 里重定义
- **不要把样式写成 `style="..."` 内联堆在 wxml 里**，抽到页面 `.wxss` 里命名，否则论文附录贴代码很难看
