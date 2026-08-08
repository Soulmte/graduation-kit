<template>
  <n-card title="公告列表">
    <div class="toolbar">
      <n-input
        v-model:value="title"
        placeholder="搜索标题"
        style="width: 300px"
        clearable
        @keydown.enter="onSearch"
      />
      <n-button type="primary" @click="onSearch">搜索</n-button>
    </div>

    <n-empty v-if="!list.length && !loading" description="暂无公告" />
    <n-spin v-else :show="loading">
      <div v-for="item in list" :key="item.id" class="notice-item">
        <div class="notice-title" @click="router.push(`/user/notice/${item.id}`)">
          {{ item.title }}
        </div>
        <div class="notice-content text-ellipsis-2">{{ htmlToText(item.content) }}</div>
        <div class="notice-time">发布时间: {{ item.createTime }}</div>
      </div>
    </n-spin>

    <div class="pagination-wrap">
      <n-pagination
        v-model:page="pageNum"
        :page-size="pageSize"
        :item-count="total"
        show-total
        @update:page="fetchList"
      />
    </div>
  </n-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NInput, NButton, NSpin, NPagination, NEmpty } from 'naive-ui'
import { pageQueryNotice } from '@/api/notice'

const router = useRouter()

const htmlToText = (html = '') =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const title = ref('')

const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageQueryNotice({ pageNum: pageNum.value, pageSize, title: title.value })
    list.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}
const onSearch = () => {
  pageNum.value = 1
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.notice-item {
  border-bottom: 1px solid var(--color-border);
  padding: 16px 0;
}
.notice-item:last-child {
  border-bottom: 0;
}
.notice-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: 8px;
  cursor: pointer;
  transition: color 0.2s;
}
.notice-title:hover {
  color: var(--color-primary);
}
.notice-content {
  color: var(--color-text-sub);
  line-height: 1.7;
  margin-bottom: 8px;
}
.notice-time {
  color: var(--color-text-mute);
  font-size: var(--font-size-xs);
}
.notice-detail-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: 12px;
}
.notice-detail-time {
  color: var(--color-text-mute);
  font-size: var(--font-size-sm);
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}
</style>
