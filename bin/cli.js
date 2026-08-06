#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, cpSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, '..');
const SRC_SKILLS = join(PKG_ROOT, 'src', 'skills');
const SRC_VENDOR = join(PKG_ROOT, 'src', 'vendor');

/** 本包原创，默认全装 */
const CORE = [
  'graduation-project',
  'thesis-writer',
  'feature-forge',
  'database-designer',
  'api-designer',
  'code-reviewer',
];

/** 上游第三方，安装时询问。kind: skill = 独立 skill；vendor = 落到 graduation-project/vendor/ */
const UPSTREAM = [
  {
    id: 'impeccable',
    kind: 'skill',
    label: 'impeccable',
    license: 'Apache-2.0',
    why: '前端界面设计与工程打磨，毕设前端想做得漂亮时调用',
  },
  {
    id: 'ui-ux-pro-max',
    kind: 'vendor',
    label: 'ui-ux-pro-max',
    license: 'MIT',
    why: '设计系统与配色方案检索，graduation-project 阶段 1.5 风格选型主方案',
  },
  {
    id: 'taste-skill',
    kind: 'vendor',
    label: 'taste-skill',
    license: 'MIT',
    why: '12 个风格子技能（极简/柔和/粗野等），作为风格备选参考',
  },
];

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);
const info = (s) => console.log(s);
const ok = (s) => console.log(`${paint('green', '✓')} ${s}`);
const warn = (s) => console.log(`${paint('yellow', '!')} ${s}`);
const fail = (s) => console.error(`${paint('red', '✗')} ${s}`);

/** 读取 SKILL.md 的 frontmatter，只关心 name 与 description */
function readFrontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

function listSkills() {
  return readdirSync(SRC_SKILLS).filter((n) =>
    statSync(join(SRC_SKILLS, n)).isDirectory(),
  );
}

function targetDir(opts) {
  if (opts.global) return join(homedir(), '.agents', 'skills');
  return join(resolve(opts.dir || process.cwd()), '.agents', 'skills');
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a.trim()); }));
}

/**
 * 决定装哪些上游增强。
 * --with-upstream / --no-upstream 跳过询问；非交互终端默认全装。
 */
async function resolveUpstream(opts) {
  const all = UPSTREAM.map((u) => u.id);
  if (opts.noUpstream) return [];
  if (opts.withUpstream) return all;
  if (!process.stdin.isTTY) return all;

  info('');
  info(`上游增强包${paint('dim', '（已随本包内置，无需联网）')}：`);
  for (const u of UPSTREAM) {
    info(`  ${paint('cyan', u.label.padEnd(16))} ${u.why}`);
    info(`  ${''.padEnd(16)} ${paint('dim', u.license)}`);
  }
  info('');
  const a = (await ask('一并安装？[Y/n/自选] ')).toLowerCase();

  if (a === 'n' || a === 'no') return [];
  if (a === '' || a === 'y' || a === 'yes') return all;

  // 自选：逐个确认
  const picked = [];
  for (const u of UPSTREAM) {
    const b = (await ask(`  装 ${u.label}？[Y/n] `)).toLowerCase();
    if (b !== 'n' && b !== 'no') picked.push(u.id);
  }
  return picked;
}

function copySkill(name, dest, opts, counters) {
  const from = join(SRC_SKILLS, name);
  if (!existsSync(join(from, 'SKILL.md'))) {
    fail(`${name}：包内不存在这个 skill`);
    return;
  }
  const to = join(dest, name);
  if (existsSync(to) && !opts.force) {
    warn(`${name} 已存在，跳过（--force 覆盖）`);
    counters.skipped++;
    return;
  }
  if (existsSync(to)) rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  ok(name);
  counters.installed++;
}

async function install(opts) {
  const dest = targetDir(opts);
  const counters = { installed: 0, skipped: 0 };

  // --only 直接指定时不询问，完全听用户
  const explicit = opts.only ? opts.only.split(',').map((s) => s.trim()) : null;
  const upstream = explicit
    ? UPSTREAM.filter((u) => explicit.includes(u.id)).map((u) => u.id)
    : await resolveUpstream(opts);

  const core = explicit ? explicit.filter((n) => !UPSTREAM.some((u) => u.id === n)) : CORE;

  mkdirSync(dest, { recursive: true });
  info('');
  info(`安装目标：${paint('cyan', dest)}`);

  for (const name of core) copySkill(name, dest, opts, counters);
  for (const id of upstream.filter((i) => UPSTREAM.find((u) => u.id === i)?.kind === 'skill')) {
    copySkill(id, dest, opts, counters);
  }

  // vendor 类上游落到 graduation-project/vendor/，供编排 skill 读取
  const vendorIds = upstream.filter((i) => UPSTREAM.find((u) => u.id === i)?.kind === 'vendor');
  const gpDir = join(dest, 'graduation-project');
  if (vendorIds.length && existsSync(gpDir)) {
    for (const id of vendorIds) {
      const from = join(SRC_VENDOR, id);
      const to = join(gpDir, 'vendor', id);
      if (!existsSync(from)) continue;
      if (existsSync(to) && !opts.force) {
        warn(`vendor/${id} 已存在，跳过`);
        counters.skipped++;
        continue;
      }
      if (existsSync(to)) rmSync(to, { recursive: true, force: true });
      cpSync(from, to, { recursive: true });
      ok(`graduation-project/vendor/${id}`);
      counters.installed++;
    }
  } else if (vendorIds.length) {
    warn('未安装 graduation-project，vendor 资源无处存放，已跳过');
  }

  info('');
  info(`完成：安装 ${counters.installed} 个，跳过 ${counters.skipped} 个。`);
  info(paint('dim', '提示：新开一个会话，agent 才会加载新 skill。'));
}

