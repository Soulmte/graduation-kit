---
name: api-designer
description: 毕设接口设计 skill。用户说要加接口、设计 API、定义请求响应格式、前后端联调对不上、接口该用 GET 还是 POST、返回结构怎么统一、分页怎么写、错误码怎么定、要写接口文档时使用。确保接口遵循脚手架统一协议 {code, message, data}：RESTful 路径命名、请求参数与 DTO 设计、分页与列表约定、状态码与错误码规范、鉴权与权限标注。输出接口清单表格，可直接用于论文的接口设计章节。
---

# api-designer

针对本脚手架的统一 API 协议设计 skill。**当 graduation-project 需要新增业务接口时调用**。

---

## 0. 统一协议（不可违反）

所有接口返回格式：

```json
{ "code": 200, "message": "操作成功", "data": {} }
```

**业务码与 HTTP 状态码是两层，不要混**。业务码写在 `code` 字段里，HTTP 状态统一是 200；只有认证失败才用 HTTP 状态码表达。

### 0.1 业务码（HTTP 200 下的 `code` 字段）

| code | 含义 | 前端表现 |
|------|------|---------|
| 200 | 成功 | 正常取 `data` |
| 400 | 参数错误 | 弹 `message` |
| 403 | 权限不足 | 弹 `message`，停在当前页 |
| 404 | 资源不存在 | 弹 `message` |
| 500 | 服务器错误 | 弹 `message` |
| 1001 | 登录失败（用户名或密码错误） | 弹 `message`，留在登录页 |
| 1002 | 用户名已存在 | 弹 `message`，留在注册页 |
| 1004 | 原密码错误 | 弹 `message`，留在修改密码弹窗 |
| 2001 | 数据已存在 | 弹 `message` |
| 2002 | 数据不存在 | 弹 `message` |

以上十个码脚手架已实装（三个后端的 `ResultCode` 完全对齐），**不要改动已有含义**。新增业务码从 **1005** 开始递增（1003 未使用也不要占用），并在本表补登记。

**403 和 404 是业务码，不是 HTTP 状态码。** 脚手架的权限校验（Spring Boot `@RequireAdmin`、Express `adminMiddleware`、Flask `admin_required`）在权限不足时返回的是 **HTTP 200 + `code: 403`**，绝不要写成 `res.status(403)` 或 `abort(403)`——前端拦截器只解析响应体的 `code`，HTTP 层非 200 非 401 的响应会直接掉进 catch，用户只看到一句网络错误。

### 0.2 HTTP 状态码（认证层，不走 `code` 字段）

| status | 含义 | 前端表现 |
|--------|------|---------|
| 401 | 未登录 / Token 无效或过期 | 清 token 与 userInfo，跳登录页 |
| 404 | 路由不存在 | 框架自动返回，业务不主动用 |

**Token 失效必须用 HTTP 401，不要自创业务码。** `code-standards.md` §2 的三套 `request.js` 拦截器只识别 401，自创码会让拦截器认不出来——结果是不清 token、不跳登录，用户卡在页面上反复失败。

---

## 1. 路径规范

脚手架采用**动作型路径**（`/api/{module}/{action}`），不是严格 RESTful。新增接口必须沿用此风格，不要混入 `/api/orders/{id}` 这种资源型路径，否则前后端约定会裂。

HTTP 方法按**语义**选，不按“带不带 body”选：

| 方法 | 用于 | 参数位置 |
|------|------|---------|
| `POST` | 新增、分页查询（筛选条件多） | request body |
| `GET` | 列表、单条查询 | path 参数或 query string |
| `PUT` | 全量更新 | request body（含 `id`） |
| `DELETE` | 删除 | path 参数或 body（批量时） |

分页查询用 `POST` 而非 `GET`，是因为筛选条件可能较多且含中文，放在 body 里比拼 query string 干净。这是脚手架既定约定，照做就行。

### 1.1 命名约定

| 动作 | 接口路径 |
|------|---------|
| 分页查询 | `POST /api/order/pageQuery` |
| 列表查询 | `GET /api/order/listAll` |
| 单条查询 | `GET /api/order/getById/{id}` |
| 新增 | `POST /api/order/add` |
| 更新 | `PUT /api/order/update` |
| 删除 | `DELETE /api/order/deleteById/{id}` |
| 批量删除 | `DELETE /api/order/deleteBatch` |

上表七种是标准 CRUD 动作。**非 CRUD 的业务动作用「动词+名词」驼峰命名**，直接挂在模块后：`PUT /api/user/updatePassword`、`PUT /api/order/resetStatus`、`GET /api/order/exportExcel`。不要拆成 `/api/user/password/update` 这种资源型层级路径，与脚手架现有 9 个接口的风格不一致。

路径参数在接口文档里统一写 `{id}`（OpenAPI 风格）。到具体框架注册路由时再换成各自语法：Express / Vue Router 用 `:id`，Flask 用 `<int:id>`，Spring Boot 用 `{id}`，Gin 用 `:id`，ASP.NET 用 `{id}`。

