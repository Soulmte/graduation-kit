<template>
  <div>
    <n-button @click="$router.back()">← 返回</n-button>

    <div v-if="loading" class="loading-wrapper">
      <n-spin size="medium" />
    </div>

    <div v-else-if="!detail" class="empty-notice">
      <p>公告不存在</p>
    </div>

    <template v-else>
      <h1 class="detail-title">{{ detail.title }}</h1>
      <p class="detail-subtitle">
        发布于 <span class="text-muted">{{ detail.createTime }}</span>
        <template v-if="detail.updateTime !== detail.createTime">
          · 更新于
          <span class="text-muted">{{ detail.updateTime }}</span>
        </template>
      </p>

      <n-card class="detail-section" title="基本信息">
        <n-descriptions bordered :column="1" size="medium">
          <n-descriptions-item label="编号">
            <span class="text-primary">{{ detail.id }}</span>
          </n-descriptions-item>
          <n-descriptions-item label="发布时间">
            {{ detail.createTime }}
          </n-descriptions-item>
          <n-descriptions-item label="更新时间">
            {{ detail.updateTime }}
          </n-descriptions-item>
        </n-descriptions>
      </n-card>

      <n-card class="detail-section" title="详细内容">
        <div class="rich-content" v-html="detail.content || ''" />
      </n-card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NCard, NDescriptions, NDescriptionsItem, NSpin } from 'naive-ui'
import { getNoticeById } from '@/api/notice'

const route = useRoute()
const detail = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getNoticeById(route.params.id)
    detail.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.empty-notice {
  text-align: center;
  padding: 80px 0;
  color: #999;
  font-size: 15px;
}
</style>
