<template>
    <a-card>
        <template #title>
            <a-space>
                <a-button size="small" @click="goBack">
                    <template #icon><left-outlined /></template> 返回
                </a-button>
                <span>编排：{{ agent?.name || "..." }}</span>
                <a-tag :color="agent?.status === 1 ? 'green' : 'default'">
                    {{ agent?.status === 1 ? "已发布" : "草稿" }}
                </a-tag>
            </a-space>
        </template>

        <template #extra>
            <a-space>
                <a-button @click="addNode('knowledge')">
                    <template #icon><plus-outlined /></template> 检索节点
                </a-button>
                <a-button @click="addNode('datasource')">
                    <template #icon><plus-outlined /></template> 查数据节点
                </a-button>
                <a-button @click="addNode('llm')">
                    <template #icon><plus-outlined /></template> 大模型节点
                </a-button>
                <a-button type="primary" :loading="saving" @click="handleSave">
                    <template #icon><save-outlined /></template> 保存编排
                </a-button>
            </a-space>
        </template>

        <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="拖动节点调位置，拖节点边缘的圆点连线，点节点打开参数面板"
            description="当前只支持一条链：开始 → …… → 结束，每个节点最多接一条往下走的线。改完记得点「保存编排」。"
        />

        <div class="flow-wrap" v-if="loaded">
            <vue-flow
                v-model:nodes="nodes"
                v-model:edges="edges"
                :default-viewport="viewport"
                :min-zoom="0.3"
                :max-zoom="1.6"
                fit-view-on-init
                @node-click="onNodeClick"
                @edges-change="onEdgesChange"
            >
                <background :gap="16" />
                <controls />

                <template #node-start="props">
                    <flow-node :data="props.data" type="start" />
                </template>
                <template #node-knowledge="props">
                    <flow-node :data="props.data" type="knowledge" />
                </template>
                <template #node-datasource="props">
                    <flow-node
                        :data="props.data"
                        type="datasource"
                        :sources="dataSources"
                    />
                </template>
                <template #node-llm="props">
                    <flow-node :data="props.data" type="llm" />
                </template>
                <template #node-end="props">
                    <flow-node :data="props.data" type="end" />
                </template>
            </vue-flow>
        </div>
        <a-skeleton v-else active :paragraph="{ rows: 8 }" />

        <a-drawer
            v-model:open="drawerVisible"
            :title="`节点参数：${current?.data?.title || ''}`"
            :width="460"
            placement="right"
        >
            <a-form v-if="current" layout="vertical">
                <a-form-item label="节点名称">
                    <a-input
                        v-model:value="current.data.title"
                        :maxlength="50"
                        placeholder="给这个步骤起个名字"
                    />
                </a-form-item>

                <template v-if="current.type === 'knowledge'">
                    <a-form-item
                        label="召回条数"
                        extra="召回越多参考资料越全，但提示词会变长、耗 token 也多"
                    >
                        <a-input-number
                            v-model:value="current.data.topK"
                            :min="1"
                            :max="10"
                            style="width: 140px"
                        />
                    </a-form-item>

                    <a-divider />
                    <a-form-item
                        label="试检索"
                        extra="输个问题看会召回哪几条。答得不对时先在这里确认是没召回到资料，还是召回了但模型没用好"
                    >
                        <a-input-search
                            v-model:value="testQuestion"
                            placeholder="如：押一付三是什么意思"
                            enter-button="试一下"
                            :loading="testing"
                            @search="handleTestRetrieve"
                        />
                    </a-form-item>
                    <a-list
                        v-if="testResult.length"
                        size="small"
                        bordered
                        :data-source="testResult"
                    >
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <a-list-item-meta
                                    :title="item.title"
                                    :description="item.keywords"
                                />
                            </a-list-item>
                        </template>
                    </a-list>
                    <a-empty
                        v-else-if="tested"
                        description="一条都没召回到，去知识库里补充条目或加关键词"
                    />
                </template>

                <template v-else-if="current.type === 'datasource'">
                    <a-form-item
                        label="数据源"
                        extra="选完会自动出现它支持的筛选参数。想接自己的业务表，看后端 NoticeDataSource 那个示例类"
                    >
                        <a-select
                            v-model:value="current.data.source"
                            placeholder="选一个数据源"
                            @change="onSourceChange"
                        >
                            <a-select-option
                                v-for="s in dataSources"
                                :key="s.key"
                                :value="s.key"
                            >
                                {{ s.label }}
                                <span class="text-sub">· {{ s.description }}</span>
                            </a-select-option>
                        </a-select>
                    </a-form-item>

                    <!-- 参数表单按后端的 params 声明渲染，
                         数据源加了新筛选条件这里不用改 -->
                    <template v-if="currentSourceParams.length">
                        <a-divider>筛选参数</a-divider>
                        <a-form-item
                            v-for="p in currentSourceParams"
                            :key="p.name"
                            :label="p.label"
                            :extra="p.extra"
                        >
                            <a-input
                                v-if="p.type === 'text'"
                                v-model:value="current.data.params[p.name]"
                                :maxlength="100"
                                allow-clear
                            />
                            <a-input-number
                                v-else-if="p.type === 'number'"
                                v-model:value="current.data.params[p.name]"
                                :min="1"
                                :max="10"
                                style="width: 140px"
                            />
                            <a-switch
                                v-else-if="p.type === 'switch'"
                                v-model:checked="current.data.params[p.name]"
                            />
                            <a-select
                                v-else-if="p.type === 'select'"
                                v-model:value="current.data.params[p.name]"
                                :options="
                                    (p.options || []).map((o) => ({
                                        value: o.value,
                                        label: o.label,
                                    }))
                                "
                                allow-clear
                            />
                        </a-form-item>
                    </template>
                    <a-empty
                        v-else-if="current.data.source"
                        description="这个数据源没有可配的筛选参数"
                    />
                </template>

                <template v-else-if="current.type === 'llm'">
                    <a-form-item
                        label="使用模型"
                        extra="必选。停用或删掉的模型会在保存时被拦下来"
                    >
                        <a-select
                            v-model:value="current.data.modelConfigId"
                            :options="modelOptions"
                            placeholder="选一个已启用的模型"
                        />
                    </a-form-item>

                    <a-form-item
                        label="系统提示词"
                        extra="决定智能体的语气与边界。写清楚“不知道就说不知道”能明显减少胡编"
                    >
                        <a-textarea
                            v-model:value="current.data.systemPrompt"
                            :rows="8"
                            :maxlength="2000"
                            show-count
                        />
                    </a-form-item>

                    <a-form-item
                        label="采样温度"
                        extra="越小越保守稳定，越大越发散。咨询类场景建议 0.3~0.8"
                    >
                        <a-slider
                            v-model:value="current.data.temperature"
                            :min="0"
                            :max="2"
                            :step="0.1"
                        />
                    </a-form-item>

                    <a-form-item label="带历史对话">
                        <a-switch v-model:checked="current.data.useHistory" />
                        <span class="text-sub" style="margin-left: 8px">
                            开启后模型能听懂“那第二种呢”这种跟问
                        </span>
                    </a-form-item>

                    <a-form-item
                        v-if="current.data.useHistory"
                        label="带多少条历史"
                        extra="条数越多上下文越连贯，但每次请求耗的 token 也越多"
                    >
                        <a-input-number
                            v-model:value="current.data.historyLimit"
                            :min="2"
                            :max="20"
                            style="width: 140px"
                        />
                    </a-form-item>
                </template>

                <template v-else>
                    <a-empty description="这类节点没有可调的参数" />
                </template>

                <a-divider />
                <a-button
                    v-if="current.type !== 'start' && current.type !== 'end'"
                    danger
                    block
                    @click="removeCurrent"
                >
                    <template #icon><delete-outlined /></template>
                    删除这个节点
                </a-button>
            </a-form>
        </a-drawer>
    </a-card>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import {
    LeftOutlined,
    PlusOutlined,
    SaveOutlined,
    DeleteOutlined,
} from "@ant-design/icons-vue";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";
import {
    getAgentForEdit,
    saveAgentGraph,
    listDataSource,
} from "@/api/agent";
import { listEnabledModelConfig } from "@/api/modelConfig";
import { testRetrieveKnowledge } from "@/api/knowledge";
import FlowNode from "@/components/FlowNode.vue";

