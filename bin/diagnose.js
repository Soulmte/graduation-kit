/**
 * 诊断工具：检查包完整性和系统兼容性
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = join(__dirname, '..');

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let count = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else {
        count++;
      }
    }
  };
  walk(dir);
  return count;
}

function checkScaffolds() {
  const scaffolds = join(PKG_ROOT, 'src', 'scaffolds');
  if (!existsSync(scaffolds)) {
    console.error('✗ src/scaffolds/ 目录不存在');
    return false;
  }

  const checks = [
    { name: 'backends', expected: 6, checkDirs: true },
    { name: 'frontends', expected: 6, checkDirs: true },
    { name: 'demos', expected: 3, checkDirs: true },
    { name: 'docs', expected: 1, checkDirs: false }, // docs 是文件，不是子目录
  ];

  let allOk = true;
  for (const { name, expected, checkDirs } of checks) {
    const dir = join(scaffolds, name);
    if (!existsSync(dir)) {
      console.error(`✗ ${name}/ 目录不存在`);
      allOk = false;
      continue;
    }
    
    if (!checkDirs) {
      // 对于 docs，检查文件数量
      const fileCount = countFiles(dir);
      if (fileCount >= expected) {
        console.log(`✓ ${name}/ 有 ${fileCount} 个文件`);
      } else {
        console.warn(`! ${name}/ 只有 ${fileCount} 个文件，预期至少 ${expected} 个`);
      }
      continue;
    }
    
    const subdirs = readdirSync(dir).filter((n) => {
      const stat = statSync(join(dir, n));
      return stat.isDirectory();
    });
    if (subdirs.length < expected) {
      console.warn(`! ${name}/ 只有 ${subdirs.length} 个子目录，预期至少 ${expected} 个`);
      console.warn(`  实际：${subdirs.join(', ')}`);
    } else {
      console.log(`✓ ${name}/ 有 ${subdirs.length} 个模板`);
    }
  }

  // 检查前端文件数量
  const frontendCount = countFiles(join(scaffolds, 'frontends'));
  console.log(`✓ frontends/ 共有 ${frontendCount} 个文件`);
  if (frontendCount < 200) {
    console.warn(`! 前端文件数偏少（期望 200+），可能缺失资源`);
    allOk = false;
  }

  return allOk;
}

function checkSystem() {
  console.log('\n系统信息：');
  console.log(`  Node.js: ${process.version}`);
  console.log(`  平台: ${process.platform}`);
  console.log(`  架构: ${process.arch}`);
  console.log(`  工作目录: ${process.cwd()}`);
  console.log(`  包根目录: ${PKG_ROOT}`);
  
  // 检查路径长度
  const maxPath = PKG_ROOT.length + 100; // 最长脚手架路径相对长度
  console.log(`\n路径检查：`);
  console.log(`  包根路径长度: ${PKG_ROOT.length} 字符`);
  console.log(`  预估最长路径: ~${maxPath} 字符`);
  if (process.platform === 'win32' && maxPath > 260) {
    console.warn(`! Windows MAX_PATH 限制为 260 字符`);
    console.warn(`  建议将包安装在较短的路径下`);
  } else {
    console.log(`✓ 路径长度安全`);
  }
}

function checkImports() {
  console.log('\n依赖检查：');
  try {
    import('node:fs').then(() => console.log('✓ node:fs 可用'));
    import('node:path').then(() => console.log('✓ node:path 可用'));
    import('node:url').then(() => console.log('✓ node:url 可用'));
  } catch (err) {
    console.error('✗ Node.js 内置模块导入失败');
    return false;
  }
  return true;
}

export async function diagnose() {
  console.log('graduation-kit 包完整性诊断\n');
  
  checkSystem();
  console.log('');
  
  const scaffoldsOk = checkScaffolds();
  
  console.log('');
  if (scaffoldsOk) {
    console.log('✓ 所有检查通过');
  } else {
    console.error('✗ 发现问题，请重新安装包');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  diagnose();
}
