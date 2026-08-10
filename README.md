# graduation-kit

毕业设计一件套 agent skills。一条命令装好从需求到答辩的全流程能力：需求定义、数据库设计、接口设计、代码生成、代码审查、UI 风格选型、论文写作与配图绘制。

支持任何读取 `.agents/skills/` 的 agent（Zed、Claude Code 等）。

需要 Node.js 18+；跑起脚手架还需要 MySQL 8，以及你选的那个后端的运行时：

| 后端 | 运行时 |
|---|---|
| `springboot` | JDK 17 + Maven |
| `express` | Node.js 18+ |
| `flask` | Python 3.10+ |
| `go` | Go 1.21+ |
| `dotnet` | .NET 10 SDK |

只装 skill 的话只需要 Node.js，其余一概不需要。

## 快速开始

在你打算放项目的父目录下：

```bash
npx github:Soulmte/graduation-kit create
```

分步向导会依次问你项目名、模板、后端、前端、数据库名和 MySQL 密码，跑完得到一个可直接开发的项目：

```
my-graduation-project/
├── .agents/skills/     六个毕设 skill
├── backend/            你选的后端
├── frontend/           你选的前端
├── docs/库名.sql       建表脚本，文件名跟随你填的库名
├── uploads/            用户上传的图片
├── .gitignore          已挡住依赖与构建产物
└── README.md           端口、库名、启动命令存档
```

