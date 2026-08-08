---
name: code-reviewer
description: 毕设代码审查 skill。用户说审查代码、review 一下、代码写得对不对、有没有更好的写法、检查规范、代码质量、找 bug、导师会不会挑刺、答辩前过一遍代码时使用。也在 graduation-project 每生成完一个模块后自动调用。站在导师视角检查：脚手架分层规范、命名一致性、异常与边界处理、SQL 注入与越权等安全问题、事务与并发、重复代码与圈复杂度、日志与注释、前端组件拆分与状态管理。输出按严重程度分级的问题清单与修改建议。
---

# code-reviewer

针对本脚手架项目（6 后端 + 6 前端 + 2 客户端）的代码审查 skill。**每次 `graduation-project` 生成完一个模块后调用**。

审查时的**事实基准优先级**：脚手架真实代码 > `code-standards.md` > 本文档。若发现本文档与脚手架实际实现冲突，**以脚手架为准并告知用户**，不要拿文档去“修”能跑的代码。

**跨端项目（uniapp / wxapp）换基准**：用 `crossplatform-standards.md` 代替 `code-standards.md` 的 §1–§7。不要拿 Web 前端的 `src/` 目录、Pinia/Zustand、axios 拦截器去卡小程序代码，那些本来就不存在。

---

## 0. 审查流程

```
拿到一个模块的代码
      ↓
1. 规范检查 — 对照 code-standards.md 逐项核对
2. 功能检查 — 确认需求单里的功能点全部实现
3. 集成检查 — 前后端 API 路径是否匹配、响应格式是否正确
4. 安全扫描 — SQL 注入、路径遍历、XSS、密码明文
5. 输出审查报告
```

---

## 1. 规范检查（对照 code-standards.md）

### 1.1 前端检查项

| 框架 | 必查项 |
|------|--------|
| React | 相对路径导入（`../../api/user`，无 `@/` 别名）/ Zustand `stores/userStore.js` / Ant Design 组件 / `request.js` 在 `utils/` |
| Vue-Antd | `@/` 别名 / Pinia Composition API / ant-design-vue 组件 / NProgress / `request.js` 在 `api/` 且用 `useUserStore()` |
| Vue-ElementPlus | `@/` 别名 / `ElMessage` 而非 `message` / `computed` rules / `el-pagination` 在表格下方 |
| Vue-Naive | `@/` 别名 / `useMessage` 只能在 setup 内 / `request.js` 里用 `window.$message` / `h()` render |
| uni-app | rpx 单位 / `<view>` 标签 / `uni.request` / `onLoad` 生命周期 / **无 `src/` 目录**，源码在根下 |
| wxapp | rpx 单位 / `wx.request` / `module.exports` / `.wxml`+`.js`+`.json`+`.wxss` 四件套 / **无 `src/` 目录** |

**两个容易误判的点**：

- **弹窗用 Modal 是正确的**。页面专属的 add/edit 弹窗就该内联在页面文件里用 `Modal` / `a-modal` / `el-dialog` / `n-modal`（见 `code-standards.md` §6.1）。只有**详情页用 Modal 代替独立路由**才是问题（§5 的导师红线）。
- **单行块注释不违规**。脚手架的 `api/*.js` 普遍用 `/*` + `* 描述` + `*/` 三行式或单行式标函数用途。禁的是**带 `@param` / `@returns` 标签的完整 JSDoc**，以及步骤编号注释和废话注释（`code-standards.md` §8.1）。看到 `api/user.js` 里标着「用户注册」的块注释不要报错。

### 1.2 后端检查项

| 语言 | 必查项 |
|------|--------|
| Express | 模块顶部有块注释标模块名 + 函数级 `// 描述` / controller 里 `try-catch` + `next(e)` / 业务异常走 `errorHandler` / `Result.error(message, code)` 参数顺序 |
| Flask | 模块级与函数级 `"""docstring"""` 保留 / 装饰器顺序 `@request_logger` → `@token_required` → `@admin_required` → `@log_operation` |
| FastAPI | 同上 + `Depends(verify_token)`，不要把 Flask 装饰器搬过来 |
| Go | `// FuncName 描述` 格式 / `defer rows.Close()` / `config.DB` 统一访问 |
| .NET | `/// <summary>` C# 标准 / `[Auth]` `[Log]` Attribute |
| Spring Boot | `@RestController` / `@Service` / MyBatis-Plus lambda 查询 / 管理员接口标 `@RequireAdmin` / 取当前用户用 `UserContext` |

