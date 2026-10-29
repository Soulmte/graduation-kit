/**
 * graduation-kit create —— 分步向导生成毕设项目骨架。
 * 落盘结构与 graduation-project skill 的 §1.5 约定一致。
 */
import { existsSync, mkdirSync, writeFileSync, renameSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { text, confirm, select, multiselect, closePrompt } from './prompt.js';
import { checkMysql, databaseExists, importSqlFile, mysqlGuide, mysqlFailureHint } from './mysql.js';
import { checkRedis, redisGuide } from './redis.js';
import {
  BACKENDS, FRONTENDS, TEMPLATES, readyBackends, readyFrontends, readyTemplates,
  findTemplate, demoPaths, frontendDirName, frontendSrc,
  patchBackend, patchFrontend, patchSql, sqlFileName, assertEmptyTarget, copyTree,
  patchWeChat, patchWxAppProject,
  validName, validDbName, validDbPassword, validAppId, escapePasswordForYaml,
} from './scaffold.js';

const C = { 
  reset: '\x1b[0m', 
  dim: '\x1b[2m', 
  green: '\x1b[32m', 
  cyan: '\x1b[36m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);
const line = (s = '') => console.log(s);
const ok = (s) => line(`${paint('green', '✓')} ${s}`);
const warn = (s) => line(`${paint('yellow', '⚠')} ${s}`);
const info = (s) => line(`${paint('cyan', 'ℹ')} ${s}`);
const fail = (s) => line(`${paint('red', '✗')} ${s}`);

/** 脚手架条目转 select/multiselect 选项：原字段照留，附加右侧灰色注解和推荐标记 */
const toItem = (s, note, recommended) => ({ ...s, note, recommended });

/**
 * 向导抬头打印的版本号。
 * 全局装的 graduation-kit 不会随远端仓库自动更新，把版本摆出来，
 * 用户一眼能看出手上跑的是不是最新那份，省得为已修的 bug 再来问一遍。
 */
function pkgVersion() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')).version;
  } catch {
    return '未知';
  }
}

/** 三套后端运行时的产物一并挡住，避免第一次 git add . 就把依赖提上去 */
const GITIGNORE = `# 依赖
node_modules/
__pycache__/
*.py[cod]
venv/
.venv/

# 构建产物
dist/
dist-ssr/
build/
target/
unpackage/
*.class

# 环境与密钥
.env
.env.local
*.local

# 编辑器与系统
.idea/
.vscode/
*.iml
.DS_Store
Thumbs.db

# 日志
logs/
*.log
npm-debug.log*

# 用户上传的文件不入库，但保留目录
uploads/*
!uploads/.gitkeep
`;

/** 写进项目根的交付打包脚本：双击就能出包，不要求用户记住命令 */
const PACKAGE_BAT = [
  '@echo off',
  'chcp 65001 >nul',
  'setlocal',
  'cd /d "%~dp0"',
  '',
  'echo ============================================',
  'echo   毕业设计项目 - 交付打包',
  'echo ============================================',
  'echo.',
  '',
  'where npx >nul 2>&1',
  'if errorlevel 1 (',
  '  echo [错误] 未找到 npx，请先安装 Node.js 18 或更高版本。',
  '  echo 下载地址：https://nodejs.org/',
  '  pause',
  '  exit /b 1',
  ')',
  '',
  'where graduation-kit >nul 2>&1',
  'if not errorlevel 1 (',
  '  call graduation-kit package . %*',
  ') else (',
  '  call npx --yes graduation-kit@latest package . %*',
  ')',
  '',
  'if errorlevel 1 (',
  '  echo.',
  '  echo [失败] 打包没有完成，请查看上面的错误信息。',
  '  pause',
  '  exit /b 1',
  ')',
  '',
  'echo.',
  'echo 打包完成，zip 已生成在项目同级目录。',
  'pause',
].join('\r\n') + '\r\n';

const RUN_HINT = {
  springboot: 'mvn spring-boot:run',
  express: 'npm install && npm run dev',
  flask: 'pip install -r requirements.txt && python app.py',
  fastapi: 'pip install -r requirements.txt && python app.py',
  go: 'go mod tidy && go run .',
  dotnet: 'dotnet restore && dotnet run',
};
const FE_HINT = {
  vite: 'npm install && npm run dev',
  rn: 'npm install && npm start（手机装 Expo Go 扫码）',
  uniapp: 'HBuilderX 打开项目，运行到浏览器 / 微信开发者工具',
  taro: 'npm install && npm run dev:h5（H5）/ dev:weapp（微信开发者工具导入 dist）',
  wxapp: '微信开发者工具直接导入此目录',
};

/** 交易 demo 独有的说明，附在 README 里，答辩前能直接对着看 */
const TRADE_README = `
## 交易 demo 说明

这套项目在干净脚手架之上加了一条完整的交易链路，可以直接当毕设的业务底子改。

### 三个角色的入口

| 角色 | 入口 | 能做什么 |
| --- | --- | --- |
| 普通用户 | \`/user/mall\` | 逛商品、加购物车、下单、支付、确认收货、申请退款 |
| 商家 | \`/merchant/shop\` | 维护店铺、管商品、发货、审退款 |
| 管理员 | \`/admin/merchant\` | 审店铺、管分类，另有全量订单与退款视图 |

普通用户在右上角下拉里点「申请开店」提交资料，管理员审核通过后账号自动变成商家。

### 订单状态机

\`\`\`
0 待支付 --支付--> 1 待发货 --发货--> 2 待收货 --确认收货--> 3 已完成
0 待支付 --取消--> 4 已取消
1 / 2 --申请退款--> 5 退款中 --同意--> 6 已退款
                            \\--拒绝--> 回到原来的状态
\`\`\`

### 几个刻意的设计（答辩常问）

- **一单只属一个商家**。购物车跨店结算时后端直接拒绝，让退款和发货的责任方唯一。
- **扣库存用带条件的 UPDATE**（\`stock = stock - n WHERE stock >= n\`），靠数据库行锁挡并发超卖，看受影响行数判断成功与否。
- **金额一律后端算**。前端传的价格不采纳，避免改包改价。
- **订单明细存商品快照**（名称、封面、单价）。商家后来改名改价，旧订单显示的仍是成交时的信息。
- **购物车不存价格**，每次展示实时读商品表，所以调价后购物车立刻跟着变。
- **买家端 / 商家端 / 管理端走不同路径**（\`/mine/*\` \`/merchant/*\` \`/admin/*\`），不靠参数区分权限。

### 表

除脚手架自带的 user / notice / operation_log 之外，新增 8 张：
merchant、category、product、cart_item、orders、order_item、payment、refund。

> 订单表叫 \`orders\`，因为 \`order\` 是 MySQL 保留字。
`;

