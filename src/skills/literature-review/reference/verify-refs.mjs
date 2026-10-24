#!/usr/bin/env node
/**
 * 文献真实性核验（联网）。
 *
 *   node verify-refs.mjs [docs/thesis] [--offline] [--json]
 *
 * 与 thesis-writer 的 check-refs.mjs 分工：
 *   - check-refs.mjs 查「引用格式」，纯离线
 *   - 本脚本查「文献是否真的存在」，需要联网
 *
 * 每条 reference 的处理：
 *   - 有 doi  → 查 Crossref，比对标题相似度与出版年
 *   - 只有 url → 请求一次，只看能否打开（标题/年份仍需人工核对）
 *   - 都没有   → 直接判失败
 *
 * 退出码：0 全部通过（可能有待人工项）；1 存在失败项。
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const dir = resolve(args.find((a) => !a.startsWith('--')) || 'docs/thesis');
const OFFLINE = flags.has('--offline');
const AS_JSON = flags.has('--json');
const TIMEOUT = 20000;
const UA = 'graduation-kit-literature-review/1.6.0 (+https://github.com/Soulmte/graduation-kit)';

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 只留字母数字，用来比对标题（大小写、标点、空格差异都忽略） */
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** 双字组相似度，0~1 */
function dice(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const bigrams = (s) => {
    const out = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      out.set(g, (out.get(g) || 0) + 1);
    }
    return out;
  };
  const ga = bigrams(a);
  const gb = bigrams(b);
  let hit = 0;
  for (const [g, n] of ga) hit += Math.min(n, gb.get(g) || 0);
  const total = Math.max(a.length - 1, 0) + Math.max(b.length - 1, 0);
  return total ? (2 * hit) / total : 0;
}

function titleMatches(expected, actual) {
  const a = normalize(expected);
  const b = normalize(actual);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return dice(a, b) >= 0.8;
}

function normalizeDoi(raw) {
  return String(raw || '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT),
    redirect: 'follow',
  });
  if (res.status === 404) return { status: 404, data: null };
  if (!res.ok) return { status: res.status, data: null };
  return { status: res.status, data: await res.json() };
}

async function headOrGet(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' },
    signal: AbortSignal.timeout(TIMEOUT),
    redirect: 'follow',
  });
  return { status: res.status, finalUrl: res.url };
}

// ---------------------------------------------------------------- 入口

const file = join(dir, 'refs-source.json');
if (!existsSync(file)) {
  console.error(`× 找不到 ${file}`);
  console.error('  先由 literature-review 检索并生成该文件，再核验。');
  process.exit(1);
}

let policy;
try {
  policy = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`× refs-source.json 解析失败：${e.message}`);
  process.exit(1);
}

const refs = Array.isArray(policy.references) ? policy.references : [];
if (!refs.length) {
  console.error('× references 为空，没有可核验的文献。');
  process.exit(1);
}

if (!AS_JSON) {
  console.log('');
  console.log(`文献核验：${file}（${refs.length} 条）`);
  if (OFFLINE) console.log(paint('yellow', '  离线模式：只做结构检查，不联网'));
  console.log('');
}

const results = [];
let failures = 0;