const route = useRoute();
const router = useRouter();
const agentId = Number(route.params.id);

const { toObject } = useVueFlow();

const agent = ref(null);
const loaded = ref(false);
const saving = ref(false);
const nodes = ref([]);
const edges = ref([]);
const viewport = ref({ x: 0, y: 0, zoom: 1 });
const modelOptions = ref([]);
const dataSources = ref([]);

const drawerVisible = ref(false);
const currentId = ref(null);

const testQuestion = ref("");
const testResult = ref([]);
const testing = ref(false);
const tested = ref(false);

// 抽屉里改参数要直接作用到 nodes 上，所以这里返回的是数组里的那个对象本身，
// 不能拷贝——拷贝一份改了也白改。
const current = computed(() =>
    nodes.value.find((n) => n.id === currentId.value),
);

// 当前选中数据源的参数声明，抽屉里据此渲染控件
const currentSourceParams = computed(() => {
    const key = current.value?.data?.source;
    if (!key) return [];
    return dataSources.value.find((s) => s.key === key)?.params || [];
});

// 换数据源就清掉旧参数：不同数据源的参数名根本不一样，
// 留着旧值只会存进 graph_json 变成没人读的脏数据。
// 同时把声明了但没值的参数补上默认值，免得控件绑到 undefined。
const onSourceChange = (key) => {
    if (!current.value) return;
    const params = {};
    const specs = dataSources.value.find((s) => s.key === key)?.params || [];
    for (const p of specs) {
        params[p.name] = p.type === "switch" ? false : p.type === "number" ? 3 : "";
    }
    current.value.data.params = params;
};