---

## 2. 各后端实现模板

### 2.1 Spring Boot

```java
@PostMapping("/add")
@Log("创建订单")
public Result<Void> add(@RequestBody @Valid OrderAddDTO dto) {
    orderService.add(dto);
    return Result.success("创建成功");
}
```

`@Valid` 不能省，否则 DTO 上的 `@NotBlank` / `@Size` 全部失效。

登录校验由全局 `JwtInterceptor` 统一处理，**不要在方法里手写取 token 、解析 token 的代码**。但**管理员权限需要显式标注** `@RequireAdmin`（拦截器只判登录，不判角色）：

```java
@DeleteMapping("/deleteById/{id}")
@Log("删除订单")
@RequireAdmin
public Result<Void> deleteById(@PathVariable Long id) { ... }
```

需要当前登录用户信息时用 `UserContext.getUserId()` / `UserContext.isAdmin()`，不要在控制器参数里接 `HttpServletRequest` 自己掘。涉密接口（登录、改密码）的日志要关参数录入：`@Log(value = "修改密码", saveParams = false)`。

### 2.2 Express

```js
// routes/orderRoutes.js
router.post('/add', authMiddleware, logMiddleware('创建订单'), orderController.add);
// 仅管理员：adminMiddleware 必须排在 authMiddleware 之后
router.delete('/deleteById/:id', authMiddleware, adminMiddleware, logMiddleware('删除订单'), orderController.deleteById);

// controllers/orderController.js
export const add = async (req, res, next) => {
  try {
    const { title, amount } = req.body;
    if (!title) return res.json(Result.error('订单标题不能为空', ResultCode.BAD_REQUEST));
    await orderService.add({ title, amount });
    res.json(Result.success(null, '创建成功'));
  } catch (e) { next(e); }
};
```

注意 `Result` 两个方法的参数顺序是反的：`success(data, message)`、`error(message, code)`。写成 `Result.error(400, 'xxx')` 会得到 `{code: 'xxx', message: 400}`，前端拦截器彻底失效。业务码用 `ResultCode` 常量，不要硬编码数字。

Express 没有内置校验，但**不要把 `req.body` 整个透传给 service**。显式解构出需要的字段，这就是轻量版 DTO：既挡住了客户端伪造 `id` / `deleted` 等字段，也让该接口需要哪些参数一目了然。

### 2.3 Go

```go
// controllers/order.go
func OrderAdd(c *gin.Context) {
    var dto models.OrderAddDTO
    if err := c.ShouldBindJSON(&dto); err != nil {
        utils.Error(c, utils.CodeBadRequest, "参数错误")
        return
    }
    if err := services.OrderAdd(&dto); err != nil {
        handleError(c, err)
        return
    }
    utils.SuccessMsg(c, "创建成功", nil)
}
```

绑定用具体 struct + `binding:"required"` tag，**不要**用 `map[string]interface{}`——那等于放弃参数校验，且与 `database-designer` 的实体定义脉络对不上。

### 2.4 Flask

```python
@order_bp.route('/add', methods=['POST'])
@request_logger
@token_required
@log_operation('创建订单')
def add():
    data = request.json or {}
    title = data.get('title')
    if not title:
        return Result.error('订单标题不能为空', ResultCode.BAD_REQUEST)
    OrderService.add({'title': title, 'amount': data.get('amount')})
    return Result.success(None, '创建成功')
```

**装饰器顺序固定，不能调**：`@request_logger` → `@token_required` →（`@admin_required`）→ `@log_operation`。三个装饰器职责不同，不重复：

| 装饰器 | 作用 | 落到哪 |
|--------|------|--------|
| `@request_logger` | 开发期彩色请求日志（方法/路径/code/耗时） | 控制台，不写库 |
| `@token_required` | 验签，把 payload 挂到 `request.user` | — |
| `@admin_required` | 判角色，非 admin 抛 `BizError(403)` | — |
| `@log_operation` | 业务操作日志 | `operation_log` 表 |

`Result.error` 签名是 `error(message, code)`，与 Express 一致，不要写反。需要当前用户时用 `getattr(request, 'user', None)` 取，并传给 service 做归属校验。

同样不要把 `request.json` 直接丢给 service。Flask 没有强类型 DTO，就用 `data.get()` 显式取字段；字段多的接口可引入 marshmallow 或 pydantic 做 schema 校验。

### 2.5 FastAPI

```python
@router.post('/add')
async def add(dto: OrderAddDTO, user: dict = Depends(verify_token)):
    await OrderService.add(dto)
    return Result.success(None, '创建成功')
```

两个坑：
- 用 Pydantic 模型接参，不要 `await request.json()` 拿 `dict`，否则丢掉校验与 OpenAPI 文档。
- FastAPI 靠 `Depends` 做横切，**不要**把 Flask 的 `@log_operation` 装饰器直接搬过来套在路径函数上（会破坏签名使依赖注入失效）。日志用 `Depends` 或中间件。

