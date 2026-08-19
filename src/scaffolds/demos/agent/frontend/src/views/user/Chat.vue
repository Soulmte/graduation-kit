<template>
    <div class="chat">
        <!-- 左侧会话列表 -->
        <div class="chat__side">
            <a-button
                type="primary"
                block
                :disabled="!agentOptions.length"
                @click="startNew"
            >
                <template #icon><plus-outlined /></template> 新对话
            </a-button>

            <a-select
                v-model:value="currentAgentId"
                :options="agentOptions"
                placeholder="选择助手"
                style="width: 100%; margin-top: 12px"
            />

            <a-divider style="margin: 12px 0" />

            <a-spin :spinning="listLoading">
                <a-empty
                    v-if="!conversations.length && !listLoading"
                    :image="simpleEmptyImage"
                    description="还没有对话记录"
                />
                <div
                    v-for="conv in conversations"
                    :key="conv.id"
                    class="conv"
                    :class="{ 'conv--active': conv.id === currentConvId }"
                    @click="openConversation(conv)"
                >
                    <div class="conv__title">{{ conv.title }}</div>
                    <div class="conv__meta">
                        <span>{{ conv.agentName || "已删除" }}</span>
                        <span>{{ conv.msgCount }} 条</span>
                    </div>
                    <div class="conv__ops">
                        <edit-outlined @click.stop="handleRename(conv)" />
                        <delete-outlined @click.stop="handleDelete(conv)" />
                    </div>
                </div>
            </a-spin>
        </div>

        <!-- 右侧消息区 -->
        <div class="chat__main">
            <div class="chat__head">
                <a-avatar :size="36" :src="currentAgent?.avatar">
                    {{ currentAgent?.name?.charAt(0) || "AI" }}
                </a-avatar>
                <div>
                    <div class="chat__name">
                        {{ currentAgent?.name || "选一个助手开始提问" }}
                    </div>
                    <div class="chat__desc">
                        {{ currentAgent?.description || "" }}
                    </div>
                </div>
            </div>

            <div ref="scrollRef" class="chat__body">
                <a-empty
                    v-if="!messages.length"
                    description="有什么想问的，直接在下面输入"
                />

                <div
                    v-for="(msg, i) in messages"
                    :key="msg.id || `tmp_${i}`"
                    class="bubble"
                    :class="`bubble--${msg.role}`"
                >
                    <a-avatar
                        v-if="msg.role === 'assistant'"
                        :size="32"
                        :src="currentAgent?.avatar"
                    >
                        {{ currentAgent?.name?.charAt(0) || "AI" }}
                    </a-avatar>

                    <div class="bubble__wrap">
                        <div class="bubble__body">
                            <span v-if="msg.content">{{ msg.content }}</span>
                            <!-- 首个 delta 到来前先转个圈，不然用户会以为点了没反应 -->
                            <a-spin v-else-if="msg.pending" size="small" />
                            <span class="cursor" v-if="msg.streaming">▍</span>
                        </div>

                        <a-alert
                            v-if="msg.errorMsg"
                            type="error"
                            show-icon
                            :message="msg.errorMsg"
                        />

                        <div v-if="msg.trace?.length" class="bubble__foot">
                            <a class="link" @click="msg.traceOpen = !msg.traceOpen">
                                {{ msg.traceOpen ? "收起" : "查看" }}推理过程（{{
                                    msg.trace.length
                                }}
                                步）
                            </a>
                            <span v-if="msg.costMs" class="text-sub">
                                耗时 {{ (msg.costMs / 1000).toFixed(1) }}s
                            </span>
                            <span v-if="msg.tokenUsage" class="text-sub">
                                {{ msg.tokenUsage }} tokens
                            </span>
                        </div>

                        <div v-if="msg.traceOpen" class="trace">
                            <div
                                v-for="(step, si) in msg.trace"
                                :key="si"
                                class="trace__item"
                            >
                                <a-tag>{{ nodeTypeLabel(step.nodeType) }}</a-tag>
                                <strong>{{ step.title || step.nodeKey }}</strong>
                                <span v-if="step.cost" class="text-sub">
                                    {{ step.cost }}ms
                                </span>
                                <div v-if="step.output" class="trace__output">
                                    {{ step.output }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <a-avatar v-if="msg.role === 'user'" :size="32">我</a-avatar>
                </div>
            </div>

            <div class="chat__input">
                <a-textarea
                    v-model:value="question"
                    :rows="3"
                    :maxlength="2000"
                    :disabled="sending"
                    placeholder="输入问题，Enter 发送，Shift + Enter 换行"
                    @press-enter="onPressEnter"
                />
                <div class="chat__actions">
                    <span class="text-sub">
                        {{ sending ? "正在回答，可以点停止生成" : "" }}
                    </span>
                    <a-space>
                        <a-button v-if="sending" danger @click="handleStop">
                            <template #icon><stop-outlined /></template> 停止生成
                        </a-button>
                        <a-button
                            v-else
                            type="primary"
                            :disabled="!question.trim() || !currentAgentId"
                            @click="handleSend"
                        >
                            <template #icon><send-outlined /></template> 发送
                        </a-button>
                    </a-space>
                </div>
            </div>
        </div>

        <a-modal
            v-model:open="renameVisible"
            title="重命名会话"
            @ok="submitRename"
        >
            <a-input
                v-model:value="renameTitle"
                :maxlength="100"
                placeholder="给这段对话起个名字"
                @press-enter="submitRename"
            />
        </a-modal>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref } from "vue";
