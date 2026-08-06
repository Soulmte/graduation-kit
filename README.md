# graduation-kit

毕业设计一件套 agent skills。一条命令装好从需求到答辩的全流程能力：需求定义、数据库设计、接口设计、代码生成、代码审查、UI 风格选型、论文写作与配图绘制。

支持任何读取 `.agents/skills/` 的 agent（Zed、Claude Code 等）。

## 安装

```bash
# 装到当前项目
npx graduation-kit install

# 装到全局，所有项目可用
npx graduation-kit install -g
```

安装时会询问是否一并装上三个上游增强包。它们已随包内置，无需联网。

## 命令

```bash
npx graduation-kit install [选项]     安装
npx graduation-kit list               列出包内 skill
npx graduation-kit uninstall [选项]   移除
npx graduation-kit doctor             校验 frontmatter 规范
```

| 选项 | 说明 |
|---|---|
| `-g, --global` | 装到 `~/.agents/skills/` |
| `-d, --dir <path>` | 指定项目目录（默认当前目录） |
| `-f, --force` | 覆盖已存在的 skill |
| `-o, --only <a,b>` | 只处理指定 skill，跳过上游询问 |
| `-y, --with-upstream` | 直接带上三个上游增强，不询问 |
| `--no-upstream` | 只装六个核心 skill |

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

## 开发

```bash
npm test                              # 校验所有 skill 的 frontmatter
node bin/cli.js install --dir /tmp/x  # 装到临时目录试跑
```

绘图引擎的回归测试：

```bash
cd src/skills/thesis-writer/reference/examples
node verify.js && node verify-editor.js && node audit.js
```

## 许可

MIT。vendored 的第三方组件另有许可，见 [NOTICE.md](NOTICE.md)。
