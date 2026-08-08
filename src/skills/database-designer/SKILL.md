---
name: database-designer
description: 毕设数据库设计 skill。用户说要建表、设计数据库、写建表 SQL、加字段、改表结构、设计 ER 关系、数据库设计不合理、表太多要不要拆、加索引时使用。匹配脚手架 scaffold_db 的命名与字段规范：主键与时间戳约定、逻辑删除、外键与关联表策略、字段类型选择、索引设计、三大范式与合理反范式。输出可直接执行的 DDL 与实体类映射说明。也用于论文里的数据库设计章节与数据字典整理。
---

# database-designer

针对本脚手架 `scaffold_db` 的数据库设计 skill。**当 graduation-project 需要新增数据表时调用**。

---

## 0. 脚手架已有表（不要改动结构）

完整 DDL 在项目根的 `docs/scaffold_db.sql`（直接在脚手架仓库里开发时是 `脚手架/docs/scaffold_db.sql`），新增表前先读一遍，保证风格一致。

| 表名 | 用途 | 字段 |
|------|------|------|
| `user` | 用户表 | id, username, password, nickname, age, gender, phone, email, role, avatar, create_time, update_time, deleted |
| `notice` | 公告表 | id, title, content, create_by, create_time, update_time, deleted |
| `operation_log` | 操作日志表 | id, username, operation, method, params, execute_time, ip, create_time |

三张表的约定细节（新表照搬）：

- `user.role` 只有两个值：`admin` / `user`，默认 `user`
- `user` 的唯一约束是 `UNIQUE KEY uk_username (username, deleted)`（含 `deleted`，原因见 §1.3）
- `notice.create_by` 存的是**用户名字符串**，不是 `user_id`——故意反范式，避开列表页联表查发布人
- `operation_log` **没有 `deleted` 列**，日志只写入与查询，不做逻辑删除
- 所有 `create_time` / `update_time` 都是 `DATETIME DEFAULT NULL`，**由应用层填值**，不用数据库默认值（原因见 §1.1）

---

## 1. 新增表模板

```sql
CREATE TABLE IF NOT EXISTS `{table_name}` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name`        VARCHAR(100) NOT NULL                COMMENT '名称',
  `description` TEXT                                 COMMENT '描述',
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'active' COMMENT '状态：active-启用，inactive-停用',
  `user_id`     BIGINT       DEFAULT NULL            COMMENT '关联用户ID',
  `create_time` DATETIME     DEFAULT NULL            COMMENT '创建时间',
  `update_time` DATETIME     DEFAULT NULL            COMMENT '更新时间',
  `deleted`     TINYINT      NOT NULL DEFAULT 0      COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '{表说明}';
```

这个模板与 `scaffold_db.sql` 现有三表完全同构，**直接追加到该文件末尾即可**（写在初始化数据的 INSERT 之前）。注意该文件开头有 `DROP DATABASE`，重新执行会清掉已有数据。

### 1.1 时间字段由应用层填，不用数据库默认值

脚手架三张表的时间字段均为 `DATETIME DEFAULT NULL`，**没有**用 `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`。新表要保持一致，因为三个后端都已在应用层填值：

| 后端 | 填值方式 |
|------|---------|
| Spring Boot | `@TableField(fill = FieldFill.INSERT)` / `INSERT_UPDATE` + `MybatisPlusConfig` 里的 `MetaObjectHandler` |
| Express | SQL 里显式写 `create_time` 用 `NOW()`、`update_time = NOW()` |
| Flask | 同 Express，SQL 里写 `NOW()` |

如果新表用了 `DEFAULT CURRENT_TIMESTAMP`，与 Spring Boot 的自动填充会形成两套机制，谁生效取决于插入语句带不带该列，调试时很难说清。

### 1.2 字段命名规范

| 要求 | 示例 |
|------|------|
| 表名/字段名用**小写 + 下划线** | `order_item` / `create_time` |
| 表名用**单数**，与脚手架 `user` / `notice` 一致 | `order_item` 而非 `order_items` |
| 主键统一为 `id`（BIGINT AUTO_INCREMENT） | `id BIGINT NOT NULL AUTO_INCREMENT` |
| 关联字段用 `{表名}_id` | `user_id` / `order_id` |
| 时间字段用 `DATETIME DEFAULT NULL`，应用层填值 | `create_time` / `update_time` |
| 逻辑删除用 `deleted`（TINYINT NOT NULL DEFAULT 0） | 不要用 `is_deleted` 或 `is_delete` |
| 枚丙类字段用 `VARCHAR` 存英文标识，不用 MySQL `ENUM` | `status VARCHAR(20)`、`gender VARCHAR(10)` |
| 所有表加 `ENGINE=InnoDB` + `utf8mb4` | |
| COMMENT 用中文，枚丙值要写全 | `'状态：active-启用，inactive-停用'` |

**为何不用 `ENUM`**：改枚丙值要执行 `ALTER TABLE`，且各后端 ORM 对 `ENUM` 的映射行为不一致。`VARCHAR` + COMMENT 里写清取值范围，配合应用层校验更好管。这也是 `user.role` 和 `user.gender` 的实际做法。

### 1.3 索引规范

```sql
-- 唯一索引
UNIQUE KEY `uk_fieldname` (`fieldname`)

