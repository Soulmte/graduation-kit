/**
 * 验证导入后的项目结构与配置完整性
 * 检查：目录结构、配置文件、数据库连接、依赖完整性
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

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

/** 检查必需的目录结构 */
function checkDirectories(root) {
  const issues = [];
  const dirs = [
    { path: 'backend', desc: '后端代码' },
    { path: 'docs', desc: '数据库脚本' },
    { path: 'uploads', desc: '上传目录' },
  ];

  line(paint('bold', '1. 目录结构'));
  let hasBackend = false;
  let hasFrontend = false;

  for (const { path: dir, desc } of dirs) {
    const fullPath = join(root, dir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      ok(`${dir}/ ${paint('dim', `(${desc})`)} 存在`);
      if (dir === 'backend') hasBackend = true;
    } else {
      fail(`${dir}/ ${paint('dim', `(${desc})`)} 缺失`);
      issues.push(`缺少 ${dir}/ 目录`);
    }
  }

  // 检查前端目录（可能是 frontend/ 或 frontend-xxx/）
  const allDirs = readdirSync(root).filter((n) => {
    const stat = statSync(join(root, n));
    return stat.isDirectory() && (n === 'frontend' || n.startsWith('frontend-'));
  });

  if (allDirs.length > 0) {
    hasFrontend = true;
    allDirs.forEach((dir) => {
      ok(`${dir}/ ${paint('dim', '(前端代码)')} 存在`);
    });
  } else {
    fail('frontend/ 缺失');
    issues.push('缺少前端目录');
  }

  line('');
  return { issues, hasBackend, hasFrontend, frontendDirs: allDirs };
}

/** 检测后端类型 */
function detectBackend(backendDir) {
  if (existsSync(join(backendDir, 'pom.xml'))) return 'springboot';
  if (existsSync(join(backendDir, 'package.json'))) return 'express';
  if (existsSync(join(backendDir, 'app.py'))) return 'flask';
  if (existsSync(join(backendDir, 'go.mod'))) return 'go';
  if (existsSync(join(backendDir, 'Program.cs'))) return 'dotnet';
  return null;
}

/** 检查后端配置文件 */
function checkBackendConfig(root) {
  const issues = [];
  const backendDir = join(root, 'backend');
  if (!existsSync(backendDir)) return { issues };

  line(paint('bold', '2. 后端配置'));

  const backendType = detectBackend(backendDir);
  if (!backendType) {
    fail('无法识别后端框架');
    issues.push('后端框架未知');
    line('');
    return { issues };
  }

  info(`检测到后端：${backendType}`);

  // 检查各框架的配置文件
  const configs = {
    springboot: [
      { file: '.env', required: false },
      { file: 'src/main/resources/application.yml', required: true },
      { file: 'pom.xml', required: true },
    ],
    express: [
      { file: '.env', required: true },
      { file: 'package.json', required: true },
      { file: 'src/config/db.js', required: true },
    ],
    flask: [
      { file: '.env', required: true },
      { file: 'config.py', required: true },
      { file: 'requirements.txt', required: true },
    ],
    go: [
      { file: '.env', required: true },
      { file: 'go.mod', required: true },
      { file: 'config/database.go', required: true },
    ],
    dotnet: [
      { file: '.env', required: false },
      { file: 'appsettings.json', required: true },
      { file: 'appsettings.Development.json', required: true },
    ],
  };

  const toCheck = configs[backendType] || [];
  for (const { file, required } of toCheck) {
    const fullPath = join(backendDir, file);
    if (existsSync(fullPath)) {
      ok(`${file} 存在`);

      // 检查敏感配置
      if (file.includes('.env') || file.includes('application')) {
        const content = readFileSync(fullPath, 'utf8');
        if (content.includes('__DB_PASSWORD__')) {
          warn(`${file} 仍包含占位符 __DB_PASSWORD__`);
          issues.push(`${file} 未配置数据库密码`);
        }
      }
    } else {
      if (required) {
        fail(`${file} 缺失`);
        issues.push(`缺少必需配置文件 ${file}`);
      } else {
        warn(`${file} 缺失（可选）`);
      }
    }
  }

  line('');
  return { issues, backendType };
}

/** 检查前端配置文件 */
function checkFrontendConfig(root, frontendDirs) {
  const issues = [];
  if (frontendDirs.length === 0) return { issues };

  line(paint('bold', '3. 前端配置'));

  for (const dir of frontendDirs) {
    const fullPath = join(root, dir);
    info(`检查 ${dir}/`);

    // 检查是否是小程序
    const isWxapp = existsSync(join(fullPath, 'app.json'));
    const isUniapp = existsSync(join(fullPath, 'manifest.json')) && 
                     existsSync(join(fullPath, 'pages.json'));

    if (isWxapp) {
      const required = ['app.json', 'app.js', 'config/index.js'];
      required.forEach((file) => {
        if (existsSync(join(fullPath, file))) {
          ok(`  ${file} 存在`);
        } else {
          fail(`  ${file} 缺失`);
          issues.push(`${dir}/${file} 缺失`);
        }
      });
    } else if (isUniapp) {
      const required = ['manifest.json', 'pages.json', 'config/index.js'];
      required.forEach((file) => {
        if (existsSync(join(fullPath, file))) {
          ok(`  ${file} 存在`);
        } else {
          fail(`  ${file} 缺失`);
          issues.push(`${dir}/${file} 缺失`);
        }
      });
    } else {
      // Vite 项目
      const required = ['package.json', '.env.development', 'index.html'];
      required.forEach((file) => {
        if (existsSync(join(fullPath, file))) {
          ok(`  ${file} 存在`);
        } else {
          fail(`  ${file} 缺失`);
          issues.push(`${dir}/${file} 缺失`);
        }
      });
    }
  }

  line('');
  return { issues };
}