### 2.6 .NET

```csharp
[HttpPost("add")]
[Auth]
[Log("创建订单")]
public async Task<IActionResult> Add([FromBody] OrderAddDto dto)
{
    await orderService.Add(dto);
    return Ok(Result.Success("创建成功"));
}
```

入参用 DTO，**不要**直接接数据库实体（`Order`）。否则客户端可以伪造 `Id`、`CreateTime`、`Deleted` 等字段，这是过度提交（over-posting）漏洞。

### 2.7 入参校验通则（六个后端都适用）

**写接口的入参绝不直接用数据库实体，也不把请求体整个透传给 service。** 强弱类型语言的落地方式不同，目的一致：

| 后端 | 做法 |
|------|------|
| Spring Boot | `@RequestBody @Valid XxxDTO`，DTO 上标 `@NotBlank` / `@Size` |
| .NET | `[FromBody] XxxDto`，配合 `[Required]` 与 `ModelState` |
| Go | 具体 struct + `binding:"required"` tag |
| FastAPI | Pydantic 模型作为参数类型 |
| Express | 显式解构 `req.body` 需要的字段 + 手写必填校验 |
| Flask | `data.get()` 显式取字段，或 marshmallow / pydantic schema |

判定标准很简单：**客户端能不能通过多传一个字段改到不该改的列（`id` / `create_time` / `deleted` / `role`）。** 能就是漏洞。

### 2.8 归属校验（比入参校验更容易漏）

入参校验挡的是「别改不该改的**列**」，归属校验挡的是「别改别人的**行**」。两者都要做。

凡是「登录即可访问但只能操作自己数据」的接口（改资料、改密码、看自己的订单），**必须在 service 层比对资源归属**，不能相信客户端传的 `id`：

```java
// Spring Boot：非管理员只能改自己
if (!UserContext.isAdmin() && !dto.getId().equals(UserContext.getUserId())) {
    throw new BusinessException(ResultCode.FORBIDDEN);
}
```

```js
// Express / Flask：从 token 取身份，与目标资源对比
if (user.role !== 'admin' && Number(dto.id) !== user.id) {
  throw new BizError(ResultCode.FORBIDDEN, '无权操作他人数据');
}
```

判定标准：**拿用户 A 的 token 去调这个接口，把 `id` 改成用户 B 的，会不会成功。** 会就是越权漏洞。只靠 `@RequireAdmin` 类接口级鉴权盖不住这种情况。

---

## 3. 分页查询参数规范

请求体：
```json
{
  "pageNum": 1,
  "pageSize": 10,
  "keyword": "可选筛选条件",
  "orderBy": "createTime",
  "order": "desc"
}
```

响应体：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "records": [...],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

---

## 4. 接口清单输出模板

设计完一组接口后，输出下表。这张表可以直接搬进论文的接口设计章节（用三线表排版）：

| 序号 | 接口名称 | 请求路径 | 方法 | 请求参数 | 响应数据 | 权限 |
|-----|---------|---------|------|---------|---------|------|
| 1 | 订单分页查询 | `/api/order/pageQuery` | POST | pageNum, pageSize, keyword | records, total | 登录 |
| 2 | 订单详情 | `/api/order/getById/{id}` | GET | id（path） | 订单对象 | 登录 |
| 3 | 新增订单 | `/api/order/add` | POST | title, amount | 无 | 登录 |
| 4 | 删除订单 | `/api/order/deleteById/{id}` | DELETE | id（path） | 无 | 管理员 |

权限列只写三种：`无`（匿名可访）、`登录`、`管理员`。标为 `登录` 但只能操作自己数据的接口，在备注里补一句「仅本人或管理员」，实现时按 §2.8 做归属校验。

---

## 5. 与 graduation-project 的配合

在 `graduation-project` 的**阶段 1（需求确认）** 时，如果需要新增业务模块（如订单、课程），调用本 skill 设计 API 路径和请求/响应格式。

**设计完接口后，四处必须同步改到**（少一处前后端就联不上，或者代码写了没人调）：

1. **后端路由 + 控制器** — 按 §2 对应后端的模板写，入参遵守 §2.7，归属遵守 §2.8，管理员接口别忘标权限
2. **前端 API 函数** — Web 前端在 `<FE>/src/api/<module>.js` 新增，写法见 `code-standards.md §1.2`；uniapp / wxapp 无 `src/`，直接是 `<FE>/api/<module>.js`，且两者调用方式不同（见 `crossplatform-standards.md §5`）。路径必须与后端逐字一致
3. **前端页面调用** — 光加 `api/xxx.js` 不算做完，必须有页面或组件实际 import 并调用它；涉及管理员权限的，同步路由守卫与菜单的角色判断
4. **新增业务码登记** — 如果引入了新的 `code`，同时补到 §0.1 表里和后端的 `ResultCode` 定义里（三个后端各一份），否则前端拦截器不知道怎么处理

改完后用一句话自检：**这个接口现在能从页面上点得到吗？报错时用户能看到人话吗？**
