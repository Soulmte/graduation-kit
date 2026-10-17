# 更新日志

本项目的版本号遵循语义化版本。npm 上每个版本对应仓库中的同名 tag。

## 1.4.1

### 新增

- `graduation-kit update` / `update -g`：按 `.graduation-kit.json` 的安装记录更新
  当初装过的那批 skill，不再需要记 `install -f`。
- 版本门禁与升级提示统一改为 `npx graduation-kit update`。

### 注意

- `update` 会用包内版本覆盖本地改动，不做备份；改过 skill 需要保留时先自行复制。

## 1.4.0

### 新增

- **参考文献自动化**：论文可检索并引用近五年中英文文献，正文必须带 `[n]` 标注；
  英文文献必须附中文译名。引用来源、原文摘录与链接记录在 `docs/thesis/refs-source.json`。
- **引用校验脚本** `reference/check-refs.mjs`：检查序号连续性、是否重复引用、
  一句话多引用、近五年限制、英文文献译名与来源证据。
- **系统截图自动化** `reference/screenshot.mjs`：用本机 Chrome/Edge 登录并逐页截图，
  输出到 `docs/thesis/images/`，支持视口、缩放、等待时间与单页重拍。
- **Word 自动嵌图**：转换器把图注上方的图片按版心宽度等比缩放后插入，
  不再需要手动插图。
- **触发评测** `npm run eval`：34 条中英文固定 prompt 回归路由表，
  防止改关键词时把别的 skill 顶掉。
- **GitHub Actions**：Node 18/20/22 跑 `doctor`、触发评测、脚手架 smoke，
  另有一条 Python job 校验转换器能嵌入图片。

### 变更

- **中英文关键词**：`triggers.yaml` 与各 skill 的 `description` 补充英文触发词，
  `review code`、`design API`、`add endpoint`、`write thesis` 等可直接命中。
- **路由优先级**：有 `strong` 命中的 skill 优先于只有 `weak` 的，
  避免 `graduation-project` 靠"毕设"这个弱词抢走所有子任务。
- 论文不再禁止参考文献，改为强制可追溯引用。

## 1.3.1

### 修复

- 安装到共享 skills 目录时，`.graduation-kit.json` 不再把其他工具安装的
  skill（如 chakra-ui-*、find-skills）记为本工具管理。

## 1.3.0

### 新增

- **更新门禁**：安装时写入 `.agents/skills/.graduation-kit.json`；
  npm 有新版本时 `create` 拒绝执行，本地 skills 过期时给出升级命令。
- `npx graduation-kit -v` 输出当前版本。
- `--skip-version-check` 与 `GRADUATION_KIT_SKIP_UPDATE=1` 可跳过门禁。
- 离线时门禁自动放行，不阻塞命令。

## 1.2.0

### 新增

- **关键词触发路由** `triggers.yaml` 与按需加载的 `triggers.scenes.yaml`。
- **范围门禁**：6 个毕设专用 skill 在 `description` 开头声明适用范围，
  非毕设项目不应加载。
- **绘图工作副本** `reference/copy-template.mjs`：先把模板复制到
  `docs/thesis/figure-kit/` 再编辑，`--force` 保留已改的 `data/`。
- `doctor` 校验触发路由覆盖率与版本一致性。

## 1.1.6

- 修复 npm 打包时把嵌套 `node_modules` 带入发布包。
