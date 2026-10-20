/**
 * graduation-kit package —— 打一个直接发给客户的交付包。
 *
 * 只装源码和本地数据库：backend/、frontend-<id>/、docs/、uploads/、README.md、database/。
 * 依赖与构建产物（node_modules、target、dist、unpackage、__pycache__ 等）一律不进包，
 * 开发用的 .agents/ 与编辑器目录也不进。
 *
 * 数据库优先用 mysqldump 全量导出（结构 + 数据 + CREATE DATABASE），
 * 没装 MySQL 客户端时退回 docs/ 里的建表脚本，并明确提示数据可能不是最新的。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { writeZip } from './zip.js';
import { findMysqlDump } from './mysql.js';

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);
const line = (s = '') => console.log(s);
const ok = (s) => line(`${paint('green', '✓')} ${s}`);
const warn = (s) => line(`${paint('yellow', '!')} ${s}`);
const info = (s) => line(`${paint('cyan', 'i')} ${s}`);

/** 依赖、构建产物、编辑器与 skills，看到就整目录跳过 */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.agents', '.idea', '.vscode', '.preview',
  'dist', 'dist-ssr', 'build', 'target', 'unpackage', 'coverage',
  'next', '.next', '.nuxt', 'oh_modules', 'logs',
  '__pycache__', 'venv', '.venv', 'bin', 'obj', '.gradle',
]);

/** 日志、系统垃圾、压缩包本身 */
const SKIP_FILE = /^(?:\.DS_Store|Thumbs\.db|.*\.log|.*\.class|.*\.py[cod]|.*\.zip|.*\.rar|.*\.7z)$/i;

function readEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

