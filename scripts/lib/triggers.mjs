/**
 * 触发路由表的极简解析与匹配。
 *
 * 只解析 triggers.yaml 里我们实际用到的结构（context + skills 列表），
 * 不引入 YAML 依赖。结构被改坏时直接抛错，避免"静默解析失败 → 测了个寂寞"。
 */

/** 把 flow 数组 `[a, b, "c"]` 拆成字符串数组 */
function parseFlowArray(raw, where) {
  const text = raw.trim();
  if (!text.startsWith('[') || !text.endsWith(']')) {
    throw new Error(`${where}：期望 [a, b] 形式的数组，实际是 ${text}`);
  }
  const inner = text.slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(',')
    .map((s) => s.trim())
    .map((s) => s.replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

export function parseTriggers(text) {
  const table = { context: [], skills: [] };
  let current = null;
  let inSkills = false;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (/^context:\s*\[/.test(trimmed)) {
      table.context = parseFlowArray(trimmed.replace(/^context:\s*/, ''), `第 ${i + 1} 行 context`);
      continue;
    }

    if (trimmed === 'skills:') {
      inSkills = true;
      continue;
    }

    if (!inSkills) continue;

    // 顶层其它键出现时结束 skills 段
    if (/^[a-z_]+:/.test(line) && !line.startsWith(' ')) {
      inSkills = false;
      current = null;
      continue;
    }

    const idMatch = line.match(/^ {2}- id:\s*(\S+)\s*$/);
    if (idMatch) {
      current = { id: idMatch[1], priority: 0, strong: [], weak: [], not_for: [], order: table.skills.length };
      table.skills.push(current);
      continue;
    }
    if (!current) continue;

    const kv = line.match(/^ {4}(priority|when|strong|weak|not_for):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (key === 'priority') {
      current.priority = Number(value.trim());
      if (!Number.isFinite(current.priority)) {
        throw new Error(`第 ${i + 1} 行：${current.id} 的 priority 不是数字`);
      }
    } else if (key === 'strong' || key === 'weak' || key === 'not_for') {
      current[key] = parseFlowArray(value, `第 ${i + 1} 行 ${current.id}.${key}`);
    } else {
      current.when = value.trim();
    }
  }

  if (!table.context.length) throw new Error('triggers.yaml 缺少 context');
  if (table.skills.length < 5) throw new Error(`triggers.yaml 只解析到 ${table.skills.length} 个 skill`);
  const seen = new Set();
  for (const skill of table.skills) {
    if (seen.has(skill.id)) throw new Error(`triggers.yaml 有重复的 id：${skill.id}`);
    seen.add(skill.id);
    if (!skill.strong.length) throw new Error(`${skill.id}：strong 为空`);
  }
  return table;
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[，。！？；：、,.!?;:()[\]{}"“”‘’<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 含中文：去掉空白，X 作为通配符（如 写第X章） */
function cjkPattern(term) {
  return escapeRe(term.replace(/\s+/g, '')).replace(/X/g, '.*?');
}

/** 纯英文：小写 + 词边界 */
function asciiPattern(term) {
  return escapeRe(term.trim().toLowerCase());
}

/**
 * 纯英文词按词边界匹配，避免 "api" 命中 "capital"；
 * 含中文的词先去掉空白，保证 "画 ER 图" 与 "画ER图" 等价。
 */
function matchTerm(term, norm, squashed) {
  const hasCjk = /[\u4e00-\u9fff]/.test(term);
  if (hasCjk) return new RegExp(cjkPattern(term), 'i').test(squashed);
  return new RegExp(`\\b${asciiPattern(term)}\\b`, 'i').test(norm);
}

export function route(prompt, table) {
  const norm = normalize(prompt);
  const squashed = norm.replace(/\s+/g, '');
  const context = table.context.filter((t) => matchTerm(t, norm, squashed));
  const candidates = [];

  for (const skill of table.skills) {
    // not_for 是概念描述，字面命中才生效；真正的边界靠 description
    const blocked = skill.not_for.filter((t) => matchTerm(t, norm, squashed));
    if (blocked.length) continue;

    const strong = skill.strong.filter((t) => matchTerm(t, norm, squashed));
    const weak = skill.weak.filter((t) => matchTerm(t, norm, squashed));
    const active = strong.length > 0 || weak.length >= 2 || (weak.length >= 1 && context.length >= 1);
    if (active) {
      candidates.push({
        id: skill.id,
        priority: skill.priority,
        order: skill.order,
        strong,
        weak,
        tier: strong.length ? 2 : 1,
      });
    }
  }

  candidates.sort((a, b) => b.tier - a.tier || b.priority - a.priority || a.order - b.order);
  return { top: candidates[0]?.id ?? null, candidates, context };
}
