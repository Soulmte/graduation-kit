/**
 * Redis 环境检测。
 * 创建项目时只负责判断“能不能用”，不替用户决定怎么装。
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import net from 'node:net';

const WIN_BASES = [
  'C:/Program Files/Memurai',
  'C:/Program Files/Redis',
  'C:/Program Files (x86)/Redis',
  'C:/Redis',
  'D:/Redis',
  'D:/redis',
];

function scanWindows(names) {
  const found = [];
  for (const base of WIN_BASES) {
    if (!existsSync(base)) continue;
    for (const name of names) found.push(join(base, `${name}.exe`));
    let entries = [];
    try {
      entries = readdirSync(base);
    } catch {
      continue;
    }
    for (const dir of entries) {
      for (const name of names) {
        found.push(join(base, dir, `${name}.exe`));
        found.push(join(base, dir, 'bin', `${name}.exe`));
      }
    }
  }
  return found.find(existsSync) || null;
}

function findBinary(names, envVar) {
  const fromEnv = process.env[envVar];
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  for (const name of names) {
    try {
      execFileSync(name, ['--version'], { stdio: 'ignore' });
      return name;
    } catch {
      // 不在 PATH 上
    }
  }

  if (process.platform === 'win32') return scanWindows(names);

  const candidates = [];
  for (const name of names) {
    candidates.push(
      `/usr/bin/${name}`,
      `/usr/local/bin/${name}`,
      `/opt/homebrew/bin/${name}`,
      `/snap/bin/${name}`,
    );
  }
  return candidates.find(existsSync) || null;
}

export function findRedisCli() {
  return findBinary(['redis-cli', 'memurai-cli'], 'REDIS_CLI');
}

export function findRedisServer() {
  return findBinary(['redis-server', 'memurai'], 'REDIS_SERVER');
}

function portOpen(host, port, timeout = 800) {
  return new Promise((resolve) => {
    let socket;
    try {
      socket = net.connect({ host, port });
    } catch {
      resolve(false);
      return;
    }
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

/**
 * 结论优先级：PING 通 > 端口能连（客户端缺失时） > 未就绪。
 * 认证失败不会被误判为可用。
 */
export async function checkRedis({ host = '127.0.0.1', port = 6379, password = '' } = {}) {
  const cli = findRedisCli();
  const server = findRedisServer();
  const targetPort = Number(port) || 6379;
  let pong = false;
  let version = '';
  let error = '';

  if (cli) {
    const env = { ...process.env };
    if (password) env.REDISCLI_AUTH = password;
    try {
      const out = execFileSync(cli, ['-h', host, '-p', String(targetPort), 'PING'], {
        env,
        timeout: 3000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      pong = /PONG/i.test(out.toString('utf8'));
      if (pong) {
        try {
          const info = execFileSync(cli, ['-h', host, '-p', String(targetPort), 'INFO', 'server'], {
            env,
            timeout: 3000,
            stdio: ['ignore', 'pipe', 'pipe'],
          }).toString('utf8');
          version = (info.match(/redis_version:([^\r\n]+)/) || [])[1] || '';
        } catch {
          // 版本拿不到不影响“可用”的判断
        }
      }
    } catch (err) {
      error = (err.stderr || Buffer.from('')).toString('utf8').trim().split(/\r?\n/)[0] || '';
    }
  }

  const open = await portOpen(host, targetPort);
  const authFailed = /NOAUTH|WRONGPASS|invalid password|AUTH/i.test(error);
  const usable = pong || (open && !authFailed && !error);

  return { cli, server, open, pong, version, error, usable, host, port: targetPort };
}

/** 未就绪时按平台给出可执行的下一步 */
export function redisGuide(host = '127.0.0.1', port = 6379) {
  const lines = ['未检测到可用的 Redis，按下面任一方式装好即可：'];
  if (process.platform === 'win32') {
    lines.push('  · Windows：winget install Memurai.MemuraiDeveloper');
    lines.push('  · 或安装 Memurai：https://www.memurai.com/get-memurai');
    lines.push(`  · Docker：docker run -d --name redis -p ${port}:6379 redis:7-alpine`);
    lines.push('  · WSL：wsl sudo apt install redis-server && wsl redis-server --daemonize yes');
  } else if (process.platform === 'darwin') {
    lines.push('  · macOS：brew install redis && brew services start redis');
  } else {
    lines.push('  · Debian/Ubuntu：sudo apt install redis-server && sudo systemctl start redis-server');
    lines.push(`  · 或 Docker：docker run -d --name redis -p ${port}:6379 redis:7-alpine`);
  }
  lines.push(`  验证：redis-cli -h ${host} -p ${port} ping   # 返回 PONG 即就绪`);
  return lines;
}