/** 预约 demo 独有的说明 */
const BOOKING_README = `
## 预约 demo 说明

这套项目把“抢一个时间段”这件事写完了，体检、场馆、理发、自习室这类题目换个词就能用。

### 三个角色的入口

| 角色 | 入口 | 能做什么 |
| --- | --- | --- |
| 普通用户 | \`/user/service\` | 找服务、选时段下单、取消、催单、评价 |
| 服务机构 | \`/provider/shop\` | 维护机构、管服务项、批量排班、接单核销、回复评价 |
| 管理员 | \`/admin/provider\` | 审机构、管分类、看全量预约 |

普通用户在右上角下拉里点「申请入驻」提交资料，管理员审核通过后账号自动变成机构。

### 预约状态机

\`\`\`
0 待确认 --机构接单--> 1 已确认 --到店核销--> 2 已完成（可评价）
0 待确认 --机构拒单--> 4 已拒绝（释放名额）
0 / 1 --用户取消--> 3 已取消（释放名额）
1 已确认 --机构标记--> 5 已失约（时间已过，不释放名额）
\`\`\`

### 几个刻意的设计（答辩常问）

- **库存换成了时段容量**。占名额用带条件的 UPDATE（\`booked_count = booked_count + 1 WHERE booked_count < capacity AND status = 1\`），看受影响行数判断是否抢到，靠行锁挡并发超预约。
- **取消与拒单会把名额退回去，失约不退**。人没来就是消耗了机构的档期。
- **服务已开始就不让用户自助取消**，否则机构既抽不出人手又白丢名额。
- **预约单存快照**（服务名、价格、日期时间）。机构后来改名改价或删掉时段，旧单显示的仍是预约时的信息。
- **批量排班按服务时长切片**，最多一次排 30 天，已存在的时段自动跳过，可以反复点来补齐新日子。
- **评价绑定预约单且唯一**（\`uk_appointment\`），只有已完成的单能评，一单只能评一次。
- **三端走不同路径**（\`/mine/*\` \`/provider/*\` \`/admin/*\`），不靠参数区分权限。

### 表

除脚手架自带的 user / notice / operation_log 之外，新增 6 张：
provider、service_category、service_item、time_slot、appointment、review。

> 种子数据的时段用 \`CURDATE()\` 算相对日期，不写死具体天，过几天再看仍然有可约的时段。
`;

/** AI Agent demo 独有的说明 */
const AGENT_README = `
## AI Agent demo 说明

这套项目把“管理员拖拽配一个智能体，用户直接用”写完了，
智能咨询、智能客服、智能助手这类题目换个领域词就能用。

### 先把 API Key 填上（重要）

种子数据里的 \`model_config.api_key\` 是 **空的**（不能把密钥写进仓库），
不填就无法对话。启动后用 admin 登录，进【模型配置】点编辑把自己的 Key 填进去。

- DeepSeek：https://platform.deepseek.com 申请，价格便宜，推荐
- 不想花钱：本地装 [Ollama](https://ollama.com)，拉个 \`qwen2.5:7b\`，
  模型配置里厂商选“本地 Ollama”，Key 留空即可

### 两个角色的入口

| 角色 | 入口 | 能做什么 |
| --- | --- | --- |
| 管理员 | \`/admin/agent\` | 新建智能体、拖拽编排、维护知识库、看会话记录 |
| 普通用户 | \`/user/agent\` | 选助手、流式提问、翻推理过程、管自己的会话 |

### 编排是怎么回事

画布只有四种节点，连成一条链：

\`\`\`
开始 → 知识检索（可选）→ 大模型 → 结束
\`\`\`

- **开始**：接用户提问
- **知识检索**：按关键词召回知识条目，拼进提示词。可调召回条数
- **大模型**：选模型、写系统提示词、调温度、定带多少条历史
- **结束**：输出收尾

改完点【保存编排】，再回列表点【发布】，前台才看得到。

### 几个刻意的设计（答辩常问）

- **整张画布存一个 JSON 字段**（\`agent.graph_json\`），没拆成节点表与边表。
  编排改动频繁，整体覆盖比增量同步好写也好排错。
- **发布前会校一遍图**：必须有唯一开始节点、能走到结束、不成环、
  至少一个大模型节点、引用的模型没被停用。早前存的图也会重校。
- **流式用 SSE**（\`SseEmitter\` + JDK \`HttpClient\`），前端用 \`fetch\` + \`ReadableStream\` 接。
  没用原生 \`EventSource\`：它带不了 \`Authorization\` 头，会被登录拦截器直接拦下。
- **检索没用向量库**，而是二元滑窗切词 + 加权打分（关键词 5 分、标题 3 分、正文 1 分）。
  毕设的知识量就几十到几百条，关键词召回够用，也不用额外部署 embedding 服务。
- **API Key 出口掉掩码**（\`sk-***abc\`），接口拿不到原文；更新时留空表示不改。
- **每条回答存执行轨迹**（\`message.node_trace\`），记每步耗时与产出。
  答得不对时能分清是检索没召回到资料，还是召回了但模型没用好。
- **新对话不提前建会话**，发第一句时后端才建并通过 \`meta\` 事件回传 ID，
  用户点进来看一眼就走，库里不会攒空会话。

### 表

除脚手架自带的 user / notice / operation_log 之外，新增 5 张：
model_config、agent、knowledge、conversation、message。

> \`message\` 没有 \`update_time\` 与逆辑删除列：消息只追写不修改，
> 删会话时按 \`conversation_id\` 物理删除。
`;

/** 各 demo 的 README 附录与账号说明，新增模板只需往这里添一项 */
const DEMO_INFO = {
  trade: {
    readme: TRADE_README,
    accounts: `| admin | 123456 | 管理员 |
| test | 123456 | 普通用户（购物车里预放了 2 件商品） |
| zhangsan | 123456 | 普通用户 |
| shop1 | 123456 | 商家（店铺已过审，挂着 6 个商品） |
| shop2 | 123456 | 商家（店铺待审核，可用 admin 走一遍审核流程） |`,
    hints: [
      '默认账号：admin（管理员）、shop1 / shop2（商家）、test / zhangsan（买家），密码都是 123456',
      '逛商城 /user/mall，商家中心 /merchant/shop，店铺审核 /admin/merchant',
    ],
  },
  booking: {
    readme: BOOKING_README,
    accounts: `| admin | 123456 | 管理员 |
| test | 123456 | 普通用户（名下有待确认、已确认、已完成三种预约） |
| zhang | 123456 | 普通用户（名下有被拒与失约的单） |
| shop1 | 123456 | 机构（已过审，6 个服务项与 10 个时段） |
| shop2 | 123456 | 机构（待审核，可用 admin 走一遍审核流程） |`,
    hints: [
      '默认账号：admin（管理员）、shop1 / shop2（机构）、test / zhang（用户），密码都是 123456',
      '找服务 /user/service，机构中心 /provider/shop，机构审核 /admin/provider',
    ],
  },
  agent: {
    readme: AGENT_README,
    accounts: `| admin | 123456 | 管理员 |
| test | 123456 | 普通用户（名下有 2 段历史对话） |
| zhang | 123456 | 普通用户 |`,
    hints: [
      '先填 API Key！种子数据里 model_config.api_key 是空的，admin 登录后进 /admin/modelConfig 填上',
      '管理端编排 /admin/agent（点「编排」进画布），前台对话 /user/agent',
      '不想花钱就本地装 Ollama，模型配置里厂商选“本地 Ollama”，Key 可留空',
    ],
  },
};

/** springboot-wxapp 的启动命令、运行时、端口提示都跟 springboot 一致 */
const backendKey = (be) => (be.id.startsWith('springboot') ? 'springboot' : be.id);

