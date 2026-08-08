<template>
  <div class="stack-24">
    <div class="banner">
      <h1>欢迎使用多技术栈脚手架</h1>
      <p>一套前端, 可连接六种后端实现</p>
    </div>

    <div class="home-hero">
      <n-grid :cols="2" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card>
            <n-statistic label="公告数">
              <template #prefix>
                <n-icon :component="NotificationsOutline" />
              </template>
              <span style="color: var(--color-primary)">{{ noticeCount }}</span>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card>
            <n-statistic label="服务状态">
              <template #prefix>
                <n-icon :component="CheckmarkCircleOutline" />
              </template>
              <span style="color: var(--color-success)">运行中</span>
            </n-statistic>
          </n-card>
        </n-gi>
      </n-grid>

      <div class="home-intro">
        <div class="home-intro-title">系统功能</div>
        <ul class="home-intro-list">
          <li>用户管理: 注册、登录、个人信息维护</li>
          <li>公告管理: 发布、查看、检索</li>
          <li>操作日志: 自动记录 + 条件查询</li>
          <li>文件上传: 头像与附件</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NGrid, NGi, NCard, NStatistic, NIcon } from 'naive-ui'
import { NotificationsOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import { listAllNotice } from '@/api/notice'

const noticeCount = ref(0)
onMounted(async () => {
  try {
    const res = await listAllNotice()
    noticeCount.value = (res.data || []).length
  } catch {
    /* 未登录忽略 */
  }
})
</script>

<style scoped>
.home-hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
@media (max-width: 768px) {
  .home-hero {
    grid-template-columns: 1fr;
  }
}
.home-intro {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}
.home-intro-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 16px;
}
.home-intro-list {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-sub);
  line-height: 1.9;
}
</style>
