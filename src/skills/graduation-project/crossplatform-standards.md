# 跨端项目代码规范（uniapp / taro / wxapp）

本文件定义：**基于 uniapp、taro 或 wxapp 脚手架的代码编写规范**。

> **使用前提**：只有项目用的是 `uniapp`、`taro` 或 `wxapp` 脚手架时才读本文件。用 react / vue-antd / vue-elementplus / vue-naive 的请读 `code-standards.md`，**不要读本文件**。

跨端项目不是 Web 前端，`code-standards.md` 里的 API 层 / request / Store / 路由 / 页面 / 样式规范大部分不适用。以下两类内容仍然适用，需要回去读：

- **`code-standards.md §0.3`** —— 27 条接口清单与 `{code, message, data}` 响应协议，三个后端与全部前端统一
- **`code-standards.md §8`、`§9`** —— 注释红线与变量命名规范，跨端也要遵守

uniapp、taro 与 wxapp 之间差别也很大，**别把 uniapp 的写法搬到 taro 或 wxapp**。

---

## 1. 目录结构

**uniapp 和 wxapp 没有 `src/`，目录直接摊在项目根；taro 有 `src/`。** 不要按 Web 前端的路径去找文件。

**uniapp**：`api/` `common/styles/` `components/` `config/` `data/` `pages/` `static/` `store/`（**单数**）`utils/` + `App.vue` `main.js` `pages.json` `manifest.json` `jsconfig.json`

**taro**：`config/` `src/` `package.json` `babel.config.js` `project.config.json`；`src/` 下是 `api/` `components/` `config/` `data/` `pages/` `static/` `store/` `styles/` `utils/` + `app.js` `app.config.js` `app.scss`

**wxapp**：`api/` `config/` `pages/` `static/` `styles/` `utils/` + `app.js` `app.json` `app.wxss` `project.config.json` `sitemap.json`

### 1.1 静态资源分类

**`static/` 下必须再分一级用途目录，不允许把图片直接摊在 `static/` 根上。**

| 目录 | 放什么 | 已内置 |
|---|---|---|
| `static/tab/` | 底部导航图标（普通态 + 选中态） | `tab-home*.png` `tab-notice*.png` `tab-profile*.png` |
| `static/avatar/` | 头像类图片（默认头像、占位图） | `default-avatar.png` |
| `static/banner/` | 轮播图、活动图 | 按业务新建 |
| `static/empty/` | 空状态插图 | 按业务新建 |

**路径统一从 `utils/assets.js`（taro 为 `src/assets/index.js`）引，页面里不要写死 `/static/xxx.png`。** 新增图片时先归到对应分类，再到这个文件里登记导出。

```js
// uniapp / wxapp：utils/assets.js
// taro：src/assets/index.js（图片必须 import，H5 不会自动拷贝 src/static）
import { TAB_ICONS, DEFAULT_AVATAR } from '@/utils/assets'
```

页面文件的命名规则不一样，写路径时容易错：

| | 页面目录 | 页面文件名 | 页面配置 | 登录页路径 |
|---|---|---|---|---|
| uniapp | 11 个：`index` `login` `register` `notice` `profile` `edit` `settings` `password` `about` `agreement` `message` | 一律 `index.vue`；`notice/` 是 `list.vue` + `detail.vue`，`message/` 是 `index.vue` + `detail.vue` | `pages.json` | `/pages/login/index` |
| taro | 11 个：同 uniapp | 同上 | 同目录 `*.config.js` | `/pages/login/index` |
| wxapp | 5 个（无 `edit`）| **与目录同名**，如 `login/login.js`，四件套 `.js` `.json` `.wxml` `.wxss` | `app.json` | `/pages/login/login` |

**消息中心、设置页目前是前端 mock**：消息数据在 `data/messages.js`（taro 为 `src/data/messages.js`），已读状态存在本地缓存；设置页的开关、缓存大小也是模拟值。接真实后端时只需把数据源换成接口，页面结构不用改。

## 2. 与 Web 前端的核心差异