/** 项目根 README：环境、启动步骤、常用命令、交付与 Skills 都写进去 */
function projectReadme({ name, be, fes, db, sqlFile, template, withSkills = true, withRedis = false, dbImported = false, wechat = null }) {
  const F = '```';
  const code = (lang, body) => `${F}${lang}\n${body}\n${F}`;
  const row = (cells) => `| ${cells.join(' | ')} |`;

  const feRows = fes.map((f) => {
    const dir = frontendDirName(f.id, fes.length);
    return row([`\`${dir}/\``, f.label, FE_HINT[f.kind]]);
  });

  const info = DEMO_INFO[template?.id];

  // demo 的种子数据里多了业务角色账号，一并写进 README 省得去翻 SQL
  const accountRows = info?.accounts
    || `| admin | 123456 | 管理员 |
| test | 123456 | 普通用户 |`;

  const beRuntime = {
    springboot: 'JDK 21、Maven 3.8+',
    express: 'Node.js 18+',
    flask: 'Python 3.9+',
    go: 'Go 1.21+',
    dotnet: '.NET 10 SDK',
  }[backendKey(be)] || be.lang;

  // 运行说明按后端拆成多行，比一行 && 拼起来好复制
  const beRun = {
    springboot: 'mvn spring-boot:run',
    express: 'npm install\nnpm run dev',
    flask: 'pip install -r requirements.txt\npython app.py',
    go: 'go mod tidy\ngo run .',
    dotnet: 'dotnet restore\ndotnet run',
  }[backendKey(be)] || RUN_HINT[be.id] || '# 见该目录说明';

  const envRows = [
    row(['Node.js', '18+', fes.some((f) => f.kind === 'vite' || f.kind === 'taro')
      ? '前端构建 / graduation-kit 命令'
      : 'graduation-kit 命令（前端用 HBuilderX / 微信开发者工具）']),
    row(['MySQL', '5.7 / 8.x（utf8mb4）', '数据库']),
    row([`${be.label} 运行时`, beRuntime, '后端运行']),
  ];
  if (fes.some((f) => f.kind === 'uniapp')) {
    envRows.push(row(['HBuilderX', '最新稳定版', 'uniapp 运行与调试']));
  }
  if (fes.some((f) => f.kind === 'wxapp' || f.kind === 'taro')) {
    envRows.push(row(['微信开发者工具', '最新稳定版', '小程序调试']));
  }
  if (fes.some((f) => f.kind === 'rn')) {
    envRows.push(row(['Expo Go', '最新版（手机应用商店）', '扫码调试 React Native 客户端']));
  }
  if (withRedis) {
    envRows.push(row(['Redis', '5+', '缓存 / 验证码 / 会话（见 docs/redis.md）']));
  }

  const feRuns = fes.map((f) => {
    const dir = frontendDirName(f.id, fes.length);
    if (f.kind === 'vite') {
      return `**${dir}/**\n\n${code('bash', `cd ${dir}\nnpm install\nnpm run dev`)}`;
    }
    if (f.kind === 'taro') {
      return `**${dir}/**\n\n${code('bash', `cd ${dir}\nnpm install\nnpm run dev:h5      # H5\nnpm run dev:weapp   # 微信小程序，产物在 dist/`)}`;
    }
    if (f.kind === 'rn') {
      return `**${dir}/**\n\n${code('bash', `cd ${dir}\nnpm install\nnpm start            # 终端出二维码，手机 Expo Go 扫码\nnpm run android      # 或在 Android 模拟器里跑`)}`;
    }
    if (f.kind === 'uniapp') {
      return `**${dir}/**\n\n${code('text', `HBuilderX 打开 ${dir}/，运行到浏览器 / 微信开发者工具 / 真机`)}`;
    }
    return `**${dir}/**\n\n${code('text', `微信开发者工具直接导入 ${dir}/`)}`;
  });

  const beCmdRows = {
    springboot: [
      ['mvn spring-boot:run', `开发启动（:${be.port}）`],
      ['mvn clean package', '打包 jar 到 target/'],
      ['java -jar target/*.jar', '运行打包后的 jar'],
    ],
    express: [
      ['npm install', '安装依赖'],
      ['npm run dev', `开发启动（:${be.port}，nodemon）`],
      ['npm start', '生产启动'],
    ],
    flask: [
      ['pip install -r requirements.txt', '安装依赖'],
      ['python app.py', `启动（:${be.port}）`],
    ],
    go: [
      ['go mod tidy', '拉取依赖'],
      ['go run .', `开发启动（:${be.port}）`],
      ['go build -o app', '编译可执行文件'],
    ],
    dotnet: [
      ['dotnet restore', '还原依赖'],
      ['dotnet run', `启动（:${be.port}）`],
      ['dotnet publish -c Release -o publish', '发布到 publish/'],
    ],
  }[backendKey(be)] || [];

  const feCmdSections = fes.map((f) => {
    const dir = frontendDirName(f.id, fes.length);
    const rows = {
      vite: [
        ['npm install', '安装依赖'],
        ['npm run dev', '开发模式（热更新）'],
        ['npm run build', '生产构建到 dist/'],
        ['npm run preview', '预览构建结果'],
      ],
      taro: [
        ['npm install', '安装依赖'],
        ['npm run dev:h5', 'H5 开发（热更新）'],
        ['npm run dev:weapp', '微信小程序开发，产物在 dist/'],
        ['npm run build:h5', 'H5 生产构建'],
        ['npm run build:weapp', '微信小程序生产构建'],
      ],
      rn: [
        ['npm install', '安装依赖'],
        ['npm start', '启动 Metro（:8090），手机扫码调试'],
        ['npm run android', 'Android 模拟器'],
        ['npm run web', '浏览器（只看样式）'],
        ['npm run type-check', 'TypeScript 类型检查'],
      ],
      uniapp: [
        ['HBuilderX 打开本目录', '运行到浏览器 / 微信开发者工具 / 真机'],
      ],
      wxapp: [
        ['微信开发者工具导入本目录', '编译预览'],
        ['工具 → 构建 npm', '生成 miniprogram_npm（第一次必须先做，否则 TDesign 组件加载不出来）'],
      ],
    }[f.kind] || [];
    return `### ${dir}/（${f.label}）\n\n| 命令 | 说明 |\n| --- | --- |\n${rows.map(([c, d]) => row([`\`${c}\``, d])).join('\n')}`;
  });

  const wxappDir = frontendDirName('wxapp', fes.length);
  const wechatLines = wechat
    ? [
        '- 后端：`backend/src/main/resources/application.yml` 里的 `wechat.appid` / `wechat.secret`'
          + (wechat.appid ? `（当前 AppID \`${wechat.appid}\`）` : '（**还是占位符**，微信登录会失败）'),
        ...(fes.some((f) => f.kind === 'wxapp')
          ? [`- 小程序：\`${wxappDir}/project.config.json\` 里的 \`appid\``]
          : []),
        '- 这套后端是给**原生小程序**（`--fe wxapp`）配的；uni-app / Taro 可以直连接口，但 `wx.login` 换 openid 要自己在各自项目里接',
        '- AppID / AppSecret 在微信公众平台 → 开发管理 → 开发设置里拿；secret 只放后端，不要写进前端',
      ].join('\n')
    : '';

  const dbTarget = dbImported
    ? `数据库已经导入本地 MySQL（库名 \`${db.name}\`），直接启动后端即可。`
    : `先导入数据库（库名 \`${db.name}\`）：\n\n${code('bash', `mysql -u ${db.user} -p --default-character-set=utf8mb4 < docs/${sqlFile}`)}`;

  const dbConfigText = be.id.startsWith('springboot')
    ? '数据库连接配置在 `backend/src/main/resources/application.yml`，库名、账号、密码要与本机一致。'
    : (be.id === 'go' || be.id === 'dotnet')
      ? '数据库连接从环境变量读（`DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`）；项目里没有 `backend/.env` 时按这几个名字新建一个。'
      : '数据库连接配置在 `backend/.env`，库名、账号、密码要与本机一致。';

  // 常见问题只写当前技术栈用得上的，避免 Web 项目里出现小程序提示
  const faq = [
    '- **后端启动报数据库连接失败**：确认已导入 SQL，且配置文件里的库名、账号、密码与本机一致。',
  ];
  if (fes.some((f) => f.kind === 'vite')) {
    faq.push('- **前端请求 404 / 网络错误**：先启动后端；确认 `frontend/.env.development` 指向的端口与后端一致。');
  }
  if (fes.some((f) => f.kind === 'uniapp' || f.kind === 'wxapp')) {
    faq.push('- **小程序请求失败**：真机连不上 localhost，把 `config/index.js` 里的 `LAN_HOST` 改成电脑局域网 IP。');
  }
  if (fes.some((f) => f.kind === 'taro')) {
    faq.push('- **Taro 请求失败**：H5 看 `config/index.js` 的代理，真机把 `src/config/index.js` 里的 `LAN_HOST` 改成电脑局域网 IP。');
  }
  if (fes.some((f) => f.kind === 'rn')) {
    faq.push('- **React Native 请求失败**：真机连不上 `localhost`，把前端目录 `.env` 里的地址改成开发机局域网 IP，再 `npm start -- --clear` 重启（`EXPO_PUBLIC_*` 在启动时内联）。');
  }
  if (wechat) {
    faq.push('- **微信一键登录报 `invalid code` / `40029`**：`application.yml` 里的 `wechat.appid` / `wechat.secret` 与小程序不是同一套，或 AppSecret 重置过。');
    faq.push('- **小程序里 TDesign 组件不显示**：开发者工具没执行「工具 → 构建 npm」，或改了依赖版本后没重新构建。');
  }
  faq.push('- **端口被占用**：改后端配置和前端配置里的端口，再重启。');
  faq.push('- **CLI 命令找不到或版本旧**：用 `npx graduation-kit@latest ...`，或先 `npx clear-npx-cache`。');

  const out = [
    `# ${name}`,
    '',
    '基于 [graduation-kit](https://gitee.com/rain-drops/graduation-kit) 生成。',
    '',
    '## 环境要求',
    '',
    '| 依赖 | 要求 | 用途 |',
    '| --- | --- | --- |',
    ...envRows,
    '',
    '## 技术栈',
    '',
    '| 目录 | 技术 | 启动方式 |',
    '| --- | --- | --- |',
    row(['`backend/`', `${be.label}（${be.lang}）`, RUN_HINT[backendKey(be)] || '见该目录说明']),
    ...feRows,
    '',
    `后端端口 **${be.port}**，前端已配好指向它；改端口时前后端要一起改。`,
    '',
    ...(wechat ? ['## 微信小程序登录', '', wechatLines, ''] : []),
    '## 使用说明',
    '',
    '### 1. 准备数据库',
    '',
    dbTarget,
    '',
    dbConfigText,
    '',
    '### 2. 启动后端',
    '',
    code('bash', `cd backend\n${beRun}`),
    '',
    `后端运行在 **:${be.port}**，接口统一以 \`/api\` 开头。`,
    '',
    '### 3. 启动前端（另开终端）',
    '',
    ...feRuns.flatMap((s) => [s, '']),
    '### 4. 登录',
    '',
    '| 账号 | 密码 | 角色 |',
    '| --- | --- | --- |',
    accountRows,
    '',
    '### 5. 停止',
    '',
    '终端里按 `Ctrl+C`。',
    '',
    ...(info?.readme ? [info.readme.trim()] : []),
    '## 常用命令',
    '',
    `### 后端（${be.label}）`,
    '',
    '| 命令 | 说明 |',
    '| --- | --- |',
    ...beCmdRows.map(([c, d]) => row([`\`${c}\``, d])),
    '',
    ...feCmdSections.flatMap((s) => [s, '']),
    '## 交付打包与 Skills',
    '',
    '### 打包给客户',
    '',
    '双击项目根的 `package-delivery.bat`，或执行：',
    '',
    code('bash', 'npx graduation-kit package .'),
    '',
    `会生成 \`${name}-delivery.zip\`，包含前端、后端和 \`database/${db.name}.sql\`（本地库结构与数据），自动排除 \`node_modules\`、\`target\`、\`dist\`、\`unpackage\` 等构建与依赖产物。`,
    '',
    '常用参数：',
    '',
    '| 参数 | 说明 |',
    '| --- | --- |',
    '| `--no-db` | 只打代码，不带数据库 |',
    '| `--db-file <sql>` | 用指定 SQL 代替 mysqldump 导出 |',
    '| `--out <zip>` | 指定输出路径 |',
    '',
    '### 安装 / 更新 Skills',
    '',
    withSkills
      ? '当前项目已安装到 `.agents/skills/`，新开 Agent 会话即可使用。'
      : '当前项目内没有安装 Agent Skills。',
    '',
    code('bash', [
      '# 装到当前项目（<项目>/.agents/skills/）',
      'npx graduation-kit install',
      'npx graduation-kit update',
      '',
      '# 装到全局（~/.agents/skills/，所有项目可用）',
      'npx graduation-kit install -g',
      'npx graduation-kit update -g',
      '',
      '# 只装某一个',
      'npx graduation-kit install --only thesis-writer',
    ].join('\n')),
    '',
    '`update` 会按当初的安装范围更新；`create` 检测到全局已装时会跳过项目内重复安装，需要项目内独立一份用 `--local-skills`。',
    '',
    '### 自检',
    '',
    code('bash', [
      'npx graduation-kit verify    # 检查项目结构',
      'npx graduation-kit doctor    # 检查 skills 的 frontmatter',
      'npx graduation-kit -v        # 当前 CLI 版本',
    ].join('\n')),
    '',
    '## 目录说明',
    '',
    '- `backend/` 后端代码',
    ...fes.map((f) => `- \`${frontendDirName(f.id, fes.length)}/\` ${f.label}`),
    `- \`docs/${sqlFile}\` 建表脚本，含初始数据`,
    '- `uploads/` 用户上传的图片（内容不入库）',
    '- `package-delivery.bat` 双击打交付包',
    ...(withRedis ? ['- `docs/redis.md` Redis 连接信息、环境检测与安装步骤'] : []),
    ...(withSkills ? ['- `.agents/skills/` Agent Skills，不影响项目运行'] : []),
    '',
    '## 常见问题',
    '',
    ...faq,
    '',
    '## 接口约定',
    '',
    '响应结构统一为 `{ code, message, data }`，HTTP 状态码一律 200，业务结果看 `code`（200 成功）。只有 Token 失效才返回 HTTP 401。',
    '',
    '后端出口已统一转驼峰，前端直接读 `createTime` 这类字段。',
    '',
  ];

  return out.join('\n');
}

