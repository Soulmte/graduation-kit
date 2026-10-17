/**
 * 触发路由回归测试。
 *
 *   node scripts/eval-triggers.mjs
 *
 * 校验三件事：
 *   1. triggers.yaml 结构可解析，每个 skill 都有 strong 词
 *   2. 固定 prompt 命中预期的 skill（中英文都有）
 *   3. 每个 skill 至少被一个用例覆盖，避免新增 skill 忘了写用例
 *
 * 它测的是路由表本身，不调用模型。改 description / 关键词后跑一遍，
 * 能挡住"改一个词把别的 skill 顶掉"这类回归。
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTriggers, route } from './lib/triggers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const YAML = join(ROOT, 'src', 'skills', 'triggers.yaml');
const CASES = join(HERE, 'evals', 'triggers.json');

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
};
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);

let failed = 0;
const check = (label, cond, detail = '') => {
  if (cond) return;
  failed++;
  console.error(`  ${paint('red', '✗')} ${label}${detail ? ` — ${detail}` : ''}`);
};

let table;
try {
  table = parseTriggers(readFileSync(YAML, 'utf8'));
} catch (e) {
  console.error(`${paint('red', '×')} triggers.yaml 解析失败：${e.message}`);
  process.exit(1);
}

const { cases } = JSON.parse(readFileSync(CASES, 'utf8'));
const ids = table.skills.map((s) => s.id);

console.log(`\n路由表：${table.skills.length} 个 skill，${table.context.length} 个领域词`);
console.log(`用例：${cases.length} 条\n`);

const covered = new Set();
let english = 0;

for (const c of cases) {
  if (c.expect) {
    if (!ids.includes(c.expect)) {
      check(`用例引用了不存在的 skill：${c.expect}`, false, c.prompt);
      continue;
    }
    covered.add(c.expect);
  }
  if (!/[\u4e00-\u9fff]/.test(c.prompt)) english++;

  const result = route(c.prompt, table);
  const ok = result.top === c.expect;
  if (ok) {
    console.log(`  ${paint('green', '✓')} ${c.prompt}`);
  } else {
    failed++;
    const got = result.top || 'null';
    console.error(`  ${paint('red', '✗')} ${c.prompt}`);
    console.error(`     期望 ${c.expect || 'null'}，实际 ${got}`);
    if (result.candidates.length) {
      const detail = result.candidates
        .map((x) => `${x.id}(strong:${x.strong.join('/') || '-'} weak:${x.weak.join('/') || '-'})`)
        .join(' > ');
      console.error(`     ${paint('dim', detail)}`);
    }
  }
}

console.log('');
for (const id of ids) {
  check(`skill 没有正向用例：${id}`, covered.has(id));
}
check('英文用例不足 10 条', english >= 10, `当前 ${english} 条`);

if (failed) {
  console.error(`\n${failed} 项未通过。\n`);
  process.exit(1);
}
console.log(`全部通过（${cases.length} 条用例，英文 ${english} 条）。\n`);
