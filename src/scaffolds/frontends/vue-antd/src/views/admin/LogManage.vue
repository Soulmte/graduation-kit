<template>
    <a-card title="操作日志">
        <template #extra>
            <a-button
                danger
                :disabled="!selectedIds.length"
                @click="handleBatchDelete"
            >
                <template #icon><delete-outlined /></template> 批量删除
            </a-button>
        </template>

        <div class="toolbar">
            <a-input-search
                v-model:value="filters.username"
                placeholder="搜索用户名"
                style="width: 200px"
                allow-clear
                @search="onFilter"
            />
            <a-input-search
                v-model:value="filters.operation"
                placeholder="搜索操作"
                style="width: 200px"
                allow-clear
                @search="onFilter"
            />
            <a-range-picker
                show-time
                @change="
                    (val) => {
                        timeRange = val;
                        onFilter();
                    }
                "
            />
        </div>

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :components="tableComponents"
            :row-selection="{
                selectedRowKeys: selectedIds,
                onChange: (v) => (selectedIds = v),
            }"
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
                <template v-else-if="column.key === 'executeTime'">
                    {{
                        record.executeTime != null
                            ? `${record.executeTime} ms`
                            : "-"
                    }}
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <a-button
                            size="small"
                            class="btn-edit"
                            @click="showDetail(record)"
                            >详情</a-button
                        >
                        <a-button
                            size="small"
                            class="btn-delete"
                            @click="handleDelete(record.id)"
                        >
                            <template #icon><delete-outlined /></template> 删除
                        </a-button>
                    </div>
                </template>
            </template>
        </a-table>

        <!-- 日志详情弹窗 -->
        <a-modal
            v-model:open="detailVisible"
            title="日志详情"
            :footer="null"
            width="600px"
        >
            <a-descriptions bordered :column="1">
                <a-descriptions-item label="ID">{{
                    currentLog.id
                }}</a-descriptions-item>
                <a-descriptions-item label="用户名">{{
                    currentLog.username
                }}</a-descriptions-item>
                <a-descriptions-item label="操作">{{
                    currentLog.operation
                }}</a-descriptions-item>
                <a-descriptions-item label="方法">{{
                    currentLog.method
                }}</a-descriptions-item>
                <a-descriptions-item label="参数">
                    <pre class="log-params">{{
                        formatParams(currentLog.params)
                    }}</pre>
                </a-descriptions-item>
                <a-descriptions-item label="耗时">{{
                    currentLog.executeTime != null
                        ? `${currentLog.executeTime} ms`
                        : "-"
                }}</a-descriptions-item>
                <a-descriptions-item label="IP">{{
                    currentLog.ip
                }}</a-descriptions-item>
                <a-descriptions-item label="操作时间">{{
                    currentLog.createTime
                }}</a-descriptions-item>
            </a-descriptions>
        </a-modal>
    </a-card>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { Modal, message } from "ant-design-vue";
import { DeleteOutlined } from "@ant-design/icons-vue";
import { pageQueryLog, deleteLog, deleteLogBatch } from "@/api/log";
import ResizableTitle from "@/components/ResizableTitle.vue";
import { computed } from "vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "用户名", dataIndex: "username", key: "username", width: 120 },
    { title: "操作", dataIndex: "operation", key: "operation", width: 160 },
    { title: "方法", dataIndex: "method", key: "method", ellipsis: true },
    { title: "耗时", dataIndex: "executeTime", key: "executeTime", width: 100 },
    { title: "IP", dataIndex: "ip", key: "ip", width: 140 },
    {
        title: "操作时间",
        dataIndex: "createTime",
        key: "createTime",
        width: 180,
    },
    { title: "操作", key: "op", width: 160 },
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
const selectedIds = ref([]);
const filters = reactive({ username: "", operation: "" });
const timeRange = ref(null);
const detailVisible = ref(false);
const currentLog = ref({});

const showDetail = (row) => {
    currentLog.value = row;
    detailVisible.value = true;
};

const formatParams = (str) => {
    if (!str) return "-";
    try {
        return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
        return str;
    }
};

const fetchList = async () => {
    loading.value = true;
    try {
        const q = {
            pageNum: pageNum.value,
            pageSize,
            username: filters.username,
            operation: filters.operation,
        };
        if (timeRange.value?.length === 2) {
            q.startTime = timeRange.value[0].format("YYYY-MM-DD HH:mm:ss");
            q.endTime = timeRange.value[1].format("YYYY-MM-DD HH:mm:ss");
        }
        const res = await pageQueryLog(q);
        list.value = res.data.records;
        total.value = res.data.total;
    } finally {
        loading.value = false;
    }
};

const onFilter = () => {
    pageNum.value = 1;
    fetchList();
};

const handleDelete = (id) => {
    Modal.confirm({
        title: "确认删除",
        content: "确定要删除这条日志吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteLog(id);
            message.success("删除成功");
            fetchList();
        },
    });
};

const handleBatchDelete = () => {
    if (!selectedIds.value.length)
        return message.warning("请先选择要删除的日志");
    Modal.confirm({
        title: "确认批量删除",
        content: `确定要删除选中的 ${selectedIds.value.length} 条日志吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteLogBatch(selectedIds.value);
            message.success("批量删除成功");
            selectedIds.value = [];
            fetchList();
        },
    });
};

onMounted(fetchList);
</script>

<style scoped>
.log-params {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 13px;
    max-height: 300px;
    overflow: auto;
}
</style>
