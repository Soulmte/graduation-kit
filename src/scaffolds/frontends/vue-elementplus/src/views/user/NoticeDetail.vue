<template>
  <div v-if="loading" class="loading-wrapper">
    <el-skeleton :rows="8" animated />
  </div>

  <div v-else-if="!detail" class="empty-wrapper">
    <el-empty description="公告不存在" />
    <div class="empty-action">
      <el-button @click="$router.back()">返回</el-button>
    </div>
  </div>

  <div v-else>
    <el-button @click="$router.back()">
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <h1 class="detail-title">{{ detail.title }}</h1>
    <p class="detail-subtitle">
      发布于 <span class="text-muted">{{ detail.createTime }}</span>
      <template v-if="detail.updateTime !== detail.createTime">
        · 更新于 <span class="text-muted">{{ detail.updateTime }}</span>
      </template>
    </p>

    <el-card class="detail-section">
      <h2 class="section-title">基本信息</h2>
      <el-descriptions bordered :column="1" size="large">
        <el-descriptions-item label="编号">
          <span class="text-primary">{{ detail.id }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="发布人">
          {{ detail.createBy || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">
          {{ detail.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ detail.updateTime }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="detail-section">
      <h2 class="section-title">详细内容</h2>
      <div class="rich-content" v-html="detail.content || ''" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
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
  padding: 40px 0;
}

.empty-wrapper {
  padding: 60px 0;
  text-align: center;
}

.empty-action {
  margin-top: 16px;
}

.detail-title {
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #303133;
}

.detail-subtitle {
  font-size: 14px;
  color: #909399;
  margin-bottom: 24px;
}

.text-muted {
  color: #909399;
}

.text-primary {
  color: #409eff;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #303133;
}

.rich-content {
  line-height: 1.8;
  color: #606266;
}
</style>