function list() {
  const cut = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);
  info('');
  info(`${paint('cyan', '核心 skill')}${paint('dim', '（默认全装）')}\n`);
  for (const name of CORE) {
    const fm = readFrontmatter(join(SRC_SKILLS, name, 'SKILL.md')) || {};
    info(`  ${name.padEnd(20)} ${cut(fm.description || '', 88)}`);
  }
  info('');
  info(`${paint('cyan', '上游增强')}${paint('dim', '（安装时询问）')}\n`);
  for (const u of UPSTREAM) {
    const tag = u.kind === 'skill' ? '独立 skill' : 'vendor 资源';
    info(`  ${u.id.padEnd(20)} ${u.why}`);
    info(`  ${''.padEnd(20)} ${paint('dim', `${tag} · ${u.license}`)}`);
  }
  info('');
}

function uninstall(opts) {
  const dest = targetDir(opts);
  const wanted = opts.only ? opts.only.split(',').map((s) => s.trim()) : listSkills();
  let n = 0;
  for (const name of wanted) {
    for (const to of [join(dest, name), join(dest, 'graduation-project', 'vendor', name)]) {
      if (!existsSync(to)) continue;
      rmSync(to, { recursive: true, force: true });
      ok(`已移除 ${name}`);
      n++;
    }
  }
  info(`移除 ${n} 个。`);
}

/** 校验每个 skill 的 frontmatter 是否符合规范 */
function doctor() {
  const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  let bad = 0;
  for (const dir of listSkills()) {
    const file = join(SRC_SKILLS, dir, 'SKILL.md');
    const fm = readFrontmatter(file);
    if (!fm) {
      fail(`${dir}：缺 frontmatter`);
      bad++;
      continue;
    }
    const errs = [];
    if (!fm.name) errs.push('缺 name');
    else if (fm.name !== dir) errs.push(`name “${fm.name}” 与目录名不一致`);
    else if (!NAME_RE.test(fm.name)) errs.push(`name “${fm.name}” 不合法`);
    if (!fm.description) errs.push('缺 description');
    else if (fm.description.length > 1024) errs.push('description 超 1024 字符');
    else if (fm.description.length < 40) errs.push(`description 仅 ${fm.description.length} 字符，触发信号太弱`);

    if (errs.length) {
      fail(`${dir}：${errs.join('；')}`);
      bad += errs.length;
    } else {
      ok(`${dir}（description ${fm.description.length} 字符）`);
    }
  }
  info('');
  if (bad) {
    fail(`${bad} 个问题。`);
    process.exit(1);
  }
  ok('全部通过。');
}

const HELP = `
graduation-kit — 毕业设计一件套 agent skills

用法：
  npx graduation-kit install [选项]     安装到 .agents/skills/
  npx graduation-kit list               列出包内 skill
  npx graduation-kit uninstall [选项]   移除已安装的 skill
  npx graduation-kit doctor             校验 frontmatter 规范

选项：
  -g, --global          装到 ~/.agents/skills/（所有项目可用）
  -d, --dir <path>      指定项目目录（默认当前目录）
  -f, --force           覆盖已存在的 skill
  -o, --only <a,b>      只处理指定 skill（跳过上游询问）
  -y, --with-upstream   直接带上三个上游增强，不询问
      --no-upstream     只装六个核心 skill

例：
  npx graduation-kit install -g
  npx graduation-kit install --with-upstream
  npx graduation-kit install --only thesis-writer
`;

function parse(argv) {
  const opts = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-g' || a === '--global') opts.global = true;
    else if (a === '-f' || a === '--force') opts.force = true;
    else if (a === '-d' || a === '--dir') opts.dir = argv[++i];
    else if (a === '-o' || a === '--only') opts.only = argv[++i];
    else if (a === '-y' || a === '--with-upstream') opts.withUpstream = true;
    else if (a === '--no-upstream') opts.noUpstream = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else rest.push(a);
  }
  return { cmd: rest[0], opts };
}

const { cmd, opts } = parse(process.argv.slice(2));

if (opts.help || !cmd) {
  info(HELP);
} else if (cmd === 'install') {
  await install(opts);
} else if (cmd === 'list') {
  list();
} else if (cmd === 'uninstall') {
  uninstall(opts);
} else if (cmd === 'doctor') {
  doctor();
} else {
  fail(`未知命令：${cmd}`);
  info(HELP);
  process.exit(1);
}
