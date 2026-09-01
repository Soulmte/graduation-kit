/**
 * graduation-kit verify —— 检查已生成项目的完整性与配置正确性。
 * 扫描当前目录或指定目录，验证：
 * - 目录结构（backend / frontend / docs / uploads）
 * - 关键文件存在性
 * - 配置改写是否生效（数据库名、端口、uploads 路径）
 * - 依赖清单文件（package.json / pom.xml / requirements.txt / go.mod）
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', cyan: '\x1b[36m', yellow: '\x1b[33m', red: '\x1b[31m' };
const paint = (c, s) => (process.stdout.isTTY ? `${C[c]}${s}${C.reset}` : s);
const line = (s = '') => console.log(s);
const ok = (s) => line(`${paint('green', '✓')} ${s}`);
const warn = (s) => line(`${paint('yellow', '!')} ${s}`);
const err = (s) => line(`${paint('red', '✗')} ${s}`);
const dim = (s) => paint('dim', s);

/**
 * 检查结果统计
 */
class CheckResult {
  constructor() {
    this.passed = 0;
    this.warnings = 0;
    this.errors = 0;
  }

  ok(msg) {
    ok(msg);
    this.passed++;
  }

  warn(msg) {
    warn(msg);
    this.warnings++;
  }

  error(msg) {
    err(msg);
    this.errors++;
  }

  summary() {
    line();
    if (this.errors === 0 && this.warnings === 0) {
      line(paint('green', '✓ 项目结构完整，配置正确，可以开始开发'));
    } else {
      line(`检查完成：${paint('green', this.passed + ' 项通过')}，${paint('yellow', this.warnings + ' 项警告')}，${paint('red', this.errors + ' 项错误')}`);
      if (this.errors > 0) {
        line(paint('red', '\n有严重错误，请重新生成项目或手动修复'));
      }
    }
  }
}

/**
 * 检查目录是否存在且非空
 */
function checkDir(result, dir, name, required = true) {
  if (!existsSync(dir)) {
    if (required) {
      result.error(`缺少 ${name} 目录`);
    } else {
      result.warn(`未找到 ${name} 目录（可选）`);
    }
    return false;
  }
  const stat = statSync(dir);
  if (!stat.isDirectory()) {
    result.error(`${name} 不是目录`);
    return false;
  }
  const files = readdirSync(dir);
  if (files.length === 0) {
    result.warn(`${name} 目录为空`);
    return false;
  }
  result.ok(`${name} 目录存在`);
  return true;
}

/**
 * 检查文件是否存在
 */
function checkFile(result, file, name, required = true) {
  if (!existsSync(file)) {
    if (required) {
      result.error(`缺少 ${name}`);
    } else {
      result.warn(`未找到 ${name}（可选）`);
    }
    return false;
  }
  const stat = statSync(file);
  if (!stat.isFile()) {
    result.error(`${name} 不是文件`);
    return false;
  }
  result.ok(`${name} 存在`);
  return true;
}

/**
 * 检查文件内容是否包含指定文本
 */
function checkContent(result, file, name, pattern, hint) {
  if (!existsSync(file)) return false;
  try {
    const content = readFileSync(file, 'utf8');
    if (typeof pattern === 'string') {
      if (!content.includes(pattern)) {
        result.warn(`${name} 未改写：${hint}`);
        return false;
      }
    } else if (pattern instanceof RegExp) {
      if (!pattern.test(content)) {
        result.warn(`${name} 未改写：${hint}`);
        return false;
      }
    }
    result.ok(`${name} 已改写：${hint}`);
    return true;
  } catch (e) {
    result.error(`${name} 读取失败：${e.message}`);
    return false;
  }
}

/**
 * 检查占位符是否残留（未改写）
 */
