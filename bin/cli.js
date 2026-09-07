#!/usr/bin/env node

// 检查 Node.js 版本
const nodeVersion = process.versions.node;
const [major] = nodeVersion.split('.').map(Number);
if (major < 18) {
  console.error(`\x1b[31m× Node.js 版本过低：${nodeVersion}\x1b[0m`);
  console.error(`\x1b[33m需要 Node.js 18 或更高版本，请升级后再试\x1b[0m`);
  console.error(`\x1b[2m下载地址：https://nodejs.org/\x1b[0m`);
  process.exit(1);
}

import { existsSync, mkdirSync, readdirSync, rmSync, statSync, cpSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, '..');
const SRC_SKILLS = join(PKG_ROOT, 'src', 'skills');
const SRC_VENDOR = join(PKG_ROOT, 'src', 'vendor');
const SRC_SCAFFOLDS = join(PKG_ROOT, 'src', 'scaffolds');

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
  return new Promise((res) => {
    let done = false;
    const finish = (v) => {
      if (done) return;
      done = true;
      rl.close();
      res(v);
    };
    // stdin 已经读到尾（比如调用方先关掉了自己的 readline）时，question 的回调永远不会触发。
    // 不兑这一手，Promise 悬在那儿，Node 直接抬走进程，安装看上去“一秒就过去了”却什么都没做。
    rl.once('close', () => finish(''));
    rl.question(question, finish);
  });
}

/**
 * 决定装哪些上游增强。
 * --with-upstream / --no-upstream 跳过询问；非交互终端默认全装。
 */
async function resolveUpstream(opts) {
  const all = UPSTREAM.map((u) => u.id);
  if (opts.noUpstream) return [];
  if (Array.isArray(opts.upstream)) return opts.upstream;
  if (opts.withUpstream) return all;
  if (!process.stdin.isTTY) return all;

  info('');
  info(`上游增强包${paint('dim', '（已随本包内置，无需联网）')}：`);
  for (const u of UPSTREAM) {
    info(`  ${paint('cyan', u.label.padEnd(16))} ${u.why}`);
    info(`  ${''.padEnd(16)} ${paint('dim', u.license)}`);
  }
  info('');
  const a = (await ask('一并安装？[Y/n/自选] ')).trim().toLowerCase();

  if (a === 'n' || a === 'no') return [];
  if (a === '' || a === 'y' || a === 'yes') return all;

  // 自选：逐个确认
  const picked = [];
  for (const u of UPSTREAM) {
    const b = (await ask(`  装 ${u.label}？[Y/n] `)).trim().toLowerCase();
    if (b !== 'n' && b !== 'no') picked.push(u.id);
  }
  return picked;
}

/** 递归列出目录内所有文件的相对路径（统一用 / 分隔，方便跨平台比对）。
 *  exclude：顶层目录名数组，不参与遍历。 */
function walkFiles(dir, base = dir, out = [], exclude = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(base, full).split(sep).join('/');
    if (exclude.includes(rel)) continue;
    if (entry.isDirectory()) walkFiles(full, base, out, exclude);
    else out.push(rel);
  }
  return out;
}

function countFiles(dir, exclude = []) {
  return existsSync(dir) ? walkFiles(dir, dir, [], exclude).length : 0;
}

/**
 * 目录指纹：文件相对路径 + 内容一起哈希。
 * 用来判断本地那份和包内那份是不是同一份，一致就没必要再拷一遍。
 */
function dirSignature(dir, exclude = []) {
  if (!existsSync(dir)) return null;
  const files = walkFiles(dir, dir, [], exclude).sort();
  const h = createHash('sha1');
  for (const rel of files) {
    h.update(rel);
    h.update('\0');
    h.update(readFileSync(join(dir, rel)));
    h.update('\0');
  }
  return `${files.length}:${h.digest('hex')}`;
}