| 差异点 | 说明 |
|---|---|
| 路由 | 不用 Vue Router。uniapp 看 `pages.json`；taro 看 `src/app.config.js` 的 `pages`，页面级配置在同目录 `*.config.js`；wxapp 看 `app.json` |
| 底部导航 | **不用原生 tabBar**。uniapp / taro 用自绘组件 `components/TabBar.vue`，页面用 `uni.reLaunch` / `Taro.reLaunch` 切换；wxapp 目前没有 tabBar |
| 标签 | 只能用 `<view>` `<text>` `<image>` `<navigator>`，**不能用 `<div>` `<span>` `<a>`** |
| 事件 | uniapp / taro 用 `@tap`（taro 不要用 `@click`），阻止冒泡 `@tap.stop`；wxapp 用 `bindtap` / `catchtap` |
| 样式单位 | 用 `rpx`（750rpx = 屏幕宽度），不用 `px`；taro 支持 `<style lang="scss">`，uniapp 用 `uni.scss`，wxapp 用 `.wxss` |
| 网络请求 | 不能用 axios。uniapp 用 `uni.request()`，taro 用 `Taro.request()`，wxapp 用 `wx.request()`，都已已在 `api/request.js` 里包好 Promise |
| 本地存储 | `uni.getStorageSync()` / `Taro.getStorageSync()` / `wx.getStorageSync()`，不是 `localStorage` |
| 提示 | `uni.showToast` / `Taro.showToast({ title, icon: 'none' })` / `wx.showToast`，没有组件库的 message |
| 跳转登录 | uniapp 用 `uni.reLaunch`，taro 用 `Taro.reLaunch`，wxapp 用 `wx.reLaunch`；路径名见上表 |
| 富文本 | `<rich-text :nodes="html">`，不能用 `v-html` |
| 条件编译 | uniapp 用 `// #ifdef H5`；**taro 用 `process.env.TARO_ENV`**（`'h5'` / `'weapp'`）；wxapp 没有 |
| 模块语法 | uniapp / taro 用 ES module（`import` / `export`）；**wxapp 全部用 `require` / `module.exports`** |

### 样式分层：公共样式只写一次

三端都分三层，页面里**只写自己特有的布局**，不要重复定义公共块：

| | 变量与 mixin | 公共类 | 页面样式 |
|---|---|---|---|
| uniapp | `uni.scss`（颜色/字号/间距/圆角 + `card` / `ellipsis` / `btn-filled` / `flex` 四个 mixin） | `common/styles/common.scss`，由 `App.vue` 引入 | `<style scoped lang="scss">`，只写本页布局 |
| taro | `src/styles/_variables.scss` + `_mixins.scss`，由 `config/index.js` 的 `sass.resource` 注入 | `src/styles/common.scss`，由 `app.scss` 引入 | `<style scoped lang="scss">`，只写本页布局 |
| wxapp | `styles/common.wxss` 顶部 `page { --color-*: ... }` CSS 变量 | `styles/common.wxss`，由 `app.wxss` `@import` | 页面 `.wxss` 只写本页布局 |

**可直接复用的公共类**（uniapp / taro 同名，不要改类名）：

- 容器：`.container` `.container--surface` `.container--flush` `.container--auth`
- 卡片与列表：`.card` `.card-title` `.section-title` `.cell-item` `.cell-title` `.cell-desc` `.cell-meta` `.cell-group` `.cell` `.cell-text` `.cell-arrow`
- 表单：`.form-item` `.form-label` `.form-row` `.input` `.error-text` `.gender-group` `.gender-item`
- 按钮：`.btn-primary`（`--pill`）`.btn-logout`
- 状态：`.empty` `.loading`
- 头像：`.avatar`（`--md` / `--lg`）`.avatar-fallback`
- 授权页：`.auth-header` `.auth-title` `.auth-subtitle` `.footer` `.footer-text` `.footer-link`

**wxapp 的 `styles/common.wxss`** 提供同一套命名里当前页面用到的部分：`.container` `.card` `.card--action` `.section-title` `.cell-item` `.cell-title` `.cell-desc` `.cell-meta` `.input-group` `.btn-primary` `.btn-plain` `.avatar`（`--sm`）`.mask` `.dialog*` `.article-*` `.empty`，以及 `.flex` `.flex-between` `.flex-1` `.gap-md` `.mt-*` `.text-*` 等工具类。写新页面前先查这个文件。

**规则**：

