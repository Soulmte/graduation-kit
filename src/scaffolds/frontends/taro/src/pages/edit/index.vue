<template>
  <view class="container container--surface container--flush">
    <view class="avatar-section" @tap="chooseAvatar">
      <image v-if="avatarUrl" class="avatar avatar--lg" :src="avatarUrl" mode="aspectFill" />
      <view v-else class="avatar avatar--lg avatar-fallback">{{ initial }}</view>
      <view class="avatar-tip">点击更换头像</view>
    </view>

    <view class="form-panel">
      <view class="form-item">
        <view class="form-label">用户名</view>
        <input class="input" :value="form.username" disabled />
      </view>
      <view class="form-item">
        <view class="form-label">昵称</view>
        <input
          v-model="form.nickname"
          class="input"
          placeholder="请输入昵称"
          placeholder-class="input-placeholder"
        />
      </view>
      <view class="form-item">
        <view class="form-label">邮箱</view>
        <input
          v-model="form.email"
          class="input"
          placeholder="请输入邮箱"
          placeholder-class="input-placeholder"
        />
      </view>
      <view class="form-item">
        <view class="form-label">手机号</view>
        <input
          v-model="form.phone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="input-placeholder"
        />
      </view>
      <view class="form-item">
        <view class="form-label">年龄</view>
        <input
          v-model="form.age"
          class="input"
          type="number"
          maxlength="3"
          placeholder="请输入年龄"
          placeholder-class="input-placeholder"
        />
      </view>
      <view class="form-item">
        <view class="form-label">性别</view>
        <view class="gender-group">
          <view
            class="gender-item"
            :class="{ active: form.gender === '男' }"
            @tap="form.gender = '男'"
          >男</view>
          <view
            class="gender-item"
            :class="{ active: form.gender === '女' }"
            @tap="form.gender = '女'"
          >女</view>
          <view
            class="gender-item"
            :class="{ active: !form.gender }"
            @tap="form.gender = ''"
          >未设置</view>
        </view>
      </view>

      <button class="btn-primary mt-xl" :disabled="loading" @tap="handleSave">
        {{ loading ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import Taro from '@tarojs/taro'
import { updateUser } from '@/api/user'
import { uploadFile } from '@/api/file'
import { userStore } from '@/store/user'
import { resolveAvatar, avatarInitial } from '@/utils/index'

const form = reactive({
  id: userStore.userInfo?.id,
  username: userStore.userInfo?.username || '',
  nickname: userStore.userInfo?.nickname || '',
  email: userStore.userInfo?.email || '',
  phone: userStore.userInfo?.phone || '',
  age: userStore.userInfo?.age ? String(userStore.userInfo.age) : '',
  gender: userStore.userInfo?.gender || '',
  avatar: userStore.userInfo?.avatar || ''
})
const loading = ref(false)

const avatarUrl = computed(() => resolveAvatar(form.avatar))
const initial = computed(() => avatarInitial({ username: form.username, nickname: form.nickname }))

const chooseAvatar = () => {
  Taro.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        Taro.showLoading({ title: '上传中...' })
        const uploadRes = await uploadFile(res.tempFilePaths[0])
        form.avatar = uploadRes.data.url
        Taro.showToast({ title: '上传成功', icon: 'success' })
      } catch (e) {
        Taro.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        Taro.hideLoading()
      }
    }
  })
}

const handleSave = async () => {
  loading.value = true
  try {
    await updateUser({
      id: form.id,
      nickname: form.nickname || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      avatar: form.avatar || undefined
    })
    userStore.updateUserInfo({
      nickname: form.nickname,
      email: form.email,
      phone: form.phone,
      age: form.age ? Number(form.age) : null,
      gender: form.gender,
      avatar: form.avatar
    })
    Taro.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 500)
  } catch (e) {
    // 错误已在请求拦截器中提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: $color-surface;
  padding: $space-2xl 0;
  margin-bottom: $space-md;
}

.avatar-tip {
  margin-top: $space-md;
  font-size: $font-sm;
  color: $color-text-muted;
}

.form-panel {
  background: $color-surface;
  padding: 0 $space-lg;
}
</style>
