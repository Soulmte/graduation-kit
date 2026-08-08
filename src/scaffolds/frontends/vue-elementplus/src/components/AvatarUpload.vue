<template>
  <el-upload
    class="avatar-uploader"
    :class="{ 'avatar-uploader--disabled': disabled }"
    :show-file-list="false"
    :before-upload="beforeUpload"
    :http-request="customUpload"
    :disabled="disabled"
    accept="image/jpeg,image/png,image/gif,image/webp"
  >
    <div v-if="value" class="avatar-img-wrap" :style="{ width: size + 'px', height: size + 'px' }">
      <el-avatar :size="size" :src="value" />
    </div>
    <div v-else class="avatar-placeholder" :style="{ width: size + 'px', height: size + 'px' }">
      <el-icon :size="20">
        <Loading v-if="loading" />
        <Plus v-else />
      </el-icon>
      <div class="avatar-placeholder-tip">上传头像</div>
    </div>
  </el-upload>
</template>

<script setup>
/**
 * 头像上传 (统一接入 /api/file/upload)
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import { uploadFile } from '@/api/file'

defineProps({
  value: { type: String, default: '' },
  size: { type: Number, default: 100 },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:value'])

const loading = ref(false)

const beforeUpload = (file) => {
  const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  if (!ok) {
    ElMessage.error('仅支持 JPG / PNG / GIF / WEBP')
    return false
  }
  if (file.size / 1024 / 1024 >= 2) {
    ElMessage.error('图片不能超过 2 MB')
    return false
  }
  return true
}

const customUpload = async ({ file }) => {
  loading.value = true
  try {
    const res = await uploadFile(file)
    const url = res?.data?.url
    if (url) {
      emit('update:value', url)
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error('服务端未返回 URL')
    }
  } catch {
    ElMessage.error('头像上传失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.avatar-uploader {
  display: inline-block;
  cursor: pointer;
}
.avatar-uploader--disabled {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: none;
}
.avatar-img-wrap {
  border-radius: 50%;
  border: 1px dashed var(--color-border-deep);
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}
.avatar-img-wrap:hover {
  border-color: var(--color-primary);
}
.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px dashed var(--color-border-deep);
  color: var(--color-text-mute);
  gap: 4px;
  transition: border-color 0.2s;
}
.avatar-placeholder:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.avatar-placeholder-tip {
  font-size: 12px;
}
</style>