/** Spring Boot 的库名、账号与密码都写在 application.yml 的 jdbc URL 附近 */
function readSpringConfig(root) {
  const file = join(root, 'backend', 'src', 'main', 'resources', 'application.yml');
  if (!existsSync(file)) return {};
  const text = readFileSync(file, 'utf8');
  const url = text.match(/jdbc:mysql:\/\/([^:/?\s]+):(\d+)\/([^?\s'"]+)/);
  const user = text.match(/^\s*username:\s*['"]?([^'"\s]+)/m);
  const pass = text.match(/^\s*password:\s*['"]?(.*?)['"]?\s*$/m);
  return {
    host: url?.[1],
    port: url?.[2],
    name: url?.[3],
    user: user?.[1],
    password: pass?.[1],
  };
}

/** .NET 若把连接串写进 appsettings，这里兜一下；没有就交给 .env */
function readDotnetConfig(root) {
  for (const name of ['appsettings.Development.json', 'appsettings.json']) {
    const file = join(root, 'backend', name);
    if (!existsSync(file)) continue;
    try {
      const json = JSON.parse(readFileSync(file, 'utf8'));
      const cs = json?.ConnectionStrings?.Default || json?.ConnectionStrings?.MySql;
      if (!cs) continue;
      const kv = Object.fromEntries(
        cs.split(';').map((p) => p.split('=').map((s) => s.trim())).filter((p) => p.length === 2),
      );
      return {
        host: kv.Server || kv.Host,
        port: kv.Port,
        name: kv.Database,
        user: kv.User || kv.Uid,
        password: kv.Password || kv.Pwd,
      };
    } catch {
      // 配置文件坏了不该拦住打包，继续看下一个
    }
  }
  return {};
}

function findDocsSql(root, dbName) {
  const dir = join(root, 'docs');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((n) => n.toLowerCase().endsWith('.sql'));
  if (!files.length) return null;
  const exact = files.find((n) => basename(n, '.sql') === dbName);
  return join(dir, exact || files[0]);
}

/** 解析本次导出要用的连接信息，CLI 参数优先于项目配置 */
function resolveDbConfig(root, opts) {
  const env = readEnv(join(root, 'backend', '.env'));
  const spring = readSpringConfig(root);
  const dotnet = readDotnetConfig(root);
  const preferred = opts.db || env.DB_NAME || spring.name || dotnet.name || '';
  const docsCandidate = findDocsSql(root, preferred);
  const name = preferred
    || (docsCandidate ? basename(docsCandidate, '.sql') : '')
    || (opts.dbFile ? basename(opts.dbFile, '.sql') : '');
  return {
    name,
    host: opts.dbHost || env.DB_HOST || spring.host || dotnet.host || '127.0.0.1',
    port: opts.dbPort || env.DB_PORT || spring.port || dotnet.port || '3306',
    user: opts.dbUser || env.DB_USER || spring.user || dotnet.user || 'root',
    password: opts.dbPass !== undefined
      ? opts.dbPass
      : (env.DB_PASSWORD ?? spring.password ?? dotnet.password ?? ''),
    docsSql: docsCandidate,
  };
}

/** 全量导出：--databases 会带上 CREATE DATABASE 与 USE，结构、数据、触发器一起走 */
function dumpDatabase(cfg) {
  const bin = findMysqlDump();
  if (!bin) return { ok: false, why: '未找到 mysqldump' };

  const args = [
    `--host=${cfg.host}`,
    `--port=${cfg.port}`,
    `--user=${cfg.user}`,
    '--default-character-set=utf8mb4',
    '--single-transaction',
    '--skip-lock-tables',
    '--triggers',
    '--databases',
    cfg.name,
  ];
  const env = { ...process.env };
  // 走环境变量而不是命令行，避免密码出现在进程列表里
  if (cfg.password) env.MYSQL_PWD = cfg.password;

  try {
    const out = execFileSync(bin, args, {
      env,
      maxBuffer: 512 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, sql: out.toString('utf8') };
  } catch (err) {
    const stderr = (err.stderr || Buffer.from('')).toString('utf8').trim().split(/\r?\n/).slice(0, 2).join(' ');
    return { ok: false, why: stderr || err.message || String(err) };
  }
}

function ensureMigratable(sql, cfg, source) {
  // 交付包不应该一口气把同名库删掉；只重建表，保留库本身
  let body = sql
    .replace(/^\s*DROP\s+DATABASE\s+IF\s+EXISTS\s+`[^`]*`\s*;\s*$/gim, '')
    // 脚手架 SQL 是 CREATE DATABASE `x`，补上 IF NOT EXISTS 后再迁移
    .replace(/CREATE\s+DATABASE\s+`/i, 'CREATE DATABASE IF NOT EXISTS `');

  if (!/CREATE DATABASE/i.test(body)) {
    body = `CREATE DATABASE IF NOT EXISTS \`${cfg.name}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;\n`
      + `USE \`${cfg.name}\`;\n\n${body}`;
  } else if (!/^\s*USE\s+/mi.test(body)) {
    body = `USE \`${cfg.name}\`;\n\n${body}`;
  }

  const header = [
    '-- ----------------------------------------------------------------------------',
    '-- graduation-kit 交付数据库',
    `-- 数据库：${cfg.name}`,
    `-- 来源：${source}`,
    `-- 导出时间：${new Date().toLocaleString('zh-CN')}`,
    `-- 导入：mysql -u ${cfg.user} -p --default-character-set=utf8mb4 < ${cfg.name}.sql`,
    '-- ----------------------------------------------------------------------------',
    '',
    '',
  ].join('\n');
  return header + body;
}

function dbReadme(cfg, source) {
  return `毕业设计项目数据库导入说明
========================================

数据库名：${cfg.name}
SQL 来源：${source}

导入步骤
--------
1. 安装 MySQL 5.7 或 8.x，确认字符集为 utf8mb4。
2. 进入本目录后执行（Windows cmd / PowerShell / macOS / Linux 都一样）：

   cd database
   mysql -u root -p --default-character-set=utf8mb4 < ${cfg.name}.sql

3. 脚本第一段就是建库语句（CREATE DATABASE IF NOT EXISTS + USE），
   不需要提前手动建库，导入后表结构和数据会一起就位。

4. 后端配置里的库名、账号、密码要跟本机一致：
   - Express / Flask / Go / .NET：backend/.env
   - Spring Boot：backend/src/main/resources/application.yml

导入完成后
----------
1. 启动后端与前端，命令见项目根 README 的「使用说明」与「常用命令」。
2. 如果后端连不上库，先确认 backend/.env（或 application.yml）里的库名、
   账号、密码、端口与本机 MySQL 一致。
3. 需要再次打包时，在项目根执行 npx graduation-kit package .

注意
----
- 文件里不会执行 DROP DATABASE，同名库不会被整体删除；
  但建表脚本带 DROP TABLE IF EXISTS，同名表会被重建。
- 中文报 Data too long 时，一定是导入命令漏了 --default-character-set=utf8mb4。
`;
}

function collectTree(absDir, zipRel, entries, outFile) {
  let files = 0;
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const sub = collectTree(join(absDir, entry.name), `${zipRel}/${entry.name}`, entries, outFile);
      if (sub === 0) {
        // 只在整棵子树没有任何文件时保留空目录（比如空的 uploads/）
        const marker = `${zipRel}/${entry.name}/`;
        if (!entries.some((e) => e.name === marker)) entries.push({ name: marker, dir: true });
      }
      files += sub;
    } else {
      if (SKIP_FILE.test(entry.name)) continue;
      const full = join(absDir, entry.name);
      if (outFile && resolve(full) === outFile) continue;
      entries.push({ name: `${zipRel}/${entry.name}`, data: readFileSync(full) });
      files++;
    }
  }
  return files;
}

export async function pack(opts) {
  const root = resolve(opts.dir || opts.name || process.cwd());
  if (!existsSync(root)) throw new Error(`目录不存在：${root}`);

  const projectName = basename(root);
  const topDirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name))
    .map((e) => e.name);
  const isFrontendDir = (n) => n === 'frontend' || /^frontend-[a-z0-9-]+$/i.test(n);
  const sourceDirs = topDirs.filter(
    (n) => n === 'backend' || isFrontendDir(n) || n === 'docs',
  );

  if (!sourceDirs.some((n) => n === 'backend') || !sourceDirs.some(isFrontendDir)) {
    throw new Error(
      `这不像 graduation-kit 生成的项目：${root}\n`
      + '  需要同时有 backend/ 和 frontend/（或 frontend-<框架>/）。',
    );
  }

  const outFile = opts.out
    ? resolve(opts.out)
    : join(dirname(root), `${projectName}-delivery.zip`);

  line('');
  line(paint('bold', `打包交付：${projectName}`));
  line(paint('dim', `  源目录：${root}`));
  line('');

  const entries = [];
  const dirStats = [];
  for (const name of sourceDirs) {
    const before = entries.length;
    collectTree(join(root, name), `${projectName}/${name}`, entries, outFile);
    dirStats.push({ name, files: entries.length - before });
  }

  const readme = join(root, 'README.md');
  let readmeEntry = null;
  if (existsSync(readme)) {
    // 交付包不带开发脚本，README 里的打包段落、bat 与 skills 说明也一并去掉
    const kept = [];
    let skipping = false;
    for (const lineText of readFileSync(readme, 'utf8').split(/\r?\n/)) {
      if (/^## 交付打包/.test(lineText)) {
        skipping = true;
        continue;
      }
      if (skipping && /^## /.test(lineText)) skipping = false;
      if (skipping) continue;
      if (/^- `package-delivery\.bat`/.test(lineText)) continue;
      if (/^- `\.agents\/skills\/`/.test(lineText)) continue;
      if (/CLI 命令找不到/.test(lineText)) continue;
      kept.push(lineText);
    }
    readmeEntry = {
      name: `${projectName}/README.md`,
      data: Buffer.from(kept.join('\n'), 'utf8'),
    };
    entries.push(readmeEntry);
  }

  const uploads = join(root, 'uploads');
  if (existsSync(uploads)) {
    collectTree(uploads, `${projectName}/uploads`, entries, outFile);
  }
  if (!entries.some((e) => e.name.startsWith(`${projectName}/uploads/`))) {
    entries.push({ name: `${projectName}/uploads/.gitkeep`, data: Buffer.alloc(0) });
  }

  // ---- 数据库 ----
  let dbNote = '未打包数据库';
  let dbName = '';
  let dbSource = '';
  let docsSqlRemoved = 0;
  if (opts.noDb) {
    warn('已按 --no-db 跳过数据库');
  } else {
    const cfg = resolveDbConfig(root, opts);
    if (!cfg.name) {
      throw new Error(
        '无法确定数据库名：backend 配置里没读到 DB_NAME，docs/ 里也没有 SQL。\n'
        + '  用 --db <库名> 指定，或加 --no-db 跳过数据库。',
      );
    }

    let sql;
    let source;
    if (opts.dbFile) {
      const file = resolve(opts.dbFile);
      if (!existsSync(file)) throw new Error(`--db-file 指向的文件不存在：${file}`);
      sql = readFileSync(file, 'utf8');
      source = basename(file);
    } else {
      const dumped = dumpDatabase(cfg);
      if (dumped.ok) {
        sql = dumped.sql;
        source = `mysqldump 全量导出（${cfg.host}:${cfg.port}）`;
      } else {
        if (!cfg.docsSql) {
          throw new Error(
            `数据库导出失败：${dumped.why}\n`
            + '  且 docs/ 里没有可退回的 SQL。\n'
            + '  请启动本地 MySQL 后重试，或用 --db-file <已导出的.sql> 指定文件，'
            + '或加 --no-db 只打代码。',
          );
        }
        sql = readFileSync(cfg.docsSql, 'utf8');
        source = `docs/${basename(cfg.docsSql)}（脚手架建表 + 初始数据）`;
        warn(`数据库全量导出失败：${dumped.why}`);
        warn(`已退回 ${source}，本地开发新增的数据不会包含在内`);
        warn('装好 MySQL 客户端后重试，或用环境变量 MYSQLDUMP 指定 mysqldump 的完整路径');
      }
    }

    const finalSql = ensureMigratable(sql, cfg, source);
    const sqlName = `${cfg.name}.sql`;
    entries.push({ name: `${projectName}/database/${sqlName}`, data: Buffer.from(finalSql, 'utf8') });
    entries.push({ name: `${projectName}/database/README.txt`, data: Buffer.from(dbReadme(cfg, source), 'utf8') });
    dbNote = `database/${sqlName}`;
    dbName = cfg.name;
    dbSource = source;
    ok(`database/${sqlName} ${paint('dim', source)}`);
    if (!/INSERT INTO/i.test(finalSql)) {
      warn('导出的 SQL 没有 INSERT 语句，库里可能还没有数据');
    }
  }

  // 数据库已经单独放在 database/ 了，docs/ 里的脚手架 SQL 只会让客户导错文件；
  // README 里的导入命令也跟着改指 database/。
  if (dbName) {
    const esc = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const docsSqlRe = new RegExp(`^${esc}/docs/[^/]+\\.sql$`, 'i');
    for (let i = entries.length - 1; i >= 0; i--) {
      if (docsSqlRe.test(entries[i].name)) {
        entries.splice(i, 1);
        docsSqlRemoved++;
      }
    }
    if (readmeEntry) {
      const patched = readmeEntry.data.toString('utf8')
        .split(`docs/${dbName}.sql`).join(`database/${dbName}.sql`);
      readmeEntry.data = Buffer.from(patched, 'utf8');
    }
  }

  mkdirSync(dirname(outFile), { recursive: true });
  const result = writeZip(outFile, entries);

  line('');
  for (const stat of dirStats) {
    if (stat.name === 'docs' && dbName) {
      const rest = stat.files - docsSqlRemoved;
      const note = rest > 0 ? `其余 ${rest} 个文件保留，SQL 已由 database/ 取代` : 'SQL 已由 database/ 取代';
      ok(`docs/ ${paint('dim', note)}`);
    } else {
      ok(`${stat.name}/ ${paint('dim', `${stat.files} 个文件`)}`);
    }
  }
  if (readmeEntry) ok('README.md');
  ok('uploads/');
  line(paint('green', `✓ 交付包已生成：${outFile}`));
  line(`  文件 ${result.files} 个，${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
  line(`  数据库：${dbNote}${dbName ? ` · ${dbSource}` : ''}`);
  line(paint('dim', '  已排除 node_modules / target / dist / unpackage / __pycache__ / .git / .agents'));
  line('');
}
