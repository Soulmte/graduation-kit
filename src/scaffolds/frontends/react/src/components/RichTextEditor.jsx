import { useState, useEffect } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { message } from 'antd'
import '@wangeditor/editor/dist/css/style.css'
import { uploadFile } from '../api/file'

/**
 * 富文本编辑器(基于 wangEditor 5)
 * - 内置完整工具栏:标题/加粗/列表/链接/图片/表格/代码/引用/撤销 等
 * - 图片上传接入项目统一的 /api/file/upload 接口
 * - 受控模式: value / onChange
 *
 * @param {string}   value     HTML 字符串
 * @param {function} onChange  (html) => void
 * @param {number}   height    编辑区高度, 默认 320
 * @param {string}   placeholder
 */
export default function RichTextEditor({
  value = '',
  onChange,
  height = 320,
  placeholder = '请输入内容...'
}) {
  const [editor, setEditor] = useState(null)
  const [html, setHtml] = useState(value)

  // 外部 value 变化时同步到编辑器
  // 用函数式更新读取旧值，避免把 html 写进依赖造成回环
  useEffect(() => {
    setHtml((prev) => (value !== prev ? value : prev))
  }, [value])

  // 卸载时销毁编辑器, 防内存泄漏
  useEffect(
    () => () => {
      if (editor) {
        editor.destroy()
        setEditor(null)
      }
    },
    [editor]
  )

  const toolbarConfig = {
    excludeKeys: [
      'fullScreen', // 全屏按钮在 Modal 里容易出问题
      'group-video' // 暂不需要视频
    ]
  }

  const editorConfig = {
    placeholder,
    MENU_CONF: {
      // 图片上传: 用项目统一的 request 接口, 自带 JWT
      uploadImage: {
        async customUpload(file, insertFn) {
          try {
            const res = await uploadFile(file)
            const url = res?.data?.url
            if (url) {
              insertFn(url, file.name, url)
            } else {
              message.error('图片上传失败: 服务端未返回 URL')
            }
          } catch (err) {
            message.error(err.message || '图片上传失败')
          }
        },
        // 校验
        maxFileSize: 5 * 1024 * 1024, // 5 MB
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        meta: {}
      }
    }
  }

  return (
    <div className="rich-editor-wrap">
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        className="rich-editor-toolbar"
      />
      <Editor
        defaultConfig={editorConfig}
        value={html}
        onCreated={setEditor}
        onChange={(e) => {
          const v = e.getHtml()
          setHtml(v)
          onChange?.(v)
        }}
        mode="default"
        style={{ height, overflowY: 'hidden' }}
      />
    </div>
  )
}