-- 普通索引
KEY `idx_fieldname` (`fieldname`)

-- 复合索引
KEY `idx_a_b` (`field_a`, `field_b`)
```

**复合索引的字段顺序有讲究**：遵循最左前缀原则，把筛选性高（取值越分散）的字段放前面。`idx_user_id_status` 能加速 `WHERE user_id=?` 和 `WHERE user_id=? AND status=?`，但帮不了单独的 `WHERE status=?`。

### 1.4 逻辑删除与唯一索引的冲突（常见坑）

用了 `deleted` 逻辑删除后，普通唯一索引会出问题：用户 `zhang` 被逻辑删除（`deleted=1`）后行还在表里，`UNIQUE KEY uk_username (username)` 会让新用户**无法**再注册 `zhang`。

**脚手架采用的是双重防护**，新表照搬：

```sql
-- 索引层：唯一约束包含 deleted
UNIQUE KEY `uk_username` (`username`, `deleted`)
```

```js
// 应用层：插入前先查重，返回人话错误
const [existing] = await db.execute(
  'SELECT id FROM user WHERE username = ? AND deleted = 0', [username]
);
if (existing.length > 0) throw { code: ResultCode.USERNAME_EXIST, message: '用户名已存在' };
```

两层各有职责，**都不能省**：

| 层 | 拦住什么 |
|-----|---------|
| 应用层查重 | 给用户友好提示（`code: 1002` 用户名已存在），这是主路径 |
| 索引层唯一约束 | 拦并发双开：两个请求同时过了查重时，由数据库兜底，报 `IntegrityError` 后被全局异常处理器转成“数据已存在” |

包含 `deleted` 的缺点是同一个用户名**只能被删除一次**（第二次删除会碰 `(zhang, 1)` 重复）。毕设场景下可接受。若导师追问，标准回答：生产环境可改用 `deleted` 存删除时间戳而非 0/1（未删除固定为 0），这样每次删除的值都不同，唯一约束自然不冲突。

---

## 2. 外键关联（逻辑外键）

**不设物理外键**（`FOREIGN KEY`），用逻辑外键 + 应用层维护：

```sql
-- ✅ 正确：逻辑外键
`user_id` BIGINT DEFAULT NULL COMMENT '关联用户ID',
KEY `idx_user_id` (`user_id`)

-- ❌ 错误：物理外键
FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
```

主要原因是**与逻辑删除冲突**：用户被逻辑删除（`deleted=1`）后行还在，外键约束看不出差别，约束形同虚设；而真要物理删除一行时，外键反而会把操作卡住。另外 `scaffold_db.sql` 开头的 `DROP DATABASE` 重建流程也不希望被建表顺序约束。

**代价要心里有数**：数据一致性完全靠应用层。删用户前先判断名下有无关联数据，否则会出现孤儿行（订单里的 `user_id` 指向不存在的用户）。列表页展示关联名称时，联表用 `LEFT JOIN` 而非 `INNER JOIN`，并给空值一个默认显示（如“已注销用户”），否则整行会凭空消失。

这个选择可以写进论文的数据库设计章节，是个正当的技术取舍说明。

---

## 3. 初始化数据

时间字段没有数据库默认值，**INSERT 时要显式写 `NOW()`**，否则列表页的创建时间会显空：

```sql
INSERT INTO `{table_name}` (`name`, `description`, `status`, `create_time`, `update_time`) VALUES
  ('示例数据1', '这是示例', 'active',   NOW(), NOW()),
  ('示例数据2', '这也是示例', 'inactive', NOW(), NOW());