const goBack = () => router.push("/admin/agent");

const fetchModels = async () => {
    const res = await listEnabledModelConfig();
    modelOptions.value = res.data.map((m) => ({
        value: m.id,
        label: m.isDefault === 1 ? `${m.name}（默认）` : m.name,
    }));
};

// 数据源清单来自后端扫到的 DataSourceProvider 实现类。
// 拉不到不能把整个编排页卡死——就算没数据源，其他节点还要能改。
const fetchDataSources = async () => {
    try {
        const res = await listDataSource();
        dataSources.value = res.data || [];
    } catch {
        dataSources.value = [];
        message.warning("数据源清单没拉到，查数据节点暂时选不了");
    }
};

const fetchAgent = async () => {
    const res = await getAgentForEdit(agentId);
    agent.value = res.data;

    // graphJson 后端存的是字符串，这里 parse 回来直接喂给 Vue Flow
    let graph = { nodes: [], edges: [] };
    if (res.data.graphJson) {
        try {
            graph = JSON.parse(res.data.graphJson);
        } catch {
            message.error("编排数据解析失败，已按空画布打开");
        }
    }

    nodes.value = graph.nodes || [];
    edges.value = graph.edges || [];

    // 早前存的画布可能没有 params 字段，v-model 绑到 undefined 上会报错，
    // 这里统一补上空对象。
    for (const node of nodes.value) {
        if (node.type === "datasource" && !node.data.params) {
            node.data.params = {};
        }
    }

    if (graph.viewport) viewport.value = graph.viewport;
    loaded.value = true;
};

const onNodeClick = ({ node }) => {
    currentId.value = node.id;
    testQuestion.value = "";
    testResult.value = [];
    tested.value = false;
    drawerVisible.value = true;
};

