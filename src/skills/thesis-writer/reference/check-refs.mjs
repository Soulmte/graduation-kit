#!/usr/bin/env node
/**
 * 论文引用校验。
 *
 *   node check-refs.mjs [docs/thesis]
 *
 * 依据 reference/citation-policy.md 检查：
 *   - refs-source.json 字段完整、编号连续、年份在近五年内
 *   - 篇数与语种下限（默认 ≥22 条、英文 ≥6、中文 ≥15，可在 policy 里覆盖）
 *   - 主题覆盖（scope: domain / tech 各至少 5 条）
 *   - 至少一篇英文文献，且英文文献有中文译名
 *   - 每条文献有原文摘录与链接
 *   - 正文 [n] 与文献集合一致，不重复引用，一句话不出现多个引用
 *   - 首次引用顺序严格按 numbering（默认从小到大，逐条 +1）
 *   - 08-参考文献.md 包含每个编号
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] || 'docs/thesis');
const policyPath = join(dir, 'refs-source.json');
const errors = [];

const fail = (msg) => errors.push(msg);

if (!existsSync(dir) || !statSync(dir).isDirectory()) {
  console.error(`× 目录不存在：${dir}`);
  process.exit(1);
}
if (!existsSync(policyPath)) {
  console.error(`× 缺少 ${policyPath}`);
  console.error('  先按 reference/citation-policy.md 建证据文件，再写正文。');
  process.exit(1);
}

let policy;
try {
  policy = JSON.parse(readFileSync(policyPath, 'utf8'));
} catch (e) {
  console.error(`× refs-source.json 解析失败：${e.message}`);
  process.exit(1);
}

const numbering = policy.numbering === 'desc' ? 'desc' : 'asc';
const recentYears = Number.isFinite(policy.recentYears) ? policy.recentYears : 5;
const minYear = new Date().getFullYear() - recentYears;
// 硬性配额：不足就是没写完，不允许用凑数的文献补位
const minRefs = Number.isFinite(policy.minReferences) ? policy.minReferences : 22;
const minEn = Number.isFinite(policy.minEnglish) ? policy.minEnglish : 6;
const minZh = Number.isFinite(policy.minChinese) ? policy.minChinese : 15;
const minPerScope = Number.isFinite(policy.minPerScope) ? policy.minPerScope : 5;
const refs = Array.isArray(policy.references) ? policy.references : [];
if (!refs.length) fail('references 为空');

const byNumber = new Map();
for (const [i, ref] of refs.entries()) {
  const at = `references[${i}]`;
  if (!Number.isInteger(ref.n) || ref.n < 1) fail(`${at}: n 必须是正整数`);
  else if (byNumber.has(ref.n)) fail(`${at}: 编号 ${ref.n} 重复`);
  else byNumber.set(ref.n, ref);

  if (ref.lang !== 'en' && ref.lang !== 'zh') fail(`${at}: lang 必须是 en 或 zh`);
  for (const key of ['authors', 'title', 'venue']) {
    if (!String(ref[key] || '').trim()) fail(`${at}: 缺 ${key}`);
  }
  if (!Number.isInteger(ref.year)) fail(`${at}: 缺 year`);
  else if (ref.year < minYear) fail(`${at}: ${ref.year} 年超出近 ${recentYears} 年（≥ ${minYear}）`);
  if (!String(ref.quote || '').trim()) fail(`${at}: 缺 quote（原文摘录）`);
  if (!String(ref.url || ref.doi || '').trim()) fail(`${at}: 缺 url 或 doi`);
  if (ref.lang === 'en' && !String(ref.titleZh || '').trim()) fail(`${at}: 英文文献缺 titleZh（中文译名）`);
  if (ref.scope !== 'domain' && ref.scope !== 'tech') {
    fail(`${at}: scope 必须是 domain（主题域）或 tech（技术）`);
  }
}

const numbers = [...byNumber.keys()].sort((a, b) => a - b);
if (numbers.length) {
  const max = numbers[numbers.length - 1];
  for (let i = 1; i <= max; i++) {
    if (!byNumber.has(i)) fail(`编号不连续：缺 [${i}]`);
  }
}
const enCount = refs.filter((r) => r.lang === 'en').length;
const zhCount = refs.length - enCount;
const domainCount = refs.filter((r) => r.scope === 'domain').length;
const techCount = refs.filter((r) => r.scope === 'tech').length;

if (refs.length < minRefs) fail(`文献共 ${refs.length} 条，少于硬性要求 ${minRefs} 条`);
if (enCount < minEn) fail(`英文文献只有 ${enCount} 条，少于硬性要求 ${minEn} 条`);
if (zhCount < minZh) fail(`中文文献只有 ${zhCount} 条，少于硬性要求 ${minZh} 条`);
if (domainCount < minPerScope) fail(`主题域文献只有 ${domainCount} 条，至少 ${minPerScope} 条（scope: "domain"）`);
if (techCount < minPerScope) fail(`技术类文献只有 ${techCount} 条，至少 ${minPerScope} 条（scope: "tech"）`);

// ---------------------------------------------------------------- 正文扫描

const mdFiles = readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => f !== 'full.md')
  .filter((f) => !/参考文献|references?\.md$/i.test(f))
  .sort();

const scanFiles = mdFiles.length ? mdFiles : ['full.md'].filter((f) => existsSync(join(dir, f)));
if (!scanFiles.length) fail('没有可扫描的正文 Markdown');

/** @type {Map<number, number>} */
const occurrences = new Map();
/** @type {number[]} */
const firstOrder = [];

