<template>
    <a-card title="公告列表">
        <div class="toolbar">
            <a-input-search
                v-model:value="title"
                placeholder="搜索标题"
                style="width: 300px"
                allow-clear
                @search="onSearch"
            />
        </div>

        <a-spin :spinning="loading">
            <a-empty v-if="!list.length && !loading" description="暂无公告" />
            <template v-else>
                <div v-for="item in list" :key="item.id" class="notice-item">
                    <div
                        class="notice-title"
                        @click="router.push(`/user/notice/${item.id}`)"
                    >
                        {{ item.title }}
                    </div>
                    <div class="notice-content text-ellipsis-2">
                        {{ htmlToText(item.content) }}
                    </div>
                    <div class="notice-time">
                        发布时间: {{ item.createTime }}
                    </div>
                </div>
            </template>
        </a-spin>

        <div class="pagination-wrap">
            <a-pagination
                v-model:current="pageNum"
                :page-size="pageSize"
                :total="total"
                :show-total="(t) => `共 ${t} 条`"
                @change="fetchList"
            />
        </div>
    </a-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { pageQueryNotice } from "@/api/notice";

const router = useRouter();

const htmlToText = (html = "") =>
    html
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 10;
const title = ref("");

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryNotice({
            pageNum: pageNum.value,
            pageSize,
            title: title.value,
        });
        list.value = res.data.records;
        total.value = res.data.total;
    } finally {
        loading.value = false;
    }
};

const onSearch = () => {
    pageNum.value = 1;
    fetchList();
};

onMounted(fetchList);
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
    color: var(--color-text);
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
