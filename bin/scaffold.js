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
  {
    id: 'agent',
    label: 'AI Agent demo',
    note: '拖拽编排智能体、知识库检索、流式对话，需自备大模型 API Key',
    dir: 'agent',
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
  const escapedPassword = escapePasswordForYaml(db.password);
  
  const envEdits = [
    ['__DB_PASSWORD__', db.password],
    ['DB_NAME=scaffold_db', `DB_NAME=${db.name}`],
    ['UPLOAD_DIR=../../uploads', 'UPLOAD_DIR=../uploads'],
  ];
  if (replaceInFile(join(dir, '.env'), envEdits)) changed.push('.env');

  const yml = join(dir, 'src', 'main', 'resources', 'application.yml');
  if (replaceInFile(yml, [
    ['__DB_PASSWORD__', escapedPassword],
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
  if (!existsSync(from)) {
    throw new Error(`源目录不存在：${from}`);
  }
  
  try {
    // 确保目标目录存在
    mkdirSync(to, { recursive: true });
    
    // 使用 cpSync 递归拷贝，Windows 下更可靠
    cpSync(from, to, { 
      recursive: true, 
      errorOnExist: false, 
      force: true,
      // Windows 下保留符号链接的处理
      verbatimSymlinks: false,
    });
  } catch (err) {
    // 如果 cpSync 失败（某些 Node 版本或文件系统问题），回退到手动拷贝
    if (err.code === 'ERR_FS_CP_UNKNOWN' || err.message.includes('EPERM')) {
      copyTreeManual(from, to);
    } else {
      throw new Error(`拷贝失败：${from} -> ${to}\n原因：${err.message}`);
    }
  }
}

/** 手动递归拷贝（回退方案） */
function copyTreeManual(from, to) {
  mkdirSync(to, { recursive: true });
  const entries = readdirSync(from, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(from, entry.name);
    const destPath = join(to, entry.name);
    
    if (entry.isDirectory()) {
      copyTreeManual(srcPath, destPath);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      try {
        cpSync(srcPath, destPath, { force: true });
      } catch (err) {
        // 某些符号链接或特殊文件跳过
        if (err.code !== 'ENOENT') {
          console.warn(`跳过文件：${srcPath}（${err.message}）`);
        }
      }
    }
  }
}

export function defaultProjectName(input) {
  const n = (input || '').trim();
  if (n) return n;
  return basename(resolve(process.cwd())) === '' ? 'my-graduation-project' : 'my-graduation-project';
}

/** 目录名合法性：避免用户输入带路径分隔符或非法字符 */
export function validName(name) {
  if (!name) return '名称不能为空';
  if (name.length > 100) return '名称过长（最多 100 字符）';
  
  // 不能以 . 或 - 开头（隐藏文件或解析问题）
  if (/^[.-]/.test(name)) return '名称不能以 . 或 - 开头';
  
  // Windows 保留名检查（不区分大小写）
  const reserved = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
  const lower = name.toLowerCase().replace(/\.[^.]*$/, ''); // 去除扩展名
  if (reserved.includes(lower)) return `名称不能使用系统保留字：${lower}`;
  
  // 禁止路径分隔符和其他危险字符
  if (/[\/\\:*?"<>|]/.test(name)) {
    return '名称不能包含路径分隔符或特殊字符（/ \\ : * ? " < > |）';
  }
  
  // 限字母数字与 - _ .（空格和中文会让构建工具报错）
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    return '名称只能用字母数字与 - _ .，且以字母数字开头';
  }
  
  return null;
}

/** 库名只允许 MySQL 标识符常见字符 */
export function validDbName(name) {
  if (!name) return '库名不能为空';
  if (name.length > 64) return '库名过长（MySQL 限制 64 字符）';
  
  // MySQL 保留字检查（不区分大小写）
  const reserved = ['database', 'table', 'select', 'insert', 'update', 'delete', 'user', 'group', 'order', 'where', 'from', 'join', 'index', 'key', 'primary', 'foreign'];
  if (reserved.includes(name.toLowerCase())) {
    return `库名不能使用 MySQL 保留字：${name}`;
  }
  
  // 允许字母数字下划线和美元符号（MySQL 合法字符）
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    return '库名只能用字母、数字、下划线、美元符号，且不以数字开头';
  }
  
  return null;
}

/** 验证 MySQL 密码：检查可能导致配置文件解析问题的字符 */
export function validDbPassword(password) {
  if (!password) return null; // 允许空密码
  if (password.length > 128) return '密码过长（最多 128 字符）';
  
  // 检查危险字符：引号、反斜杠、换行等
  const dangerous = ['"', "'", '`', '\\', '\n', '\r', '\t'];
  const found = dangerous.filter(c => password.includes(c));
  if (found.length > 0) {
    const names = {'"': '双引号', "'": '单引号', '`': '反引号', '\\': '反斜杠', '\n': '换行', '\r': '回车', '\t': '制表符'};
    return `密码不能包含 ${found.map(c => names[c] || c).join('、')}`;
  }
  
  // 检查 YAML 特殊字符（给出警告但不阻止，因为可以转义）
  const yamlSpecial = [':', '#', '&', '*', '!', '|', '>', '%'];
  const foundYaml = yamlSpecial.filter(c => password.includes(c));
  if (foundYaml.length > 0) {
    return `警告：密码包含 YAML 特殊字符 (${foundYaml.join(' ')})，将自动转义处理`;
  }
  
  return null;
}

/** 安全转义密码用于 YAML 配置文件 */
export function escapePasswordForYaml(password) {
  if (!password) return '';
  
  // YAML 特殊字符需要加引号
  const needsQuote = /[:\s#&*!|>@%'"]/.test(password);
  
  if (needsQuote) {
    // 引号内的反斜杠和双引号需要转义
    const escaped = password.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  
  return password;
}

/** 安全转义密码用于 properties 配置文件 */
export function escapePasswordForProperties(password) {
  if (!password) return '';
  // properties 文件需要转义冒号、等号、反斜杠
  return password
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/=/g, '\\=');
}
