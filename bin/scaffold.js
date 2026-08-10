/**
 * 脚手架分步创建：选后端、选前端、填数据库、落盘、改写端口与密码。
 * 目录约定与 graduation-project skill 一致：backend/ + frontend/ + docs/ + uploads/
 */
import { existsSync, mkdirSync, readdirSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

/** 可用后端。port 必须与脚手架内实际配置一致 */
export const BACKENDS = [
  { id: 'springboot', label: 'Spring Boot 3', port: 8080, lang: 'Java 17 + MyBatis-Plus', ready: true },
  { id: 'express', label: 'Express 4', port: 8081, lang: 'Node.js + mysql2', ready: true },
  { id: 'flask', label: 'Flask 3', port: 8082, lang: 'Python + PyMySQL', ready: true },
  { id: 'fastapi', label: 'FastAPI', port: 8083, lang: 'Python 异步', ready: false },
  { id: 'go', label: 'Gin', port: 8084, lang: 'Go 1.21 + database/sql', ready: true },
  { id: 'dotnet', label: 'ASP.NET Core', port: 8085, lang: 'C# / .NET 10 + MySql.Data', ready: true },
];

/** 可用前端。kind 决定端口改写方式 */
export const FRONTENDS = [
  { id: 'react', label: 'React 18 + 自研组件', kind: 'vite', ready: true },
  { id: 'vue-elementplus', label: 'Vue 3 + Element Plus', kind: 'vite', ready: true },
  { id: 'vue-antd', label: 'Vue 3 + Ant Design Vue', kind: 'vite', ready: true },
  { id: 'vue-naive', label: 'Vue 3 + Naive UI（含暗色模式）', kind: 'vite', ready: true },
  { id: 'uniapp', label: 'uni-app 跨端（H5 / 小程序 / App）', kind: 'uniapp', ready: true },
  { id: 'wxapp', label: '微信小程序原生', kind: 'wxapp', ready: true },
];

export const readyBackends = () => BACKENDS.filter((b) => b.ready);
export const readyFrontends = () => FRONTENDS.filter((f) => f.ready);

/**
 * 可选模板。
 * clean 是空脚手架，后端前端自由组合；
 * demo 类模板是已经写好业务的完整项目，技术栈固定，用 be / fe 锁死。
 */
export const TEMPLATES = [
  {
    id: 'clean',
    label: '干净脚手架',
    note: '只有登录注册、用户、公告、日志这些底子，业务自己写',
    ready: true,
  },
  {
    id: 'trade',
    label: '交易 demo',
    note: '在脚手架之上多了商家、商品、购物车、订单、支付、退款一整套',
    dir: 'trade',
    be: 'springboot',
    fe: ['vue-antd'],
    ready: true,
  },
  {
    id: 'booking',
    label: '预约 demo',
    note: '服务机构、服务项、排班时段、预约单、到店核销、评价一整套',
    dir: 'booking',
    be: 'springboot',
    fe: ['vue-antd'],
    ready: true,
  },
];

export const readyTemplates = () => TEMPLATES.filter((t) => t.ready);

/** 找模板，找不到返回 undefined 交由调用方报错 */
export function findTemplate(id) {
  return TEMPLATES.find((t) => t.id === id);
}

/** demo 模板的三个来源目录。clean 模板不走这里 */
export function demoPaths(srcScaffolds, template) {
  const base = join(srcScaffolds, 'demos', template.dir);
  return {
    backend: join(base, 'backend'),
    frontend: join(base, 'frontend'),
    docs: join(base, 'docs'),
  };
}

/** 多前端时的目录名：单个用 frontend/，多个用 frontend-<id>/ */
export function frontendDirName(id, total) {
  return total === 1 ? 'frontend' : `frontend-${id}`;
}

function replaceInFile(file, edits) {
  if (!existsSync(file)) return false;
  let text = readFileSync(file, 'utf8');
  const before = text;
  for (const [from, to] of edits) text = text.split(from).join(to);
  if (text === before) return false;
  writeFileSync(file, text);
  return true;
}

/**
 * 把后端配置里的占位密码与 uploads 相对路径改成新项目的实际值。
 * 脚手架里后端在 backends/<id>/，uploads 在上两级；新项目里后端在 backend/，只需上一级。
 */
export function patchBackend(dir, backend, db) {
  const changed = [];
  const envEdits = [
    ['__DB_PASSWORD__', db.password],
    ['DB_NAME=scaffold_db', `DB_NAME=${db.name}`],
    ['UPLOAD_DIR=../../uploads', 'UPLOAD_DIR=../uploads'],
  ];
  if (replaceInFile(join(dir, '.env'), envEdits)) changed.push('.env');

  const yml = join(dir, 'src', 'main', 'resources', 'application.yml');
  if (replaceInFile(yml, [
    ['__DB_PASSWORD__', db.password],
    ['/scaffold_db?', `/${db.name}?`],
    ['path: ../../uploads', 'path: ../uploads'],
  ])) changed.push('application.yml');

  // 代码里还有几处按脚手架层级硬编码的 uploads 路径，同样要少一级
  for (const [rel, edits] of Object.entries({
    'config.py': [
      ["'../../uploads'", "'../uploads'"],
      ['默认指向脚手架根的 uploads', '默认指向项目根的 uploads'],
    ],
    'src/config/upload.js': [["'../../uploads'", "'../uploads'"]],
    'src/app.js': [["'../../../uploads'", "'../../uploads'"]],
    'src/services/fileService.js': [["'../../../../uploads'", "'../../../uploads'"]],
    'config/upload.go': [['"../../uploads"', '"../uploads"']],
    'Config/UploadConfig.cs': [['"../../uploads"', '"../uploads"']],
  })) {
    if (replaceInFile(join(dir, ...rel.split('/')), edits)) changed.push(rel);
  }

  return changed;
}

/** 前端指向所选后端的端口 */
export function patchFrontend(dir, frontend, port) {
  const changed = [];
  if (frontend.kind === 'vite') {
    if (replaceInFile(join(dir, '.env.development'), [
      ['http://localhost:8080', `http://localhost:${port}`],
    ])) changed.push('.env.development');
    return changed;
  }
  if (replaceInFile(join(dir, 'config', 'index.js'), [[':8080', `:${port}`]])) {
    changed.push('config/index.js');
  }
  if (frontend.kind === 'uniapp') {
    if (replaceInFile(join(dir, 'manifest.json'), [
      ['http://localhost:8080', `http://localhost:${port}`],
    ])) changed.push('manifest.json');
  }
  return changed;
}

/** SQL 文件名跟随库名，一个项目一眼能看出建的是哪个库 */
export function sqlFileName(dbName) {
  return `${dbName}.sql`;
}

/** SQL 里的库名跟随用户选择。反引号标识符与注释里的名字一起换 */
export function patchSql(file, dbName) {
  return replaceInFile(file, [
    ['`scaffold_db`', `\`${dbName}\``],
    ['数据库：scaffold_db', `数据库：${dbName}`],
    ['< scaffold_db.sql', `< docs/${sqlFileName(dbName)}`],
  ]);
}

export function assertEmptyTarget(dir) {
  if (!existsSync(dir)) return;
  const rest = readdirSync(dir).filter((n) => n !== '.git' && n !== '.agents');
  if (rest.length) {
    throw new Error(`目标目录非空：${dir}\n  已有 ${rest.slice(0, 5).join('、')}${rest.length > 5 ? ' 等' : ''}`);
  }
}

export function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

export function defaultProjectName(input) {
  const n = (input || '').trim();
  if (n) return n;
  return basename(resolve(process.cwd())) === '' ? 'my-graduation-project' : 'my-graduation-project';
}

/** 目录名合法性：避免用户输入带路径分隔符或非法字符 */
export function validName(name) {
  if (!name) return '名称不能为空';
  // 限字母数字与 - _ 。空格和中文会让 mvn / npm 在部分环境下报错
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    return '名称只能用字母数字与 - _ .，且以字母数字开头';
  }
  return null;
}

/** 库名只允许 MySQL 标识符常见字符 */
export function validDbName(name) {
  if (!name) return '库名不能为空';
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return '库名只能用字母数字下划线，且不以数字开头';
  return null;
}
