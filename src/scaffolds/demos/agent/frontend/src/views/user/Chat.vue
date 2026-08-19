<template>
    <div class="chat">
        <!-- 左侧会话列表 -->
        <div class="chat__side">
            <a-button
                type="primary"
                block
                :disabled="!currentAgentId"
                @click="startNew"
            >
                <template #icon><plus-outlined /></template>
                新建与{{ currentAgent?.name || "助手" }}的对话
            </a-button>

            <a-select
                v-model:value="currentAgentId"
                :options="agentOptions"
                placeholder="选择助手"
                style="width: 100%; margin-top: 12px"
                :disabled="sending"
                @change="onAgentChange"
            />

            <a-input
                v-model:value="keyword"
                allow-clear
                placeholder="搜索对话标题"
                style="margin-top: 8px"
            >
                <template #prefix><search-outlined /></template>
            </a-input>

            <a-checkbox v-model:checked="onlyCurrentAgent" class="conv__filter">
                只看当前助手
            </a-checkbox>

            <a-divider style="margin: 12px 0" />

            <div class="conv__list">
                <a-spin :spinning="listLoading">
                    <a-empty
                        v-if="!filteredConversations.length && !listLoading"
                        :image="simpleEmptyImage"
                        :description="
                            conversations.length
                                ? '没有符合条件的对话'
                                : '还没有对话记录'
                        "
                    />
                    <div
                        v-for="conv in filteredConversations"
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
                        <!-- 思考面板放在正文之上：生成中自动展开，让用户看到
                             正在检索、正在想；结束后折叠成一行摘要，不占地方。 -->
                        <div
                            v-if="msg.role === 'assistant' && msg.trace?.length"
                            class="think"
                            :class="{ 'think--live': msg.thinking }"
                        >
                            <div class="think__head" @click="toggleTrace(msg)">
                                <loading-outlined v-if="msg.thinking" />
                                <bulb-outlined v-else />
                                <span class="think__label">
                                    {{ thinkSummary(msg) }}
                                </span>
                                <span class="think__toggle">
                                    {{ isTraceOpen(msg) ? "收起" : "展开" }}
                                    <up-outlined v-if="isTraceOpen(msg)" />
                                    <down-outlined v-else />
                                </span>
                            </div>

                            <div v-if="isTraceOpen(msg)" class="think__body">
                                <div
                                    v-for="(step, si) in msg.trace"
                                    :key="si"
                                    class="step"
                                    :class="{ 'step--running': step.running }"
                                >
                                    <span class="step__dot" />
                                    <div class="step__main">
                                        <div class="step__title">
                                            <a-tag :color="nodeTagColor(step.nodeType)">
                                                {{ nodeTypeLabel(step.nodeType) }}
                                            </a-tag>
                                            <strong>
                                                {{ step.title || step.nodeKey }}
                                            </strong>
                                            <span
                                                v-if="step.running"
                                                class="step__state"
                                            >
                                                执行中
                                            </span>
                                            <span
                                                v-else-if="step.cost != null"
                                                class="text-sub step__cost"
                                            >
                                                {{ step.cost }}ms
                                            </span>
                                        </div>
                                        <div v-if="step.output" class="step__output">
                                            {{ step.output }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="msg.content || msg.pending || !msg.errorMsg" class="bubble__body">
                            <span v-if="msg.content">{{ msg.content }}</span>
                            <!-- 首个 delta 到来前先转个圈，不然用户会以为点了没反应 -->
                            <span v-else-if="msg.pending" class="typing">
                                <a-spin size="small" />
                                <span class="text-sub">{{ pendingHint(msg) }}</span>
                            </span>
                            <span class="cursor" v-if="msg.streaming">▍</span>
                        </div>

                        <!-- 报错用一行小字，不用 a-alert 那么大一块 -->
                        <div v-if="msg.errorMsg" class="err" :title="msg.errorMsg">
                            <exclamation-circle-outlined />
                            <span class="err__text">{{ msg.errorMsg }}</span>
                        </div>

                        <div
                            v-if="msg.costMs || msg.tokenUsage"
                            class="bubble__foot"
                        >
                            <span v-if="msg.costMs" class="text-sub">
                                耗时 {{ (msg.costMs / 1000).toFixed(1) }}s
                            </span>
                            <span v-if="msg.tokenUsage" class="text-sub">
                                {{ msg.tokenUsage }} tokens
                            </span>
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
    SearchOutlined,
    BulbOutlined,
    LoadingOutlined,
    UpOutlined,
    DownOutlined,
    ExclamationCircleOutlined,
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
    datasource: "查数据",
    llm: "大模型",
    end: "结束",
};

// 节点标签颜色，让思考面板一眼能分出哪步在做什么
const NODE_TAG_COLOR = {
    start: "default",
    knowledge: "cyan",
    datasource: "purple",
    llm: "blue",
    end: "green",
};