// 单链限制：一个节点只能有一条往下走的线。
// 在前端就拦住，比等到保存时才报错体验好。
const onEdgesChange = (changes) => {
    for (const change of changes) {
        if (change.type !== "add") continue;
        const source = change.item?.source;
        const dup = edges.value.filter((e) => e.source === source);
        if (dup.length > 1) {
            message.warning("一个节点只能接一条往下走的线，先删掉原来的连线");
            edges.value = edges.value.filter((e) => e.id !== change.item.id);
        }
    }
};

// 节点 id 用「类型_序号」，序号从现有同类节点里取最大值 +1。
// 不用时间戳是为了让存进 graph_json 的 id 短一点、看着好认。
const nextNodeId = (type) => {
    let max = 0;
    for (const node of nodes.value) {
        const matched = /^(.+)_(\d+)$/.exec(node.id);
        if (matched && matched[1] === type) {
            max = Math.max(max, Number(matched[2]));
        }
    }
    return `${type}_${max + 1}`;
};

// 新节点的初始参数。datasource 故意不预选数据源：
// 选哪个库得看业务，默认填一个反而容易被忽略着就保存了。
const NODE_DEFAULTS = {
    knowledge: () => ({ title: "检索知识库", topK: 3 }),
    datasource: () => ({ title: "查业务数据", source: null, params: {} }),
    llm: () => ({
        title: "生成回答",
        modelConfigId: null,
        systemPrompt:
            "你是一位专业的咨询助手。回答要口语化、分条。" +
            "参考资料里有的就依据资料回答，没有就直说不确定，不要编造。",
        temperature: 0.7,
        useHistory: true,
        historyLimit: 6,
    }),
};

const addNode = (type) => {
    const id = nextNodeId(type);

    // 新节点放在现有节点最右边再往右一截，避免叠在一起看不见
    const maxX = nodes.value.reduce((acc, n) => Math.max(acc, n.position?.x || 0), 0);

    nodes.value.push({
        id,
        type,
        position: { x: maxX + 120, y: 340 },
        data: NODE_DEFAULTS[type](),
    });

    currentId.value = id;
    drawerVisible.value = true;
    message.info("节点已加到画布下方，拖过去连上线再保存");
};

const removeCurrent = () => {
    const id = currentId.value;
    if (!id) return;

    nodes.value = nodes.value.filter((n) => n.id !== id);
    // 连着它的线一起删掉，否则保存时会报「连线指向不存在的节点」
    edges.value = edges.value.filter((e) => e.source !== id && e.target !== id);

    drawerVisible.value = false;
    currentId.value = null;
    message.success("节点已删除，记得把断开的两头重新连上");
};

const handleTestRetrieve = async () => {
    if (!testQuestion.value.trim()) {
        message.warning("先输个问题");
        return;
    }

    testing.value = true;
    try {
        const res = await testRetrieveKnowledge(
            agentId,
            testQuestion.value.trim(),
            current.value?.data?.topK || 3,
        );
        testResult.value = res.data || [];
        tested.value = true;
    } finally {
        testing.value = false;
    }
};

const handleSave = async () => {
    saving.value = true;
    try {
        // toObject() 拿到的是 Vue Flow 内部维护的最新画布（含拖动后的坐标与视角），
        // 直接读 nodes.value 拿不到拖动产生的位移。
        const graph = toObject();
        await saveAgentGraph(agentId, {
            nodes: graph.nodes.map((n) => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data,
            })),
            edges: graph.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
            viewport: graph.viewport,
        });
        message.success("编排已保存");
        await fetchAgent();
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchAgent();
    fetchModels();
    fetchDataSources();
});
</script>

<style scoped>
/* Vue Flow 的容器必须有明确高度，否则画布高度算成 0，节点渲染不出来 */
.flow-wrap {
    height: 560px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
}

.text-sub {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
}
</style>