for (const file of scanFiles) {
  const raw = readFileSync(join(dir, file), 'utf8');
  const text = raw.replace(/```[\s\S]*?```/g, '').replace(/\r\n/g, '\n');

  let lineNo = 0;
  for (const line of text.split('\n')) {
    lineNo++;
    for (const sentence of line.split(/(?<=[。！？!?])/)) {
      // [12] 是引用；[12](url) 是 Markdown 链接，不算
      const markers = [...sentence.matchAll(/\[(\d{1,3})\](?!\()/g)].map((m) => Number(m[1]));
      if (!markers.length) continue;

      if (markers.length > 1) {
        fail(`${file}:${lineNo} 一句话出现 ${markers.length} 个引用 — ${sentence.trim().slice(0, 40)}`);
      }
      for (const n of markers) {
        occurrences.set(n, (occurrences.get(n) || 0) + 1);
        if (!firstOrder.includes(n)) firstOrder.push(n);
      }
    }
  }
}

for (const [n, count] of occurrences) {
  if (count > 1) fail(`[${n}] 被引用了 ${count} 次；每条文献只允许引用一次`);
}

const cited = new Set(occurrences.keys());
for (const n of numbers) {
  if (!cited.has(n)) fail(`文献 [${n}] 未在正文中引用`);
}
for (const n of cited) {
  if (!byNumber.has(n)) fail(`正文引用了 [${n}]，但 refs-source.json 里没有这条文献`);
}

if (firstOrder.length > 1) {
  const descending = firstOrder.every((n, i) => i === 0 || firstOrder[i - 1] === n + 1);
  const ascending = firstOrder.every((n, i) => i === 0 || firstOrder[i - 1] === n - 1);
  if (numbering === 'desc' && !descending) {
    fail(`首次引用顺序应为从大到小，实际是 ${firstOrder.join(' → ')}`);
  }
  if (numbering === 'asc' && !ascending) {
    fail(`首次引用顺序应从小到大，实际是 ${firstOrder.join(' → ')}`);
  }
}

// ---------------------------------------------------------------- 参考文献章节

const refFile = readdirSync(dir).find((f) => /参考文献/.test(f) && f.endsWith('.md'));
if (!refFile) {
  fail('缺少参考文献章节（如 08-参考文献.md）');
} else {
  const text = readFileSync(join(dir, refFile), 'utf8');
  const listed = new Set(
    [...text.matchAll(/^\[(\d{1,3})\]/gm)].map((m) => Number(m[1])),
  );
  for (const n of numbers) {
    if (!listed.has(n)) fail(`${refFile} 缺少条目 [${n}]`);
  }
}

// ---------------------------------------------------------------- 输出

console.log('');
console.log(
  `文献 ${refs.length} 条（英文 ${enCount}，中文 ${zhCount}；主题 ${domainCount}，技术 ${techCount}），正文引用 ${occurrences.size} 处`,
);
console.log(`策略：近 ${recentYears} 年（≥ ${minYear}），编号${numbering === 'desc' ? '从大到小' : '从小到大'}`);
console.log(`配额：≥${minRefs} 条，英文 ≥${minEn}，中文 ≥${minZh}，主题/技术各 ≥${minPerScope}`);

if (errors.length) {
  console.log('');
  for (const e of errors) console.error(`  × ${e}`);
  console.error(`\n${errors.length} 项未通过。\n`);
  process.exit(1);
}
console.log('全部通过。\n');