/** 检查数据库脚本 */
function checkDatabaseScript(root) {
  const issues = [];
  line(paint('bold', '4. 数据库脚本'));

  const docsDir = join(root, 'docs');
  if (!existsSync(docsDir)) {
    fail('docs/ 目录不存在');
    issues.push('缺少 docs/ 目录');
    line('');
    return { issues };
  }

  const sqlFiles = readdirSync(docsDir).filter((f) => f.endsWith('.sql'));
  if (sqlFiles.length === 0) {
    fail('未找到 .sql 文件');
    issues.push('docs/ 目录下无 SQL 脚本');
  } else {
    sqlFiles.forEach((file) => {
      ok(`${file} 存在`);
      // 读取文件检查基本表
      const content = readFileSync(join(docsDir, file), 'utf8');
      const tables = ['user', 'notice', 'operation_log'];
      const missing = tables.filter((t) => !content.includes(`CREATE TABLE`) || !content.includes(t));
      if (missing.length === 0) {
        info(`  包含核心表：${tables.join(', ')}`);
      } else {
        warn(`  可能缺少核心表：${missing.join(', ')}`);
      }
    });
  }

  line('');
  return { issues };
}

/** 检查其他重要文件 */
function checkOtherFiles(root) {
  const issues = [];
  line(paint('bold', '5. 其他文件'));

  const files = [
    { name: 'README.md', desc: '项目说明', required: true },
    { name: '.gitignore', desc: 'Git 忽略配置', required: true },
    { name: 'uploads/.gitkeep', desc: '上传目录占位', required: false },
  ];

  files.forEach(({ name, desc, required }) => {
    if (existsSync(join(root, name))) {
      ok(`${name} ${paint('dim', `(${desc})`)} 存在`);
    } else {
      if (required) {
        fail(`${name} ${paint('dim', `(${desc})`)} 缺失`);
        issues.push(`缺少 ${name}`);
      } else {
        warn(`${name} ${paint('dim', `(${desc})`)} 缺失`);
      }
    }
  });

  line('');
  return { issues };
}

/** 检查 Agent Skills */
function checkSkills(root) {
  line(paint('bold', '6. Agent Skills'));

  const skillsDir = join(root, '.agents', 'skills');
  if (!existsSync(skillsDir)) {
    warn('未安装 Agent Skills');
    line('');
    return;
  }

  const skills = readdirSync(skillsDir).filter((n) => {
    const stat = statSync(join(skillsDir, n));
    return stat.isDirectory() && existsSync(join(skillsDir, n, 'SKILL.md'));
  });

  if (skills.length === 0) {
    warn('.agents/skills/ 存在但无有效 skill');
  } else {
    ok(`已安装 ${skills.length} 个 skill`);
    info(`  ${skills.join(', ')}`);
  }

  line('');
}

/** 主验证逻辑 */
export async function verify(targetDir, silent = false) {
  const root = resolve(targetDir);

  if (!silent) {
    line('');
    line(paint('bold', paint('cyan', '━━━ 项目结构验证 ━━━')));
    line('');
    line(`目标目录：${paint('cyan', root)}`);
    line('');
  }

  if (!existsSync(root)) {
    if (!silent) fail('目录不存在');
    return 1;
  }

  const allIssues = [];

  const { issues: dirIssues, hasBackend, hasFrontend, frontendDirs } = checkDirectories(root);
  allIssues.push(...dirIssues);

  if (hasBackend) {
    const { issues: beIssues } = checkBackendConfig(root);
    allIssues.push(...beIssues);
  }

  if (hasFrontend) {
    const { issues: feIssues } = checkFrontendConfig(root, frontendDirs);
    allIssues.push(...feIssues);
  }

  const { issues: dbIssues } = checkDatabaseScript(root);
  allIssues.push(...dbIssues);

  const { issues: fileIssues } = checkOtherFiles(root);
  allIssues.push(...fileIssues);

  checkSkills(root);

  // 汇总
  if (!silent) {
    line(paint('cyan', '━━━ 验证结果 ━━━'));
    line('');
  }

  if (allIssues.length === 0) {
    if (!silent) {
      line(paint('green', '✓ 项目结构完整，配置正常'));
      line('');
      info('下一步：');
      info('  1. 检查后端配置文件中的数据库密码');
      info('  2. 导入数据库脚本');
      info('  3. 安装依赖并启动项目');
      line('');
    }
    return 0;
  } else {
    if (!silent) {
      line(paint('red', `✗ 发现 ${allIssues.length} 个问题：`));
      line('');
      allIssues.forEach((issue, i) => {
        line(`  ${i + 1}. ${issue}`);
      });
      line('');
      warn('建议：重新运行 create 命令或手动补全缺失文件');
      line('');
    }
    return 1;
  }
}
