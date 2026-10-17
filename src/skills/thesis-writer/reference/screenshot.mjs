#!/usr/bin/env node
/**
 * 系统页面自动截图。
 *
 *   node .agents/skills/thesis-writer/reference/screenshot.mjs \
 *        --config docs/thesis/screenshots.json
 *
 * 依赖 puppeteer-core（不下载浏览器，复用本机 Chrome / Edge）：
 *   npm i -D puppeteer-core
 *
 * 配置示例见 reference/screenshots.example.json。
 * 只做三件事：登录、逐页打开、按配置截图。不做图像处理。
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const configPath = resolve(getArg('--config', 'docs/thesis/screenshots.json'));
const only = getArg('--only');
const checkOnly = args.includes('--check');

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].filter(Boolean);

const findBrowser = () => BROWSERS.find((p) => existsSync(p)) || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safeName = (name) => name.replace(/[\\/:*?"<>|]/g, '_').trim();

if (!existsSync(configPath)) {
  console.error(`× 找不到配置：${configPath}`);
  console.error('  复制 reference/screenshots.example.json 到 docs/thesis/screenshots.json 后修改。');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error(`× 配置解析失败：${e.message}`);
  process.exit(1);
}

const baseUrl = String(config.baseUrl || '').replace(/\/+$/, '');
const configDir = dirname(configPath);
const outDir = isAbsolute(config.outDir || 'images')
  ? config.outDir
  : resolve(configDir, config.outDir || 'images');
const screens = Array.isArray(config.screens) ? config.screens : [];
const viewport = { width: 1440, height: 900, ...(config.viewport || {}) };
const scale = Number(config.deviceScaleFactor || 2);

const problems = [];
if (!baseUrl) problems.push('缺 baseUrl');
if (!screens.length) problems.push('screens 为空');
for (const [i, s] of screens.entries()) {
  if (!s.name) problems.push(`screens[${i}] 缺 name`);
  if (!s.url) problems.push(`screens[${i}] 缺 url`);
}

if (problems.length) {
  for (const p of problems) console.error(`× ${p}`);
  process.exit(1);
}

const targets = only ? screens.filter((s) => s.name === only) : screens;
if (only && !targets.length) {
  console.error(`× --only 没找到：${only}`);
  process.exit(1);
}

const browserPath = findBrowser();
console.log(`配置：${configPath}`);
console.log(`输出：${outDir}`);
console.log(`浏览器：${browserPath || '未找到（需要本机 Chrome / Edge）'}`);
console.log(`页面：${targets.length} 张，视口 ${viewport.width}×${viewport.height} @${scale}x`);

if (checkOnly) {
  for (const s of targets) console.log(`  · ${safeName(s.name)}.png  ← ${s.url}`);
  process.exit(browserPath ? 0 : 1);
}
if (!browserPath) {
  console.error('× 未找到 Chrome 或 Edge。设置 CHROME_PATH 指向可执行文件后重试。');
  process.exit(1);
}

let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  console.error('× 缺少 puppeteer-core。在项目根目录执行：npm i -D puppeteer-core');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { ...viewport, deviceScaleFactor: scale },
});

const page = await browser.newPage();
let failed = 0;

try {
  if (config.login) {
    const login = config.login;
    console.log('\n登录中…');

    if (login.mode === 'api') {
      // 直接调登录接口拿 token，再注入 localStorage。
      // 适用于有验证码、SSO 或登录页改了结构的项目。
      const url = `${baseUrl}${login.apiUrl || '/api/user/login'}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: login.username, password: login.password }),
      });
      const json = await res.json().catch(() => null);
      const pick = (obj, path) => path.split('.').reduce((o, key) => (o == null ? o : o[key]), obj);
      const token = pick(json, login.tokenPath || 'data.token');
      if (!token) {
        throw new Error(`登录接口没返回 token（HTTP ${res.status}）：${JSON.stringify(json)}`);
      }
      const user = pick(json, login.userPath || 'data.userInfo');
      const entries = { [login.tokenKey || 'token']: token };
      if (user) entries[login.userKey || 'userInfo'] = JSON.stringify(user);
      await page.evaluateOnNewDocument((data) => {
        for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value);
      }, entries);
      console.log('接口登录完成，token 已注入 localStorage。');
    } else {
      await page.goto(`${baseUrl}${login.url || '/login'}`, { waitUntil: 'networkidle2' });
      if (login.usernameSelector) {
        await page.waitForSelector(login.usernameSelector, { timeout: 10000 });
        await page.type(login.usernameSelector, String(login.username ?? ''));
      }
      if (login.passwordSelector) {
        await page.type(login.passwordSelector, String(login.password ?? ''));
      }
      if (login.submitSelector) {
        await page.click(login.submitSelector);
      } else if (login.submitText) {
        await page.evaluate((text) => {
          const btn = [...document.querySelectorAll('button')].find(
            (b) => b.textContent.trim().includes(text),
          );
          if (!btn) throw new Error(`找不到包含“${text}”的按钮`);
          btn.click();
        }, login.submitText);
      }
      if (login.successSelector) {
        await page.waitForSelector(login.successSelector, { timeout: 15000 });
      }
      await sleep(Number(login.waitAfter || 1500));
      console.log('表单登录完成。');
    }
  }

  for (const [i, screen] of targets.entries()) {
    const file = join(outDir, `${safeName(screen.name)}.png`);
    try {
      await page.goto(`${baseUrl}${screen.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
      for (const sel of screen.hide || config.hide || []) {
        await page.evaluate((s) => {
          document.querySelectorAll(s).forEach((el) => {
            el.style.visibility = 'hidden';
          });
        }, sel);
      }
      if (screen.selector) {
        await page.waitForSelector(screen.selector, { timeout: 15000 });
      }
      await sleep(Number(screen.wait || 800));
      if (screen.selector) {
        const el = await page.$(screen.selector);
        await el.screenshot({ path: file, type: 'png' });
      } else {
        await page.screenshot({ path: file, type: 'png', fullPage: Boolean(screen.fullPage) });
      }
      console.log(`  ✓ ${i + 1}/${targets.length} ${screen.name}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${screen.name} — ${e.message}`);
    }
  }
} finally {
  await browser.close();
}

console.log('');
if (failed) {
  console.error(`${failed} 张失败。`);
  process.exit(1);
}
console.log(`全部完成：${targets.length} 张，已写入 ${outDir}`);