import { useRoute } from "vue-router";
import { Modal, message, Empty } from "ant-design-vue";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SendOutlined,
    StopOutlined,
} from "@ant-design/icons-vue";
import { listPublishedAgent } from "@/api/agent";
import {
    listMyConversation,
    getConversationDetail,
    renameConversation,
    deleteConversation,
} from "@/api/conversation";
import { streamChat } from "@/api/chat";

const NODE_TYPE_LABEL = {
    start: "开始",
    knowledge: "知识检索",
    llm: "大模型",
    end: "结束",
};

const route = useRoute();

// 侧边栏空位置小，用简约版的空状态图。
// 不能写 :image="null" —— Empty 内部会做 `'type' in image` 判断，
// 而 typeof null 恰好是 'object'，会直接报 Cannot use 'in' operator。
const simpleEmptyImage = Empty.PRESENTED_IMAGE_SIMPLE;

const agents = ref([]);
const conversations = ref([]);
const messages = ref([]);
const listLoading = ref(false);
const sending = ref(false);
const question = ref("");
const scrollRef = ref(null);

const currentAgentId = ref(null);
const currentConvId = ref(null);

const renameVisible = ref(false);
const renameTitle = ref("");
const renaming = ref(null);

// 中断函数由 streamChat 返回，点停止或离开页面时调它
let abortStream = null;

const nodeTypeLabel = (type) => NODE_TYPE_LABEL[type] || type;

const agentOptions = computed(() =>
    agents.value.map((a) => ({ value: a.id, label: a.name })),
);

const currentAgent = computed(() =>
    agents.value.find((a) => a.id === currentAgentId.value),
);

const scrollToBottom = () => {
    nextTick(() => {
        const el = scrollRef.value;
        if (el) el.scrollTop = el.scrollHeight;
    });
};

const parseTrace = (raw) => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const fetchAgents = async () => {
    const res = await listPublishedAgent();
    agents.value = res.data || [];

    // 从列表页带过来的 agentId 优先，否则默认选第一个
    const fromQuery = Number(route.query.agentId);
    if (fromQuery && agents.value.some((a) => a.id === fromQuery)) {
        currentAgentId.value = fromQuery;
    } else if (!currentAgentId.value && agents.value.length) {
        currentAgentId.value = agents.value[0].id;
    }
};