```

每张新表至少给 **2–3 条初始数据**。空表会让前端列表页、分页组件、统计图表都无法验证，答辩演示时也没东西可看。

---

## 4. 各后端实体/DAO 实现

### 4.0 Spring Boot（主力后端，默认按此写）

实体类放 `entity/`，四个注解一个都不能漏：

```java
@Data
@TableName("order_item")
public class OrderItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    /**
     * 创建时间（插入时自动填充）
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间（插入与更新时自动填充）
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
```

| 注解 | 漏了会怎样 |
|------|------------|
| `@TableName` | 表名与类名不一致时找不到表 |
| `@TableId(type = IdType.AUTO)` | 不用数据库自增，插入时 id 会变雪花 ID |
| `@TableField(fill = ...)` | 时间字段存 NULL（表结构没默认值） |
| `@TableLogic` | 删除变物理删除，且查询不自动过滤 `deleted=0` |

`application.yml` 里已全局配好 `logic-delete-field: deleted` / `logic-delete-value: 1` / `logic-not-delete-value: 0`，**不要再改**。Mapper 接口只需空壳：

```java
@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItem> {
}
```

### 4.1 Express / Flask（手写 SQL）

两个后端都没用 ORM，**逻辑删除靠手写 `deleted = 0`**，漏了就会把删掉的数据查出来：

```js
// Express
const [rows] = await db.execute(
  'SELECT * FROM `order_item` WHERE deleted = 0 AND id = ?',
  [id]
);
```

```python
# Flask
row = Database.execute_one(
    'SELECT * FROM order_item WHERE deleted = 0 AND id = %s', (item_id,))
```

三个必知：

1. **逻辑删除写 `UPDATE ... SET deleted = 1`**，不是 `DELETE FROM`
2. **只选需要的列**。脚手架用 `USER_COLUMNS` 常量显式列出字段并**排除 `password`**，新表有敏感列时照搬这个做法，不要 `SELECT *`
3. **`order` 是 MySQL 保留字**（`ORDER BY`），必须加反引号，否则直接报语法错。同类陷阱：`group`、`desc`、`key`。**取表名时就绕开保留字**更稳，比如用 `order_info`

排序字段不能拼，必须白名单映射（字段名无法参数化，拼字符串就是 SQL 注入），脚手架的写法：

```js
const orderCol = { username: 'username', email: 'email', createTime: 'create_time' }[orderBy] || 'create_time';
```

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

在 `graduation-project` 的**阶段 1（需求确认）**后、写接口之前调用本 skill 生成建表 SQL。顺序不能倒：表结构定不下来，`api-designer` 无法定 DTO 字段。

**新增一张表后，四处必须同步**（少一处就跑不起来）：

| 序 | 同步到哪 | 要做什么 |
|----|---------|---------|
| 1 | `docs/scaffold_db.sql` | 追加建表语句（写在末尾 INSERT 之前）+ 2–3 条初始化数据 |
| 2 | 实体类 | Spring Boot 加 `entity/Xxx.java` + `mapper/XxxMapper.java`；Express / Flask 无实体类，直接在 service 写 SQL |
| 3 | 数据字典 | 论文数据库设计章节需要一张字段表（字段名/类型/长度/是否为空/说明），格式见 §6 |
| 4 | 重建数据库 | `mysql -u root -p --default-character-set=utf8mb4 < scaffold_db.sql`。**不带 `--default-character-set` 中文会报 Data too long** |

---

## 6. 数据字典输出模板（直接搬进论文）

每张表一张表格，用三线表排版：

| 字段名 | 类型 | 长度 | 主键 | 允空 | 默认值 | 说明 |
|-------|------|------|------|------|--------|------|
| id | BIGINT | — | ✓ | ✗ | 自增 | 主键ID |
| name | VARCHAR | 100 | | ✗ | — | 名称 |
| status | VARCHAR | 20 | | ✗ | active | 状态：active-启用，inactive-停用 |
| create_time | DATETIME | — | | ✓ | NULL | 创建时间 |
| deleted | TINYINT | — | | ✗ | 0 | 逻辑删除：0-未删除，1-已删除 |

需要 ER 图时转给 `thesis-writer` skill 的绘图系统，不要自己拼 ASCII 图。