// 正在执行某个节点时，正文区的占位提示
const PENDING_HINT = {
    start: "正在准备……",
    knowledge: "正在查资料……",
    datasource: "正在查数据……",
    llm: "正在思考……",
    end: "即将完成……",
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

// 侧边栏筛选：标题关键词 + 是否只看当前助手
const keyword = ref("");
const onlyCurrentAgent = ref(false);

const renameVisible = ref(false);
const renameTitle = ref("");
const renaming = ref(null);

// 中断函数由 streamChat 返回，点停止或离开页面时调它
let abortStream = null;

const nodeTypeLabel = (type) => NODE_TYPE_LABEL[type] || type;
const nodeTagColor = (type) => NODE_TAG_COLOR[type] || "default";

// 思考中默认展开，用户手动折叠过就听用户的（traceOpen 不再是 null）
const isTraceOpen = (msg) =>
    msg.traceOpen === null ? !!msg.thinking : !!msg.traceOpen;

const toggleTrace = (msg) => {
    msg.traceOpen = !isTraceOpen(msg);
};

// 折叠时那一行摘要：正在跑就报当前步骤，跑完就报总步数
const thinkSummary = (msg) => {
    if (msg.thinking) {
        const running = msg.trace.find((s) => s.running);
        const last = msg.trace[msg.trace.length - 1];
        const step = running || last;
        return step ? `${step.title || nodeTypeLabel(step.nodeType)}……` : "正在思考……";
    }
    return `推理过程（${msg.trace.length} 步）`;
};

// 正文还没开始吐字时，拿当前节点类型提示一句
const pendingHint = (msg) => {
    const running = (msg.trace || []).find((s) => s.running);
    return PENDING_HINT[running?.nodeType] || "正在思考……";
};

const agentOptions = computed(() =>
    agents.value.map((a) => ({ value: a.id, label: a.name })),
);

const currentAgent = computed(() =>
    agents.value.find((a) => a.id === currentAgentId.value),
);

// 前端筛：会话列表就那么几条，没必要为了筛选多走一轮接口
const filteredConversations = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    return conversations.value.filter((c) => {
        if (onlyCurrentAgent.value && c.agentId !== currentAgentId.value) {
            return false;
        }
        if (kw && !String(c.title || "").toLowerCase().includes(kw)) {
            return false;
        }
        return true;
    });
});

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
        // 历史消息不在思考中，默认折叠
        traceOpen: false,
        thinking: false,
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
            thinking: false,
        });
    }
};

/**
 * 切换助手。
 *
 * 后端要求会话与助手必须对得上（否则报“会话与智能体对不上”），
 * 所以换了助手就不能继续往旧会话里发，直接开一段新的。
 * 生成中下拉框是 disabled 的，这里不用再判 sending。
 */
const onAgentChange = () => {
    startNew();
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
        last.thinking = false;
        // 没跑完的节点停在“执行中”不合理，标成已中断
        last.trace?.forEach((s) => {
            if (s.running) {
                s.running = false;
                s.output = s.output || "已中断";
            }
        });
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
        thinking: false,
    });

    // 先插一条空的回复占位，delta 到了就往它的 content 上拼。
    // traceOpen 给 null 表示“用户还没表态”，思考中自动展开、结束后自动收起；
    // 一旦用户手动点过就变成 true/false，之后听用户的。
    const reply = ref({
        role: "assistant",
        content: "",
        trace: [],
        traceOpen: null,
        thinking: true,
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
            // 节点开始：先占一行“执行中”，不等它跑完
            onStep: (step) => {
                reply.value.trace.push({ ...step, running: true });
                scrollToBottom();
            },
            // 节点跑完：把刚才那行补上耗时与输出，而不是再插一行
            onTrace: (step) => {
                const list = reply.value.trace;
                const i = list.findIndex(
                    (s) => s.running && s.nodeKey === step.nodeKey,
                );
                if (i >= 0) {
                    list[i] = { ...step, running: false };
                } else {
                    list.push({ ...step, running: false });
                }
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
                reply.value.thinking = false;
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
                reply.value.thinking = false;
                reply.value.errorMsg = msg;
                // 停在哪一步出错的，把那步标成失败，方便定位
                reply.value.trace.forEach((s) => {
                    if (s.running) {
                        s.running = false;
                        s.output = s.output || "执行失败";
                    }
                });
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
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--color-bg-card);
    box-shadow: var(--shadow-sm);
    /* 新建与筛选固定在上方，只让会话列表滚，
       否则会话一多搜索框就被顶出可视区了。 */
    overflow: hidden;
}

.conv__filter {
    margin-top: 10px;
    font-size: var(--font-size-xs);
    color: var(--color-text-sub);
}

.conv__list {
    flex: 1;
    min-height: 0;
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

/* 思考面板：模仿“思考过程”那种淡底卡片，视觉上比正文退后一级 */
.think {
    margin-bottom: 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-page);
    overflow: hidden;
}

.think--live {
    border-color: var(--color-primary-bg-deep);
    background: var(--color-primary-bg);
}

.think__head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    font-size: var(--font-size-xs);
    color: var(--color-text-sub);
    cursor: pointer;
    user-select: none;
}

.think__label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.think--live .think__label {
    color: var(--color-primary-active);
}

.think__toggle {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--color-text-mute);
}

.think__body {
    padding: 2px 10px 8px;
    border-top: 1px dashed var(--color-border-deep);
}

/* 每一步左侧一个小圆点，连成一条时间线 */
.step {
    display: flex;
    gap: 8px;
    padding: 5px 0;
    font-size: var(--font-size-xs);
}

.step__dot {
    flex: none;
    width: 6px;
    height: 6px;
    margin-top: 7px;
    border-radius: 50%;
    background: var(--color-border-deep);
}

.step--running .step__dot {
    background: var(--color-primary);
    animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
    50% {
        opacity: 0.25;
    }
}

.step__main {
    flex: 1;
    min-width: 0;
}

.step__title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
}

.step__state {
    color: var(--color-primary);
}

.step__cost {
    margin-left: auto;
}

.step__output {
    margin-top: 3px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    background: #fff;
    color: var(--color-text-sub);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 140px;
    overflow: auto;
}

/* 报错只占一行：不论多长都不抢掉正文的位置，完整内容走 title 提示 */
.err {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: var(--font-size-xs);
    color: var(--color-danger);
}

.err__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 首字未到时的占位：转圈 + 一句当前在做什么 */
.typing {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-size-sm);
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
