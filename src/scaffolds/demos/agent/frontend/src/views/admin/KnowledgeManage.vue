<template>
    <a-card title="知识库">
        <template #extra>
            <a-space>
                <a-button
                    v-if="selectedIds.length"
                    danger
                    @click="handleDeleteBatch"
                >
                    <template #icon><delete-outlined /></template>
                    删除选中（{{ selectedIds.length }}）
                </a-button>
                <a-button type="primary" @click="handleAdd">
                    <template #icon><plus-outlined /></template> 添加条目
                </a-button>
            </a-space>
        </template>

        <a-alert
            type="info"
            show-icon
            style="margin-bottom: 16px"
            message="知识条目是智能体回答的依据"
            description="检索节点会按关键词召回条目、拼进提示词。归属留空的条目是全局共享，所有智能体都能检索到；关键词写得越贴近用户提问方式，召回越准。"
        />

        <div class="toolbar">
            <a-space wrap>
                <a-input-search
                    v-model:value="query.keyword"
                    placeholder="搜索标题或正文"
                    style="width: 240px"
                    allow-clear
                    @search="onSearch"
                />
                <a-select
                    v-model:value="query.agentId"
                    :options="agentOptions"
                    placeholder="全部归属"
                    style="width: 200px"
                    allow-clear
                    @change="onSearch"
                />
                <a-select
                    v-model:value="query.status"
                    :options="statusOptions"
                    placeholder="全部状态"
                    style="width: 130px"
                    allow-clear
                    @change="onSearch"
                />
                <a-checkbox
                    v-model:checked="globalOnly"
                    @change="onGlobalOnlyChange"
                >
                    只看全局条目
                </a-checkbox>
            </a-space>
        </div>

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :row-selection="{
                selectedRowKeys: selectedIds,
                onChange: (keys) => (selectedIds = keys),
            }"
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
                    <a-tag v-if="!record.agentId" color="purple">全局</a-tag>
                    <span v-else>{{ record.agentName || "已删除" }}</span>
                </template>
                <template v-else-if="column.key === 'keywords'">
                    <a-space v-if="record.keywords" wrap :size="4">
                        <a-tag v-for="k in splitKeywords(record.keywords)" :key="k">
                            {{ k }}
                        </a-tag>
                    </a-space>
                    <span v-else class="text-sub">未填</span>
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-tag :color="record.status === 1 ? 'green' : 'default'">
                        {{ record.status === 1 ? "启用" : "停用" }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <a-button
                            size="small"
                            class="btn-edit"
                            @click="handleEdit(record)"
                        >
                            <template #icon><edit-outlined /></template> 编辑
                        </a-button>
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

        <a-drawer
            v-model:open="modalVisible"
            :title="editing ? '编辑条目' : '添加条目'"
            :width="720"
            placement="right"
            destroy-on-close
        >
            <a-form
                ref="formRef"
                :model="form"
                :rules="rules"
                layout="vertical"
            >
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item
                            label="归属智能体"
                            name="agentId"
                            extra="留空为全局共享，所有智能体都能检索到"
                        >
                            <a-select
                                v-model:value="form.agentId"
                                :options="agentOptions"
                                placeholder="留空表示全局共享"
                                allow-clear
                            />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="状态" name="status">
                            <a-radio-group v-model:value="form.status">
                                <a-radio :value="1">启用</a-radio>
                                <a-radio :value="0">停用</a-radio>
                            </a-radio-group>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="标题" name="title">
                    <a-input
                        v-model:value="form.title"
                        placeholder="如：押一付三的含义"
                        :maxlength="200"
                    />
                </a-form-item>

                <a-form-item
                    label="关键词"
                    name="keywords"
                    extra="逗号分隔。写用户会怎么问，比写书面术语更容易召回，如“押一付三,押付,怎么付款”"
                >
                    <a-input
                        v-model:value="form.keywords"
                        placeholder="押一付三,押付比例,首期款"
                        :maxlength="255"
                    />
                </a-form-item>

                <a-form-item
                    label="正文"
                    name="content"
                    extra="命中后会原文拼进提示词，写完整但别太长，一条讲清一件事"
                >
                    <a-textarea
                        v-model:value="form.content"
                        :rows="10"
                        :maxlength="5000"
                        show-count
                        placeholder="押一付三指押金为一个月租金、房租三个月一付……"
                    />
                </a-form-item>
            </a-form>

            <!-- 抽屉没有内置的确定取消，得自己放到 footer 插槽里 -->
            <template #footer>
                <div class="drawer-footer">
                    <a-button @click="modalVisible = false">取消</a-button>
                    <a-button type="primary" :loading="submitting" @click="handleSubmit">
                        {{ editing ? "保存" : "添加" }}
                    </a-button>
                </div>
            </template>
        </a-drawer>
    </a-card>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { Modal, message } from "ant-design-vue";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons-vue";
import {
    pageQueryKnowledge,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
    deleteKnowledgeBatch,
} from "@/api/knowledge";
import { pageQueryAgent } from "@/api/agent";

const columns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "标题", dataIndex: "title", key: "title", width: 220 },
    { title: "归属", dataIndex: "agentName", key: "agentName", width: 150 },
    { title: "关键词", dataIndex: "keywords", key: "keywords" },
    { title: "命中次数", dataIndex: "hitCount", key: "hitCount", width: 100 },
    { title: "状态", dataIndex: "status", key: "status", width: 90 },
    { title: "操作", key: "op", width: 140 },
];

