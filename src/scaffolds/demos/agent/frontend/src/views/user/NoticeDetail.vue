<template>
    <div>
        <a-button style="margin-bottom: 16px" @click="$router.back()">
            <template #icon><arrow-left-outlined /></template> 返回
        </a-button>

        <a-spin v-if="loading" style="display: block; margin-top: 120px" />

        <p
            v-else-if="!detail"
            style="margin-top: 40px; color: var(--color-text-mute)"
        >
            公告不存在
        </p>

        <template v-else>
            <h1 class="detail-title">{{ detail.title }}</h1>
            <p class="detail-subtitle">
                发布于 <span class="text-muted">{{ detail.createTime }}</span>
                <template v-if="detail.updateTime !== detail.createTime">
                    · 更新于
                    <span class="text-muted">{{ detail.updateTime }}</span>
                </template>
            </p>

            <a-card class="detail-section">
                <h2 class="section-title">基本信息</h2>
                <a-descriptions bordered :column="1" size="middle">
                    <a-descriptions-item label="编号">
                        <span class="text-primary">{{ detail.id }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item label="发布人">
                        {{ detail.createBy || "-" }}
                    </a-descriptions-item>
                    <a-descriptions-item label="发布时间">
                        {{ detail.createTime }}
                    </a-descriptions-item>
                    <a-descriptions-item label="更新时间">
                        {{ detail.updateTime }}
                    </a-descriptions-item>
                </a-descriptions>
            </a-card>

            <a-card class="detail-section">
                <h2 class="section-title">详细内容</h2>
                <div class="rich-content" v-html="detail.content || ''" />
            </a-card>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ArrowLeftOutlined } from "@ant-design/icons-vue";
import { getNoticeById } from "@/api/notice";

const route = useRoute();
const detail = ref(null);
const loading = ref(true);

onMounted(async () => {
    try {
        const res = await getNoticeById(route.params.id);
        detail.value = res.data;
    } finally {
        loading.value = false;
    }
});
</script>
