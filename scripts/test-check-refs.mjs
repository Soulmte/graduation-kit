/**
 * check-refs.mjs 的自测：一组合规文献 + 两组故意写错的文献。
 *
 *   node scripts/test-check-refs.mjs
 *
 * 全部在系统临时目录里完成，跑完即删。
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECKER = join(ROOT, 'src', 'skills', 'thesis-writer', 'reference', 'check-refs.mjs');

const POLICY = JSON.stringify(
  {
    numbering: 'asc',
    recentYears: 5,
    references: [
      {
        n: 2,
        lang: 'en',
        authors: 'Smith J',
        title: 'Web Application Architecture',
        titleZh: 'Web 应用架构',
        venue: 'Journal of Systems and Software',
        year: 2023,
        doi: '10.1000/xyz',
        quote: 'Layered architectures separate concerns.',
      },
      {
        n: 1,
        lang: 'zh',
        authors: '张三',
        title: '高校管理系统设计',
        venue: '计算机应用与软件',
        year: 2022,
        url: 'https://example.org/1',
        quote: '系统采用前后端分离架构。',
      },
    ],
  },
  null,
  2,
);

const BODY = `## 一、绪论

已有研究指出分层架构可以隔离关注点[1]。

国内研究采用前后端分离实现管理系统[2]。
`;

const REFS = `## 八、参考文献

[1] 张三. 高校管理系统设计[J]. 计算机应用与软件, 2022.

[2] Smith J. Web Application Architecture[J]. Journal of Systems and Software, 2023.
（中文译名：Web 应用架构）
`;

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

function makeDir({ policy = POLICY, body = BODY, refs = REFS } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'gk-refs-'));
  writeFileSync(join(dir, 'refs-source.json'), policy);
  writeFileSync(join(dir, '01-绪论.md'), body);
  writeFileSync(join(dir, '08-参考文献.md'), refs);
  return dir;
}

const cases = [
  {
    name: '合规文献通过',
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
    files: {
      policy: POLICY.replace('"titleZh": "Web 应用架构",', ''),
    },
    expect: 1,
    contains: '缺 titleZh',
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
