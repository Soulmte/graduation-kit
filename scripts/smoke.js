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
 * 否则 smoke 会直接报未登记，避免新模板惄惄地没人校验。
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
    check(`${want.layout} 已带上`,
      existsSync(join(root, 'frontend', 'src', 'layouts', want.layout)));

    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    check('README 含 demo 说明', want.readme.every((k) => readme.includes(k)));
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