/** 清空目录，但保留 keep 里的顶层条目（vendor 由它自己的流程管，不能跟着被删） */
function rmExcept(dir, keep = []) {
  for (const entry of readdirSync(dir)) {
    if (keep.includes(entry)) continue;
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

/**
 * 装一个目录（skill 本体或 vendor 资源）。
 *   内容与包内一致   -> 不动盘，记 up-to-date
 *   已存在但内容不同 -> force 时更新，否则跳过
 *   不存在           -> 安装
 * 落盘后核对文件数与 SKILL.md，杀毒拦截或路径超长导致的静默少拷会被抓出来。
 */
function copyDir(label, from, to, opts, counters, { requireSkillMd = true, preserve = [] } = {}) {
  if (!existsSync(from)) {
    fail(`${label}：包内缺少源目录`);
    counters.failed++;
    return 'missing';
  }
  if (requireSkillMd && !existsSync(join(from, 'SKILL.md'))) {
    fail(`${label}：包内缺少 SKILL.md，不是合法 skill`);
    counters.failed++;
    return 'missing';
  }

  const already = existsSync(to);

  if (already && !opts.reinstall) {
    const srcSig = dirSignature(from, preserve);
    if (srcSig && srcSig === dirSignature(to, preserve)) {
      info(`${paint('dim', '=')} ${label} ${paint('dim', '本地已是同一份，跳过')}`);
      counters.upToDate++;
      return 'up-to-date';
    }
    if (!opts.force) {
      warn(`${label} 已存在且内容不同，跳过（加 --force 更新）`);
      counters.skipped++;
      return 'skipped';
    }
  }

  const expected = countFiles(from, preserve);
  if (already) rmExcept(to, preserve);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, force: true, errorOnExist: false });

  const actual = countFiles(to, preserve);
  if (actual < expected) {
    fail(`${label}：应有 ${expected} 个文件，实际只落盘 ${actual} 个`);
    counters.failed++;
    return 'failed';
  }
  if (requireSkillMd && !existsSync(join(to, 'SKILL.md'))) {
    fail(`${label}：SKILL.md 没落盘，agent 认不出这个 skill`);
    counters.failed++;
    return 'failed';
  }

  ok(`${label} ${paint('dim', `${actual} 个文件${already ? '，已更新' : ''}`)}`);
  counters.installed++;
  return already ? 'updated' : 'installed';
}

