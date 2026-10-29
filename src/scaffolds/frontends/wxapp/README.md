# 微信小程序客户端（TDesign）

毕业设计脚手架的微信小程序，UI 用 [TDesign 小程序版](https://tdesign.tencent.com/miniprogram/overview)。

## 首次打开

```bash
npm install
```

然后**在微信开发者工具里点一次「工具 → 构建 npm」**，会生成 `miniprogram_npm/`。
`app.json` 里的 `usingComponents` 指向 `tdesign-miniprogram/...`，没构建会报「未找到组件」。

> 换了台机器、或者 `npm install` 更新了版本，都要重新构建一次。

## 页面

| 页面 | 路径 | 说明 |
|---|---|---|
| 首页 | `pages/index/index` | 用户卡片 + 最新 3 条公告 |
| 公告 | `pages/notice/list` | 公告列表（下拉刷新） |
| 公告详情 | `pages/notice/detail?id=` | 富文本正文 |
| 我的 | `pages/profile/profile` | 只做导航：用户卡片 + 入口列表 |
| 个人资料 | `pages/profile/edit` | 昵称、手机号、邮箱 |
| 修改密码 | `pages/profile/password` | 改完自动退出登录 |
| 用户协议 / 隐私政策 | `pages/profile/agreement?type=user\|privacy` | 两份文本共用一页 |
| 关于应用 | `pages/profile/about` | 版本、技术栈、接口地址 |
| 登录 | `pages/login/login` | 微信一键登录 / 账号密码（Tab 切换） |
| 注册 | `pages/register/register` | 账号密码注册 |

## 底部导航（自建，不用原生 tabBar）

`app.json` **没有** `tabBar` 字段，底部栏是自定义组件 `components/tab-bar/`：

```xml
<tab-bar active="home" />
```

- `active`：`home` / `notice` / `profile`
- 组件内部自带 `tabbar-spacer` 等高占位块，页面内容不会被盖住
- 栏高只由组件 wxss 里 `:host` 的 `--tabbar-height`（默认 72rpx）决定，
  占位块跟着算；底部留白是 `max(16rpx, env(safe-area-inset-bottom) - 24rpx)`，
  即安全区收一圈再用，否则文字下面会空出一大片白
- 切换用 `wx.reLaunch`，样式、图标、选中色都在组件 wxss 里，改主题不用动 app.json

新增 tab 页：在 `tab-bar.js` 的 `list` 里加一项，给页面末尾放 `<tab-bar active="xxx" />` 即可。

## 登录方式

1. **微信一键登录**：`wx.login()` 拿 `code` → `POST /api/user/wxLogin` → 后端用 appid/secret 换 openid → 没有账号自动建 → 返回 JWT。
   需要配套的「小程序专用后端」（`--be springboot-wxapp`），普通后端没有这个接口。
2. **账号密码登录**：管理员/测试账号用，任何后端都支持。

appid 在 `project.config.json`（模板里是 `touristappid`，`create` 会把 `--appid` 或向导里填的值写进去），
后端的 appid/secret 在 `backend/src/main/resources/application.yml` 的 `wechat` 段，两边必须一致。
secret 只放后端，不要写进小程序代码。

## 主题

品牌色在 `app.wxss` 里覆盖 TDesign 变量，改色只改这几行：

```css
page {
  --td-brand-color: #1890ff;
  --td-brand-color-active: #096dd9;
  --td-brand-color-light: #e6f4ff;
}
```

`styles/common.wxss` 是页面级公共样式（卡片、间距、文本工具类），TDesign 组件自带样式，不要重复写。

## 头像与昵称

从 2022-10-25 起，`wx.getUserProfile` 不再返回真实头像和昵称（返回灰头像 + “微信用户”），`wx.getUserInfo` 更是早就拿不到了。官方现在只给两件事：

| 能力 | 用法 | 约束 |
|---|---|---|
| 选微信头像 | `<button open-type="chooseAvatar" bindchooseavatar="...">` | 回调给的是**本地临时路径**，必须上传到后端才能持久化 |
| 填微信昵称 | `<input type="nickname">`（TDesign 用 `<t-input type="nickname">`） | 键盘上方给“使用微信昵称”一键填入，仍需用户确认 |

所以“自动读取微信头像/昵称”这个能力已经没了，正确做法是上面两种。本脚手架已在 `pages/profile/edit` 里接好：

1. 点头像 → 微信选头像（或相册）→ `api/file.js` 的 `wx.uploadFile` 上传到 `POST /api/file/upload`（字段名 `file`）
2. 后端返回 `{ url: '/uploads/日期/xxx.png' }` → 写进 `user.avatar` → 同步本地缓存
3. 昵称输入框用 `type="nickname"`，能一键填入微信昵称

上传接口需要带 token，`wx.uploadFile` 的 `header` 里已经加上了 `Authorization`。

## 接口地址

`config/index.js`：

```js
const LAN_HOST = 'localhost';
```

真机调试时连不上 `localhost`，改成电脑的局域网 IP（Windows 用 `ipconfig` 查 IPv4）。

## 上传头像

小程序上传要用 `wx.uploadFile`（multipart，字段名 `file`），接口是 `POST /api/file/upload`，
返回的 `data.url` 写进 `user.avatar`。已封装在 `api/file.js` 的 `uploadImage()`，
在 `pages/profile/edit` 里配合 `open-type="chooseAvatar"` 使用。