const statusOptions = [
    { value: 1, label: "启用" },
    { value: 0, label: "停用" },
];

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const selectedIds = ref([]);
const globalOnly = ref(false);
const agentOptions = ref([]);

const query = reactive({
    pageNum: 1,
    pageSize: 10,
    keyword: "",
    agentId: undefined,
    status: undefined,
    globalOnly: undefined,
});

const modalVisible = ref(false);
const submitting = ref(false);
const editing = ref(null);
const formRef = ref(null);

const emptyForm = () => ({
    agentId: undefined,
    title: "",
    content: "",
    keywords: "",
    status: 1,
});

const form = reactive(emptyForm());

const rules = {
    title: [{ required: true, message: "请填标题" }],
    content: [{ required: true, message: "请填正文" }],
    status: [{ required: true, message: "请选择状态" }],
};

// 关键词存的是逗号分隔的字串，中英文逗号都得能拆，
// 不然用户用了中文逗号就会整串挤在一个标签里。
const splitKeywords = (raw) =>
    raw
        .split(/[,，]/)
        .map((k) => k.trim())
        .filter(Boolean);

const fetchAgentOptions = async () => {
    // 归属下拉要含草稿智能体（发布前先备知识是常见做法），所以走管理端接口
    const res = await pageQueryAgent({ pageNum: 1, pageSize: 200 });
    agentOptions.value = res.data.records.map((a) => ({
        value: a.id,
        label: a.status === 1 ? a.name : `${a.name}（草稿）`,
    }));
};

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryKnowledge({ ...query });
        list.value = res.data.records;
        total.value = res.data.total;
        selectedIds.value = [];
    } finally {
        loading.value = false;
    }
};

const onSearch = () => {
    query.pageNum = 1;
    fetchList();
};

const onGlobalOnlyChange = () => {
    // 只看全局与按归属筛是互斥的，同时上传会查不出东西
    query.globalOnly = globalOnly.value ? true : undefined;
    if (globalOnly.value) query.agentId = undefined;
    onSearch();
};

const handleAdd = () => {
    editing.value = null;
    Object.assign(form, emptyForm());
    modalVisible.value = true;
};

const handleEdit = (record) => {
    editing.value = record;
    Object.assign(form, {
        agentId: record.agentId ?? undefined,
        title: record.title,
        content: record.content,
        keywords: record.keywords || "",
        status: record.status,
    });
    modalVisible.value = true;
};

const handleDelete = (id) => {
    Modal.confirm({
        title: "确认删除",
        content: "删除后检索不再召回这条资料。确定删除吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteKnowledge(id);
            message.success("删除成功");
            fetchList();
        },
    });
};

const handleDeleteBatch = () => {
    const ids = [...selectedIds.value];
    Modal.confirm({
        title: "批量删除",
        content: `确定删除选中的 ${ids.length} 条资料吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteKnowledgeBatch(ids);
            message.success("删除成功");
            fetchList();
        },
    });
};

const handleSubmit = async () => {
    await formRef.value.validate();
    // agentId 为 undefined 时后端当全局条目存，直接传就行，不要自己改成 0
    const payload = { ...form };

    // 抽屉不会自己关，也没内置 loading，这两件事得自己管：
    // 正文可能已经写了好几百字，提交失败时绝不能关掉。
    submitting.value = true;
    try {
        if (editing.value) {
            payload.id = editing.value.id;
            await updateKnowledge(payload);
            message.success("更新成功");
        } else {
            await addKnowledge(payload);
            message.success("添加成功");
        }
        modalVisible.value = false;
        fetchList();
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    fetchList();
    fetchAgentOptions();
});
</script>