const fetchConversations = async () => {
    listLoading.value = true;
    try {
        const res = await listMyConversation();
        conversations.value = res.data || [];
    } finally {
        listLoading.value = false;
    }
};

const openConversation = async (conv) => {
    if (sending.value) {
        message.warning("等这条回答生成完再切会话");
        return;
    }

    currentConvId.value = conv.id;
    if (conv.agentId) currentAgentId.value = conv.agentId;

    const res = await getConversationDetail(conv.id);
    // node_trace 在库里是 JSON 字符串，进页面就 parse 成数组，
    // 让历史消息与刚生成的消息结构一致，模板里就不用分两种情况写。
    messages.value = (res.data.messages || []).map((m) => ({
        ...m,
        trace: parseTrace(m.nodeTrace),
        traceOpen: false,
    }));
    scrollToBottom();
};

const startNew = () => {
    if (sending.value) {
        message.warning("等这条回答生成完再开新对话");
        return;
    }

    // 不提前调创建接口：发第一句时 conversationId 为空，后端会自己建并通过
    // meta 事件把 ID 回传。这样用户点了新对话却不问，库里不会攒空会话。
    currentConvId.value = null;
    messages.value = [];

    // 开场白先在本地摆上，不存库，只是让页面不空
    const greeting = currentAgent.value?.greeting;
    if (greeting) {
        messages.value.push({
            role: "assistant",
            content: greeting,
            trace: [],
            traceOpen: false,
        });
    }
};

const handleRename = (conv) => {
    renaming.value = conv;
    renameTitle.value = conv.title;
    renameVisible.value = true;
};

const submitRename = async () => {
    const title = renameTitle.value.trim();
    if (!title) {
        message.warning("标题不能为空");
        return;
    }
    await renameConversation(renaming.value.id, title);
    message.success("已重命名");
    renameVisible.value = false;
    fetchConversations();
};

const handleDelete = (conv) => {
    Modal.confirm({
        title: "删除会话",
        content: `删除【${conv.title}】及其全部消息？删了找不回来。`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteConversation(conv.id);
            message.success("已删除");
            if (currentConvId.value === conv.id) {
                currentConvId.value = null;
                messages.value = [];
            }
            fetchConversations();
        },
    });
};

// Shift + Enter 换行，Enter 直接发
const onPressEnter = (e) => {
    if (e.shiftKey) return;
    e.preventDefault();
    if (!sending.value) handleSend();
};

const handleStop = () => {
    abortStream?.();
    abortStream = null;
    sending.value = false;

    const last = messages.value[messages.value.length - 1];
    if (last && last.role === "assistant") {
        last.streaming = false;
        last.pending = false;
        // 中断时后端已经存了那一瞬的部分内容，前端也照实标注一下
        if (!last.content) last.content = "（已停止生成）";
    }
};

const handleSend = () => {
    const text = question.value.trim();
    if (!text) return;
    if (!currentAgentId.value) {
        message.warning("先选一个助手");
        return;
    }

    messages.value.push({
        role: "user",
        content: text,
        trace: [],
        traceOpen: false,
    });

    // 先插一条空的回复占位，delta 到了就往它的 content 上拼
    const reply = ref({
        role: "assistant",
        content: "",
        trace: [],
        traceOpen: false,
        pending: true,
        streaming: true,
    });
    messages.value.push(reply.value);

    question.value = "";
    sending.value = true;
    scrollToBottom();

    const isNewConv = !currentConvId.value;

    abortStream = streamChat(
        {
            agentId: currentAgentId.value,
            conversationId: currentConvId.value,
            question: text,
        },
        {
            onMeta: (data) => {
                currentConvId.value = data.conversationId;
            },
            onTrace: (step) => {
                reply.value.trace.push(step);
                scrollToBottom();
            },
            onDelta: (chunk) => {
                reply.value.pending = false;
                reply.value.content += chunk;
                scrollToBottom();
            },
            onDone: (data) => {
                reply.value.streaming = false;
                reply.value.pending = false;
                reply.value.costMs = data.costMs;
                reply.value.tokenUsage = data.tokenUsage;
                sending.value = false;
                abortStream = null;
                // 新会话要刷列表才能出现在侧边栏；老会话刷一下更新消息数与排序
                fetchConversations();
                if (isNewConv) scrollToBottom();
            },
            onError: (msg) => {
                reply.value.streaming = false;
                reply.value.pending = false;
                reply.value.errorMsg = msg;
                sending.value = false;
                abortStream = null;
                scrollToBottom();
            },
        },
    );
};

