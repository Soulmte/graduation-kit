/**
 * 可编辑性审计：统计每张图有多少「可拖拽元素」，以及是否仍有 custom 命令式绘制。
 * 目标：custom 应为空，所有可见内容都在 nodes 里。
 * 运行：node audit.js
 */
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, 'data')

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.startsWith('_'))
let hasCustom = 0

console.log('图表'.padEnd(24) + '节点数  连线数  custom')
console.log('-'.repeat(52))

for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8')
  // 粗略统计：nodes.push / 数组项 / links
  const pushes = (src.match(/nodes\.push\(/g) || []).length
  const items = (src.match(/\{\s*id:\s*['"]/g) || []).length
  const links = (src.match(/\{\s*(points|from):/g) || []).length
  const custom = /custom\s*\(/.test(src)
  if (custom) hasCustom++
  console.log(
    f.replace('.js', '').padEnd(24) +
    String(Math.max(pushes, items)).padStart(5) +
    String(links).padStart(8) +
    (custom ? '     有 ⚠' : '     无')
  )
}

console.log('-'.repeat(52))
console.log(hasCustom
  ? `\n${hasCustom} 个文件仍有 custom 绘制，其中的元素无法拖拽`
  : '\n所有图均为纯声明式，全部元素可拖拽编辑')
