#!/usr/bin/env node
/**
 * 把 thesis-writer 自带的绘图模板复制到项目工作目录。
 *
 * 硬性规则：skill 目录里的 reference/examples/ 是只读模板，
 * 所有改图、跑校验、导出都必须发生在复制出来的工作副本里。
 *
 * 用法：
 *   node copy-template.mjs                      # 复制到 ./docs/thesis/figure-kit
 *   node copy-template.mjs docs/figs            # 指定目录
 *   node copy-template.mjs --force              # 只刷新引擎/编辑器/校验脚本，保留已有 data/
 *   node copy-template.mjs --force --reset-data # 连 data/ 也恢复成模板（会覆盖你的图）
 *
 * 说明：--force 不会删除工作目录里模板之外的文件，新增的图不会丢。
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, 'examples');
const DEFAULT_TARGET = join(process.cwd(), 'docs', 'thesis', 'figure-kit');

/** 引擎与校验工具，每次 --force 都刷新；data/ 是用户的图，默认不动 */
const FRAMEWORK = [
  'editor.html',
  'editor.js',
  'verify.js',
  'verify-editor.js',
  'audit.js',
  'package.json',
  'engine',
];

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  console.log(`把绘图模板复制到工作目录（skill 目录保持只读）

用法：
  node copy-template.mjs [目标目录] [--force] [--reset-data]

  --force       目录已存在时，刷新引擎/编辑器/校验脚本，保留已有 data/
  --reset-data  配合 --force，把 data/ 也覆盖成模板内容

默认目标：./docs/thesis/figure-kit`);
  process.exit(0);
}

const force = args.includes('--force');
const resetData = args.includes('--reset-data');
const positional = args.filter((a) => !a.startsWith('-'));
const target = resolve(positional[0] || DEFAULT_TARGET);

const rel = relative(SOURCE, target);
const insideTemplate = rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
if (insideTemplate) {
  console.error('× 目标目录不能是模板目录本身或它的子目录。');
  console.error('  请换一个项目内的目录，例如 docs/thesis/figure-kit。');
  process.exit(1);
}
if (!existsSync(SOURCE)) {
  console.error(`× 找不到模板目录：${SOURCE}`);
  process.exit(1);
}

const isEmpty = (dir) => !existsSync(dir) || readdirSync(dir).length === 0;

function copyItems(items) {
  let copied = 0;
  for (const item of items) {
    const from = join(SOURCE, item);
    const to = join(target, item);
    if (!existsSync(from)) continue;
    cpSync(from, to, { recursive: true, force: true, errorOnExist: false });
    copied++;
  }
  return copied;
}

const firstRun = isEmpty(target);
if (!firstRun && !force) {
  console.error(`× 目标目录已存在：${target}`);
  console.error('');
  console.error('  不要直接覆盖，先确认要做什么：');
  console.error('    刷新引擎/编辑器/校验脚本（保留你的图）：加 --force');
  console.error('    连 data/ 一起恢复成模板（会覆盖你的图）：加 --force --reset-data');
  console.error('    换一个目录：node copy-template.mjs <目录>');
  process.exit(1);
}

mkdirSync(target, { recursive: true });

if (firstRun || resetData) {
  const n = copyItems([...FRAMEWORK, 'data']);
  console.log(`✓ 已复制模板到 ${target}（${n} 项${firstRun ? '' : '，data/ 已重置'}）`);
} else {
  const n = copyItems(FRAMEWORK);
  // 缺失的模板数据文件补回来，已有的一律不覆盖
  const dataDir = join(target, 'data');
  if (!existsSync(dataDir)) {
    cpSync(join(SOURCE, 'data'), dataDir, { recursive: true, force: false, errorOnExist: false });
    console.log(`✓ 已刷新模板到 ${target}（${n} 项，data/ 为首次生成）`);
  } else {
    const srcData = readdirSync(join(SOURCE, 'data'));
    const dstData = new Set(readdirSync(dataDir));
    const missing = srcData.filter((f) => !dstData.has(f));
    for (const f of missing) {
      cpSync(join(SOURCE, 'data', f), join(dataDir, f), { force: false, errorOnExist: false });
    }
    console.log(`✓ 已刷新模板到 ${target}（${n} 项，data/ 保留原有文件${missing.length ? `，补齐 ${missing.length} 个缺失文件` : ''}）`);
  }
}

if (firstRun && statSync(target).isDirectory()) {
  console.log('');
  console.log('接下来：');
  console.log(`  cd ${target}`);
  console.log('  node verify.js && node verify-editor.js && node audit.js');
  console.log('  浏览器打开 editor.html 微调，导出到 docs/thesis/images/');
  console.log('');
  console.log('只改 data/ 下的数据文件；engine/、编辑器、校验脚本不要改。');
}
