/**
 * 端到端自检：把每个 ready 的后端各生成一次，检查端口、库名、密码、uploads 层级都改对了。
 * 只读校验，全部落在系统临时目录，跑完即删。
 *   node scripts/smoke.js
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readyBackends, readyFrontends, readyTemplates, sqlFileName } from '../bin/scaffold.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(ROOT, 'bin', 'cli.js');
const FE = readyFrontends()[0].id;
const DB = 'smoke_db';
const PASS = 'smoke-pass';

let failed = 0;
const check = (label, cond, detail) => {
  if (cond) return console.log(`  \u2713 ${label}`);
  failed++;
  console.error(`  \u2717 ${label}${detail ? ` \u2014 ${detail}` : ''}`);
};

/**
 * 各 demo 模板的预期产物。新增模板必须往这里补一项，
 * 否则 smoke 会直接报未登记，避免新模板悄悄地没人校验。
 */
const DEMO_EXPECT = {
  trade: {
    tables: ['merchant', 'category', 'product', 'cart_item',
      'orders', 'order_item', 'payment', 'refund'],
    views: {
      merchant: ['Shop.vue', 'ProductManage.vue', 'OrderManage.vue', 'RefundAudit.vue'],
      user: ['Mall.vue', 'ProductDetail.vue', 'Cart.vue', 'Checkout.vue', 'MyOrder.vue'],
      admin: ['MerchantManage.vue', 'CategoryManage.vue'],
    },
    layout: 'MerchantLayout.vue',
    readme: ['交易 demo 说明', '订单状态机'],
  },
  booking: {
    tables: ['provider', 'service_category', 'service_item',
      'time_slot', 'appointment', 'review'],
    views: {
      provider: ['Shop.vue', 'ServiceManage.vue', 'ScheduleManage.vue',
        'AppointmentManage.vue', 'ReviewManage.vue'],
      user: ['ServiceList.vue', 'ServiceDetail.vue', 'MyAppointment.vue'],
      admin: ['ProviderManage.vue', 'ServiceCategoryManage.vue', 'AppointmentManage.vue'],
    },
    layout: 'ProviderLayout.vue',
    readme: ['预约 demo 说明', '预约状态机'],
  },
  agent: {
    tables: ['model_config', 'agent', 'knowledge', 'conversation', 'message'],
    views: {
      admin: ['ModelConfigManage.vue', 'AgentManage.vue', 'AgentFlow.vue',
        'KnowledgeManage.vue', 'ConversationManage.vue'],
      user: ['AgentList.vue', 'Chat.vue'],
    },
    components: ['FlowNode.vue'],
    readme: ['AI Agent demo 说明', '先把 API Key 填上'],
  },
};

/**
 * 每个 ready 前端至少要有这些文件。新增前端忘了打包、或者目录被清空，
 * smoke 会直接报，不用等用户生成项目才发现。
 */
const FE_EXPECT = {
  react: ['package.json', 'vite.config.js', 'src/main.jsx', 'src/App.jsx'],
  'vue-elementplus': ['package.json', 'vite.config.js', 'src/main.js', 'src/App.vue'],
  'vue-antd': ['package.json', 'vite.config.js', 'src/main.js', 'src/App.vue'],
  'vue-naive': ['package.json', 'vite.config.js', 'src/main.js', 'src/App.vue'],
  uniapp: ['pages.json', 'App.vue', 'main.js', 'pages/login/index.vue', 'components/TabBar.vue', 'pages/settings/index.vue', 'pages/message/index.vue', 'data/messages.js', 'utils/message.js', 'utils/assets.js', 'static/tab/tab-home.png', 'static/avatar/default-avatar.png', 'common/styles/common.scss'],
  'react-native': ['package.json', 'app.json', 'global.css', 'src/app/_layout.tsx', 'src/app/login.tsx', 'src/app/profile/password.tsx', 'src/theme/tabbar.css', 'src/theme/typography.css', 'src/components/AppToast.tsx', 'src/components/ConfirmDialog.tsx', '.env'],
  taro: ['package.json', 'config/index.js', 'src/app.config.js', 'src/pages/login/index.vue', 'src/static/tab/tab-home.png', 'src/assets/index.js', 'src/components/TabBar.vue', 'src/pages/settings/index.vue', 'src/pages/settings/index.config.js', 'src/pages/message/index.vue', 'src/data/messages.js', 'src/utils/message.js', 'src/styles/common.scss', 'src/styles/_variables.scss', 'src/styles/_mixins.scss'],
  wxapp: ['app.json', 'project.config.json', 'pages/login/login.js', 'utils/assets.js', 'static/avatar/default-avatar.png', 'styles/common.wxss'],
};