function checkNoPlaceholder(result, file, name, placeholder) {
  if (!existsSync(file)) return true;
  try {
    const content = readFileSync(file, 'utf8');
    if (content.includes(placeholder)) {
      result.error(`${name} 仍有占位符 ${placeholder}，配置未生效`);
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
}

/**
 * 检测后端类型
 */
function detectBackend(dir) {
  if (existsSync(join(dir, 'pom.xml'))) return 'springboot';
  if (existsSync(join(dir, 'package.json'))) return 'express';
  if (existsSync(join(dir, 'requirements.txt'))) return 'flask';
  if (existsSync(join(dir, 'go.mod'))) return 'go';
  const csproj = readdirSync(dir).find((f) => f.endsWith('.csproj'));
  if (csproj) return 'dotnet';
  return null;
}

/**
 * 检测前端类型
 */
function detectFrontend(dir) {
  if (!existsSync(join(dir, 'package.json'))) return null;
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  if (pkg.dependencies?.react) return 'react';
  if (pkg.dependencies?.vue) {
    if (pkg.dependencies?.['element-plus']) return 'vue-elementplus';
    if (pkg.dependencies?.['ant-design-vue']) return 'vue-antd';
    if (pkg.dependencies?.['naive-ui']) return 'vue-naive';
    return 'vue';
  }
  if (existsSync(join(dir, 'manifest.json'))) return 'uniapp';
  if (existsSync(join(dir, 'project.config.json'))) return 'wxapp';
  return 'unknown';
}

/**
 * 验证后端配置
 */
function verifyBackend(result, dir, type) {
  line();
  line(paint('cyan', `━━ 后端 (${type}) ━━`));

  if (type === 'springboot') {
    checkFile(result, join(dir, 'pom.xml'), 'pom.xml');
    const yml = join(dir, 'src', 'main', 'resources', 'application.yml');
    if (checkFile(result, yml, 'application.yml')) {
      checkNoPlaceholder(result, yml, 'application.yml', '__DB_PASSWORD__');
      checkNoPlaceholder(result, yml, 'application.yml', 'scaffold_db');
      checkContent(result, yml, 'application.yml', 'path: ../uploads', 'uploads 路径已改为项目相对路径');
    }
  } else if (type === 'express') {
    checkFile(result, join(dir, 'package.json'), 'package.json');
    const env = join(dir, '.env');
    if (checkFile(result, env, '.env')) {
      checkNoPlaceholder(result, env, '.env', '__DB_PASSWORD__');
      checkNoPlaceholder(result, env, '.env', 'scaffold_db');
      checkContent(result, env, '.env', 'UPLOAD_DIR=../uploads', 'uploads 路径已改为项目相对路径');
    }
  } else if (type === 'flask') {
    checkFile(result, join(dir, 'requirements.txt'), 'requirements.txt');
    const cfg = join(dir, 'config.py');
    if (checkFile(result, cfg, 'config.py')) {
      checkNoPlaceholder(result, cfg, 'config.py', '__DB_PASSWORD__');
      checkContent(result, cfg, 'config.py', "'../uploads'", 'uploads 路径已改为项目相对路径');
    }
  } else if (type === 'go') {
    checkFile(result, join(dir, 'go.mod'), 'go.mod');
    const cfg = join(dir, 'config', 'upload.go');
    if (checkFile(result, cfg, 'config/upload.go', false)) {
      checkContent(result, cfg, 'config/upload.go', '"../uploads"', 'uploads 路径已改为项目相对路径');
    }
  } else if (type === 'dotnet') {
    const csproj = readdirSync(dir).find((f) => f.endsWith('.csproj'));
    if (csproj) {
      checkFile(result, join(dir, csproj), csproj);
    }
    const cfg = join(dir, 'Config', 'UploadConfig.cs');
    if (checkFile(result, cfg, 'Config/UploadConfig.cs', false)) {
      checkContent(result, cfg, 'Config/UploadConfig.cs', '"../uploads"', 'uploads 路径已改为项目相对路径');
    }
  }
}

/**
 * 验证前端配置
 */
function verifyFrontend(result, dir, name, type) {
  line();
  line(paint('cyan', `━━ ${name} (${type}) ━━`));

  if (['react', 'vue-elementplus', 'vue-antd', 'vue-naive', 'vue'].includes(type)) {
    checkFile(result, join(dir, 'package.json'), 'package.json');
    checkFile(result, join(dir, 'vite.config.js'), 'vite.config.js', false) ||
      checkFile(result, join(dir, 'vite.config.ts'), 'vite.config.ts', false);
    const env = join(dir, '.env.development');
    if (checkFile(result, env, '.env.development')) {
      checkContent(result, env, '.env.development', /http:\/\/localhost:\d{4}/, '已配置后端端口');
    }
  } else if (type === 'uniapp') {
    checkFile(result, join(dir, 'package.json'), 'package.json');
    checkFile(result, join(dir, 'manifest.json'), 'manifest.json');
    const cfg = join(dir, 'config', 'index.js');
    if (checkFile(result, cfg, 'config/index.js')) {
      checkContent(result, cfg, 'config/index.js', /:\d{4}/, '已配置后端端口');
    }
  } else if (type === 'wxapp') {
    checkFile(result, join(dir, 'project.config.json'), 'project.config.json');
    const cfg = join(dir, 'config', 'index.js');
    if (checkFile(result, cfg, 'config/index.js')) {
      checkContent(result, cfg, 'config/index.js', /:\d{4}/, '已配置后端端口');
    }
  }
}

/**
 * 验证 docs 目录与 SQL 文件
 */
function verifyDocs(result, dir) {
  line();
  line(paint('cyan', '━━ 数据库脚本 ━━'));

  if (!checkDir(result, dir, 'docs')) return;

  const files = readdirSync(dir).filter((f) => f.endsWith('.sql'));
  if (files.length === 0) {
    result.error('docs 目录缺少 .sql 文件');
    return;
  }
  if (files.length > 1) {
    result.warn(`docs 目录有 ${files.length} 个 .sql 文件，通常只需一个`);
  }

  const sqlFile = join(dir, files[0]);
  checkFile(result, sqlFile, files[0]);
  checkNoPlaceholder(result, sqlFile, files[0], 'scaffold_db');
  
  // 检查 SQL 文件名是否与内容库名一致
  const content = readFileSync(sqlFile, 'utf8');
  const match = content.match(/CREATE DATABASE.*?`(\w+)`/);
  if (match) {
    const dbName = match[1];
    const expectedName = `${dbName}.sql`;
    if (files[0] !== expectedName) {
      result.warn(`SQL 文件名 ${files[0]} 与内容库名 ${dbName} 不一致，建议改为 ${expectedName}`);
    } else {
      result.ok(`SQL 文件名与库名一致：${dbName}`);
    }
  }
}

/**
 * 主入口
 */
export async function verify(targetDir) {
  const dir = targetDir ? resolve(targetDir) : process.cwd();
  const name = basename(dir);

  line();
  line(paint('cyan', '毕业设计项目完整性检查'));
  line(dim(`目录：${dir}`));

  if (!existsSync(dir)) {
    err(`目录不存在：${dir}`);
    process.exit(1);
  }

  const result = new CheckResult();

  // 1. 基础结构
  line();
  line(paint('cyan', '━━ 目录结构 ━━'));
  const hasBackend = checkDir(result, join(dir, 'backend'), 'backend');
  const hasUploads = checkDir(result, join(dir, 'uploads'), 'uploads');
  checkDir(result, join(dir, 'docs'), 'docs');
  checkFile(result, join(dir, 'README.md'), 'README.md', false);
  checkFile(result, join(dir, '.gitignore'), '.gitignore', false);

  // 2. 检测前端（可能有多个）
  const frontends = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'frontend' || entry.startsWith('frontend-')) {
      const fDir = join(dir, entry);
      if (statSync(fDir).isDirectory()) {
        frontends.push({ name: entry, dir: fDir });
      }
    }
  }

  if (frontends.length === 0) {
    result.warn('未找到 frontend 目录，请检查是否选择了前端');
  } else {
    result.ok(`找到 ${frontends.length} 个前端目录`);
  }

  // 3. 验证后端
  if (hasBackend) {
    const backendType = detectBackend(join(dir, 'backend'));
    if (backendType) {
      verifyBackend(result, join(dir, 'backend'), backendType);
    } else {
      result.error('无法识别后端类型（缺少 pom.xml / package.json / requirements.txt / go.mod / .csproj）');
    }
  }

  // 4. 验证前端
  for (const { name: fname, dir: fdir } of frontends) {
    const frontendType = detectFrontend(fdir);
    if (frontendType) {
      verifyFrontend(result, fdir, fname, frontendType);
    } else {
      result.warn(`${fname} 无法识别类型`);
    }
  }

  // 5. 验证数据库脚本
  verifyDocs(result, join(dir, 'docs'));

  // 6. 汇总
  result.summary();

  // 返回退出码：有错误时返回 1，否则返回 0
  return result.errors > 0 ? 1 : 0;
}
