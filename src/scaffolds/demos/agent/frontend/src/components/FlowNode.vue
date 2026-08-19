<template>
    <div class="flow-node" :class="`flow-node--${type}`">
        <!-- 除开始节点外都要有入口锚点，除结束节点外都要有出口锚点。
             锚点就是拖出来连线的那个小圆点，缺了对应的锚点这个方向就连不上线。 -->
        <handle
            v-if="type !== 'start'"
            type="target"
            :position="Position.Left"
        />

        <div class="flow-node__head">
            <component :is="icon" class="flow-node__icon" />
            <span class="flow-node__type">{{ typeLabel }}</span>
        </div>

        <div class="flow-node__title">{{ data.title || "未命名" }}</div>

        <div class="flow-node__desc">{{ desc }}</div>

        <handle
            v-if="type !== 'end'"
            type="source"
            :position="Position.Right"
        />
    </div>
</template>

<script setup>
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import {
    PlayCircleOutlined,
    DatabaseOutlined,
    RobotOutlined,
    CheckCircleOutlined,
    TableOutlined,
} from "@ant-design/icons-vue";

const props = defineProps({
    /** 节点参数，来自 graph_json 的 data 字段 */
    data: {
        type: Object,
        default: () => ({}),
    },
    /** 节点类型：start / knowledge / datasource / llm / end */
    type: {
        type: String,
        required: true,
    },
    /**
     * 数据源清单，只有 datasource 节点用得上。
     * 拿它把 key 换成中文名，不传就退而显示 key 本身。
     */
    sources: {
        type: Array,
        default: () => [],
    },
});

const META = {
    start: { label: "开始", icon: PlayCircleOutlined },
    knowledge: { label: "知识检索", icon: DatabaseOutlined },
    datasource: { label: "查数据", icon: TableOutlined },
    llm: { label: "大模型", icon: RobotOutlined },
    end: { label: "结束", icon: CheckCircleOutlined },
};

const typeLabel = computed(() => META[props.type]?.label || props.type);
const icon = computed(() => META[props.type]?.icon || PlayCircleOutlined);

// 节点卡片上直接把关键参数摆出来，不用点开抽屉才知道配了什么
const desc = computed(() => {
    if (props.type === "knowledge") {
        return `召回 ${props.data.topK || 3} 条资料`;
    }
    if (props.type === "datasource") {
        if (!props.data.source) {
            return "还没选数据源";
        }
        const hit = props.sources.find((s) => s.key === props.data.source);
        return `查 ${hit?.label || props.data.source}`;
    }
    if (props.type === "llm") {
        const history = props.data.useHistory
            ? `带 ${props.data.historyLimit || 6} 条历史`
            : "不带历史";
        return `温度 ${props.data.temperature ?? 0.7} · ${history}`;
    }
    if (props.type === "start") {
        return "接收用户提问";
    }
    return "输出最终回答";
});
</script>

<style scoped>
.flow-node {
    width: 200px;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-left-width: 4px;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: box-shadow 0.2s;
}

.flow-node:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 左边框用颜色区分类型，扫一眼就知道这条链的形状 */
.flow-node--start {
    border-left-color: #52c41a;
}

.flow-node--knowledge {
    border-left-color: #faad14;
}

.flow-node--datasource {
    border-left-color: #722ed1;
}

.flow-node--llm {
    border-left-color: #1677ff;
}

.flow-node--end {
    border-left-color: #8c8c8c;
}

.flow-node__head {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
}

.flow-node__icon {
    font-size: 14px;
}

.flow-node__title {
    margin-top: 4px;
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.88);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.flow-node__desc {
    margin-top: 2px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
}
</style>