/** 各前端把后端端口写在哪里，用于确认 patchFrontend 真的改到了 */
const PORT_FILES = {
  vite: ['.env.development'],
  rn: ['.env'],
  uniapp: ['config/index.js'],
  taro: ['config/index.js', 'src/config/index.js'],
  wxapp: ['config/index.js'],
};

/**
 * 找出解析后没落在项目根 uploads/ 的相对路径引用。
 * 两种写法基准不同：拼在 __dirname / __file__ 上的以文件所在目录为基准，
 * 其余是配置默认值，运行时以后端目录（进程工作目录）为基准。
 */
function staleUploadRefs(beDir, wantDir) {
  const hits = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'target') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|ts|py|go|cs|json|yml|yaml)$|^\.env$/.test(e.name)) continue;
      const text = readFileSync(p, 'utf8');
      for (const m of text.matchAll(/(?:\.\.\/)+uploads/g)) {
        const from = text.lastIndexOf('\n', m.index) + 1;
        let to = text.indexOf('\n', m.index);
        if (to < 0) to = text.length;
        const base = /__dirname|__file__/.test(text.slice(from, to)) ? d : beDir;
        if (resolve(base, m[0]) !== wantDir) hits.push(`${p.slice(beDir.length + 1)} → ${m[0]}`);
      }
    }
  };
  walk(beDir);
  return hits;
}