1. 页面里不要再写一遍 `.container` `.card` `.btn-primary` `.input` `.form-item` `.empty` 的完整样式；需要微调时加页级修饰类，例如 `.user-card`。
2. 同样的样式出现第 2 次就上移到公共文件，不要复制粘贴。
3. 改主色 / 圆角 / 间距：uniapp 只改 `uni.scss` 的「脚手架设计变量」段；taro 只改 `_variables.scss`；wxapp 只改 `styles/common.wxss` 顶部的 CSS 变量。
4. uniapp 的 `uni.scss` 会被**整份注入**每个 `<style lang="scss">`（不是按文件 import），所以变量与 mixin 必须直接写在该文件里，**不要在 `uni.scss` 里用 `./` 相对路径 import 其它 scss**（会相对组件文件解析而报 `Can't find stylesheet`）。taro 由 `sass.resource` 完成同样的注入。
5. wxapp **禁止**在 wxml 里堆 `style="..."`，用 `styles/common.wxss` 里的工具类（`.flex` `.flex-between` `.gap-md` `.mt-lg` `.text-center` `.text-muted` `.link` 等）。

### 尺寸与溢出硬约束

公共层已经把下面这些约束写死，页面里不要再绕开：

| 约束 | 具体做法 |
|---|---|
| 页面宽度 | `.container` 已固定 `width:100%; max-width:100%; overflow-x:hidden`，页面根节点不要再加负边距或固定宽度 |
| 盒模型 | `view` `text` `input` `textarea` `button` `image` 全局 `box-sizing:border-box; max-width:100%` |
| 图片 | `image` 全局 `display:block; max-width:100%; flex-shrink:0`，不要写超过容器的固定宽度 |
| 长文本 | `.cell-title` `.cell-desc` `.cell-meta` `.cell-text` `.article-content` 已加 `overflow-wrap:break-word; word-break:break-word`；自定义文本块也要加 |
| flex 收缩 | 带文字的 flex 子项加 `min-width:0`；`.form-row .input` 已加 |
| 底部栏 | `TabBar` 组件内部自带与真实高度一致的占位块（`boundingClientRect` 测量 + CSS 兜底），页面**不要**再手写 `padding-bottom` |
| 顶部栏 | 自定义 `NavBar` 同样自带占位块，且不提供关闭开关；玻璃取色用页面顶部的背景渐变，不要让内容进入导航栏区域 |
| 弹窗 | wxapp 的 `.dialog` 已有 `max-width:calc(100% - 80rpx)`，不要写死宽度 |
| 按钮 | 公共按钮已 `max-width:100%`；`.btn-primary--pill` 的 400rpx 也会被限制 |
| 富文本 | `.article-content` 已 `max-width:100%; overflow-x:auto`，宽表格/图片在容器内滚动，不撑破页面 |

**固定栏为什么不会遮内容**：`TabBar.vue` / `NavBar.vue` 在模板里先渲染一个 `*-spacer`，高度默认取 token 兜底值；挂载后再用 `createSelectorQuery().boundingClientRect()` 量出固定栏的真实高度并覆盖。占位块在文档流里，固定栏只是浮在它上面，所以图标、字号、安全区怎么变，内容都不会被盖住。**页面里不要再手动写 `padding-bottom` / `padding-top`。**

**页面里禁止**：

- 写死超过屏幕的 `width` / `margin-left`，用 `%` / `rpx` + `max-width`
- 用 `position:fixed` 放普通内容（只允许 tabBar / 导航栏 / 弹窗遮罩）
- 用 `100vw` 做宽度，容易出现横向滚动条
- 给 `image` 只写 `width` 不写 `height`，会按原图比例把容器撑高

需要横向滑动的内容（如宽表格）用 `<scroll-view scroll-x>` 包起来，**不要**为了它去掉页面级的 `overflow-x:hidden`。

新增页面在 320px 宽（iPhone SE）和连续 50 个英文字符下各看一次，不能出现横向滚动条。

## 3. 状态管理：两端各一套，都不是 Pinia

**uniapp —— `store/user.js`，Vue 3 `reactive()` 轻量单例**（注释写明"避免引入 pinia"）：

