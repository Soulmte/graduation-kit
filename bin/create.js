/**
 * graduation-kit create —— 分步向导生成毕设项目骨架。
 * 落盘结构与 graduation-project skill 的 §1.5 约定一致。
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { text, confirm, select, multiselect, closePrompt } from './prompt.js';
import {
  BACKENDS, FRONTENDS, readyBackends, readyFrontends, frontendDirName,
  patchBackend, patchFrontend, patchSql, assertEmptyTarget, copyTree,
  validName, validDbName,
} from './scaffold.js';

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', cyan: '\x1b[36m', yellow: '\x1b[33m' };
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);
const line = (s = '') => console.log(s);
const ok = (s) => line(`${paint('green', '✓')} ${s}`);
const warn = (s) => line(`${paint('yellow', '!')} ${s}`);

/** 脚手架条目转 select/multiselect 选项：原字段照留，附加右侧灰色注解 */
const toItem = (s, note) => ({ ...s, note });

const RUN_HINT = {
  springboot: 'mvn spring-boot:run',
  express: 'npm install && npm run dev',
  flask: 'pip install -r requirements.txt && python app.py',
};
const FE_HINT = {
  vite: 'npm install && npm run dev',
  uniapp: 'HBuilderX 打开，或 npm install && npm run dev:h5',
  wxapp: '微信开发者工具直接导入此目录',
};

/** create --list：列出可选脚手架，未完善的标注出来 */
function listScaffolds() {
  line('\n可选后端（一个）');
  for (const b of BACKENDS) {
    const tag = b.ready ? paint('green', ':' + b.port) : paint('dim', '未完善');
    line(`  ${b.id.padEnd(16)} ${b.label.padEnd(22)} ${tag}`);
  }
  line('\n可选前端（可多选）');
  for (const f of FRONTENDS) {
    const tag = f.ready ? '' : paint('dim', '未完善');
    line(`  ${f.id.padEnd(16)} ${f.label}${tag ? '  ' + tag : ''}`);
  }
  line(`\n${paint('dim', '示例：npx graduation-kit create my-app --be springboot --fe react,vue-antd')}\n`);
}

