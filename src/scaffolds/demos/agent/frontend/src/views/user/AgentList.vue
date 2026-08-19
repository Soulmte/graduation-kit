<template>
    <a-card title="智能助手">
        <template #extra>
            <a-button @click="router.push('/user/chat')">
                <template #icon><message-outlined /></template> 我的对话
            </a-button>
        </template>

        <a-spin :spinning="loading">
            <a-empty
                v-if="!list.length && !loading"
                description="还没有可用的助手，等管理员发布后再来"
            />

            <a-row v-else :gutter="[16, 16]">
                <a-col
                    v-for="item in list"
                    :key="item.id"
                    :xs="24"
                    :sm="12"
                    :lg="8"
                >
                    <div class="agent-card" @click="startChat(item)">
                        <div class="agent-card__head">
                            <a-avatar :size="48" :src="item.avatar">
                                {{ item.name?.charAt(0) }}
                            </a-avatar>
                            <div class="agent-card__meta">
                                <div class="agent-card__name">{{ item.name }}</div>
                                <div class="agent-card__count">
                                    已服务 {{ item.chatCount || 0 }} 次
                                </div>
                            </div>
                        </div>

                        <div class="agent-card__desc text-ellipsis-2">
                            {{ item.description || "这个助手还没写简介" }}
                        </div>

                        <a-button type="primary" block>
                            <template #icon><message-outlined /></template>
                            开始咨询
                        </a-button>
                    </div>
                </a-col>
            </a-row>
        </a-spin>
    </a-card>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { MessageOutlined } from "@ant-design/icons-vue";
import { listPublishedAgent } from "@/api/agent";

const router = useRouter();

const loading = ref(false);
const list = ref([]);

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await listPublishedAgent();
        list.value = res.data || [];
    } finally {
        loading.value = false;
    }
};

// 这里只带上 agentId 跳过去，会话由对话页在发第一句时才创建，
// 免得用户点进来看一眼就走、库里攒一堆空会话。
const startChat = (item) => {
    router.push({ path: "/user/chat", query: { agentId: item.id } });
};

onMounted(fetchList);
</script>

<style scoped>
.agent-card {
    height: 100%;
    padding: 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg-card);
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.2s;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.agent-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
}

.agent-card__head {
    display: flex;
    align-items: center;
    gap: 12px;
}

.agent-card__name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
}

.agent-card__count {
    font-size: var(--font-size-xs);
    color: var(--color-text-mute);
}

/* 简介裁两行，卡片高度才能对齐；flex: 1 把按钮压到底部 */
.agent-card__desc {
    flex: 1;
    color: var(--color-text-sub);
    line-height: 1.7;
    min-height: 48px;
}
</style>