模板选 `clean` 就是干净脚手架，选 `trade` 或 `booking` 就多一整套已写好的业务（详见下面的[可选模板](#可选模板)）。

参数给全就跳过提问，适合写进脚本：

```bash
npx github:Soulmte/graduation-kit create my-app --be springboot --fe react
npx github:Soulmte/graduation-kit create my-shop --template trade --db shop_db
npx github:Soulmte/graduation-kit create my-booking --template booking --db booking_db
npx github:Soulmte/graduation-kit create demo --be express --fe vue-antd,wxapp --db lib_db
npx github:Soulmte/graduation-kit create --list      # 先看看有哪些模板与脚手架可选
```

### 生成之后的五步

1. **建库**。进项目目录，把 `docs/` 下那个 SQL 导进 MySQL：

   ```bash
   mysql -uroot -p --default-character-set=utf8mb4 < docs/你的库名.sql
   ```

   脚本自带 `CREATE DATABASE`，不用先手动建库。

2. **起后端**。`cd backend`，按终端提示的那条命令跑。各后端的命令：

   | 后端 | 首次启动 |
   |---|---|
   | `springboot` | `mvn spring-boot:run` |
   | `express` | `npm install && npm run dev` |
   | `flask` | `pip install -r requirements.txt && python app.py` |
   | `go` | `go mod tidy && go run .` |
   | `dotnet` | `dotnet restore && dotnet run` |

3. **起前端**。另开一个终端，`cd frontend`（多前端时是 `frontend-<名>/`），`npm install && npm run dev`。小程序那两个不用 dev，直接用微信开发者工具 / HBuilderX 打开目录。

4. **登录验证**。浏览器开前端给出的地址，用 `admin / 123456`（管理员）或 `test / 123456`（普通用户）登录。能进仪表盘说明前后端和数据库都通了。

5. **开工**。新开一个 agent 会话，skill 才会被加载（不需要重启编辑器），然后跟 agent 说你的毕设题目。

端口、库名、启动命令这些也都写进了项目根的 `README.md`，终端滚走了能回去查。

### 先确认它是通的，再动手改

后端起来后可以直接探活，不用等前端：

```bash
curl http://localhost:8080/api/health
```

端口换成你选的那个后端的端口（见下面的表）。返回 `{"code":200,...}` 就说明服务和数据库都正常。这一步能把「代码问题」和「环境问题」分开，省掉大量瞎猜。

### 从 Gitee 用

`npx` 只认 `github:` / `gitlab:` / `bitbucket:` 三个简写，Gitee 拉不了。从 Gitee 过来先 clone：

```bash
git clone https://gitee.com/rain-drops/graduation-kit.git
cd graduation-kit
npm link
```

之后 `graduation-kit create` 就能在任何目录直接用，不必写 `npx`。后续更新只需在这个目录 `git pull`，不用重新 link。

## 只装 skill

项目已经有了、只想要这套 skill：

```bash
# 装到当前项目
npx github:Soulmte/graduation-kit install

# 装到全局，所有项目可用
npx github:Soulmte/graduation-kit install -g

# 只要论文那一个
npx github:Soulmte/graduation-kit install --only thesis-writer
```

安装时会询问是否一并装上三个上游增强包。它们已随包内置，无需联网。

升级包之后重装要加 `-f`，否则遇到已存在的目录会直接跳过，你会以为装上了新版其实还是旧的。

## 命令

```bash
npx github:Soulmte/graduation-kit create [名称]     向导：脚手架 + SQL + skills
npx github:Soulmte/graduation-kit install [选项]   只安装 skills
npx github:Soulmte/graduation-kit list             列出包内 skill
npx github:Soulmte/graduation-kit uninstall        移除已安装的 skill
npx github:Soulmte/graduation-kit doctor           校验 frontmatter 规范
```

通用选项

| 选项 | 说明 |
|---|---|
| `-d, --dir <path>` | 指定工作目录（默认当前目录） |
| `-f, --force` | 覆盖已存在的 skill |
| `-y, --with-upstream` | 直接带上三个上游增强，不询问 |
| `--no-upstream` | 只装六个核心 skill |

`install` 专属

| 选项 | 说明 |
|---|---|
| `-g, --global` | 装到 `~/.agents/skills/` |
| `-o, --only <a,b>` | 只处理指定 skill，跳过上游询问 |

`create` 专属

| 选项 | 说明 |
|---|---|
| `-t, --template <id>` | 模板：`clean` 干净脚手架 / `trade` 交易 demo / `booking` 预约 demo |
| `--be <id>` | 后端，只能一个（demo 模板会忽略） |
| `--fe <a,b>` | 前端，可多个逗号分隔（demo 模板会忽略） |
| `--db <name>` | 数据库名（默认 `scaffold_db`） |
| `--db-pass <pwd>` | MySQL root 密码 |
| `--no-skills` | 不装 skills，只要脚手架 |
| `--list` | 列出可选模板与脚手架 |

## 可选模板

向导第二步会问你要哪种模板。区别只有一个：**干净脚手架给的是底子，demo 给的是已经写好的业务**。

| `--template` | 内容 | 技术栈 |
|---|---|---|
| `clean`（默认） | 登录注册、用户、公告、日志、仪表盘这些底子 | 后端前端自由组合 |
| `trade` | 在上面那些之外，多了商家、商品、购物车、订单、支付、退款一整套 | 固定 Spring Boot + Vue 3 & Ant Design Vue |
| `booking` | 多了服务机构、服务项、排班时段、预约单、到店核销、评价一整套 | 固定 Spring Boot + Vue 3 & Ant Design Vue |

### 交易 demo

毕设选题里买卖类占很大一块（商城、点餐、票务、二手交易、农产品直销……），这些题目的骨架其实是同一套：商家管商品，买家下单付款，卖家发货，中间可能退款。这个 demo 把这套流程完整写了一遍，改个名词就能套到自己的题目上。

```bash
npx github:Soulmte/graduation-kit create my-shop --template trade --db shop_db
```

三个角色各有入口：

| 角色 | 入口 | 能做什么 |
|---|---|---|
| 买家 | `/user/mall` | 逛商品、加购物车、下单、支付、确认收货、申请退款 |
| 商家 | `/merchant/shop` | 维护店铺、管商品（含上下架）、发货、审退款 |
| 管理员 | `/admin/merchant` | 审店铺、管分类，另有全量订单与退款视图 |

买家在右上角下拉点「申请开店」提交资料，管理员审核通过后账号自动变成商家。种子数据已经把这条路铺好了：`shop1` 的店过审能直接用，`shop2` 的店待审核，用 `admin` 走一遍审核就能看到角色变化。

订单状态机（也写在生成出来的 SQL 注释和 `Orders.java` 里）：

```
0 待支付 --支付--> 1 待发货 --发货--> 2 待收货 --确认收货--> 3 已完成
0 待支付 --取消--> 4 已取消
1 / 2 --申请退款--> 5 退款中 --同意--> 6 已退款
                            \--拒绝--> 回到原来的状态
```

数据库比干净版多 8 张表：`merchant` `category` `product` `cart_item` `orders` `order_item` `payment` `refund`（订单表叫 `orders`，因为 `order` 是 MySQL 保留字）。后端多 34 条接口，前端多 11 个页面。

几个刻意的设计，答辩容易被问到，代码注释里都写了理由：

- **一单只属一个商家**。购物车跨店结算后端直接拒绝，让退款和发货的责任方唯一。
- **扣库存用带条件的 UPDATE**（`stock = stock - n WHERE stock >= n`），靠数据库行锁挡并发超卖，看受影响行数判断成败，而不是先查再改。
- **金额一律后端算**，前端传的价格不采纳。
- **订单明细存商品快照**（名称、封面、单价）。商家后来改名改价，旧订单显示的还是成交时的信息。
- **购物车不存价格**，每次展示实时读商品表，所以调价后购物车立刻跟着变。
- **买家端 / 商家端 / 管理端走不同路径**（`/mine/*` `/merchant/*` `/admin/*`），不靠参数区分权限。

默认账号：`admin` 管理员，`shop1` `shop2` 商家，`test` `zhangsan` 买家，密码都是 `123456`。`test` 的购物车里预放了 2 件商品，订单列表里 5 笔单覆盖了待支付、待发货、待收货、已完成、退款中五种状态，进去就能看到东西，不用自己造数据。

### 预约 demo

另一大类选题卖的不是货，而是“某个时间段的服务能力”（体检预约、场馆预定、理发到店、自习室选座、课程约课……）。这类题目的难点不在付款，而在时段名额的并发与状态流转。

```bash
npx github:Soulmte/graduation-kit create my-booking --template booking --db booking_db
```

三个角色各有入口：

| 角色 | 入口 | 能做什么 |
|---|---|---|
| 用户 | `/user/service` | 找服务、按日期选时段下单、取消、催单、评价 |
| 服务机构 | `/provider/shop` | 维护机构、管服务项（含上下线）、批量排班、接单拒单核销、回复评价 |
| 管理员 | `/admin/provider` | 审机构、管分类，另有全量预约视图 |

用户在右上角下拉点「申请入驻」提交资料，管理员审核通过后账号自动变成机构。种子数据里 `shop1` 已过审可直接用，`shop2` 待审核，用 `admin` 走一遍就能看到角色变化。

预约状态机（也写在生成出来的 SQL 注释和 `Appointment.java` 里）：

```
0 待确认 --机构接单--> 1 已确认 --到店核销--> 2 已完成（可评价）
0 待确认 --机构拒单--> 4 已拒绝（释放名额）
0 / 1 --用户取消--> 3 已取消（释放名额）
1 已确认 --机构标记--> 5 已失约（时间已过，不释放名额）
```

数据库比干净版多 6 张表：`provider` `service_category` `service_item` `time_slot` `appointment` `review`。后端多 37 条接口，前端多 11 个页面。

几个刻意的设计：

- **库存换成了时段容量**。占名额用 `booked_count = booked_count + 1 WHERE booked_count < capacity AND status = 1`，看受影响行数判断是否抢到，而不是先查再改。
- **取消与拒单退名额，失约不退**。人没来就是已经消耗了机构的档期。
- **服务已开始不允许自助取消**，否则机构既抽不出人手又白丢名额。
- **预约单存快照**（服务名、价格、日期时间），机构后来改名改价或删时段都不影响旧单。
- **批量排班按服务时长切片**，一次最多 30 天，已存在的时段自动跳过，可以反复点来补新日子。
- **评价绑定预约单且唯一**（`uk_appointment`），只有已完成的单能评，一单只能评一次。

默认账号：`admin` 管理员，`shop1` `shop2` 机构，`test` `zhang` 用户，密码都是 `123456`。9 笔预约单把六种状态全覆盖了，服务项里也故意留了一个已下线的和一个没排班的，用来验证校验分支。时段日期用 `CURDATE()` 算相对天数，过几天再看仍然有可约时段。

## 可选脚手架

后端选一个，五家的接口完全一致（同一套 24 条业务接口、同一套错误码、同一套字段名），前端无感对接任意一个：

| `--be` | 技术栈 | 端口 |
|---|---|---|
| `springboot` | Java 17 + MyBatis-Plus | 8080 |
| `express` | Node.js + mysql2 | 8081 |
| `flask` | Python + PyMySQL | 8082 |
| `go` | Go 1.21 + database/sql | 8084 |
| `dotnet` | C# / .NET 10 + MySql.Data | 8085 |

还有一个 `fastapi`（8083）尚未完成对齐，暂时没放进可选列表。

**换后端不用改前端**。前端只认 `/api` 前缀和统一响应格式，换一家后端重新 `create` 一次就行，页面代码一行不用动。想对比几种技术栈再定选题方向的话，这个特性很省事。

前端可多选，多选时落成 `frontend-<名>/`：

| `--fe` | 技术栈 | 开发端口 |
|---|---|---|
| `react` | React 18 + 自研组件 | 5176 |
| `vue-elementplus` | Vue 3 + Element Plus | 5175 |
| `vue-antd` | Vue 3 + Ant Design Vue | 5174 |
| `vue-naive` | Vue 3 + Naive UI（含暗色模式） | 5177 |
| `uniapp` | uni-app 跨端（H5 / 小程序 / App） | HBuilderX |
| `wxapp` | 微信小程序原生 | 开发者工具 |

端口错开是有意的：多选几个前端时可以同时跑，不会抢端口。

每个脚手架都带 13 个成品页面（登录注册、用户管理、公告管理、日志管理、仪表盘、个人中心等），可直接当作你业务模块的模仿对象。

## 内置接口

五家后端共同的 24 条业务接口，加上一条探活。路径前缀统一 `/api/<模块>`，标 admin 的只有管理员能调：

| 模块 | 接口 | admin |
|---|---|---|
| user | `POST /api/user/register` | |
| user | `POST /api/user/login` | |
| user | `POST /api/user/pageQuery` | ✓ |
| user | `GET /api/user/listAll` | ✓ |
| user | `GET /api/user/getById/{id}` | |
| user | `PUT /api/user/update` | |
| user | `PUT /api/user/updatePassword` | |
| user | `DELETE /api/user/deleteById/{id}` | ✓ |
| user | `DELETE /api/user/deleteBatch` | ✓ |
| notice | `POST /api/notice/add` | ✓ |
| notice | `POST /api/notice/pageQuery` | |
| notice | `GET /api/notice/listAll` | |
| notice | `GET /api/notice/getById/{id}` | |
| notice | `PUT /api/notice/update` | ✓ |
| notice | `DELETE /api/notice/deleteById/{id}` | ✓ |
| notice | `DELETE /api/notice/deleteBatch` | ✓ |
| log | `POST /api/log/pageQuery` | ✓ |
| log | `GET /api/log/listAll` | ✓ |
| log | `GET /api/log/getById/{id}` | ✓ |
| log | `DELETE /api/log/deleteById/{id}` | ✓ |
| log | `DELETE /api/log/deleteBatch` | ✓ |
| file | `POST /api/file/upload` | |
| file | `POST /api/file/uploadBatch` | |
| file | `DELETE /api/file/delete` | |
| — | `GET /api/health` | |

响应一律是 `{code, message, data}`，HTTP 状态码固定 200（只有 token 无效或过期才返 HTTP 401）。业务码共 11 个：

| code | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器异常 |
| 1001 | 用户名或密码错误 |
| 1002 | 用户名已存在 |
| 1004 | 原密码错误 |
| 2001 | 数据已存在 |
| 2002 | 数据不存在 |

自己新增错误码从 1005 开始排（1003 是空号）。改密码走单独的 `updatePassword`，`update` 不接受 `password` 和 `role` 字段——这是有意防的提权口子，你自己加新接口时可以照这个思路写。

## 仓库结构

```
graduation-kit/
├── bin/                    CLI 入口
│   ├── cli.js              命令分发、install / uninstall / list / doctor
│   ├── create.js           create 向导与非交互生成
│   ├── scaffold.js         脚手架清单、拷贝、端口与库名改写
│   └── prompt.js           无依赖的终端交互（text / select / multiselect）
├── src/
│   ├── skills/             七个 skill 源文件
│   │   ├── graduation-project/
│   │   ├── thesis-writer/      含绘图引擎与 docx 转换脚本
│   │   ├── feature-forge/
│   │   ├── database-designer/
│   │   ├── api-designer/
│   │   ├── code-reviewer/
│   │   └── impeccable/
│   ├── scaffolds/          脚手架源码
│   │   ├── backends/       springboot / express / flask / fastapi / go / dotnet
│   │   ├── frontends/      react / vue-×3 / uniapp / wxapp
│   │   ├── clients/        pyqt / react-native
│   │   ├── demos/          带业务的完整模板
│   │   │   ├── trade/      交易 demo：springboot + vue-antd + 8 张交易表
│   │   │   └── booking/    预约 demo：springboot + vue-antd + 6 张预约表
│   │   ├── docs/           scaffold_db.sql
│   │   └── uploads/        预置头像等静态文件
│   └── vendor/             上游组件（随包内置，无需联网）
├── scripts/
│   └── smoke.js            逐个后端与模板生成到临时目录验证改写结果
├── NOTICE.md               第三方许可
└── LICENSE
```

`bin/` 是安装器，`src/skills/` 是发给 agent 读的提示词，`src/scaffolds/` 是会被拷进你项目的真实代码。三者互不依赖：只想要 skill 就用 `install`，只想要脚手架就 `create --no-skills`。

## 包含内容

### 核心 skill（默认全装）

| skill | 用途 |
|---|---|
| `graduation-project` | 全流程编排。五阶段工作流，站在导师视角把关代码质量 |
| `thesis-writer` | 论文正文与摘要、八类论文插图绘制、Markdown 转 Word |
| `feature-forge` | 需求访谈、功能边界、MVP 范围、EARS 需求描述 |
| `database-designer` | 建表 DDL、ER 关系、索引设计、数据字典 |
| `api-designer` | RESTful 接口设计、统一响应协议、错误码规范 |
| `code-reviewer` | 分层规范、安全问题、命名一致性分级审查 |

### 上游增强（安装时询问）

| 组件 | 落地位置 | 许可 |
|---|---|---|
| `impeccable` | 独立 skill | Apache-2.0 |
| `ui-ux-pro-max` | `graduation-project/vendor/` | MIT |
| `taste-skill` | `graduation-project/vendor/` | MIT |

不装上游也能用：`graduation-project` 会回退到 `style-integration.md` 的内置配色速查表。

## 怎么用

skill 不靠命令调用，直接跟 agent 说你要干什么就行，它会自己匹配。几个典型说法：

| 你说 | 会走 |
|---|---|
| 「我毕设题目是图书馆管理系统，帮我开工」 | `graduation-project` 五阶段全流程 |
| 「题目太宽了，不知道做哪些功能」 | `feature-forge` 需求访谈与 MVP 划边 |
| 「帮我设计图书借还的表」 | `database-designer` 出 DDL |
| 「加一个借书记录接口」 | `api-designer` |
| 「帮我审一下这个模块的代码」 | `code-reviewer` 分级问题清单 |
| 「写论文第四章」、「画一张系统架构图」 | `thesis-writer` |

推荐的开发顺序：先拿 `feature-forge` 把功能边界定下来，再 `database-designer` 建表，接着 `api-designer` 定接口，然后让 `graduation-project` 逐模块生代码，每写完一个用 `code-reviewer` 过一遍。论文可以边写代码边积累。

论文插图是一套浏览器里的 Canvas 绘图工具，支持八类图（架构图、ER 图、用例图、流程图、时序图、功能模块图、技术栈图、对比图），输出符合学位论文规范的黑白线稿。拖动标签前记得先点「编辑模式」，否则点不动不是坏了；保存只写浏览器缓存，要点「导出代码」粘回数据文件才算落盘。

## 开发

改完 `bin/` 或脚手架后跑一轮：

```bash
npm test          # doctor + smoke，提交前跑这一条就够
npm run doctor    # 只校验所有 skill 的 frontmatter
npm run smoke     # 只跑脚手架生成验证
npm run scaffolds # 列出当前可选脚手架与端口
```

`npm run smoke` 会把每个可用后端各生成一次到系统临时目录，逐项校对目录结构、SQL 文件名与内容、uploads 相对路径、前端端口、以及配置里的库名密码有没有改到位，跑完自动清掉。新增后端或改 `patchBackend()` 的改写表时它能第一时间发现遗漏。

想实际看一眼生成结果：

```bash
node bin/cli.js create demo --be go --fe vue-naive --db lib_db --dir /tmp/x
node bin/cli.js install --dir /tmp/x   # 只装 skill 到临时目录
```

绘图引擎的回归测试：

```bash
cd src/skills/thesis-writer/reference/examples
node verify.js && node verify-editor.js && node audit.js
```

注意 `scripts/` 不在 `package.json` 的 `files` 里，不随 npm 包发布，只在 clone 下来的仓库里能跑。

## 常见问题

**装完了 agent 没反应** —— 新开一个会话。已经开着的会话不会重新扫 skill 目录。

**升级后还是旧版** —— 重装要加 `-f`。不加的话已存在的目录会被整个跳过，只打一行警告。

**`--only` 为什么没装上游** —— 这是有意的：指定了 `--only` 就只装你点名的，不会再问上游。想要 `impeccable` 就把它一并写进 `--only`。

**数据库连不上** —— `create` 时密码留空的话需要自己到 `backend` 配置里补。另外记得先导入 `docs/` 下的 SQL。

**SQL 文件叫什么名** —— 跟随 `--db`，例如 `--db library_db` 得到 `docs/library_db.sql`，文件内的建库语句也一并改好。不传 `--db` 就是默认的 `scaffold_db.sql`。

**导入 SQL 中文变乱码** —— 命令要带 `--default-character-set=utf8mb4`，项目 README 里给的那条已经带了。

**前端头像图片 404** —— 头像路径用 `/uploads/xxx.jpg` 靠 vite 代理转到后端，这是既定设计。确保后端已启动，不要自己拼绝对地址。

**小程序真机调试请求失败** —— 手机访问不了电脑的 `localhost`。把 `config/index.js` 里的 `LAN_HOST` 改成电脑局域网 IP，并在微信开发者工具里勾上不校验域名。

**请求报 401 但刚刚还能用** —— token 过期。只有 token 无效或过期会返 HTTP 401，其余情况一律 HTTP 200 + 业务码，重新登录即可。前端已经帮你拦了这个状态，自己写请求时别绕过拦截器。

**Go 后端跑不起来，报 missing go.sum entry** —— 首次要先 `go mod tidy` 拉依赖，再 `go run .`。仓库里没预置 `go.sum`。

**dotnet 后端报框架版本不匹配** —— 项目目标 net10.0，需要 .NET 10 SDK。`dotnet --list-sdks` 确认一下，低版本 SDK 编不过。

**端口被占** —— 后端端口写在 `backend/.env`（springboot 在 `application.yml`），前端在 `.env.development`。两边都改，前端的代理目标也要跟着改。

**报 `toItem is not defined`** —— 这是旧版的 bug，已修。`npx` 会缓存旧代码，跑 `npx --ignore-existing github:Soulmte/graduation-kit create` 重拉；link 过来的在 clone 目录 `git pull` 即可。

**改了仓库代码，`graduation-kit` 命令跑的还是旧的** —— `npm link` 是符号链接，不存在缓存；如果真跑的旧代码，说明当前用的是 `npx` 拉下的副本，不是 link 那份。`which graduation-kit` 确认一下。

**论文转 Word 后章节串位** —— 转换脚本按单独一行的 `---` 分割章节，所以正文里不能出现分割线。图片需要自己手动插，脚本不管图。

## 许可

MIT。vendored 的第三方组件另有许可，见 [NOTICE.md](NOTICE.md)。