const work = mkdtempSync(join(tmpdir(), 'gk-smoke-'));
try {
  for (const be of readyBackends()) {
    console.log(`\n${be.id}`);
    const name = `smoke-${be.id}`;
    execFileSync(process.execPath, [
      CLI, 'create', name, '--be', be.id, '--fe', FE,
      '--db', DB, '--db-pass', PASS, '--no-skills', '-d', work,
    ], { stdio: 'pipe' });

    const root = join(work, name);
    const sql = join(root, 'docs', sqlFileName(DB));
    check('生成 backend/ frontend/ docs/ uploads/', ['backend', 'frontend', 'docs', 'uploads']
      .every((d) => existsSync(join(root, d))));
    check('交付打包脚本已写入', existsSync(join(root, 'package-delivery.bat')));
    check(`SQL 文件名跟随库名（${sqlFileName(DB)}）`, existsSync(sql));
    check('SQL 内的库名已改写', existsSync(sql) && readFileSync(sql, 'utf8').includes(`\`${DB}\``));

    const stale = staleUploadRefs(join(root, 'backend'), join(root, 'uploads'));
    check('后端 uploads 相对路径都指向项目根', stale.length === 0, stale.join('、'));

    const feEnv = join(root, 'frontend', '.env.development');
    check(`前端指向 :${be.port}`, existsSync(feEnv)
      && readFileSync(feEnv, 'utf8').includes(`:${be.port}`));

    const dotenv = join(root, 'backend', '.env');
    if (existsSync(dotenv)) {
      const t = readFileSync(dotenv, 'utf8');
      check('.env 已填库名与密码', t.includes(`DB_NAME=${DB}`) && t.includes(`DB_PASSWORD=${PASS}`));
      check('.env 无遗留占位符', !t.includes('__DB_PASSWORD__'));
    }
    const yml = join(root, 'backend', 'src', 'main', 'resources', 'application.yml');
    if (existsSync(yml)) {
      const t = readFileSync(yml, 'utf8');
      check('application.yml 已填库名与密码', t.includes(`/${DB}?`) && t.includes(PASS));
      check('application.yml 无遗留占位符', !t.includes('__DB_PASSWORD__'));
    }

    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    check('README 含环境/使用/命令/交付章节', ['## 环境要求', '## 使用说明', '## 常用命令', '## 交付打包与 Skills']
      .every((h) => readme.includes(h)));
    check('README 含打包与 skills 命令', readme.includes('npx graduation-kit package .')
      && readme.includes('npx graduation-kit update') && readme.includes('npx graduation-kit install'));
  }

  // demo 模板：技术栈固定，落盘后应当带上业务表与业务页面
  for (const tpl of readyTemplates().filter((t) => t.dir)) {
    console.log(`\n模板 ${tpl.id}`);
    const want = DEMO_EXPECT[tpl.id];
    if (!want) {
      check(`${tpl.id} 模板已在 smoke 里登记预期值`, false, '请往 DEMO_EXPECT 补一项');
      continue;
    }
    const name = `smoke-tpl-${tpl.id}`;
    execFileSync(process.execPath, [
      CLI, 'create', name, '--template', tpl.id,
      '--db', DB, '--db-pass', PASS, '--no-skills', '-d', work,
    ], { stdio: 'pipe' });

    const root = join(work, name);
    const sql = join(root, 'docs', sqlFileName(DB));
    check('生成 backend/ frontend/ docs/ uploads/', ['backend', 'frontend', 'docs', 'uploads']
      .every((d) => existsSync(join(root, d))));
    check(`SQL 文件名跟随库名（${sqlFileName(DB)}）`, existsSync(sql));

    const sqlText = existsSync(sql) ? readFileSync(sql, 'utf8') : '';
    check('SQL 内的库名已改写', sqlText.includes(`\`${DB}\``));
    check('SQL 无遗留 scaffold_db', !sqlText.includes('scaffold_db'));

    const missing = want.tables.filter((t) => !sqlText.includes(`CREATE TABLE \`${t}\``));
    check(`${want.tables.length} 张业务表齐全`, missing.length === 0, missing.join('、'));

    const be = readyBackends().find((b) => b.id === tpl.be);
    const stale = staleUploadRefs(join(root, 'backend'), join(root, 'uploads'));
    check('后端 uploads 相对路径都指向项目根', stale.length === 0, stale.join('、'));

    const feEnv = join(root, 'frontend', '.env.development');
    check(`前端指向 :${be.port}`, existsSync(feEnv)
      && readFileSync(feEnv, 'utf8').includes(`:${be.port}`));

    const yml = join(root, 'backend', 'src', 'main', 'resources', 'application.yml');
    if (existsSync(yml)) {
      const t = readFileSync(yml, 'utf8');
      check('application.yml 已填库名与密码', t.includes(`/${DB}?`) && t.includes(PASS));
      check('application.yml 无遗留占位符', !t.includes('__DB_PASSWORD__'));
    }

    // 业务页面与第三方布局都得跟着过来，否则路由会指向不存在的组件
    const views = join(root, 'frontend', 'src', 'views');
    for (const [sub, files] of Object.entries(want.views)) {
      const lack = files.filter((f) => !existsSync(join(views, sub, f)));
      check(`${sub} 端 ${files.length} 个页面都在`, lack.length === 0, lack.join('、'));
    }

    // layout 只有引入第三种角色的 demo 才有（商家 / 机构），
    // agent 这类只有 admin + user 的模板不填这一项
    if (want.layout) {
      check(`${want.layout} 已带上`,
        existsSync(join(root, 'frontend', 'src', 'layouts', want.layout)));
    }

    // demo 自带的业务组件（如画布节点）也得在，否则页面 import 会空
    for (const comp of want.components || []) {
      check(`components/${comp} 已带上`,
        existsSync(join(root, 'frontend', 'src', 'components', comp)));
    }

    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    check('README 含 demo 说明', want.readme.every((k) => readme.includes(k)));
  }

  // 每个前端各生成一次，确认目录、关键文件与端口改写都在
  const feBackend = readyBackends()[0];
  for (const fe of readyFrontends()) {
    console.log(`\n前端 ${fe.id}`);
    const name = `smoke-fe-${fe.id}`;
    execFileSync(process.execPath, [
      CLI, 'create', name, '--be', feBackend.id, '--fe', fe.id,
      '--db', DB, '--db-pass', PASS, '--no-skills', '-d', work,
    ], { stdio: 'pipe' });

    const root = join(work, name);
    const dir = join(root, 'frontend');
    const want = FE_EXPECT[fe.id];
    check(`${fe.id} 已在 smoke 登记预期文件`, Boolean(want), '请往 FE_EXPECT 补一项');
    if (!want) continue;

    const missing = want.filter((f) => !existsSync(join(dir, f)));
    check(`${fe.id} 关键文件齐全`, missing.length === 0, missing.join('、'));

    for (const rel of PORT_FILES[fe.kind] || []) {
      const file = join(dir, rel);
      check(`${fe.id} ${rel} 已指向 :${feBackend.port}`,
        existsSync(file) && readFileSync(file, 'utf8').includes(`:${feBackend.port}`));
    }

    if (fe.id === 'uniapp') {
      const pages = JSON.parse(readFileSync(join(dir, 'pages.json'), 'utf8'));
      check('uniapp 没有原生 tabBar', !('tabBar' in pages));
    }
    if (['uniapp', 'taro', 'wxapp'].includes(fe.id)) {
      const leftovers = [
        'static/tab-home.png', 'src/static/tab-home.png',
        'static/logo.png', 'static/default-avatar.png',
      ].filter((p) => existsSync(join(dir, p)));
      check(`${fe.id} 静态资源已归入二级目录`, leftovers.length === 0, leftovers.join('、'));
    }
    if (fe.id === 'taro') {
      const appConfig = readFileSync(join(dir, 'src', 'app.config.js'), 'utf8');
      check('taro 没有原生 tabBar', !/tabBar\s*:/.test(appConfig));
    }

    const mobileStyle = {
      uniapp: 'common/styles/common.scss',
      taro: 'src/styles/common.scss',
      wxapp: 'styles/common.wxss',
    }[fe.id];
    if (mobileStyle) {
      const css = readFileSync(join(dir, mobileStyle), 'utf8');
      check(`${fe.id} 公共样式禁止横向溢出`,
        /overflow-x:\s*hidden/.test(css) && /max-width:\s*100%/.test(css));
      if (fe.id !== 'wxapp') {
        const tabPath = fe.id === 'taro' ? 'src/components/TabBar.vue' : 'components/TabBar.vue';
        const tab = readFileSync(join(dir, tabPath), 'utf8');
        check(`${fe.id} TabBar 自带等高占位块`,
          tab.includes('tabbar-spacer') && tab.includes('boundingClientRect'));
      }
      if (fe.id === 'uniapp' || fe.id === 'taro') {
        const about = fe.id === 'taro' ? 'src/pages/about/index.vue' : 'pages/about/index.vue';
        const text = readFileSync(join(dir, about), 'utf8');
        check(`${fe.id} 关于页技术栈跟随所选后端`,
          text.includes("'Spring Boot'") && !text.includes("'Express'"));
      }
    }
  }

  // 创建选项：Redis 说明与交付脚本
  console.log('\n创建选项');
  const optName = 'smoke-options';
  execFileSync(process.execPath, [
    CLI, 'create', optName, '--be', readyBackends()[0].id, '--fe', 'react',
    '--db', DB, '--no-skills', '--redis', '--no-import-db', '-d', work,
  ], { stdio: 'pipe' });
  const optRoot = join(work, optName);
  const bat = join(optRoot, 'package-delivery.bat');
  check('交付脚本存在且调用 package', existsSync(bat)
    && readFileSync(bat, 'utf8').includes('graduation-kit')
    && readFileSync(bat, 'utf8').includes('package .'));
  check('选择 Redis 后生成 docs/redis.md', existsSync(join(optRoot, 'docs', 'redis.md')));

  // 交付打包：不带数据库也能出包，依赖与构建产物必须被排除
  console.log('\n交付打包');
  const pkgSrc = join(work, `smoke-${readyBackends()[0].id}`);
  const pkgOut = join(work, 'delivery.zip');
  execFileSync(process.execPath, [
    CLI, 'package', pkgSrc, '--no-db', '--out', pkgOut,
  ], { stdio: 'pipe' });
  check('交付包已生成', existsSync(pkgOut));
  if (existsSync(pkgOut)) {
    let names = [];
    try {
      names = execFileSync('unzip', ['-Z1', pkgOut], { encoding: 'utf8' })
        .split(/\r?\n/).filter(Boolean);
    } catch {
      // 本机没 unzip 就只验文件存在，CI 的 ubuntu 一定有
    }
    if (names.length) {
      const projectName = `smoke-${readyBackends()[0].id}`;
      check('交付包包含 backend/ 与 frontend/', names.some((n) => n.startsWith(`${projectName}/backend/`))
        && names.some((n) => n.startsWith(`${projectName}/frontend/`)));
      check('交付包不含依赖与构建产物', !names.some((n) => /\/(node_modules|target|dist|unpackage|__pycache__)\//.test(n)));
      check('交付包不含 skills', !names.some((n) => n.includes('/.agents/')));
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log('');
if (failed) {
  console.error(`${failed} 项未通过。`);
  process.exit(1);
}
console.log('全部通过。');