/** create --list：列出可选模板与脚手架，未完善的标注出来 */
function listScaffolds() {
  line('');
  line(paint('bold', paint('cyan', '━━━ 可选模板 ━━━')));
  line('');
  line(paint('dim', '  模板决定项目初始状态：干净脚手架或带业务的 demo'));
  line('');
  for (const t of TEMPLATES) {
    const status = t.ready ? paint('green', '✓') : paint('dim', '✗ 未完善');
    const rec = t.id === 'clean' ? paint('yellow', ' ★ 推荐') : '';
    line(`  ${status} ${paint('bold', t.id.padEnd(16))}${rec} ${t.label}`);
    line(`     ${paint('dim', t.note)}`);
    if (t.be) {
      line(`     ${paint('dim', `技术栈固定：${t.be} + ${t.fe.join('、')}`)}`);
    }
    line('');
  }
  
  line(paint('bold', paint('cyan', '━━━ 可选后端框架 ━━━')));
  line(paint('dim', '  （仅 clean 模板需要选择，推荐 Spring Boot）'));
  line('');
  for (const b of BACKENDS) {
    if (!b.ready) continue;
    const rec = b.id === 'springboot' ? paint('yellow', ' ★ 推荐') : '';
    const port = paint('dim', `:${b.port}`);
    const extra = b.id === 'springboot' ? paint('dim', '  企业级主流，面试认可度高') : '';
    line(`  ${paint('green', '✓')} ${paint('bold', b.id.padEnd(16))}${rec} ${b.label.padEnd(22)} ${port}${extra}`);
  }
  const unreadyBe = BACKENDS.filter(b => !b.ready);
  if (unreadyBe.length) {
    line('');
    line(paint('dim', '  未完善：' + unreadyBe.map(b => b.id).join('、')));
  }
  line('');
  
  line(paint('bold', paint('cyan', '━━━ 可选前端框架 ━━━')));
  line(paint('dim', '  （可多选，用逗号分隔；推荐 Vue + Ant Design）'));
  line('');
  for (const f of FRONTENDS) {
    if (!f.ready) continue;
    const rec = f.id === 'vue-antd' ? paint('yellow', ' ★ 推荐') : '';
    const extra = f.id === 'vue-antd' ? paint('dim', '  组件丰富、文档完善、后台首选') : '';
    line(`  ${paint('green', '✓')} ${paint('bold', f.id.padEnd(20))}${rec} ${f.label}${extra}`);
  }
  const unreadyFe = FRONTENDS.filter(f => !f.ready);
  if (unreadyFe.length) {
    line('');
    line(paint('dim', '  未完善：' + unreadyFe.map(f => f.id).join('、')));
  }
  line('');
  
  line(paint('cyan', '━━━ 使用示例 ━━━'));
  line('');
  line('  # 交互式创建（推荐）');
  line(paint('dim', '  npx github:Soulmte/graduation-kit create my-project'));
  line('');
  line('  # 非交互式创建');
  line(paint('dim', '  npx github:Soulmte/graduation-kit create my-project --be springboot --fe vue-antd'));
  line('');
  line('  # 多个前端');
  line(paint('dim', '  npx github:Soulmte/graduation-kit create my-project --be springboot --fe react,vue-antd'));
  line('');
}