**Spring Boot 包结构核对**（模块新增的文件必须落对位置）：

```
com.example/
├── common/     横切关注：annotation aspect config exception interceptor result util
├── controller/ dto/ entity/ mapper/ service/
```

新增业务模块只往 `controller` / `dto` / `entity` / `mapper` / `service` 里加，**不要往 `common/` 里塞业务代码**。

---

## 2. 功能完整性检查

对照需求确认单逐项核实：

```
□ 每个确认单中的功能点是否都有对应的代码
□ 路由是否注册（前端 router + 后端 routes，两边都要查）
□ 页面是否真的被调用（光写了 api 函数没人 import 等于没做）
□ 权限检查是否三层对齐（见下方）
□ 错误处理是否完整（try-catch / errorHandler / next(e)）
```

**权限三层对齐**——只查一层会漏：

| 层 | 检查位置 |
|-----|---------|
| 后端接口级 | Spring Boot `@RequireAdmin` / Express `adminMiddleware` / Flask `@admin_required` |
| 后端归属级 | 登录即可访但只能改自己的接口，service 层有没有比对 `id`（见 `api-designer` §2.8） |
| 前端路由级 | 路由 `meta: { requiresAuth, requiresAdmin }` + 守卫里的角色判断 + 菜单是否隐藏 |

前端隐藏菜单**不算权限**，后端没标 admin 就是 🔴。反之后端有但前端没拦，用户会看到一个点进去就报错的菜单，算 🟡。

---

## 3. 集成检查

### 3.1 API 路径对齐

- 前端 `api/xxx.js` 中的路径是否与后端路由逐字一致（`baseURL` 已含 `/api`，前端写 `/user/login` 而非 `/api/user/login`）
- 请求方法是否匹配（GET/POST/PUT/DELETE）
- 字段命名：后端出口已统一转驼峰（Express `keysToCamel`、Flask `_keys_to_camel`），**前端一律读 `createTime` / `updateTime` / `createBy`**。发现前端读 `create_time` 按 🔴处理（取到 undefined，页面显空）

### 3.2 响应格式

所有后端接口必须返回 `{ code: 200, message: "...", data: ... }`。按 `api-designer` §0 的两层协议核查：

- 成功：`code === 200`
- 业务异常：`code !== 200`（400 / 403 / 404 / 500 / 1001 / 1002 / 1004 / 2001 / 2002），HTTP 状态仍为 200
- Token 失效：走 **HTTP 401**，不得自创业务码表达

**两个必查的断链**：

1. **Token 失效没走 401** —— 如果后端用自定义业务码表达 Token 过期，而 `request.js` 拦截器只识别 401，拦截器会走到兵底分支：只弹一句提示，**不清 token、不跳登录页**，用户卡在页面上反复失败。🔴
2. **权限不足写成 HTTP 403** —— 脚手架的约定是 HTTP 200 + `code: 403`。写成 `res.status(403)` / `abort(403)` 会直接掉进 axios 的 catch，用户只看到一句网络错误而不是“权限不足”。🔴

新增业务码要确认三处都登记了：后端 `ResultCode` 定义、`api-designer` §0.1 表、前端需要特殊处理时的分支。

---

## 4. 安全检查

| 检查项 | 严重度 | 说明 |
|--------|--------|------|
| SQL 注入 | 🔴 | 必须参数化查询（`?` / `%s` / `@param`）。字符串拼 SQL 一律打回。特别查动态拼 `ORDER BY` 字段名——字段名不能参数化，必须用白名单 |
| 越权访问 | 🔴 | 改/删别人数据时是否校验归属（`WHERE id=? AND user_id=?` 或 service 层比对 token 里的身份） |
| 路径遍历 | 🔴 | 文件删除/读取是否校验解析后的结果仍在 uploads 目录内。对照实现：Spring Boot `normalize().toAbsolutePath()` + `startsWith`、Express `path.resolve` + `startsWith`、Flask `os.path.realpath` + `startswith` |
| 密码回传前端 | 🔴 | 查询类接口返回的用户对象必须抹掉 `password`（Spring Boot `setPassword(null)`、Express/Flask 在 SQL 里不选该列）。明文存可以，明文发给前端不行 |
| JWT 密钥硬编码 | 🟡 | 密钥应读配置文件/环境变量。脚手架现状：Express 走 `process.env.JWT_SECRET`，Flask/Spring Boot 有占位默认值——属于 demo 可接受，新写的代码不要再硬编码新密钥 |
| XSS | 🟡 | 前端 `v-html` / `dangerouslySetInnerHTML` 内容是否可控（公告富文本正是这个场景） |
| 密码明文存储 | 🟢 | **本项目有意为之**，不要改。详见下方 §4.1 |
| CORS | 🟢 | 开发期全开可接受，论文里说明生产环境应收紧 |

