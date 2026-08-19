<template>
    <a-card title="会话记录">
        <a-alert
            type="info"
            show-icon
            style="margin-bottom: 16px"
            message="这里能看到用户与智能体的真实对话"
            description="点「查看」展开完整消息，每条回答下面能翻出执行轨迹，答得不对时先看是检索没召回到资料，还是模型没用好资料。"
        />

        <div class="toolbar">
            <a-space wrap>
                <a-input-search
                    v-model:value="query.title"
                    placeholder="搜索会话标题"
                    style="width: 240px"
                    allow-clear
                    @search="onSearch"
                />
                <a-select
                    v-model:value="query.agentId"
                    :options="agentOptions"
                    placeholder="全部智能体"
                    style="width: 200px"
                    allow-clear
                    @change="onSearch"
                />
            </a-space>
        </div>

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :pagination="{
                current: query.pageNum,
                pageSize: query.pageSize,
                total,
                onChange: (p) => {
                    query.pageNum = p;
                    fetchList();
                },
                showTotal: (t) => `共 ${t} 条`,
            }"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'idx'">
                    {{ (query.pageNum - 1) * query.pageSize + index + 1 }}
                </template>
                <template v-else-if="column.key === 'agentName'">
                    {{ record.agentName || "已删除" }}
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <a-button
                            size="small"
                            type="primary"
                            @click="handleView(record)"
                        >
                            <template #icon><eye-outlined /></template> 查看
                        </a-button>
                    </div>
                </template>
            </template>
        </a-table>

        <a-drawer
            v-model:open="drawerVisible"
            :title="detail?.title || '会话详情'"
            :width="720"
            placement="right"
        >
            <a-spin :spinning="detailLoading">
                <a-descriptions
                    v-if="detail"
                    size="small"
                    bordered
                    :column="2"
                    style="margin-bottom: 16px"
                >
                    <a-descriptions-item label="用户">
                        {{ detail.username || "未知" }}
                    </a-descriptions-item>
                    <a-descriptions-item label="智能体">
                        {{ detail.agentName || "已删除" }}
                    </a-descriptions-item>
                    <a-descriptions-item label="消息条数">
                        {{ detail.msgCount }}
                    </a-descriptions-item>
                    <a-descriptions-item label="最后活动">
                        {{ detail.lastTime }}
                    </a-descriptions-item>
                </a-descriptions>

                <a-empty
                    v-if="detail && !detail.messages?.length"
                    description="这个会话还没有消息"
                />

                <div
                    v-for="msg in detail?.messages || []"
                    :key="msg.id"
                    class="msg"
                    :class="`msg--${msg.role}`"
                >
                    <div class="msg__head">
                        <a-tag :color="msg.role === 'user' ? 'blue' : 'green'">
                            {{ msg.role === "user" ? "用户" : "智能体" }}
                        </a-tag>
                        <span class="text-sub">{{ msg.createTime }}</span>
                        <span v-if="msg.costMs" class="text-sub">
                            耗时 {{ (msg.costMs / 1000).toFixed(1) }}s
                        </span>
                        <span v-if="msg.tokenUsage" class="text-sub">
                            {{ msg.tokenUsage }} tokens
                        </span>
                    </div>

                    <div class="msg__body">{{ msg.content }}</div>

                    <a-alert
                        v-if="msg.errorMsg"
                        type="error"
                        show-icon
                        :message="msg.errorMsg"
                        style="margin-top: 8px"
                    />

                    <a-collapse
                        v-if="parseTrace(msg.nodeTrace).length"
                        ghost
                        style="margin-top: 4px"
                    >
                        <a-collapse-panel key="trace" header="执行轨迹">
                            <a-timeline>
                                <a-timeline-item
                                    v-for="(step, i) in parseTrace(msg.nodeTrace)"
                                    :key="i"
                                >
                                    <strong>{{ step.title || step.nodeKey }}</strong>
                                    <a-tag style="margin-left: 6px">
                                        {{ nodeTypeLabel(step.nodeType) }}
                                    </a-tag>
                                    <span v-if="step.cost" class="text-sub">
                                        {{ step.cost }}ms
                                    </span>
                                    <div v-if="step.output" class="trace__output">
                                        {{ step.output }}
                                    </div>
                                </a-timeline-item>
                            </a-timeline>
                        </a-collapse-panel>
                    </a-collapse>
                </div>
            </a-spin>
        </a-drawer>
    </a-card>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { EyeOutlined } from "@ant-design/icons-vue";
import {
    pageQueryConversation,
    getConversationDetailForAdmin,
} from "@/api/conversation";
import { pageQueryAgent } from "@/api/agent";

const NODE_TYPE_LABEL = {
    start: "开始",
    knowledge: "知识检索",
    llm: "大模型",
    end: "结束",
};

const columns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "会话标题", dataIndex: "title", key: "title", ellipsis: true },
    { title: "用户", dataIndex: "username", key: "username", width: 130 },
    { title: "智能体", dataIndex: "agentName", key: "agentName", width: 160 },
    { title: "消息数", dataIndex: "msgCount", key: "msgCount", width: 90 },
    { title: "最后活动", dataIndex: "lastTime", key: "lastTime", width: 180 },
    { title: "操作", key: "op", width: 100 },
];

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const agentOptions = ref([]);

const query = reactive({
    pageNum: 1,
    pageSize: 10,
    title: "",
    agentId: undefined,
});

const drawerVisible = ref(false);
const detailLoading = ref(false);
const detail = ref(null);

const nodeTypeLabel = (type) => NODE_TYPE_LABEL[type] || type;

// node_trace 存的是 JSON 字串。旧数据或异常中断的消息可能没这个字段，
// 解不开就当没有轨迹，不能把整个抽屉卡死。
const parseTrace = (raw) => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const fetchAgentOptions = async () => {
    const res = await pageQueryAgent({ pageNum: 1, pageSize: 200 });
    agentOptions.value = res.data.records.map((a) => ({
        value: a.id,
        label: a.name,
    }));
};

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryConversation({ ...query });
        list.value = res.data.records;
        total.value = res.data.total;
    } finally {
        loading.value = false;
    }
};

const onSearch = () => {
    query.pageNum = 1;
    fetchList();
};

const handleView = async (record) => {
    // 先开抽屉再拉数据，配上 spin 比等接口回来才弹感觉快
    detail.value = null;
    drawerVisible.value = true;
    detailLoading.value = true;
    try {
        const res = await getConversationDetailForAdmin(record.id);
        detail.value = res.data;
    } finally {
        detailLoading.value = false;
    }
};

onMounted(() => {
    fetchList();
    fetchAgentOptions();
});
</script>

<style scoped>
.msg {
    padding: 10px 12px;
    margin-bottom: 12px;
    border-radius: 8px;
    background: #fafafa;
}

/* 用户与智能体用左边条颜色区分，比只看标签更容易扫 */
.msg--user {
    border-left: 3px solid #1677ff;
}

.msg--assistant {
    border-left: 3px solid #52c41a;
}

.msg__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 12px;
}

/* 模型回答里的换行要保留，不然分条回答会糊成一大块 */
.msg__body {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.7;
}

.trace__output {
    margin-top: 4px;
    padding: 6px 8px;
    border-radius: 4px;
    background: #f5f5f5;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.65);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 160px;
    overflow: auto;
}
</style>