async function install(opts) {
  const dest = targetDir(opts);
  const counters = { installed: 0, skipped: 0, upToDate: 0, failed: 0 };

  // --only 直接指定时不询问，完全听用户
  const explicit = opts.only ? opts.only.split(',').map((s) => s.trim()) : null;
  const upstream = explicit
    ? UPSTREAM.filter((u) => explicit.includes(u.id)).map((u) => u.id)
    : await resolveUpstream(opts);

  const core = explicit ? explicit.filter((n) => !UPSTREAM.some((u) => u.id === n)) : CORE;

  mkdirSync(dest, { recursive: true });
  info('');
  info(`安装目标：${paint('cyan', dest)}`);
  info('');

  for (const name of core) {
    // graduation-project 下的 vendor/ 是上游资源的存放处，不属于这个 skill 本体，
    // 比对和清理时都要把它撑开，否则这个 skill 永远不可能“已是最新”。
    const preserve = name === 'graduation-project' ? ['vendor'] : [];
    copyDir(name, join(SRC_SKILLS, name), join(dest, name), opts, counters, { preserve });
  }
  for (const id of upstream.filter((i) => UPSTREAM.find((u) => u.id === i)?.kind === 'skill')) {
    copyDir(id, join(SRC_SKILLS, id), join(dest, id), opts, counters);
  }

  // vendor 类上游落到 graduation-project/vendor/，供编排 skill 读取
  const vendorIds = upstream.filter((i) => UPSTREAM.find((u) => u.id === i)?.kind === 'vendor');
  const gpDir = join(dest, 'graduation-project');
  if (vendorIds.length && existsSync(gpDir)) {
    for (const id of vendorIds) {
      copyDir(
        `graduation-project/vendor/${id}`,
        join(SRC_VENDOR, id),
        join(gpDir, 'vendor', id),
        opts,
        counters,
        { requireSkillMd: false },
      );
    }
  } else if (vendorIds.length) {
    warn('未安装 graduation-project，vendor 资源无处存放，已跳过');
  }

  // 收尾再数一遍目录，确认确实落在盘上，而不是只打印了一堆钩
  const landed = existsSync(dest)
    ? readdirSync(dest).filter(
        (n) =>
          statSync(join(dest, n)).isDirectory() && existsSync(join(dest, n, 'SKILL.md')),
      )
    : [];

  info('');
  const parts = [`安装/更新 ${counters.installed} 个`];
  if (counters.upToDate) parts.push(`已是最新 ${counters.upToDate} 个`);
  if (counters.skipped) parts.push(`跳过 ${counters.skipped} 个`);
  if (counters.failed) parts.push(`${paint('red', `失败 ${counters.failed} 个`)}`);
  info(`完成：${parts.join('，')}。`);

  if (landed.length) {
    ok(`当前目录下已就位 ${landed.length} 个 skill：${landed.join('、')}`);
  } else {
    fail('目标目录里没有任何 skill，安装实际并未生效。');
    info(paint('dim', '请跑一次 graduation-kit diagnose 排查环境。'));
  }

  if (counters.failed) {
    process.exitCode = 1;
    return;
  }

  if (counters.skipped) {
    info(paint('dim', '跳过的那几个本地改过或版本不同，想跟包内保持一致就加 --force。'));
  } else if (counters.upToDate && !counters.installed) {
    info(paint('dim', '本地已是最新，没动任何文件（想强制重装加 --reinstall）。'));
  } else {
    info(paint('dim', '提示：新开一个会话，agent 才会加载新 skill。'));
  }
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
  npx github:Soulmte/graduation-kit create [名称]      分步向导：脚手架 + SQL + skills
  npx github:Soulmte/graduation-kit install [选项]     只安装 skills 到 .agents/skills/
  npx github:Soulmte/graduation-kit verify [目录]      验证项目结构与配置完整性
  npx github:Soulmte/graduation-kit diagnose           诊断包完整性与系统兼容性
  npx github:Soulmte/graduation-kit list               列出包内 skill
  npx github:Soulmte/graduation-kit uninstall [选项]   移除已安装的 skill
  npx github:Soulmte/graduation-kit doctor             校验 frontmatter 规范

通用选项：
  -d, --dir <path>      指定工作目录（默认当前目录）
  -f, --force           内容有变化时覆盖已存在的 skill
      --reinstall       不比对内容，直接强制重拷一遍
  -y, --with-upstream   直接带上三个上游增强，不询问
      --no-upstream     只装六个核心 skill

install 专属：
  -g, --global          装到 ~/.agents/skills/（所有项目可用）
  -o, --only <a,b>      只处理指定 skill（跳过上游询问）

create 专属（全部给出则跳过向导，适合脚本）：
  -l, --list            只列出可选模板、脚手架与端口，不创建
  -t, --template <id>   模板：clean（干净脚手架）| trade（交易 demo）| booking（预约 demo）
                        | agent（AI Agent demo，需自备大模型 API Key）
                        选 demo 时技术栈已固定，--be / --fe 会被忽略
      --be <id>         后端，只能一个：springboot | express | flask
                                      | go | dotnet
      --fe <a,b>        前端，可多个：react | vue-elementplus | vue-antd
                                    | vue-naive | uniapp | wxapp
      --db <name>       数据库名（默认 scaffold_db，生成的 SQL 同名）
      --db-pass <pwd>   MySQL root 密码，会写进后端配置
      --no-skills       不安装 skills，只要脚手架

例：
  npx github:Soulmte/graduation-kit create
  npx github:Soulmte/graduation-kit create --list
  npx github:Soulmte/graduation-kit create my-shop --template trade
  npx github:Soulmte/graduation-kit create rent-agent --template agent --db agent_db
  npx github:Soulmte/graduation-kit create smart-library --be springboot --fe react
  npx github:Soulmte/graduation-kit create demo --be express --fe vue-antd,wxapp --db lib_db
  npx github:Soulmte/graduation-kit install -g
  npx github:Soulmte/graduation-kit install --only thesis-writer
`;

function parse(argv) {
  const opts = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-g' || a === '--global') opts.global = true;
    else if (a === '-f' || a === '--force') opts.force = true;
    else if (a === '--reinstall') { opts.reinstall = true; opts.force = true; }
    else if (a === '-d' || a === '--dir') opts.dir = argv[++i];
    else if (a === '-o' || a === '--only') opts.only = argv[++i];
    else if (a === '-y' || a === '--with-upstream') opts.withUpstream = true;
    else if (a === '--no-upstream') opts.noUpstream = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-t' || a === '--template') opts.template = argv[++i];
    else if (a === '--be') opts.be = argv[++i];
    else if (a === '--fe') opts.fe = argv[++i];
    else if (a === '--db') opts.db = argv[++i];
    else if (a === '--db-pass') opts.dbPass = argv[++i];
    else if (a === '--no-skills') opts.noSkills = true;
    else if (a === '-l' || a === '--list') opts.list = true;
    else if (a.startsWith('-')) opts.unknown = a;
    else rest.push(a);
  }
  if (rest[1]) opts.name = rest[1];
  return { cmd: rest[0], opts };
}

const { cmd, opts } = parse(process.argv.slice(2));

if (opts.help || !cmd) {
  info(HELP);
} else if (opts.unknown) {
  fail(`未知选项：${opts.unknown}`);
  info(HELP);
  process.exit(1);
} else if (cmd === 'install') {
  await install(opts);
} else if (cmd === 'create' || cmd === 'new') {
  const { create } = await import('./create.js');
  try {
    await create(opts, { SRC_SCAFFOLDS, installSkills: install });
  } catch (e) {
    const msg = e.message || e.code || String(e);
    fail(msg || '未知错误，请运行 graduation-kit diagnose 检查环境');
    if (e.stack) {
      console.error('\n详细错误：');
      console.error(e.stack);
    }
    process.exit(1);
  }
} else if (cmd === 'list') {
  list();
} else if (cmd === 'uninstall') {
  uninstall(opts);
} else if (cmd === 'doctor') {
  doctor();
} else if (cmd === 'verify') {
  const { verify } = await import('./verify.js');
  const targetDir = opts.dir || opts.name || process.cwd();
  const exitCode = await verify(targetDir);
  process.exit(exitCode);
} else if (cmd === 'diagnose') {
  const { diagnose } = await import('./diagnose.js');
  await diagnose();
} else {
  fail(`未知命令：${cmd}`);
  info(HELP);
  process.exit(1);
}
