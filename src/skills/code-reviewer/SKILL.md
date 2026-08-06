---
name: code-reviewer
description: 毕设代码审查 skill。用户说审查代码、review 一下、代码写得对不对、有没有更好的写法、检查规范、代码质量、找 bug、导师会不会挑刺、答辩前过一遍代码时使用。也在 graduation-project 每生成完一个模块后自动调用。站在导师视角检查：脚手架分层规范、命名一致性、异常与边界处理、SQL 注入与越权等安全问题、事务与并发、重复代码与圈复杂度、日志与注释、前端组件拆分与状态管理。输出按严重程度分级的问题清单与修改建议。
---

# code-reviewer

针对本脚手架项目（6 后端 + 6 前端）的代码审查 skill。**每次 `graduation-project` 生成完一个模块后调用**。

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
| React | 相对路径导入 / Zustand Store / Ant Design 组件 / 无 JSDoc 块注释 / request.js 在 utils/ / 弹窗不为 Modal |
| Vue-Antd | @/ 别名 / Pinia Composition API / ant-design-vue 组件 / NProgress / request.js 用 useUserStore() |
| Vue-ElementPlus | @/ 别名 / ElMessage / computed rules / 分页在表格下方 |
| Vue-Naive | @/ 别名 / useMessage 在 setup 内 / window.$message 在 request.js / h() render |
| uni-app | rpx 单位 / <view> 标签 / uni.request / onLoad 生命周期 |
| wxapp | rpx 单位 / wx.request / module.exports / .wxml+.js+.json+.wxss 四件套 |

### 1.2 后端检查项

| 语言 | 必查项 |
|------|--------|
| Express | 模块级 `/** 模块名 */` + 函数级 `// 描述` / try-catch 在 controller / 错误走 errorHandler |
| Flask | `"""docstring"""` 模块级保留，函数级保留 / `@token_required` 装饰器 |
| FastAPI | 同上 + `Depends(verify_token)` |
| Go | `// FuncName 描述` 格式 / `defer rows.Close()` / `config.DB` 统一访问 |
| .NET | `/// <summary>` C# 标准 / `[Auth]` `[Log]` Attribute |
| Spring Boot | `@RestController` / `@Service` / MyBatis-Plus lambda 查询 |

---

## 2. 功能完整性检查

对照需求确认单逐项核实：

```
□ 每个确认单中的功能点是否都有对应的代码
□ 路由是否注册（前端 router + 后端 routes）
□ 权限检查是否正确（admin 操作需要 requiresAdmin）
□ 错误处理是否完整（try-catch / errorHandler / next(e)）
```

---

## 3. 集成检查

### 3.1 API 路径对齐

- 前端 `api/xxx.js` 中的路径是否与后端路由一致
- 请求方法是否匹配（GET/POST/PUT/DELETE）

### 3.2 响应格式

所有后端接口必须返回 `{ code: 200, message: "...", data: ... }`。检查：
- 成功: `code === 200`
- 业务异常: `code !== 200`（如 1001 登录错误）
- HTTP 401: Token 无效或过期

---

## 4. 安全检查

| 检查项 | 严重度 | 说明 |
|--------|--------|------|
| SQL 注入 | 🔴 | 必须参数化查询（`?` / `%s` / `@param`）。字符串拼 SQL 一律打回 |
| 越权访问 | 🔴 | 改/删别人数据时是否校验归属（`WHERE id=? AND user_id=?`） |
| 路径遍历 | 🔴 | 文件删除/读取是否校验解析后的绝对路径仍在 uploads 目录内 |
| JWT 密钥硬编码 | 🟡 | 密钥应读配置文件/环境变量，不写在源码里 |
| XSS | 🟡 | 前端 `v-html` / `dangerouslySetInnerHTML` 内容是否可控 |
| 密码明文存储 | 🟢 | **本项目有意为之**，不要改。详见下方 §4.1 |
| CORS | 🟢 | 开发期 `origin: '*'` 可接受，论文里说明生产环境应收紧 |

### 4.1 密码明文是既定选择，不要“修”

本脚手架密码**明文存储**，这是为了 demo 演示与调试方便有意为之的取舍。审查时：

- **不要**自作主张引入 BCrypt / Argon2 改成哈希，也不要把它列为待修缺陷
- **不要**因此阻塞模块验收，这不是阻塞项

但有一件事必须做：**提醒用户在论文里主动写清楚**。导师看到明文密码大概率会问，与其被动挨问，不如写进“系统不足与改进方向”一节：

> 本系统为教学演示原型，用户密码采用明文存储以简化调试。实际部署应采用 BCrypt 等带盐哈希算法，仅存储哈希值，登录时比对哈希而非明文。

这句话把“漏洞”变成了“知道怎么做但有意简化”，是加分项。同理适用于 CORS 放开。

---

## 5. 输出格式

```
📋 代码审查报告 — 《模块名》

## 规范检查
- [x] 导入路径风格正确
- [x] Store 用法正确
- [ ] UserManage.jsx:3 有 JSDoc 块注释 → 需删除

## 功能完整性
- [x] 用户注册功能已实现
- [x] 分页查询已实现
- [ ] 缺批量删除功能（确认单 §2.3 要求）

## 集成检查
- [x] API 路径与后端一致
- [x] 响应格式 {code,message,data}

## 安全检查
- [x] 无 SQL 注入风险
- [x] 文件删除有路径校验
- [—] 密码明文：既定选择，不计作问题

## 问题汇总（按严重度）
🔴 阻塞：0 项
🟡 应修：1 项 — 缺批量删除功能
🟢 建议：1 项 — 删掉 JSDoc 块注释

## 结论
通过 9/11。🔴 为 0，可进入下一模块；🟡 项需在本模块内补齐。
```

**分级口径**：🔴 阻塞（安全洞、功能跑不通、前后端对不上）必须当场修，不修不进下一模块；🟡 应修（功能缺失、规范违反）本模块内补齐；🟢 建议（风格、可读性）可攒到收尾一次性处理。

---

## 6. 与 graduation-project 的配合

本 skill 被 `graduation-project` 在**阶段 3（自检）** 时调用。调用时机：
- 每完成一个模块的代码生成后
- 用户提到"检查一下代码"时
- 代码出现明显问题时自动触发