onMounted(async () => {
    await fetchAgents();
    await fetchConversations();
    startNew();
});

// 离开页面时把未读完的流关掉，不然组件销毁后回调还在改已卸载的状态
onBeforeUnmount(() => {
    abortStream?.();
});
</script>

<style scoped>
/* 左右分栏，高度卡在视口内，消息区自己滚。
   减去 header、footer 与内容区上下边距（各 24px）。 */
.chat {
    display: flex;
    gap: 16px;
    height: calc(100vh - var(--h-header) - var(--h-footer) - 48px);
    min-height: 520px;
}

.chat__side {
    width: 260px;
    flex-shrink: 0;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--color-bg-card);
    box-shadow: var(--shadow-sm);
    overflow-y: auto;
}

.conv {
    position: relative;
    padding: 10px 12px;
    margin-bottom: 6px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.2s;
}

.conv:hover {
    background: var(--color-bg-hover);
}

.conv--active {
    background: var(--color-primary-bg);
}

.conv__title {
    font-size: var(--font-size-md);
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 36px;
}

.conv__meta {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: var(--font-size-xs);
    color: var(--color-text-mute);
}

/* 重命名与删除图标平时藏着，鼠标移上去才出，避免列表显得杂 */
.conv__ops {
    position: absolute;
    top: 10px;
    right: 10px;
    display: none;
    gap: 8px;
    color: var(--color-text-mute);
}

.conv:hover .conv__ops {
    display: flex;
}

.conv__ops :hover {
    color: var(--color-primary);
}

.chat__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-radius: var(--radius-lg);
    background: var(--color-bg-card);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
}

.chat__head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--color-border);
}

.chat__name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
}

.chat__desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-mute);
}

.chat__body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.bubble {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
}

.bubble--user {
    justify-content: flex-end;
}

.bubble__wrap {
    max-width: 76%;
}

.bubble__body {
    padding: 10px 14px;
    border-radius: var(--radius-lg);
    background: var(--color-bg-page);
    color: var(--color-text);
    line-height: 1.75;
    /* 模型常用换行分条，不保留会糊成一大块 */
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 42px;
}

.bubble--user .bubble__body {
    background: var(--color-primary);
    color: #fff;
}

/* 生成中的光标，让用户看得出还在写 */
.cursor {
    display: inline-block;
    margin-left: 2px;
    animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {
    to {
        visibility: hidden;
    }
}

.bubble__foot {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
    font-size: var(--font-size-xs);
}

.link {
    color: var(--color-primary);
    cursor: pointer;
}

.trace {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    background: var(--color-bg-page);
}

.trace__item {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
    font-size: var(--font-size-xs);
}

.trace__output {
    flex-basis: 100%;
    margin-top: 2px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    background: #fff;
    color: var(--color-text-sub);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 140px;
    overflow: auto;
}

.chat__input {
    padding: 12px 20px 16px;
    border-top: 1px solid var(--color-border);
}

.chat__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
}

/* 屏幕窄时会话列表横过来放到上面，不然手机上消息区只剩一条缝 */
@media (max-width: 768px) {
    .chat {
        flex-direction: column;
        height: auto;
    }

    .chat__side {
        width: 100%;
        max-height: 260px;
    }

    .chat__main {
        height: 70vh;
    }

    .bubble__wrap {
        max-width: 88%;
    }
}
</style>
