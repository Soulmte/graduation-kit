/**
 * Metro 配置
 * withUniwindConfig 必须是 outermost（最外层）包装，负责把 Tailwind 类编译成 RN 样式。
 */
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts'
})
