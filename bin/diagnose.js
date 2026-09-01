/**
 * 诊断系统兼容性与包完整性
 * 检查：Node 版本、终端类型、脚手架资源、文件拷贝能力、必需工具
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, mkdirSync, writeFileSync, mkdtempSync, rmSync, cpSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform, release, arch, homedir, tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, '..');
const SRC_SCAFFOLDS = join(PKG_ROOT, 'src', 'scaffolds');

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
const ok = (s) => line(`  ${paint('green', '✓')} ${s}`);
const warn = (s) => line(`  ${paint('yellow', '⚠')} ${s}`);
const fail = (s) => line(`  ${paint('red', '✗')} ${s}`);
const info = (s) => line(`  ${paint('cyan', 'ℹ')} ${s}`);

/** 检查命令是否可用 */
function hasCommand(cmd) {
  try {
    if (platform() === 'win32') {
      execSync(`where ${cmd}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

/** 获取命令版本 */
function getVersion(cmd, args = ['--version']) {
  try {
    const output = execSync(`${cmd} ${args.join(' ')}`, { 
      encoding: 'utf8', 
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000,
    });
    return output.trim().split('\n')[0];
  } catch {
    return null;
  }
}

/** 检查 Node.js 环境 */
function checkNodeEnv() {
  line(paint('bold', '1. Node.js 环境'));
  
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  
  if (nodeMajor >= 18) {
    ok(`Node.js ${nodeVersion} ${paint('dim', '(满足要求 >=18)')}`);
  } else if (nodeMajor >= 16) {
    warn(`Node.js ${nodeVersion} ${paint('dim', '(建议升级到 18+)')}`);
  } else {
    fail(`Node.js ${nodeVersion} ${paint('dim', '(需要 18+)')}`);
  }
  
  const npmVersion = getVersion('npm');
  if (npmVersion) {
    ok(`npm ${npmVersion}`);
  } else {
    warn('npm 未安装或不在 PATH 中');
  }
  
  line('');
}

/** 检查终端兼容性 */
function checkTerminal() {
  line(paint('bold', '2. 终端兼容性'));
  
  const shell = process.env.SHELL || process.env.ComSpec || '未知';
  const term = process.env.TERM || '未知';
  const isTTY = process.stdout.isTTY;
  
  info(`Shell: ${shell}`);
  info(`TERM: ${term}`);
  info(`TTY: ${isTTY ? '是' : '否'}`);
  
  if (platform() === 'win32') {
    const isCmd = shell.toLowerCase().includes('cmd.exe');
    const isPowerShell = shell.toLowerCase().includes('powershell') || 
                        shell.toLowerCase().includes('pwsh');
    const isGitBash = shell.toLowerCase().includes('bash');
    
    if (isCmd) {
      ok('检测到 CMD');
      info('  支持基本 ANSI 颜色（Windows 10+）');
    } else if (isPowerShell) {
      ok('检测到 PowerShell');
      info('  完整支持 ANSI 转义序列');
    } else if (isGitBash) {
      ok('检测到 Git Bash');
      info('  完整支持终端特性');
    } else {
      warn('未识别的终端类型');
      info('  如遇显示问题，建议使用 PowerShell 或 Git Bash');
    }
  } else {
    ok(`检测到 Unix-like 终端 (${platform()})`);
  }
  
  if (!isTTY) {
    warn('非交互式终端，部分交互功能可能不可用');
    info('  非交互模式需要使用命令行参数（--be, --fe 等）');
  }
  
  line('');
}

/** 检查包完整性 */
function checkPackageIntegrity() {
  line(paint('bold', '3. 包完整性'));
  
  // 检查脚手架资源
  if (!existsSync(SRC_SCAFFOLDS)) {
    fail('脚手架资源目录缺失');
    info(`  预期位置: ${SRC_SCAFFOLDS}`);
    line('');
    return false;
  }
  
  ok('脚手架资源目录存在');
  
  // 检查路径长度（Windows 限制）
  if (platform() === 'win32') {
    const pathLength = SRC_SCAFFOLDS.length;
    if (pathLength > 200) {
      warn(`包路径过长 (${pathLength} 字符)，可能触发 Windows 路径限制`);
      info(`  当前路径: ${SRC_SCAFFOLDS}`);
      info(`  建议：将 npm 缓存移到较短路径，或使用 npm install -g`);
    } else {
      ok(`包路径长度正常 (${pathLength} 字符)`);
    }
  }
  
  // 检查后端
  const backendsDir = join(SRC_SCAFFOLDS, 'backends');
  if (existsSync(backendsDir)) {
    const backends = readdirSync(backendsDir).filter((n) => {
      const stat = statSync(join(backendsDir, n));
      return stat.isDirectory();
    });
    ok(`后端脚手架: ${backends.length} 个 (${backends.join(', ')})`);
  } else {
    fail('后端脚手架目录缺失');
  }
  
  // 检查前端
  const frontendsDir = join(SRC_SCAFFOLDS, 'frontends');
  if (existsSync(frontendsDir)) {
    const frontends = readdirSync(frontendsDir).filter((n) => {
      const stat = statSync(join(frontendsDir, n));
      return stat.isDirectory();
    });
    ok(`前端脚手架: ${frontends.length} 个 (${frontends.join(', ')})`);
  } else {
    fail('前端脚手架目录缺失');
  }
  
  // 检查 demo
  const demosDir = join(SRC_SCAFFOLDS, 'demos');
  if (existsSync(demosDir)) {
    const demos = readdirSync(demosDir).filter((n) => {
      const stat = statSync(join(demosDir, n));
      return stat.isDirectory();
    });
    ok(`Demo 模板: ${demos.length} 个 (${demos.join(', ')})`);
  } else {
    warn('Demo 模板目录缺失（不影响基础功能）');
  }
  
  // 检查 skills
  const skillsDir = join(PKG_ROOT, 'src', 'skills');
  if (existsSync(skillsDir)) {
    const skills = readdirSync(skillsDir).filter((n) => {
      const stat = statSync(join(skillsDir, n));
      return stat.isDirectory() && existsSync(join(skillsDir, n, 'SKILL.md'));
    });
    ok(`Skills: ${skills.length} 个`);
  } else {
    fail('Skills 目录缺失');
  }
  
  line('');
  return true;
}

/** 测试文件拷贝功能 */
function testCopyCapability() {
  line(paint('bold', '4. 文件拷贝测试'));
  
  try {
    // 创建临时测试目录
    const testDir = mkdtempSync(join(tmpdir(), 'graduation-kit-test-'));
    const srcDir = join(testDir, 'src');
    const destDir = join(testDir, 'dest');
    
    // 创建测试文件
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'test.txt'), 'hello');
    mkdirSync(join(srcDir, 'subdir'), { recursive: true });
    writeFileSync(join(srcDir, 'subdir', 'nested.txt'), 'world');
    
    // 测试 cpSync
    cpSync(srcDir, destDir, { recursive: true });
    
    // 验证结果
    const destExists = existsSync(join(destDir, 'test.txt')) && 
                       existsSync(join(destDir, 'subdir', 'nested.txt'));
    
    if (destExists) {
      ok('cpSync 递归拷贝功能正常');
    } else {
      fail('cpSync 拷贝未生效（文件未创建）');
    }
    
    // 清理
    rmSync(testDir, { recursive: true, force: true });
    
  } catch (err) {
    fail(`文件拷贝测试失败: ${err.message || err.code || String(err)}`);
    warn('这可能导致项目创建时只生成部分文件');
    info('  可能原因：权限不足、磁盘空间不足、防病毒软件拦截');
  }
  
  line('');
}

/** 检查必需工具 */
function checkRequiredTools() {
  line(paint('bold', '5. 必需工具'));
  
  const tools = [
    { name: 'git', desc: '版本控制', required: true },
    { name: 'mysql', desc: 'MySQL 客户端', required: true },
  ];
  
  const warnings = [];
  
  for (const { name, desc, required } of tools) {
    if (hasCommand(name)) {
      const version = getVersion(name);
      ok(`${name} ${paint('dim', `(${desc})`)} ${version ? `- ${version}` : '已安装'}`);
    } else {
      if (required) {
        fail(`${name} ${paint('dim', `(${desc})`)} 未安装`);
        warnings.push(`缺少 ${name}`);
      } else {
        warn(`${name} ${paint('dim', `(${desc})`)} 未安装（可选）`);
      }
    }
  }
  
  line('');
  return warnings;
}

/** 检查可选工具 */
function checkOptionalTools() {
  line(paint('bold', '6. 可选工具（按后端类型）'));
  
  const tools = [
    { name: 'java', check: 'java -version', desc: 'Spring Boot 需要' },
    { name: 'mvn', check: 'mvn --version', desc: 'Spring Boot 构建工具' },
    { name: 'python', check: 'python --version', desc: 'Flask/FastAPI 需要' },
    { name: 'pip', check: 'pip --version', desc: 'Python 包管理' },
    { name: 'go', check: 'go version', desc: 'Go 后端需要' },
    { name: 'dotnet', check: 'dotnet --version', desc: '.NET 后端需要' },
  ];
  
  for (const { name, check, desc } of tools) {
    if (hasCommand(name)) {
      const version = getVersion(name, check.split(' ').slice(1));
      ok(`${name.padEnd(8)} ${paint('dim', `(${desc})`)} ${version ? `- ${version}` : '已安装'}`);
    } else {
      info(`${name.padEnd(8)} ${paint('dim', `(${desc})`)} 未安装`);
    }
  }
  
  line('');
}

/** 检查系统信息 */
function checkSystemInfo() {
  line(paint('bold', '7. 系统信息'));
  
  info(`操作系统: ${platform()} ${release()} (${arch()})`);
  info(`用户目录: ${homedir()}`);
  info(`当前目录: ${process.cwd()}`);
  
  line('');
}

/** 主诊断逻辑 */
export async function diagnose() {
  line('');
  line(paint('bold', paint('cyan', '━━━ 系统诊断 ━━━')));
  line('');
  
  checkNodeEnv();
  checkTerminal();
  const packageOk = checkPackageIntegrity();
  testCopyCapability();
  const toolWarnings = checkRequiredTools();
  checkOptionalTools();
  checkSystemInfo();
  
  // 汇总
  line(paint('cyan', '━━━ 诊断结果 ━━━'));
  line('');
  
  const issues = [];
  if (!packageOk) issues.push('包资源不完整');
  issues.push(...toolWarnings);
  
  if (issues.length === 0) {
    line(paint('green', '✓ 系统环境正常，可以开始使用'));
    line('');
    info('快速开始：');
    info('  graduation-kit create              # 交互式创建项目');
    info('  graduation-kit create --list       # 查看可用模板和脚手架');
    info('  graduation-kit install -g          # 全局安装 Agent Skills');
    line('');
  } else {
    line(paint('yellow', `⚠ 发现 ${issues.length} 个问题：`));
    line('');
    issues.forEach((issue, i) => {
      line(`  ${i + 1}. ${issue}`);
    });
    line('');
    warn('部分功能可能受限，建议安装缺失工具');
    line('');
  }
}
