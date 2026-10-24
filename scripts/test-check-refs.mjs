/**
 * check-refs.mjs 的自测：一组合规文献 + 一组故意写错的文献。
 *
 *   node scripts/test-check-refs.mjs
 *
 * 合规那组按硬性配额造数：22 条、中文 15、英文 7、主题 11 / 技术 11，
 * 正文按 [1] → [22] 顺序各引一次。全部在系统临时目录里完成，跑完即删。
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECKER = join(ROOT, 'src', 'skills', 'thesis-writer', 'reference', 'check-refs.mjs');

const TOTAL = 22;
const ZH = 15;
const YEAR = new Date().getFullYear() - 1;

const refs = Array.from({ length: TOTAL }, (_, i) => {
  const n = i + 1;
  const lang = n <= ZH ? 'zh' : 'en';
  const scope = n % 2 === 1 ? 'domain' : 'tech';
  const base = {
    n,
    lang,
    scope,
    authors: lang === 'zh' ? `作者${n}` : `Author${n} J`,
    title: lang === 'zh' ? `高校系统研究 ${n}` : `Web Architecture Study ${n}`,
    venue: lang === 'zh' ? '计算机应用与软件' : 'Journal of Systems and Software',
    year: YEAR,
    quote: `原文摘录 ${n}。`,
  };
  if (lang === 'en') base.titleZh = `Web 架构研究 ${n}`;
  if (n % 2 === 1) base.url = `https://example.org/${n}`;
  else base.doi = `10.1000/xyz${n}`;
  return base;
});

const POLICY = JSON.stringify(
  { numbering: 'asc', recentYears: 5, minReferences: 22, minEnglish: 6, minChinese: 15, minPerScope: 5, references: refs },
  null,
  2,
);

/** 22 句话，按编号从小到大各引一次 */
const BODY = `## 一、绪论\n\n${refs
  .map((r) => `已有研究指出第 ${r.n} 项结论成立[${r.n}]。`)
  .join('\n\n')}\n`;

const REFS = `## 八、参考文献\n\n${refs
  .map((r) => `[${r.n}] ${r.authors}. ${r.title}[J]. ${r.venue}, ${r.year}.`)
  .join('\n\n')}\n`;

function run(dir) {
  try {
    const out = execFileSync(process.execPath, [CHECKER, dir], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status || 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

function makeDir({ policy = POLICY, body = BODY, refsFile = REFS } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'gk-refs-'));
  writeFileSync(join(dir, 'refs-source.json'), policy);
  writeFileSync(join(dir, '01-绪论.md'), body);
  writeFileSync(join(dir, '08-参考文献.md'), refsFile);
  return dir;
}

const cases = [
  {
    name: '合规文献通过（22 条 / 英 7 中 15）',
    files: {},
    expect: 0,
  },
  {
    name: '同一编号引用两次要报错',
    files: { body: BODY.replace('[1]。', '[1]。另见[1]。') },
    expect: 1,
    contains: '只允许引用一次',
  },
  {
    name: '一句话两个引用要报错',
    files: { body: BODY.replace('[1]。', '[1][2]。') },
    expect: 1,
    contains: '一句话出现',
  },
  {
    name: '正文少引用一条要报错',
    files: { body: BODY.replace('[1]。', '。') },
    expect: 1,
    contains: '未在正文中引用',
  },
  {
    name: '英文文献缺译名要报错',
    files: { policy: POLICY.replace('"titleZh": "Web 架构研究 16",', '') },
    expect: 1,
    contains: '缺 titleZh',
  },
  {
    name: '总数不足 22 条要报错',
    files: {
      policy: JSON.stringify({ ...JSON.parse(POLICY), references: refs.slice(0, 21) }, null, 2),
      body: BODY.replace(/已有研究指出第 22 项结论成立\[22\]。\n?/, ''),
      refsFile: REFS.replace(/\[22\][^\n]*\n?/, ''),
    },
    expect: 1,
    contains: '少于硬性要求 22 条',
  },
  {
    name: '英文不足 6 条要报错',
    files: {
      policy: JSON.stringify(
        {
          ...JSON.parse(POLICY),
          references: refs.map((r, i) => (i >= 16 ? { ...r, lang: 'zh', authors: `作者${r.n}` } : r)),
        },
        null,
        2,
      ),
    },
    expect: 1,
    contains: '英文文献只有',
  },
  {
    name: '中文不足 15 条要报错',
    files: {
      policy: JSON.stringify(
        {
          ...JSON.parse(POLICY),
          references: refs.map((r, i) => (i < 5 ? { ...r, lang: 'en', titleZh: r.titleZh || '译名' } : r)),
        },
        null,
        2,
      ),
    },
    expect: 1,
    contains: '中文文献只有',
  },
  {
    name: '引用顺序从大到小要报错',
    files: {
      body: `## 一、绪论\n\n${refs
        .slice()
        .reverse()
        .map((r) => `已有研究指出第 ${r.n} 项结论成立[${r.n}]。`)
        .join('\n\n')}\n`,
    },
    expect: 1,
    contains: '应从小到大',
  },
  {
    name: '缺 scope 要报错',
    files: {
      policy: JSON.stringify(
        { ...JSON.parse(POLICY), references: refs.map(({ scope, ...rest }) => rest) },
        null,
        2,
      ),
    },
    expect: 1,
    contains: 'scope 必须是',
  },
];

let failed = 0;
for (const c of cases) {
  const dir = makeDir(c.files);
  try {
    const result = run(dir);
    const okCode = result.code === c.expect;
    const okText = !c.contains || result.out.includes(c.contains);
    if (okCode && okText) {
      console.log(`  ✓ ${c.name}`);
    } else {
      failed++;
      console.error(`  ✗ ${c.name} — 退出码 ${result.code}（期望 ${c.expect}）`);
      if (!okText) console.error(`    输出里找不到「${c.contains}」`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log('');
if (failed) {
  console.error(`${failed} 项未通过。\n`);
  process.exit(1);
}
console.log('引用校验器自测全部通过。\n');