for (const [index, ref] of refs.entries()) {
  const n = Number.isInteger(ref.n) ? ref.n : index + 1;
  const label = `[${String(n).padStart(2, ' ')}]`;
  const doi = normalizeDoi(ref.doi);
  const url = String(ref.url || '').trim();
  const item = { n, title: ref.title || '', doi, status: 'pass', detail: '' };

  // 结构底线：结构性缺项一律算失败，不联网也查得出来
  const missing = ['authors', 'title', 'venue', 'quote'].filter(
    (k) => !String(ref[k] || '').trim(),
  );
  if (!doi && !url) missing.push('doi 或 url');
  if (missing.length) {
    item.status = 'fail';
    item.detail = `缺 ${missing.join(' / ')}`;
    failures++;
    results.push(item);
    if (!AS_JSON) console.log(`  ${paint('red', '✗')} ${label} ${item.detail}`);
    continue;
  }

  if (OFFLINE) {
    item.status = 'pass';
    item.detail = '仅结构检查';
    results.push(item);
    if (!AS_JSON) console.log(`  ${paint('dim', '·')} ${label} 结构完整${doi ? ` DOI ${doi}` : ''}`);
    continue;
  }

  try {
    if (doi) {
      const { status, data } = await getJson(
        `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      );
      if (status === 404) {
        item.status = 'fail';
        item.detail = `Crossref 查不到 DOI ${doi}（疑似编造）`;
        failures++;
      } else if (!data) {
        item.status = 'warn';
        item.detail = `Crossref 返回 ${status}，无法核验`;
      } else {
        const message = data.message || {};
        const actualTitle = Array.isArray(message.title) ? message.title[0] : message.title;
        const year = message.issued?.['date-parts']?.[0]?.[0] ?? message.published?.['date-parts']?.[0]?.[0];
        const titleOk = titleMatches(ref.title, actualTitle);
        const yearOk = !Number.isInteger(ref.year) || !year || Number(ref.year) === Number(year);
        if (!titleOk) {
          item.status = 'fail';
          item.detail = `标题对不上：Crossref 是「${String(actualTitle || '').slice(0, 60)}」`;
          failures++;
        } else if (!yearOk) {
          item.status = 'fail';
          item.detail = `年份对不上：Crossref 是 ${year}，清单写 ${ref.year}`;
          failures++;
        } else {
          item.status = 'pass';
          item.detail = year ? `标题一致 · ${year}` : '标题一致';
        }
      }
      await sleep(300);
    } else {
      const { status } = await headOrGet(url);
      if (status === 404 || status === 410) {
        item.status = 'fail';
        item.detail = `链接打不开（HTTP ${status}）`;
        failures++;
      } else if (status === 401 || status === 403) {
        item.status = 'warn';
        item.detail = `链接存在但拒绝抓取（HTTP ${status}），标题/年份需人工核对`;
      } else if (status >= 500) {
        item.status = 'warn';
        item.detail = `站点异常（HTTP ${status}），稍后重试`;
      } else {
        item.status = 'warn';
        item.detail = '链接可达，但标题/年份需人工核对（建议补 DOI）';
      }
      await sleep(300);
    }
  } catch (e) {
    const code = e?.cause?.code || e?.code || e?.name || 'ERROR';
    item.status = 'warn';
    item.detail = `网络不可达（${code}），本条未核验`;
  }

  results.push(item);

  if (!AS_JSON) {
    const mark =
      item.status === 'pass' ? paint('green', '✓') : item.status === 'fail' ? paint('red', '✗') : paint('yellow', '!');
    console.log(`  ${mark} ${label} ${item.detail}`);
    if (item.status !== 'pass') {
      console.log(`      ${paint('dim', `「${String(ref.title || '').slice(0, 70)}」`)}`);
    }
  }
}

// ---------------------------------------------------------------- 汇总

const passed = results.filter((r) => r.status === 'pass').length;
const warned = results.filter((r) => r.status === 'warn').length;

if (AS_JSON) {
  console.log(JSON.stringify({ file, total: refs.length, passed, warned, failed: failures, results }, null, 2));
} else {
  console.log('');
  const parts = [paint('green', `${passed} 通过`)];
  if (warned) parts.push(paint('yellow', `${warned} 待人工`));
  if (failures) parts.push(paint('red', `${failures} 失败`));
  console.log(`结果：${parts.join('，')}`);

  if (failures) {
    console.log('');
    console.log(paint('dim', '失败项必须删除或替换：论文里不能出现查不到出处的文献。'));
  } else if (warned) {
    console.log('');
    console.log(paint('dim', '待人工项：链接能打开不等于文献真实，逐条核对标题、作者、年份后再写进正文。'));
  }
  console.log('');
}

process.exit(failures ? 1 : 0);
