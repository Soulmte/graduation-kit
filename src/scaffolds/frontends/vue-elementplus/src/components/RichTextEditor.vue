<template>
  <div class="rich-editor-wrap">
    <Toolbar
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      mode="default"
      class="rich-editor-toolbar"
    />
    <Editor
      :modelValue="modelValue"
      :defaultConfig="editorConfig"
      mode="default"
      :style="{ height: height + 'px', overflowY: 'hidden' }"
      @onCreated="onCreated"
      @onChange="onChange"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ElMessage } from 'element-plus'
import '@wangeditor/editor/dist/css/style.css'
import { uploadFile } from '@/api/file'

defineProps({
  modelValue: { type: String, default: '' },
  height: { type: Number, default: 320 },
  placeholder: { type: String, default: '请输入内容...' }
})
const emit = defineEmits(['update:modelValue'])

const editorRef = shallowRef(null)

const toolbarConfig = {
  excludeKeys: ['fullScreen', 'group-video']
}

const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          const res = await uploadFile(file)
          const url = res?.data?.url
          if (url) {
            insertFn(url, file.name, url)
          } else {
            ElMessage.error('图片上传失败: 服务端未返回 URL')
          }
        } catch {
          ElMessage.error('图片上传失败')
        }
      },
      maxFileSize: 5 * 1024 * 1024,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }
  }
}

const onCreated = (editor) => {
  editorRef.value = editor
}
const onChange = (editor) => {
  emit('update:modelValue', editor.getHtml())
}

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})
</script>