/** 非交互模式：把 --be / --fe 解析成 item，非法值直接报错退出 */
function resolveFlags(opts) {
  const be = BACKENDS.find((b) => b.id === opts.be);
  if (!be) throw new Error(`未知后端 --be ${opts.be}，可选：${readyBackends().map((b) => b.id).join(' / ')}`);
  if (!be.ready) throw new Error(`${be.id} 脚手架尚未完善，暂不可选`);

  const ids = String(opts.fe || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  if (!ids.length) throw new Error('--fe 至少指定一个前端');
  const fes = ids.map((id) => {
    const f = FRONTENDS.find((x) => x.id === id);
    if (!f) throw new Error(`未知前端 --fe ${id}，可选：${readyFrontends().map((x) => x.id).join(' / ')}`);
    if (!f.ready) throw new Error(`${id} 脚手架尚未完善，暂不可选`);
    return f;
  });
  return { be, fes };
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

  const interactive = process.stdin.isTTY && !opts.be;
  let name, be, fes, db, withSkills;

  if (!interactive) {
    ({ be, fes } = resolveFlags(opts));
    name = opts.name || 'my-graduation-project';
    db = { name: opts.db || 'scaffold_db', password: opts.dbPass || '' };
    withSkills = !opts.noSkills;
  } else {
    line('');
    line(paint('cyan', '毕业设计脚手架向导'));
    line(paint('dim', '一个后端 + 一个或多个前端 + 数据库脚本 + skills，按 Ctrl+C 可随时退出'));

    name = await text('项目目录名', {
      def: opts.name || 'my-graduation-project',
      validate: validName,
    });

    const beItems = readyBackends().map((b) => toItem(b, `${b.lang}，端口 ${b.port}`));
    be = await select('选择后端（只能一个）', beItems, 1);

    const feItems = readyFrontends().map((f) => toItem(f));
    fes = await multiselect('选择前端（可多个）', feItems, [1]);

    line('');
    const dbName = await text('数据库名', { def: 'scaffold_db', validate: validDbName });
    const dbPass = await text('MySQL root 密码', { def: '' });
    db = { name: dbName, password: dbPass };

    withSkills = await confirm('同时安装 skills 到 .agents/skills/', true);
  }

  const root = resolve(opts.dir || process.cwd(), name);
  assertEmptyTarget(root);

  // 预览，确认后才写盘
  line('');
  line('即将创建：');
  line(`  ${paint('cyan', root)}`);
  line(`    backend/${''.padEnd(Math.max(1, 22 - 8))}${be.id}${paint('dim', `  :${be.port}`)}`);
  for (const f of fes) {
    line(`    ${frontendDirName(f.id, fes.length)}/`.padEnd(26) + f.id);
  }
  line(`    docs/scaffold_db.sql`.padEnd(26) + paint('dim', `库名 ${db.name}`));
  line(`    uploads/`);
  if (withSkills) line(`    .agents/skills/`.padEnd(26) + paint('dim', '6 个核心 skill'));
  line('');

  if (interactive && !(await confirm('确认创建', true))) {
    line('已取消。');
    closePrompt();
    return;
  }
  closePrompt();

  // ---- 落盘 ----
  line('');
  mkdirSync(root, { recursive: true });

  copyTree(join(SRC_SCAFFOLDS, 'backends', be.id), join(root, 'backend'));
  const bePatched = patchBackend(join(root, 'backend'), be, db);
  ok(`backend/ ${paint('dim', `← ${be.id}`)}`);
  if (bePatched.length) line(`  ${paint('dim', `已改写 ${bePatched.join('、')}`)}`);

  for (const f of fes) {
    const dirName = frontendDirName(f.id, fes.length);
    copyTree(join(SRC_SCAFFOLDS, 'frontends', f.id), join(root, dirName));
    const changed = patchFrontend(join(root, dirName), f, be.port);
    ok(`${dirName}/ ${paint('dim', `← ${f.id}`)}`);
    if (changed.length) line(`  ${paint('dim', `已指向 :${be.port}（${changed.join('、')}）`)}`);
  }

  mkdirSync(join(root, 'docs'), { recursive: true });
  const sqlTo = join(root, 'docs', 'scaffold_db.sql');
  copyTree(join(SRC_SCAFFOLDS, 'docs'), join(root, 'docs'));
  patchSql(sqlTo, db.name);
  ok(`docs/scaffold_db.sql ${paint('dim', `库名 ${db.name}`)}`);

  mkdirSync(join(root, 'uploads'), { recursive: true });
  writeFileSync(join(root, 'uploads', '.gitkeep'), '');
  ok('uploads/');

  if (withSkills) {
    line('');
    await installSkills({ ...opts, dir: root, global: false, force: true });
  }

  // ---- 后续步骤 ----
  line('');
  line(paint('cyan', '下一步'));
  line(`  cd ${name}`);
  line(`  mysql -u root -p --default-character-set=utf8mb4 < docs/scaffold_db.sql`);
  line('');
  line(`  ${paint('dim', '# 后端')}`);
  line(`  cd backend && ${RUN_HINT[be.id] || '见该目录说明'}`);
  line('');
  line(`  ${paint('dim', '# 前端')}`);
  for (const f of fes) {
    line(`  cd ${frontendDirName(f.id, fes.length)} && ${FE_HINT[f.kind]}`);
  }
  if (!db.password) {
    line('');
    warn('数据库密码留空，启动前请到 backend 配置里补上。');
  }
  if (fes.some((f) => f.kind !== 'vite')) {
    line('');
    warn('小程序真机调试连不上 localhost，需把 config/index.js 的 LAN_HOST 改成电脑局域网 IP。');
  }
  line('');
  line(paint('dim', '默认账号：admin / 123456（管理员），test / 123456（普通用户）'));
}
