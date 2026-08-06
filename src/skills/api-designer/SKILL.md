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

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
| 1001 | 登录失败（用户名或密码错误） |
| 1002 | 用户名已存在 |
| 1003 | Token 无效或过期 |

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

| 动作 | 路径示例 |
|------|---------|
| 分页查询 | `POST /api/order/pageQuery` |
| 列表查询 | `GET /api/order/listAll` |
| 单条查询 | `GET /api/order/getById/:id` |
| 新增 | `POST /api/order/add` |
| 更新 | `PUT /api/order/update` |
| 删除 | `DELETE /api/order/deleteById/:id` |
| 批量删除 | `DELETE /api/order/deleteBatch` |

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

`@Valid` 不能省，否则 DTO 上的 `@NotBlank` / `@Size` 全部失效。鉴权由全局 `JwtInterceptor` 或 Spring Security 统一处理，不在方法上手写。

### 2.2 Express

```js
// routes/orderRoutes.js
router.post('/add', authMiddleware, logMiddleware('创建订单'), orderController.add);

// controllers/orderController.js
export const add = async (req, res, next) => {
  try {
    await orderService.add(req.body);
    res.json(Result.success(null, '创建成功'));
  } catch (e) { next(e); }
};
```

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
    OrderService.add(request.json)
    return Result.success(None, '创建成功')
```

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

入参用 DTO，**不要**直接接数据库实体（`Order`）。否则客户端可以伪造 `Id`、`CreateTime`、`Deleted` 等字段，这是过度提交（over-posting）漏洞。同理适用于所有后端：**写接口的入参一律用 DTO，不用实体。**

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

## 4. 与 graduation-project 的配合

在 `graduation-project` 的**阶段 1（需求确认）** 时，如果需要新增业务模块（如订单、课程），调用本 skill 设计 API 路径和请求/响应格式。