/** 把 --template 解析成模板对象，缺省按 clean */
function resolveTemplate(id) {
  if (!id) return findTemplate('clean');
  const t = findTemplate(id);
  if (!t) {
    const available = readyTemplates().map((x) => x.id).join(' / ');
    line('');
    fail(`未知模板: ${id}`);
    line('');
    info('可选模板：');
    readyTemplates().forEach((t) => {
      line(`  ${paint('green', '✓')} ${paint('bold', t.id.padEnd(16))} ${t.label}`);
    });
    line('');
    throw new Error(`请使用有效的模板名: ${available}`);
  }
  if (!t.ready) throw new Error(`${t.id} 模板尚未完善，暂不可选`);
  return t;
}

/**
 * 非交互模式：把 --be / --fe 解析成 item，非法值直接报错退出。
 * demo 模板的技术栈已固定，直接按模板声明取，不看 --be / --fe。
 */
function resolveFlags(opts, template) {
  if (template.be) {
    return {
      be: BACKENDS.find((b) => b.id === template.be),
      fes: template.fe.map((id) => FRONTENDS.find((f) => f.id === id)),
    };
  }

  const be = BACKENDS.find((b) => b.id === opts.be);
  if (!be) {
    line('');
    fail(`未知后端框架: ${opts.be}`);
    line('');
    info('可选后端框架：');
    readyBackends().forEach((b) => {
      const rec = b.id === 'springboot' ? paint('yellow', ' ★ 推荐') : '';
      line(`  ${paint('green', '✓')} ${paint('bold', b.id.padEnd(16))}${rec} ${b.label.padEnd(22)} ${paint('dim', `:${b.port}`)}`);
    });
    line('');
    throw new Error(`请使用有效的后端框架: ${readyBackends().map((b) => b.id).join(' / ')}`);
  }
  if (!be.ready) throw new Error(`${be.id} 脚手架尚未完善，暂不可选`);

  const ids = String(opts.fe || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  if (!ids.length) {
    line('');
    fail('缺少前端框架');
    line('');
    info('可选前端框架（可多选，用逗号分隔）：');
    readyFrontends().forEach((f) => {
      const rec = f.id === 'vue-antd' ? paint('yellow', ' ★ 推荐') : '';
      line(`  ${paint('green', '✓')} ${paint('bold', f.id.padEnd(20))}${rec} ${f.label}`);
    });
    line('');
    throw new Error(`请使用 --fe 指定至少一个前端框架`);
  }
  const fes = ids.map((id) => {
    const f = FRONTENDS.find((x) => x.id === id);
    if (!f) {
      line('');
      fail(`未知前端框架: ${id}`);
      line('');
      info('可选前端框架：');
      readyFrontends().forEach((f) => {
        const rec = f.id === 'vue-antd' ? paint('yellow', ' ★ 推荐') : '';
        line(`  ${paint('green', '✓')} ${paint('bold', f.id.padEnd(20))}${rec} ${f.label}`);
      });
      line('');
      throw new Error(`请使用有效的前端框架: ${readyFrontends().map((x) => x.id).join(' / ')}`);
    }
    if (!f.ready) throw new Error(`${id} 脚手架尚未完善，暂不可选`);
    return f;
  });
  return { be, fes };
}

/**
 * 创建前先看清楚 skills 的现状。
 * 全局装过就不该再往每个新项目里塞一份；项目内已有一份时更不该默默覆盖。
 */
function inspectSkills(ctx, root) {
  const core = ctx.CORE || [];
  const globalDir = join(homedir(), '.agents', 'skills');
  const localDir = join(root, '.agents', 'skills');
  const installed = ctx.installedSkills || (() => []);
  const manifest = ctx.readManifest || (() => null);
  const globalNames = installed(globalDir);
  const localNames = installed(localDir);
  return {
    globalNames,
    localNames,
    globalManifest: manifest(globalDir),
    // 只有核心 skill 全部就位才算“全局已装好”，缺一个都还要补
    globalComplete: core.length > 0 && core.every((n) => globalNames.includes(n)),
  };
}

/**
 * 决定这次创建要不要装 skills。
 * no-skills > force-skills > 项目内已有 > 全局已装 > 正常安装
 */
function planSkills(opts, state) {
  if (opts.noSkills) return { install: false, reason: 'no-skills' };
  if (opts.forceSkills) return { install: true, reason: 'force' };
  if (state.localNames.length) return { install: false, reason: 'local' };
  if (state.globalComplete && !opts.localSkills) return { install: false, reason: 'global' };
  return { install: true, reason: 'fresh' };
}

/** 打印“为什么没装”，避免用户以为装失败 */
function skillSkipNote(state, reason) {
  if (reason === 'local') {
    return `项目内已有 skills（${state.localNames.join('、')}），已保留不覆盖；要覆盖加 --force-skills`;
  }
  if (reason === 'global') {
    const v = state.globalManifest?.version || '未知版本';
    return `已检测到全局 skills（v${v}，${state.globalNames.length} 个），本次不再在项目内重复安装`;
  }
  if (reason === 'no-skills') return '已按 --no-skills 跳过 Agent Skills';
  return '未安装 Agent Skills';
}

/** 把本次 Redis 检测结果落成文档，换台机器也能照着装 */
function redisDoc(cfg, state) {
  const lines = [
    '# Redis 环境说明',
    '',
    '本项目在创建时选择了使用 Redis。',
    '',
    '## 连接信息（默认）',
    '',
    '| 项 | 值 |',
    '| --- | --- |',
    `| host | ${cfg.host} |`,
    `| port | ${cfg.port} |`,
    '| db | 0 |',
    `| password | ${cfg.password ? '已设置' : '空'} |`,
    '',
    '## 环境检测',
    '',
    `检测时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    `- redis-cli：${state?.cli || '未找到'}`,
    `- redis-server：${state?.server || '未找到'}`,
    `- 端口：${state?.open ? '有服务监听' : '未监听'}`,
    `- PING：${state?.pong ? 'PONG' : '无响应'}`,
    `- 版本：${state?.version || '未知'}`,
    `- 结论：${state?.usable ? '可用' : '未就绪'}`,
    '',
  ];
  if (state?.usable) {
    lines.push('## 下一步', '', 'Redis 已可用，可以在业务代码里接缓存、验证码或会话共享。', '');
  } else {
    lines.push('## 安装与启动', '', '```text', ...redisGuide(cfg.host, cfg.port), '```', '');
    lines.push('装好后在项目根执行下面的命令，返回 PONG 即就绪：', '', '```bash',
      `redis-cli -h ${cfg.host} -p ${cfg.port} ping`, '```', '');
  }
  return lines.join('\n');
}

