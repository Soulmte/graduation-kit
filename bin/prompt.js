/**
 * 极简交互提示：单选、多选、文本、确认。
 * 只用 readline 逐行读取，不接管 TTY 原始模式，避免 Windows 终端兼容问题。
 */
import { createInterface } from 'node:readline';

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', cyan: '\x1b[36m', yellow: '\x1b[33m' };
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);

let rl = null;
function io() {
  if (!rl) rl = createInterface({ input: process.stdin, output: process.stdout });
  return rl;
}
export function closePrompt() {
  if (rl) { rl.close(); rl = null; }
}

function read(q) {
  return new Promise((res) => io().question(q, (a) => res(a.trim())));
}

export async function text(label, { def = '', validate } = {}) {
  for (;;) {
    const hint = def ? paint('dim', ` (${def})`) : '';
    const a = (await read(`${paint('cyan', '?')} ${label}${hint} `)) || def;
    const err = validate ? validate(a) : null;
    if (!err) return a;
    console.log(`  ${paint('yellow', '!')} ${err}`);
  }
}

export async function confirm(label, def = true) {
  const hint = def ? 'Y/n' : 'y/N';
  for (;;) {
    const a = (await read(`${paint('cyan', '?')} ${label} ${paint('dim', `[${hint}]`)} `)).toLowerCase();
    if (!a) return def;
    if (['y', 'yes'].includes(a)) return true;
    if (['n', 'no'].includes(a)) return false;
    console.log(`  ${paint('yellow', '!')} 请输入 y 或 n`);
  }
}

/**
 * 单选。items: [{ id, label, note, recommended }]，返回选中的 item。
 */
export async function select(label, items, def = 1) {
  console.log('');
  console.log(`${paint('cyan', '?')} ${label}`);
  items.forEach((it, i) => {
    const num = paint('green', String(i + 1));
    const rec = it.recommended ? paint('yellow', ' ★') : '';
    const note = it.note ? paint('dim', `  ${it.note}`) : '';
    console.log(`  ${num}) ${it.label}${rec}${note}`);
  });
  for (;;) {
    const a = (await read(`  序号 ${paint('dim', `(${def})`)} `)) || String(def);
    const n = Number(a);
    if (Number.isInteger(n) && n >= 1 && n <= items.length) return items[n - 1];
    console.log(`  ${paint('yellow', '!')} 请输入 1-${items.length} 之间的序号`);
  }
}

/**
 * 多选。输入逗号分隔序号，或 a 全选。返回选中的 item 数组，至少一项。
 */
export async function multiselect(label, items, def = [1]) {
  console.log('');
  console.log(`${paint('cyan', '?')} ${label}`);
  items.forEach((it, i) => {
    const num = paint('green', String(i + 1));
    const rec = it.recommended ? paint('yellow', ' ★') : '';
    const note = it.note ? paint('dim', `  ${it.note}`) : '';
    console.log(`  ${num}) ${it.label}${rec}${note}`);
  });
  console.log(`  ${paint('dim', '(逗号分隔多选，a 全选)')}`);
  const defStr = def.join(',');
  for (;;) {
    const a = (await read(`  序号 ${paint('dim', `(${defStr})`)} `)) || defStr;
    if (a.toLowerCase() === 'a') return [...items];
    const nums = a.split(/[,，\s]+/).filter(Boolean).map(Number);
    const bad = nums.some((n) => !Number.isInteger(n) || n < 1 || n > items.length);
    if (bad || !nums.length) {
      console.log(`  ${paint('yellow', '!')} 请输入 1-${items.length} 之间的序号，用逗号分隔`);
      continue;
    }
    const uniq = [...new Set(nums)];
    return uniq.map((n) => items[n - 1]);
  }
}