- **直接 import 对象用**：`import { userStore } from '@/store/user'`，然后 `userStore.token`。**不是** `useUserStore()` 调用
- 方法是 `setLogin(token, userInfo)` / `updateUserInfo(userInfo)` / `logout()` / `isLoggedIn()`。注意登录方法叫 `setLogin` 不叫 Web 版的 `login`
- `updateUserInfo` 是**合并语义**（内部 `{ ...this.userInfo, ...userInfo }`），可以只传要改的字段。与 wxapp 同名方法语义相反，别混用
- `uni.setStorageSync` 能直接存对象，不用 `JSON.stringify`

**taro —— `src/store/user.js`，Vue 3 `reactive()` 轻量单例**，不要用 Pinia：

- 导入 `import { userStore } from '@/store/user'`，方法名与 uniapp 一致：`setLogin` / `updateUserInfo` / `logout` / `isLoggedIn`
- `updateUserInfo` 是合并语义
- 读写用 `Taro.getStorageSync` / `Taro.setStorageSync`

**wxapp —— `utils/store.js`，`module.exports` 的纯函数集合**，没有响应式：

- 方法是 `getToken()` / `getUserInfo()` / `setAuth(token, userInfo)` / `logout()` / `updateUserInfo(info)`
- 登录方法叫 `setAuth`；`updateUserInfo(info)` 是**整体覆盖**，要传完整对象
- 读写都直接落 storage，页面拿到值后还要 `this.setData()` 才会渲染

三端对照（**跨端复制代码前先确认当前项目是哪一套**）：

| | 登录 | 更新信息 | 语义 |
|---|---|---|---|
| Web 四版（Pinia）| `login` | `updateUserInfo` | 合并 |
| uniapp（reactive）| `setLogin` | `updateUserInfo` | 合并 |
| taro（reactive）| `setLogin` | `updateUserInfo` | 合并 |
| wxapp（纯函数）| `setAuth` | `updateUserInfo` | **整体覆盖** |

`updateUserInfo` 三端同名但 wxapp 语义相反，在 wxapp 里必须先 `{ ...userInfo, ...改动 }` 再传。

## 4. 后端地址配置

两端都在 `config/index.js`，但机制不同，不要在 `request.js` 里写死地址。

**uniapp**（`export default`）：只有 `BASE_URL` / `UPLOAD_BASE`。**H5 也直接访问后端完整地址**（后端已开 CORS），**不要配 `/api` 代理** —— 项目根的 `api/` 源码目录会与 `/api` 前缀冲突，浏览器请求 `@/api/xxx` 时会变成 `/api/xxx.js` 被代理吃掉。小程序端同样用完整地址，生产环境读 `PROD_BASE_URL`。**部署前要改 `PROD_BASE_URL` 常量。**

**wxapp**（`module.exports`）：两个常量 —— `BASE_URL`（接口地址）和 `UPLOAD_BASE`（对应后端 `uploads` 目录）。小程序不支持 `/api` 代理，所以没有环境判断。

**taro**（`export default`）：`src/config/index.js` 导出 `BASE_URL` / `UPLOAD_BASE`。H5 用 `/api` 走 `config/index.js` 的 `h5.devServer.proxy`，小程序用完整地址，生产环境读 `PROD_BASE_URL`。**改后端端口要同步两处：`config/index.js` 的代理与 `src/config/index.js` 的地址**（脚手架生成时已自动处理）。

**图片地址必须拼完整 URL。** 后端返回的头像是 `/uploads/xxx.jpg` 相对路径，小程序的 `<image src>` 不认，wxapp 里用 `config.UPLOAD_BASE` 拼。

**小程序真机调试连不上 localhost。** 需要局域网 IP 或内网穿透，并在微信开发者工具里勾"不校验合法域名"。答辩前先在真机上试一次。

## 5. 请求封装：调用方式三端不同

**uniapp**：`api/request.js` 默认导出 `request(options)`，传对象。业务 API 写成：

`export const login = (username, password) => request({ url: '/user/login', method: 'POST', data: { username, password } })`

同文件还命名导出了 `upload(filePath)`，走 `uni.uploadFile`，字段名 `file`，接口 `/file/upload`。

**wxapp**：`api/request.js` 导出的是 `{ get, post, put, delete }` 四个快捷方法，业务 API 写成：

`login: (username, password) => request.post('/user/login', { username, password })`

**taro**：`src/api/request.js` 默认导出 `request(options)`，与 uniapp 同形。业务 API 写法一致：

