/**
 * MySQL 客户端定位与本地导入。
 * create 的“生成后直接导库”和 package 的“全量导出”共用同一套安装目录扫描。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const WIN_BASES = [
  'C:/Program Files/MySQL',
  'C:/Program Files (x86)/MySQL',
  'C:/xampp/mysql',
  'C:/phpstudy_pro/Extensions',
  'C:/wamp64/bin/mysql',
  'C:/laragon/bin/mysql',
  'D:/mysql',
  'D:/xampp/mysql',
  'D:/phpstudy_pro/Extensions',
  'D:/wamp64/bin/mysql',
  'D:/laragon/bin/mysql',
];

/**
 * @param {'mysql'|'mysqldump'} name
 * @param {string} envVar 允许用环境变量直接指定可执行文件
 */
export function findMysqlBinary(name, envVar) {
  const fromEnv = process.env[envVar];
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  try {
    execFileSync(exe, ['--version'], { stdio: 'ignore' });
    return exe;
  } catch {
    // 不在 PATH 上，继续扫常见安装目录
  }

  const candidates = [];
  if (process.platform === 'win32') {
    for (const base of WIN_BASES) {
      if (!existsSync(base)) continue;
      candidates.push(join(base, exe));
      let entries = [];
      try {
        entries = readdirSync(base);
      } catch {
        continue;
      }
      for (const dir of entries) {
        candidates.push(join(base, dir, exe));
        candidates.push(join(base, dir, 'bin', exe));
        candidates.push(join(base, dir, 'mysql', 'bin', exe));
      }
    }
  } else {
    candidates.push(
      `/usr/bin/${name}`,
      `/usr/local/bin/${name}`,
      `/usr/local/mysql/bin/${name}`,
      `/opt/homebrew/bin/${name}`,
    );
  }
  return candidates.find(existsSync) || null;
}

export const findMysqlClient = () => findMysqlBinary('mysql', 'MYSQL_CLIENT');
export const findMysqlDump = () => findMysqlBinary('mysqldump', 'MYSQLDUMP');

function connArgs(cfg) {
  return [
    `--host=${cfg.host || '127.0.0.1'}`,
    `--port=${cfg.port || '3306'}`,
    `--user=${cfg.user || 'root'}`,
  ];
}

function connEnv(cfg) {
  const env = { ...process.env };
  // 走环境变量而不是命令行，避免密码出现在进程列表里
  if (cfg.password) env.MYSQL_PWD = cfg.password;
  return env;
}

function stderrOf(err) {
  return (err.stderr || Buffer.from('')).toString('utf8').trim()
    .split(/\r?\n/).filter(Boolean).slice(0, 2).join(' ');
}

/** 只验证客户端在、账号能连上，不碰具体库 */
export function checkMysql(cfg) {
  const bin = findMysqlClient();
  if (!bin) return { ok: false, reason: 'missing-client', bin: null };
  try {
    execFileSync(bin, [...connArgs(cfg), '--batch', '--skip-column-names', '-e', 'SELECT 1'], {
      env: connEnv(cfg),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return { ok: true, reason: 'ok', bin };
  } catch (err) {
    return { ok: false, reason: 'connect-failed', bin, stderr: stderrOf(err) };
  }
}

export function databaseExists(cfg) {
  const bin = findMysqlClient();
  if (!bin) return false;
  const name = String(cfg.name || '').replace(/'/g, "''");
  try {
    const out = execFileSync(bin, [
      ...connArgs(cfg),
      '--batch',
      '--skip-column-names',
      '-e',
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${name}'`,
    ], {
      env: connEnv(cfg),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return out.toString('utf8').trim().length > 0;
  } catch {
    // 连不上时按“不存在”处理，真正的导入会再报一次错
    return false;
  }
}

export function importSqlFile(file, cfg) {
  const bin = findMysqlClient();
  if (!bin) return { ok: false, reason: 'missing-client' };
  try {
    execFileSync(bin, [...connArgs(cfg), '--default-character-set=utf8mb4'], {
      env: connEnv(cfg),
      input: readFileSync(file),
      maxBuffer: 128 * 1024 * 1024,
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, bin };
  } catch (err) {
    return { ok: false, reason: 'failed', bin, stderr: stderrOf(err) };
  }
}

/** 没装客户端或连不上时，告诉用户下一步做什么 */
export function mysqlGuide(cfg) {
  return [
    '自动导入需要本机可用的 mysql 客户端：',
    `  · 已装 MySQL 就把 bin 目录加进 PATH（例如 C:/Program Files/MySQL/MySQL Server 8.0/bin）`,
    '  · 或用环境变量 MYSQL_CLIENT 指向 mysql.exe 的完整路径',
    '  · 也可以先跳过，之后手动执行：',
    `    mysql -u ${cfg.user || 'root'} -p --default-character-set=utf8mb4 < docs/${cfg.name}.sql`,
  ];
}

/** 连接失败时给一句能直接照做的原因，而不是把 stderr 原样丢给用户 */
export function mysqlFailureHint(cfg, stderr) {
  const text = String(stderr || '');
  if (/access denied/i.test(text)) {
    return `密码或用户不对：确认 ${cfg.user} 的密码，或用 --db-user / --db-pass 重新指定`;
  }
  if (/can't connect|refused|10061|2003|timeout/i.test(text)) {
    return `连不上 ${cfg.host}:${cfg.port}：先启动 MySQL 服务（Windows 可试 net start mysql80）`;
  }
  return '检查 MySQL 服务是否启动、端口与账号密码是否正确';
}