### 4.1 密码明文是既定选择，不要“修”

本脚手架密码**明文存储**，这是为了 demo 演示与调试方便有意为之的取舍。审查时：

- **不要**自作主张引入 BCrypt / Argon2 改成哈希，也不要把它列为待修缺陷
- **不要**因此阻塞模块验收，这不是阻塞项

但有一件事必须做：**提醒用户在论文里主动写清楚**。导师看到明文密码大概率会问，与其被动挨问，不如写进“系统不足与改进方向”一节：

> 本系统为教学演示原型，用户密码采用明文存储以简化调试。实际部署应采用 BCrypt 等带盐哈希算法，仅存储哈希值，登录时比对哈希而非明文。

这句话把“漏洞”变成了“知道怎么做但有意简化”，是加分项。同理适用于 CORS 放开。

### 4.2 不要误报的既定设计

以下均为脚手架有意选择，**审查时不计作问题，也不要主动“修”**：

| 写法 | 为何不是问题 |
|------|------------|
| 分页查询用 `POST` 而非 `GET` | 脚手架既定约定，筛选条件多且含中文 |
| 路径是 `/api/user/deleteById/{id}` 而非 RESTful | 脚手架用动作型路径，全项目统一 |
| `api/*.js` 里标函数用途的块注释 | 属于允许的注释，不是 JSDoc |
| 每个 Flask 路由都叠 `@request_logger` | 它只往控制台打彩色日志，不写库，与 `@log_operation` 不重复 |
| 页面专属弹窗内联在页面文件里 | §6.1 的拆分原则，只有多页复用才抽组件 |
| React 用相对路径 `../../api/user` | React 版本有意不配 `@/` 别名，与 Vue 三版不同 |
| 前端 `baseURL` 已含 `/api`，调用处写 `/user/login` | 正确写法，不要“补”成 `/api/user/login` |

---

## 5. 输出格式

```
📋 代码审查报告 — 《模块名》

## 规范检查
- [x] 导入路径风格正确
- [x] Store 用法正确
- [ ] UserManage.jsx:42 有步骤编号注释（1.获取 2.校验）→ 需删除

## 功能完整性
- [x] 用户注册功能已实现
- [x] 分页查询已实现
- [ ] 缺批量删除功能（确认单 §2.3 要求）

## 集成检查
- [x] API 路径与后端逐字一致
- [x] 响应格式 {code,message,data}
- [x] 页面已实际调用新增的 api 函数
- [x] 权限三层对齐（接口级 / 归属级 / 路由级）

## 安全检查
- [x] 无 SQL 注入风险
- [x] 文件删除有路径校验
- [x] 响应里已抹除 password
- [—] 密码明文：既定选择，不计作问题

## 问题汇总（按严重度）
🔴 阻塞：0 项
🟡 应修：1 项 — 缺批量删除功能
🟢 建议：1 项 — 删掉步骤编号注释

## 结论
通过 11/13。🔴 为 0，可进入下一模块；🟡 项需在本模块内补齐。
```

**分级口径**：🔴 阻塞（安全洞、功能跑不通、前后端对不上）必须当场修，不修不进下一模块；🟡 应修（功能缺失、规范违反）本模块内补齐；🟢 建议（风格、可读性）可攒到收尾一次性处理。

---

## 6. 与 graduation-project 的配合

本 skill 在 `graduation-project` 的**阶段 2（代码生成）每模块收尾时**被调用，审查通过后才进入**阶段 3（自检）**的命令行校验。调用时机：

- 每完成一个模块的代码生成后
- 用户提到“检查一下代码”“review 一下”“答辩前过一遍”时
- 代码出现明显问题时自动触发

两者分工：本 skill 看**代码内容**（人工阅读式审查），`self-check.md` 跑**命令**（build / lint / 接口连通性）。两者都过才算模块完成。
