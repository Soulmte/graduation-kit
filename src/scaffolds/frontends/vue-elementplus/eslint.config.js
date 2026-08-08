import js from '@eslint/js'
import globals from 'globals'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: vueParser,
      globals: globals.browser
    },
    plugins: { vue },
    rules: {
      ...js.configs.recommended.rules,
      ...vue.configs['flat/recommended']
        .map((c) => c.rules)
        .reduce((acc, r) => ({ ...acc, ...r }), {}),
      // Element Plus 组件名不强制多单词
      'vue/multi-word-component-names': 'off',
      'vue/comment-directive': 'off',
      'vue/no-v-html': 'warn',
      // 模板缩进与换行全交给 Prettier，否则两边规则会打架
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      // wangEditor 等第三方组件的 props / 事件名本身是驼峰，不能改
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      // 解构剔除字段（如 const { confirm, ...payload } = form）不算未使用
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', ignoreRestSiblings: true }
      ]
    }
  }
]
