# graduation-kit

毕业设计一件套：一条命令生成完整项目（后端 + 前端 + 数据库 + 文档），附赠从需求到答辩的 AI Agent Skills。

## 快速开始

### 方式 1：在线生成器（推荐）

打开网页填表单，下载 zip 解压即用：

- **GitHub Pages**: https://soulmte.github.io/graduation-kit/web-installer.html
- **Gitee 镜像**: https://rain-drops.gitee.io/graduation-kit/web-installer.html

填写项目名、选择技术栈（后端/前端）、配置数据库，点击生成即可下载。解压后：

```bash
# 1. 导入数据库
mysql -uroot -p < docs/你的库名.sql

# 2. 启动后端（以 Spring Boot 为例）
cd backend
mvn spring-boot:run

# 3. 启动前端（另开终端）
cd frontend
npm install && npm run dev

# 4. 浏览器访问前端地址，用 admin/123456 登录
```

### 方式 2：命令行生成

需要 Node.js 18+：

```bash
npx graduation-kit create

# 或指定参数跳过交互
npx graduation-kit create my-project --be springboot --fe vue-antd --db my_db
```

## 技术栈选项

**后端（选一个）**：

| 选项 | 技术栈 | 端口 |
|---|---|---|
| `springboot` | Java 17 + MyBatis-Plus | 8080 |
| `express` | Node.js + mysql2 | 8081 |
| `flask` | Python + PyMySQL | 8082 |
| `go` | Go + database/sql | 8084 |
| `dotnet` | .NET 10 + MySql.Data | 8085 |

**前端（可多选）**：

| 选项 | 技术栈 | 端口 |
|---|---|---|
| `react` | React 18 + 自研组件 | 5176 |
| `vue-elementplus` | Vue 3 + Element Plus | 5175 |
| `vue-antd` | Vue 3 + Ant Design Vue | 5174 |
| `vue-naive` | Vue 3 + Naive UI | 5177 |
| `uniapp` | uni-app 跨端 | - |
| `wxapp` | 微信小程序原生 | - |

**推荐组合**：`springboot` + `vue-antd`（企业级主流，面试认可度高）

## 内置功能

生成的项目已包含：

- ✅ **用户管理**：注册、登录、JWT 认证、角色权限
- ✅ **公告管理**：增删改查、富文本编辑
- ✅ **操作日志**：自动记录关键操作
- ✅ **文件上传**：头像、图片上传
- ✅ **仪表盘**：数据统计、图表展示
- ✅ **个人中心**：修改密码、更新资料

## 可选模板

### `clean`（默认）
干净脚手架，只包含上述基础功能。

### `trade`（交易系统）
额外包含：商家入驻、商品管理、购物车、订单流程、支付退款。

```bash
npx graduation-kit create my-shop --template trade --db shop_db
```

### `booking`（预约系统）
额外包含：服务机构、服务项目、时段排班、预约管理、到店核销、评价系统。

```bash
npx graduation-kit create my-booking --template booking --db booking_db
```

### `agent`（AI 智能体）
额外包含：大模型配置、拖拽编排智能体、知识库检索、流式对话。需自备 API Key（DeepSeek / Ollama）。

```bash
npx graduation-kit create rent-agent --template agent --db agent_db
```

## Agent Skills（可选）

生成项目后可安装 AI 辅助工具（需支持 `.agents/skills/` 的编辑器，如 Zed、Cursor）：

**Windows**：双击 `install-skills.bat`  
**Mac/Linux**：运行 `bash install-skills.sh`

包含 6 个 Skills：

- `graduation-project` - 五阶段全流程编排
- `thesis-writer` - 论文写作、插图绘制、Markdown 转 Word
- `feature-forge` - 需求访谈、功能边界划分
- `database-designer` - 建表设计、ER 图、索引优化
- `api-designer` - RESTful 接口设计、错误码规范
- `code-reviewer` - 代码审查、安全检查

安装后新建 Agent 会话，直接说需求即可（如"我毕设题目是图书馆管理系统，帮我开工"）。

## 常见问题

**Q: 启动后端报数据库连接失败？**  
A: 确保已导入 SQL 文件，并检查 `backend/.env` 或 `application.yml` 中的数据库密码是否正确。

**Q: 前端头像图片 404？**  
A: 头像路径通过 Vite 代理转发到后端，确保后端已启动。

**Q: 小程序真机调试请求失败？**  
A: 手机访问不了 `localhost`，需修改 `config/index.js` 中的 `LAN_HOST` 为电脑局域网 IP。

**Q: 端口被占用？**  
A: 修改后端配置文件（`.env` 或 `application.yml`）和前端 `.env.development` 中的端口号。

**Q: 升级后还是旧版本？**  
A: 重装时加 `-f` 参数：`npx graduation-kit install -f`

## 其他命令

```bash
# 列出可选技术栈
npx graduation-kit create --list

# 只安装 Skills（不生成项目）
npx graduation-kit install

# 安装到全局（所有项目可用）
npx graduation-kit install -g

# 验证项目完整性
npx graduation-kit verify

# 诊断系统环境
npx graduation-kit diagnose
```

## 仓库地址

- GitHub: https://github.com/Soulmte/graduation-kit
- Gitee: https://gitee.com/rain-drops/graduation-kit

## 许可

MIT License
