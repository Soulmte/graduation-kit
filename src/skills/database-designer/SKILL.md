---
name: database-designer
description: 毕设数据库设计 skill。用户说要建表、设计数据库、写建表 SQL、加字段、改表结构、设计 ER 关系、数据库设计不合理、表太多要不要拆、加索引时使用。匹配脚手架 scaffold_db 的命名与字段规范：主键与时间戳约定、逻辑删除、外键与关联表策略、字段类型选择、索引设计、三大范式与合理反范式。输出可直接执行的 DDL 与实体类映射说明。也用于论文里的数据库设计章节与数据字典整理。
---

# database-designer

针对本脚手架 `scaffold_db` 的数据库设计 skill。**当 graduation-project 需要新增数据表时调用**。

---

## 0. 脚手架已有表

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `user` | 用户表 | id, username, password, role, deleted |
| `notice` | 公告表 | id, title, content, deleted |
| `operation_log` | 操作日志表 | id, username, operation, execute_time |

---

## 1. 新增表模板

```sql
CREATE TABLE IF NOT EXISTS `{table_name}` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(100) NOT NULL COMMENT '名称',
  `description` TEXT COMMENT '描述',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除:0-未删除,1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='{表说明}';
```

### 1.1 字段命名规范

| 要求 | 示例 |
|------|------|
| 表名/字段名用**小写 + 下划线** | `order_item` / `create_time` |
| 主键统一为 `id`（BIGINT AUTO_INCREMENT） | `id BIGINT NOT NULL AUTO_INCREMENT` |
| 时间字段用 `DATETIME`，默认 `CURRENT_TIMESTAMP` | `create_time` / `update_time` |
| 逻辑删除用 `deleted`（TINYINT DEFAULT 0） | 不要用 `is_deleted` |
| 所有表加 `ENGINE=InnoDB` + `utf8mb4` | |
| COMMENT 用中文，简洁说明字段用途 | |

### 1.2 索引规范

```sql
-- 唯一索引
UNIQUE KEY `uk_fieldname` (`fieldname`)

-- 普通索引
KEY `idx_fieldname` (`fieldname`)

-- 复合索引
KEY `idx_a_b` (`field_a`, `field_b`)
```

**复合索引的字段顺序有讲究**：遵循最左前缀原则，把筛选性高（取值越分散）的字段放前面。`idx_user_id_status` 能加速 `WHERE user_id=?` 和 `WHERE user_id=? AND status=?`，但帮不了单独的 `WHERE status=?`。

### 1.3 逐辑删除与唯一索引的冲突（常见坑）

用了 `deleted` 逐辑删除后，普通唯一索引会出问题：

```sql
UNIQUE KEY `uk_username` (`username`)
```

用户 `zhang` 被逐辑删除（`deleted=1`）后，行还在表里，新用户**无法**再注册 `zhang`。两种解法：

| 方案 | 写法 | 适用 |
|------|------|------|
| 不加唯一索引，应用层校验 | `KEY idx_username (username)` + 插入前 `SELECT ... WHERE username=? AND deleted=0` | **毕设推荐**，简单易说清 |
| 唯一索引包含 deleted | `UNIQUE KEY uk_username_deleted (username, deleted)` | 只能容忍删除一次，不推荐 |

答辩时导师可能会问这个，提前想好怎么答。

---

## 2. 外键关联（逻辑外键）

**不设物理外键**（`FOREIGN KEY`），用逻辑外键 + 应用层维护：

```sql
-- ✅ 正确：逻辑外键
`user_id` BIGINT COMMENT '关联用户ID',
KEY `idx_user_id` (`user_id`)

-- ❌ 错误：物理外键（不推荐）
FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
```

---

## 3. 初始化数据

```sql
INSERT INTO `{table_name}` (`name`, `description`, `status`) VALUES
  ('示例数据1', '这是示例', 'active'),
  ('示例数据2', '这也是示例', 'inactive');
```

---

## 4. 各后端 DAO/Model 实现

### 4.1 Express

```js
const [rows] = await db.execute(
  'SELECT * FROM `order` WHERE deleted = 0 AND id = ?',
  [id]
);
```

注意：`order` 是 MySQL 保留字（`ORDER BY`），必须加反引号，否则直接报语法错。同类陷井：`group`、`desc`、`key`、`status` 虽不是保留字但建议避开。**取表名时就绕开保留字**更稳，比如用 `orders` 或 `order_info`。

### 4.2 Go

```go
type Order struct {
    ID         int64  `json:"id"`
    Name       string `json:"name"`
    Status     string `json:"status"`
    CreateTime string `json:"createTime"`
}
```

### 4.3 .NET

```csharp
public class Order
{
    public long Id { get; set; }
    public string Name { get; set; }
    public string Status { get; set; }
    public DateTime? CreateTime { get; set; }
}
```

---

## 5. 与 graduation-project 的配合

在 `graduation-project` 的**阶段 1（需求确认）** 时，如果毕设业务需要新增数据表，调用本 skill 生成建表 SQL。