export async function create(opts, ctx) {
  const { SRC_SCAFFOLDS, installSkills } = ctx;
  if (!existsSync(SRC_SCAFFOLDS)) {
    throw new Error(`包内缺少脚手架资源：${SRC_SCAFFOLDS}`);
  }
  if (opts.list) {
    listScaffolds();
    return;
  }

  // --be 或 --template 任一给出都走非交互，方便脚本一行创建
  const interactive = process.stdin.isTTY && !opts.be && !opts.template;
  let name, template, be, fes, db, withSkills, root, skillState, skillReason;
  let importDb = false;
  let importSkipped = false;
  let useRedis = false;
  let redisState = null;
  let dbImported = false;
  const dbConn = {
    host: opts.dbHost || '127.0.0.1',
    port: String(opts.dbPort || '3306'),
    user: opts.dbUser || 'root',
  };
  const redisOpts = {
    host: opts.redisHost || '127.0.0.1',
    port: Number(opts.redisPort) || 6379,
    password: opts.redisPass || '',
  };

  if (!interactive) {
    template = resolveTemplate(opts.template);
    ({ be, fes } = resolveFlags(opts, template));
    name = opts.name || 'my-graduation-project';
    root = resolve(opts.dir || process.cwd(), name);
    db = { name: opts.db || 'scaffold_db', password: opts.dbPass || '', ...dbConn };
    importDb = Boolean(opts.importDb) && !opts.noImportDb;
    useRedis = Boolean(opts.redis) && !opts.noRedis;
    if (useRedis) {
      redisState = await checkRedis(redisOpts);
      if (!redisState.usable) {
        warn('未检测到可用的 Redis');
        if (/NOAUTH|WRONGPASS|invalid password/i.test(redisState.error || '')) {
          line(`  ${paint('dim', '服务在跑，但认证没通过；用 --redis-pass 指定密码')}`);
        }
        redisGuide(redisOpts.host, redisOpts.port).forEach((l) => line(`  ${paint('dim', l)}`));
        line('');
      }
    }
    skillState = inspectSkills(ctx, root);
    const plan = planSkills(opts, skillState);
    withSkills = plan.install;
    skillReason = plan.reason;
  } else {
    line('');
    line(`${paint('bold', paint('cyan', '━━━ 毕业设计脚手架向导 ━━━'))} ${paint('dim', `v${pkgVersion()}`)}`);
    line('');
    line(`${paint('dim', '   一条命令生成：后端 + 前端 + 数据库 + Skills')}`);
    line(`${paint('dim', '   按 Ctrl+C 可随时退出')}`);
    line('');
    line(paint('dim', '─────────────────────────────────────────────────'));
    line('');

    name = await text('项目目录名', {
      def: opts.name || 'my-graduation-project',
      validate: validName,
    });
    root = resolve(opts.dir || process.cwd(), name);
    line('');

    const tplItems = readyTemplates().map((t) => {
      const isClean = t.id === 'clean';
      const recommended = isClean;
      return toItem(t, t.note, recommended);
    });
    template = await select('选择模板', tplItems, 1);
    line('');

    if (template.be) {
      // demo 模板技术栈已固定，不再问后端前端
      be = BACKENDS.find((b) => b.id === template.be);
      fes = template.fe.map((id) => FRONTENDS.find((f) => f.id === id));
      info(`${template.label} 技术栈：${be.label} + ${fes.map((f) => f.label).join('、')}`);
      line('');
    } else {
      const beItems = readyBackends().map((b) => {
        const recommended = b.id === 'springboot';
        let note = `${b.lang}，端口 ${b.port}`;
        if (b.id === 'springboot') {
          note += '  推荐：生态成熟、企业主流';
        }
        return toItem(b, note, recommended);
      });
      line(paint('yellow', '   ★ 推荐 Spring Boot：Java 企业级主流，工具链完善，面试认可度高'));
      line('');
      be = await select('选择后端框架', beItems, 1);
      line('');

      const feItems = readyFrontends().map((f) => {
        // Vue + Ant Design 为首推
        const recommended = f.id === 'vue-antd';
        let note = '';
        if (f.id === 'vue-antd') {
          note = '企业级组件库，开箱即用  推荐：表单表格完善，后台首选';
        } else if (f.id === 'vue-elementplus') {
          note = 'Element Plus，社区广泛使用';
        } else if (f.id === 'react') {
          note = 'React 18，适合现代前端开发';
        } else if (f.id === 'uniapp') {
          note = '跨端开发，一套代码多端运行';
        } else if (f.id === 'wxapp') {
          note = '微信小程序原生开发';
        }
        return toItem(f, note, recommended);
      });
      line(paint('yellow', '   ★ 推荐 Vue + Ant Design：组件丰富、文档完善、适合毕设快速开发'));
      line('');
      fes = await multiselect('选择前端框架（可多选）', feItems, [1]);
      line('');
    }

    const dbName = await text('数据库名', { def: 'scaffold_db', validate: validDbName });
    const dbPass = await text('MySQL root 密码（留空表示无密码）', { 
      def: '', 
      validate: validDbPassword 
    });
    db = { name: dbName, password: dbPass, ...dbConn };
    line('');

    importDb = await confirm('生成后直接把 SQL 导入本地 MySQL？', true);
    if (importDb) {
      const check = checkMysql(db);
      if (!check.ok) {
        importDb = false;
        warn(check.reason === 'missing-client'
          ? '未找到 mysql 客户端，无法自动导入'
          : `MySQL 连接失败：${check.stderr || '请确认服务已启动'}`);
        if (check.reason === 'missing-client') {
          mysqlGuide(db).forEach((l) => line(`  ${paint('dim', l)}`));
        } else {
          line(`  ${paint('dim', mysqlFailureHint(db, check.stderr))}`);
          line(`  ${paint('dim', '也可以先生成项目，之后手动导入。')}`);
        }
        line('');
      } else if (databaseExists(db)) {
        const overwrite = await confirm(`库 ${db.name} 已存在，导入会重建（DROP DATABASE），继续？`, false);
        if (!overwrite) {
          importDb = false;
          importSkipped = true;
          line('  已跳过导入，原库保持不变。');
          line('');
        }
      }
    }

    useRedis = await confirm('是否使用 Redis（缓存 / 验证码 / 会话共享）？', false);
    if (useRedis) {
      info('正在检测 Redis 环境…');
      redisState = await checkRedis(redisOpts);
      if (!redisState.usable && /NOAUTH|WRONGPASS|invalid password|AUTH/i.test(redisState.error || '')) {
        const pass = await text('Redis 密码（留空表示无密码）', { def: redisOpts.password || '' });
        redisOpts.password = pass;
        if (pass) redisState = await checkRedis(redisOpts);
      }
      if (redisState.usable) {
        ok(`Redis 可用${redisState.version ? `（v${redisState.version}）` : ''}`);
      } else {
        warn('未检测到可用的 Redis');
        if (/NOAUTH|WRONGPASS|invalid password/i.test(redisState.error || '')) {
          line(`  ${paint('dim', '服务在跑，但认证没通过；非交互模式可用 --redis-pass 指定密码')}`);
        }
        redisGuide(redisOpts.host, redisOpts.port).forEach((l) => line(`  ${paint('dim', l)}`));
      }
      line('');
    }

    if (opts.noSkills) {
      withSkills = false;
      skillReason = 'no-skills';
    } else {
      skillState = inspectSkills(ctx, root);
      const plan = planSkills(opts, skillState);
      skillReason = plan.reason;
      if (plan.reason === 'local') {
        info(`项目内已有 skills：${skillState.localNames.join('、')}`);
        line(`  ${paint('dim', '默认跳过不覆盖；需要覆盖请加 --force-skills')}`);
      } else if (plan.reason === 'global') {
        const v = skillState.globalManifest?.version || '未知版本';
        info(`检测到全局 skills（v${v}，${skillState.globalNames.length} 个）`);
        line(`  ${paint('dim', '默认不再在项目内装一份；需要独立一份请加 --local-skills')}`);
      }
      const promptText = plan.reason === 'local'
        ? '覆盖项目内已有的 skills？'
        : plan.reason === 'global'
          ? '仍在项目内再装一份 skills？'
          : '同时安装 Agent Skills（需求定义、代码审查、论文写作等）';
      withSkills = await confirm(promptText, plan.install);
    }
    line('');
  }

  // 小程序专用后端：只配原生小程序，AppID / Secret 直接写进后端配置
  let wechat = null;
  if (be.wechat) {
    if (!fes.some((f) => f.kind === 'wxapp')) {
      warn(`${be.label} 只适用于原生小程序前端（--fe wxapp）`);
      line(`  ${paint('dim', 'uni-app / Taro 也能直连这套接口，但 wx.login 那套要在各自项目里自己接')}`);
      line('');
    }
    wechat = { appid: (opts.appid || '').trim(), secret: (opts.secret || '').trim() };
    if (interactive) {
      info('微信登录需要小程序自己的 AppID / AppSecret（公众平台 → 开发管理 → 开发设置）');
      line(`  ${paint('dim', '直接回车可留空，之后改 backend/src/main/resources/application.yml 的 wechat 段')}`);
      wechat.appid = await text('微信 AppID', { def: '', validate: validAppId });
      wechat.secret = await text('微信 AppSecret', { def: '' });
      if (wechat.appid && wechat.secret) {
        ok('AppID / Secret 会写进后端 yml 与小程序的 project.config.json');
      }
      line('');
    }
  }

  const sqlFile = sqlFileName(db.name);
  assertEmptyTarget(root);

  // demo 模板从 demos/<dir>/ 取源，clean 模板走 backends/ frontends/ docs/
  const demo = template.dir ? demoPaths(SRC_SCAFFOLDS, template) : null;
  if (demo && !existsSync(demo.backend)) {
    throw new Error(`包内缺少 ${template.id} 模板资源：${demo.backend}`);
  }

  // 预览，确认后才写盘
  line('');
  line('即将创建：');
  line(`  ${paint('cyan', root)}`);
  line(`    ${paint('dim', `模板 ${template.label}`)}`);
  line(`    backend/${''.padEnd(Math.max(1, 22 - 8))}${be.id}${paint('dim', `  :${be.port}`)}`);
  for (const f of fes) {
    line(`    ${frontendDirName(f.id, fes.length)}/`.padEnd(26) + f.id);
  }
  line(`    docs/${sqlFile}`.padEnd(26) + paint('dim', `库名 ${db.name}`));
  line(`    uploads/`);
  if (wechat) {
    line(`    微信 AppID`.padEnd(26) + paint('dim', wechat.appid || '未填，yml 里留 __WECHAT_APPID__ 占位符'));
  }
  if (importDb) line(`    数据库导入`.padEnd(26) + paint('dim', `${db.user}@${db.host}:${db.port}`));
  if (useRedis) line(`    Redis`.padEnd(26) + paint('dim', redisState?.usable ? '已就绪' : '环境未就绪，见 docs/redis.md'));
  if (withSkills) line(`    .agents/skills/`.padEnd(26) + paint('dim', '7 个核心 skill + 上游增强'));
  else if (skillReason === 'global') line(`    .agents/skills/`.padEnd(26) + paint('dim', '跳过：全局已安装'));
  else if (skillReason === 'local') line(`    .agents/skills/`.padEnd(26) + paint('dim', '跳过：项目内已有'));
  line('');

  if (interactive && !(await confirm('确认创建', true))) {
    line('已取消。');
    closePrompt();
    return;
  }
  closePrompt();

  // ---- 落盘 ----
  line('');
  try {
    mkdirSync(root, { recursive: true });

    copyTree(demo ? demo.backend : join(SRC_SCAFFOLDS, 'backends', be.id), join(root, 'backend'));
    const bePatched = patchBackend(join(root, 'backend'), be, db);
    if (wechat && patchWeChat(join(root, 'backend'), wechat) && !bePatched.includes('application.yml')) {
      bePatched.push('application.yml');
    }
    ok(`backend/ ${paint('dim', `← ${demo ? `${template.id} demo` : be.id}`)}`);
    if (bePatched.length) line(`  ${paint('dim', `已改写 ${bePatched.join('、')}`)}`);

    for (const f of fes) {
      const dirName = frontendDirName(f.id, fes.length);
      copyTree(demo ? demo.frontend : frontendSrc(SRC_SCAFFOLDS, f), join(root, dirName));
      const changed = patchFrontend(join(root, dirName), f, be);
      if (wechat && f.kind === 'wxapp') {
        patchWxAppProject(join(root, dirName), wechat.appid);
      }
      ok(`${dirName}/ ${paint('dim', `← ${demo ? `${template.id} demo` : f.id}`)}`);
      if (changed.length) line(`  ${paint('dim', `已指向 :${be.port}（${changed.join('、')}）`)}`);
    }

    mkdirSync(join(root, 'docs'), { recursive: true });
    copyTree(demo ? demo.docs : join(SRC_SCAFFOLDS, 'docs'), join(root, 'docs'));
    // 后端可能自带专用建库脚本（小程序版多一个 openid 字段），优先用它
    const sqlSource = demo ? 'scaffold_db.sql' : be.sql || 'scaffold_db.sql';
    const sqlFrom = join(root, 'docs', sqlSource);
    const sqlTo = join(root, 'docs', sqlFile);
    // docs 里只留本次用的那份 SQL，避免用户导错库
    for (const f of readdirSync(join(root, 'docs'))) {
      if (f.endsWith('.sql') && f !== sqlSource) rmSync(join(root, 'docs', f), { force: true });
    }
    if (sqlFile !== sqlSource) {
      try {
        renameSync(sqlFrom, sqlTo);
      } catch (err) {
        // 如果重命名失败，尝试拷贝再删除
        const { copyFileSync, unlinkSync } = await import('node:fs');
        copyFileSync(sqlFrom, sqlTo);
        unlinkSync(sqlFrom);
      }
    }
    patchSql(sqlTo, db.name);
    ok(`docs/${sqlFile} ${paint('dim', `库名 ${db.name}`)}`);

    if (importDb) {
      line('');
      info(`正在导入数据库 ${db.name} …`);
      const result = importSqlFile(sqlTo, db);
      if (result.ok) {
        dbImported = true;
        ok(`数据库已导入 ${paint('dim', `${db.user}@${db.host}:${db.port}`)}`);
      } else if (result.reason === 'missing-client') {
        warn('未找到 mysql 客户端，已跳过自动导入');
        mysqlGuide(db).forEach((l) => line(`  ${paint('dim', l)}`));
      } else {
        warn(`数据库导入失败：${result.stderr || '请检查 MySQL 是否启动、账号密码是否正确'}`);
        line(`  ${paint('dim', mysqlFailureHint(db, result.stderr))}`);
        line(`  ${paint('dim', `手动导入：mysql -u ${db.user} -p --default-character-set=utf8mb4 < docs/${sqlFile}`)}`);
      }
    }

    if (useRedis) {
      writeFileSync(join(root, 'docs', 'redis.md'), redisDoc(redisOpts, redisState));
      ok(`docs/redis.md ${paint('dim', redisState?.usable ? 'Redis 已就绪' : '含安装指引')}`);
    }

    mkdirSync(join(root, 'uploads'), { recursive: true });
    writeFileSync(join(root, 'uploads', '.gitkeep'), '');
    ok(`uploads/ ${paint('dim', '用户上传的图片落在这里')}`);

    writeFileSync(join(root, '.gitignore'), GITIGNORE);
    ok(`.gitignore ${paint('dim', '已挡住依赖与构建产物')}`);

    writeFileSync(join(root, 'README.md'), projectReadme({ name, be, fes, db, sqlFile, template, withSkills, withRedis: useRedis, dbImported, wechat }));
    ok(`README.md ${paint('dim', '端口、库名、启动命令存档')}`);

    writeFileSync(join(root, 'package-delivery.bat'), PACKAGE_BAT);
    ok(`package-delivery.bat ${paint('dim', '双击即可打交付包')}`);

    if (withSkills) {
      line('');
      // withUpstream 必须显式给出：上面已经 closePrompt() 关掉了 readline，
      // 否则 install() 会再开一个新的去问上游增强，卡在那儿等一个永远不来的输入。
      await installSkills({
        ...opts,
        dir: root,
        global: false,
        force: true,
        withUpstream: true,
      });
    } else {
      line('');
      line(`  ${paint('dim', skillSkipNote(skillState, skillReason))}`);
    }
  } catch (err) {
    line('');
    fail(`项目生成失败：${err.message || err.code || String(err)}`);
    line('');
    warn(`已生成的部分文件在：${paint('cyan', root)}`);
    line(`请删除该目录后重试，或运行 ${paint('cyan', 'graduation-kit diagnose')} 排查环境问题`);
    line('');
    if (err.stack) console.error(paint('dim', err.stack));
    throw err;
  }

  // ---- 自动验证项目结构（静默模式） ----
  const { verify } = await import('./verify.js');
  const verifyResult = await verify(root, true);
  
  if (verifyResult !== 0) {
    line('');
    warn('项目结构验证发现问题，但不影响使用');
    info('详细信息请运行: graduation-kit verify ' + name);
  }

  // ---- 后续步骤 ----
  line('');
  line(paint('green', '✓ 项目创建成功！'));
  line('');
  line(paint('cyan', '━━━ 下一步操作 ━━━'));
  line('');
  line(paint('bold', '1. 进入项目目录'));
  line(`   cd ${name}`);
  line('');
  line(paint('bold', '2. 数据库'));
  if (dbImported) {
    line(`   ✓ 已导入本地 MySQL：${db.name}（${db.user}@${db.host}:${db.port}）`);
  } else if (importSkipped) {
    line('   已跳过导入，原库保持不变。');
    line(paint('dim', '   需要重建时再执行： ') + `mysql -u ${db.user} -p --default-character-set=utf8mb4 < docs/${sqlFile}`);
  } else {
    line(`   mysql -u ${db.user} -p --default-character-set=utf8mb4 < docs/${sqlFile}`);
    line(paint('dim', '   提示：脚本会自动创建数据库，无需手动建库'));
  }
  line('');
  line(paint('bold', '3. 启动后端'));
  line(`   cd backend && ${RUN_HINT[backendKey(be)] || '见该目录说明'}`);
  line(paint('dim', `   后端端口：${be.port}`));
  line('');
  line(paint('bold', '4. 启动前端（另开终端）'));
  for (const f of fes) {
    const dirName = frontendDirName(f.id, fes.length);
    line(`   cd ${dirName} && ${FE_HINT[f.kind]}`);
  }
  line('');
  line(paint('bold', '5. 登录测试'));
  const demoInfo = DEMO_INFO[template.id];
  if (demoInfo) {
    demoInfo.hints.forEach((h) => line(`   ${paint('dim', h)}`));
  } else {
    line(`   ${paint('dim', '管理员：admin / 123456')}`);
    line(`   ${paint('dim', '普通用户：test / 123456')}`);
  }
  line('');
  if (!db.password) {
    warn('数据库密码留空，启动前请到 backend/ 配置文件中补上');
    line('');
  }
  if (useRedis && !redisState?.usable) {
    warn('Redis 环境未就绪，安装步骤见 docs/redis.md');
    line('');
  }
  if (fes.some((f) => ['uniapp', 'taro', 'wxapp'].includes(f.kind))) {
    warn('小程序真机调试时，需将 config/index.js（Taro 为 src/config/index.js）中的 LAN_HOST 改为电脑局域网 IP');
    line('');
  }
  if (fes.some((f) => f.kind === 'wxapp')) {
    warn('小程序首次打开：开发者工具里先「工具 → 构建 npm」生成 miniprogram_npm，否则 TDesign 组件加载不出来');
    line('');
  }
  if (wechat && (!wechat.appid || !wechat.secret)) {
    warn('微信 AppID / AppSecret 没填全，微信一键登录会失败；补到 backend/src/main/resources/application.yml 的 wechat 段');
    line('');
  }
  if (fes.some((f) => f.kind === 'rn')) {
    warn('React Native 真机调试时，需将前端目录 .env 里的 localhost 改为电脑局域网 IP，再 npm start -- --clear');
    line('');
  }
  line(paint('cyan', '━━━━━━━━━━━━━━━━━━'));
  line('');
  info('详细说明请查看项目根目录的 README.md');
  if (withSkills) {
    info('Agent Skills 已安装到 .agents/skills/，新开会话即可使用');
  } else if (skillReason === 'global') {
    info('Skills 使用全局已安装的版本，本项目未重复安装（需要独立一份加 --local-skills）');
  } else if (skillReason === 'local') {
    info('保留项目内已有的 skills，未覆盖（需要更新加 --force-skills）');
  } else if (skillReason === 'fresh') {
    info('未安装 Agent Skills，之后可在项目目录运行 graduation-kit install 补装');
  }
  line('');
}
