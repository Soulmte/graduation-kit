<template>
  <div
    class="avatar-upload"
    :class="{ disabled }"
    :style="{ width: size + 'px', height: size + 'px' }"
    @click="triggerUpload"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      style="display: none"
      @change="onFileChange"
    />
    <img v-if="value" :src="value" class="avatar-img" />
    <div v-else class="avatar-placeholder">
      <n-icon :size="22" :component="loading ? ReloadOutline : AddOutline" />
      <div class="placeholder-text">上传头像</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NIcon, useMessage } from 'naive-ui'
import { AddOutline, ReloadOutline } from '@vicons/ionicons5'
import { uploadFile } from '@/api/file'

const props = defineProps({
  value: { type: String, default: '' },
  size: { type: Number, default: 100 },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:value'])
const loading = ref(false)
const message = useMessage()
const fileInput = ref(null)

const triggerUpload = () => {
  if (props.disabled) return
  fileInput.value?.click()
}

const onFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  if (!ok) {
    message.error('仅支持 JPG / PNG / GIF / WEBP')
    return
  }
  if (file.size / 1024 / 1024 >= 2) {
    message.error('图片不能超过 2 MB')
    return
  }

  loading.value = true
  try {
    const res = await uploadFile(file)
    const url = res?.data?.url
    if (url) {
      emit('update:value', url)
      message.success('头像上传成功')
    } else {
      message.error('服务端未返回 URL')
    }
  } catch {
    message.error('头像上传失败')
  } finally {
    loading.value = false
    e.target.value = ''
  }
}
</script>

<style scoped>
.avatar-upload {
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}
.avatar-upload.disabled {
  cursor: default;
  pointer-events: none;
}
.avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-mute);
  border: 1px dashed var(--color-border-deep);
  border-radius: 50%;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.avatar-placeholder:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.placeholder-text {
  font-size: 12px;
  margin-top: 4px;
}
</style>
