/**
 * 全面测试脚本：验证所有生成场景和终端兼容性
 */
import { execSync, spawn } from 'node:child_process';
import { existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DIR = 'F:/temp/graduation-kit-test';
const TESTS = [
  {
    name: '单后端单前端（最小配置）',
    args: 'test-minimal --dir ' + TEST_DIR + ' --be springboot --fe react --db testdb --no-skills',
    expectedDirs: ['backend', 'frontend', 'docs', 'uploads'],
    expectedFiles: ['backend/pom.xml', 'frontend/package.json', 'docs/testdb.sql'],
  },
  {
    name: '单后端多前端',
    args: 'test-multi-fe --dir ' + TEST_DIR + ' --be express --fe react,vue-elementplus,uniapp --db multidb --no-skills',
    expectedDirs: ['backend', 'frontend-react', 'frontend-vue-elementplus', 'frontend-uniapp', 'docs', 'uploads'],
    expectedFiles: ['backend/package.json', 'frontend-react/package.json', 'frontend-vue-elementplus/package.json', 'frontend-uniapp/manifest.json'],
  },
  {
    name: 'Flask 后端',
    args: 'test-flask --dir ' + TEST_DIR + ' --be flask --fe vue-antd --db flaskdb --no-skills',
    expectedDirs: ['backend', 'frontend', 'docs', 'uploads'],
    expectedFiles: ['backend/requirements.txt', 'frontend/package.json'],
  },
  {
    name: 'Go 后端',
    args: 'test-go --dir ' + TEST_DIR + ' --be go --fe react --db godb --no-skills',
    expectedDirs: ['backend', 'frontend', 'docs', 'uploads'],
    expectedFiles: ['backend/go.mod', 'frontend/package.json'],
  },
  {
    name: '.NET 后端',
    args: 'test-dotnet --dir ' + TEST_DIR + ' --be dotnet --fe vue-elementplus --db dotnetdb --no-skills',
    expectedDirs: ['backend', 'frontend', 'docs', 'uploads'],
    expectedFiles: ['backend/Program.cs', 'frontend/package.json'],
  },
  {
    name: '所有前端类型',
    args: 'test-all-fe --dir ' + TEST_DIR + ' --be springboot --fe react,vue-elementplus,vue-antd,uniapp,wxapp --db allfedb --no-skills',
    expectedDirs: ['backend', 'frontend-react', 'frontend-vue-elementplus', 'frontend-vue-antd', 'frontend-uniapp', 'frontend-wxapp', 'docs', 'uploads'],
    expectedFiles: ['frontend-react/package.json', 'frontend-uniapp/manifest.json', 'frontend-wxapp/project.config.json'],
  },
];

function cleanup() {
  console.log('\n清理测试目录...');
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

function runTest(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试：${test.name}`);
  console.log(`${'='.repeat(60)}`);

  const cmd = `node bin/cli.js create ${test.args}`;
  console.log(`命令：${cmd}\n`);

  try {
    // 执行生成命令
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });

    // 提取项目名（args 的第一个词）
    const projectName = test.args.split(' ')[0];
    const projectDir = join(TEST_DIR, projectName);

    // 验证目录结构
    console.log('\n验证目录结构...');
    for (const dir of test.expectedDirs) {
      const fullPath = join(projectDir, dir);
      if (existsSync(fullPath)) {
        console.log(`✓ ${dir}`);
      } else {
        throw new Error(`✗ 缺少目录：${dir}`);
      }
    }

    // 验证关键文件
    console.log('\n验证关键文件...');
    for (const file of test.expectedFiles) {
      const fullPath = join(projectDir, file);
      if (existsSync(fullPath)) {
        console.log(`✓ ${file}`);
      } else {
        throw new Error(`✗ 缺少文件：${file}`);
      }
    }

    // 运行 verify 命令
    console.log('\n运行 verify 检查...');
    const verifyCmd = `node bin/cli.js verify ${projectDir}`;
    const verifyResult = execSync(verifyCmd, { cwd: process.cwd() });
    console.log(verifyResult.toString());

    console.log(`\n✓ ${test.name} 测试通过`);
    return true;
  } catch (err) {
    console.error(`\n✗ ${test.name} 测试失败`);
    console.error(err.message);
    return false;
  }
}

async function main() {
  console.log('graduation-kit 全面测试');
  console.log(`测试目录：${TEST_DIR}`);
  console.log(`测试场景数：${TESTS.length}`);

  // 先运行诊断
  console.log('\n' + '='.repeat(60));
  console.log('运行包诊断...');
  console.log('='.repeat(60));
  try {
    execSync('node bin/cli.js diagnose', { stdio: 'inherit', cwd: process.cwd() });
  } catch (err) {
    console.error('诊断失败，终止测试');
    process.exit(1);
  }

  cleanup();

  const results = [];
  for (const test of TESTS) {
    const passed = runTest(test);
    results.push({ name: test.name, passed });
  }

  // 汇总结果
  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
  }

  console.log(`\n总计：${passed} 通过，${failed} 失败`);

  cleanup();

  if (failed > 0) {
    process.exit(1);
  }
}

main();
