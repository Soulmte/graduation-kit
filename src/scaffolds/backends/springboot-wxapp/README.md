# 小程序专用后端（Spring Boot）

毕业设计脚手架的 Spring Boot 后端，给微信小程序用的版本。除了通用版的功能，多两样东西：

| 差异 | 说明 |
|---|---|
| `user.openid` | 微信登录的用户标识，唯一索引；普通账号为 `NULL` |
| `POST /api/user/wxLogin` | 小程序登录：`wx.login()` 的 code 换 openid，没有账号就自动建，返回和账号登录一致的 JWT |
| `application.yml` 的 `wechat` 段 | `appid` / `secret` |

数据库是 `wxapp_db`，建库脚本在 `docs/scaffold_db_wxapp.sql`（比通用版多 `openid` 字段与 `uk_openid` 索引）。

> 这套后端只配**原生小程序**前端（`create --be springboot-wxapp --fe wxapp`）。
> uni-app / Taro 也能直接调这些接口，但 `wx.login` 换 openid 那段要各自项目里自己接。
>
> `application.yml` 里 `wechat.appid` / `wechat.secret` 是 `__WECHAT_APPID__` / `__WECHAT_SECRET__` 占位符，
> `create` 时填的 AppID / AppSecret 会直接写进去（同时写进小程序的 `project.config.json`）；
> 手改也行，secret 只放后端，别提交到公开仓库。

## 启动

```bash
mysql -u root -p --default-character-set=utf8mb4 < docs/scaffold_db_wxapp.sql
mvn spring-boot:run
```

端口 8080，健康检查 `GET /api/health`。

> `application.yml` 里的数据库密码是占位符 `__DB_PASSWORD__`，本地跑用环境变量覆盖，不改文件：
> `SPRING_DATASOURCE_PASSWORD=123456 mvn spring-boot:run`

## 小程序登录接口

```http
POST /api/user/wxLogin
Content-Type: application/json

{ "code": "wx.login 拿到的 code" }
```

返回与普通登录一致：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOi...",
    "userInfo": { "id": 4, "username": "wx_o6_bAZ…", "nickname": "微信用户", "openid": "o6_bAZ…" }
  }
}
```

首次登录会自动建号：`username` 由 openid 派生（`wx_` + 前 16 位），密码是随机串，不能用于账号密码登录。

`code` 只能用一次、五分钟过期，所以这个接口没法用固定值反复测——在微信开发者工具里直接点登录即可，`wx.login()` 每次都会给新的 code。

## 常见错误码

| 返回 | 原因 |
|---|---|
| `微信登录失败：invalid code（errcode 40029）` | code 过期或已用过，重新 `wx.login()` |
| `微信登录失败：invalid appid（errcode 40013）` | `wechat.appid` 与小程序 `project.config.json` 的 appid 不一致 |
| `微信登录失败：invalid appsecret（errcode 40125）` | `wechat.secret` 填错，去公众平台重置 |
| `请求微信服务器失败：…` | 本机连不上 `api.weixin.qq.com`，检查代理/网络 |

## 其余与通用版完全一致

用户管理、公告、操作日志、文件上传、JWT 鉴权、统一返回结构都没动，Web 前端换回普通登录即可直接对接。
