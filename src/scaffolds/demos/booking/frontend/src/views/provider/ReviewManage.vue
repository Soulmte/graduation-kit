<template>
    <a-card title="评价管理">
        <div class="toolbar">
            <a-select
                v-model:value="queryMinRating"
                placeholder="评分筛选"
                style="width: 160px"
                allow-clear
                @change="onSearch"
            >
                <a-select-option :value="4">好评（4 星及以上）</a-select-option>
                <a-select-option :value="3">中评（3 星）</a-select-option>
                <a-select-option :value="1">差评（2 星及以下）</a-select-option>
            </a-select>
        </div>

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :components="tableComponents"
            :pagination="{
                current: pageNum,
                pageSize,
                total,
                onChange: (p) => {
                    pageNum = p;
                    fetchList();
                },
                showTotal: (t) => `共 ${t} 条`,
            }"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'idx'">
                    {{ (pageNum - 1) * pageSize + index + 1 }}
                </template>
                <template v-else-if="column.key === 'user'">
                    <div class="rv-user">
                        <a-avatar :src="record.avatar" :size="28">
                            <template #icon><user-outlined /></template>
                        </a-avatar>
                        <span>{{ record.username }}</span>
                    </div>
                </template>
                <template v-else-if="column.key === 'rating'">
                    <a-rate :value="record.rating" disabled :count="5" style="font-size: 14px" />
                </template>
                <template v-else-if="column.key === 'reply'">
                    <span v-if="record.reply">{{ record.reply }}</span>
                    <a-tag v-else color="orange">待回复</a-tag>
                </template>
                <template v-else-if="column.key === 'op'">
                    <a-button size="small" class="btn-edit" @click="handleOpenReply(record)">
                        <template #icon><message-outlined /></template>
                        {{ record.reply ? "改回复" : "回复" }}
                    </a-button>
                </template>
            </template>
        </a-table>

        <a-modal
            v-model:open="replyVisible"
            title="回复评价"
            :width="520"
            ok-text="提交回复"
            cancel-text="取消"
            :confirm-loading="replying"
            destroy-on-close
            @ok="handleReply"
        >
            <a-descriptions v-if="replyTarget" :column="1" bordered size="small" style="margin-bottom: 12px">
                <a-descriptions-item label="评分">
                    <a-rate :value="replyTarget.rating" disabled :count="5" style="font-size: 14px" />
                </a-descriptions-item>
                <a-descriptions-item label="评价内容">
                    {{ replyTarget.content || "用户没有留下文字" }}
                </a-descriptions-item>
            </a-descriptions>
            <a-form :model="replyForm" ref="replyFormRef" layout="vertical">
                <a-form-item
                    label="回复内容"
                    name="reply"
                    :rules="[{ required: true, message: '请填写回复内容' }]"
                >
                    <a-textarea
                        v-model:value="replyForm.reply"
                        placeholder="回复会公开显示在服务详情页，注意措辞"
                        :rows="4"
                        :maxlength="500"
                        show-count
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-card>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import { UserOutlined, MessageOutlined } from "@ant-design/icons-vue";
import { pageQueryProviderReview, replyReview } from "@/api/review";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    { title: "用户", key: "user", width: 140 },
    { title: "评分", key: "rating", width: 130 },
    { title: "评价内容", dataIndex: "content", key: "content", ellipsis: true },
    { title: "我的回复", key: "reply", ellipsis: true },
    { title: "评价时间", dataIndex: "createTime", key: "createTime", width: 170 },
    { title: "操作", key: "op", width: 110 },
];

const reactiveCols = ref(baseColumns.map((c) => ({ ...c })));
const handleColumnResize = (index) => (w) => {
    reactiveCols.value[index] = { ...reactiveCols.value[index], width: w };
};
const columns = computed(() =>
    reactiveCols.value.map((col, i) => ({
        ...col,
        customHeaderCell: () => ({
            width: col.width,
            onResize: handleColumnResize(i),
        }),
    })),
);
const tableComponents = { header: { cell: ResizableTitle } };

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 10;
const queryMinRating = ref(undefined);

const replyVisible = ref(false);
const replying = ref(false);
const replyTarget = ref(null);
const replyFormRef = ref(null);
const replyForm = reactive({ reply: "" });

// 三档筛选复用后端的 minRating / maxRating：差评是 1~2，中评是 3~3，好评是 4~5
const ratingRange = () => {
    const v = queryMinRating.value;
    if (v === undefined) return {};
    if (v === 1) return { minRating: 1, maxRating: 2 };
    if (v === 3) return { minRating: 3, maxRating: 3 };
    return { minRating: 4, maxRating: 5 };
};

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryProviderReview({
            pageNum: pageNum.value,
            pageSize,
            ...ratingRange(),
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

const handleOpenReply = (record) => {
    replyTarget.value = record;
    replyForm.reply = record.reply || "";
    replyVisible.value = true;
};

const handleReply = async () => {
    await replyFormRef.value.validate();
    replying.value = true;
    try {
        await replyReview(replyTarget.value.id, replyForm.reply);
        message.success("回复成功");
        replyVisible.value = false;
        fetchList();
    } finally {
        replying.value = false;
    }
};

onMounted(fetchList);
</script>

<style scoped>
.rv-user {
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