`export const login = (username, password) => request({ url: '/user/login', method: 'POST', data: { username, password } })`

上传用 `Taro.uploadFile`，字段名 `file`，接口 `/file/upload`。

响应处理三个分支三端一致，与 Web 版对齐：`code === 200` resolve；`code === 401` 清登录态 + `reLaunch` 到登录页；其他 `showToast` 弹错误。`fail` 回调里提示网络错误（wxapp 额外判了 `err.statusCode === 401`）。

**已有接口覆盖不全，缺的要自己补。** uniapp 与 taro 的 `api/` 都有 `user` `notice` `log` `file` 四个文件；wxapp 只有 `user` `notice`，且 `user.js` 只封了登录、注册、更新、改密码、分页五个方法，删除和详情都没有。补新方法先回 `code-standards.md §0.3` 对路径。

**改密码必须走 `PUT /user/updatePassword`（`{ oldPassword, newPassword }`，错误码 1004）。** `updateUser` 不接受 `password` 字段，别把密码混进个人信息表单一起提交。三端都把它做成独立弹窗：uniapp 在 `pages/edit/index.vue`，taro 在 `src/pages/edit/index.vue`，wxapp 在 `pages/profile/profile`（无 edit 页）。

## 6. taro 的额外注意

- **页面级配置在同目录 `*.config.js`**。`enablePullDownRefresh` 等开关写在这里，漏了不报错但不生效。全局页面与 tabBar 在 `src/app.config.js`
- **生命周期用 Taro 的 hooks**：`useLoad`（取路由参数）、`useReachBottom`、`usePullDownRefresh`，从 `@tarojs/taro` 导入。不要用 `onMounted` 替代 `useLoad` 取参数
- **跳转用 `Taro.navigateTo` / `switchTab` / `redirectTo` / `reLaunch`**。tabBar 页必须用 `switchTab`，否则跳不过去
- **事件用 `@tap`，不要 `@click`**；阻止冒泡用 `@tap.stop`。mini 端不认 `@click`
- **画布**：`Taro.createCanvasContext('captchaCanvas')`，同一个页面里 `canvas-id` 必须唯一；验证码组件已封装在 `src/components/Captcha.vue`
- **H5 预览是 hash 路由**：`http://localhost:10086/#/pages/login/index`。H5 端口与代理在根目录 `config/index.js` 的 `h5.devServer`
- **构建产物固定 `dist/`**：`npm run dev:h5` 与 `npm run dev:weapp` 会互相覆盖，不要同时开两个 watch；小程序用微信开发者工具导入 `dist/`
- **底部导航是自绘的**：`src/components/TabBar.vue`，不要往 `app.config.js` 加 `tabBar`。新增页签改组件的 `items`，图标直接 `import` 进组件（H5 与小程序都由构建器处理）。切换用 `Taro.reLaunch`，`switchTab` 不生效
- **页面底部留白**：`TabBar` 组件自带与真实高度一致的占位块，页面不要再写 `padding-bottom`；改 tabBar 样式后占位高度会自动跟随

## 7. wxapp 的额外注意

- **页面是 `Page({})` 而非组件**，数据放 `data`，改数据只能 `this.setData({})`，直接赋值不会触发渲染
- **生命周期是 `onLoad(options)` / `onShow()`**，路径参数从 `onLoad` 的 `options` 里取，如 `/pages/notice/notice?id=1`
- `utils/util.js` 里有现成的 `formatTime(date)`，格式化时间别另写一份
- 新增页面要**同时**建四个文件并在 `app.json` 的 `pages` 里注册，缺一个就白屏
- **没有组件库弹窗**。`wx.showModal` 只能放文字，要输入框就自绘：`<view wx:if>` 做遮罩 + 弹窗。遮罩上 `bindtap` 关闭，弹窗本体必须用 **`catchtap`** 拦住冒泡，否则点输入框会把弹窗关掉
- **页面公共样式在 `app.wxss` → `styles/common.wxss`**（`.container` `.card` `.section-title` `.input-group` `.btn-primary` `.cell-*` 等），先查再写，不要在页面 `.wxss` 里重定义
- **不要把样式写成 `style="..."` 内联堆在 wxml 里**，用 `styles/common.wxss` 的工具类；页面确有特殊布局再写进页面 `.wxss`
