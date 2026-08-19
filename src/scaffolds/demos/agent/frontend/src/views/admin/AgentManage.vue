<template>
    <a-card title="智能体管理">
        <template #extra>
            <a-button type="primary" @click="handleAdd">
                <template #icon><plus-outlined /></template> 添加智能体
            </a-button>
        </template>

        <div class="toolbar">
            <a-space>
                <a-input-search
                    v-model:value="name"
                    placeholder="搜索名称"
                    style="width: 220px"
                    allow-clear
                    @search="onSearch"
                />
                <a-select
                    v-model:value="status"
                    placeholder="状态"
                    style="width: 140px"
                    allow-clear
                    :options="statusOptions"
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
                <template v-else-if="column.key === 'status'">
                    <a-tag :color="record.status === 1 ? 'green' : 'default'">
                        {{ record.status === 1 ? "已发布" : "草稿" }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'knowledgeCount'">
                    {{ record.knowledgeCount || 0 }} 条
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <a-button
                            size="small"
                            type="primary"
                            @click="goFlow(record.id)"
                        >
                            <template #icon><share-alt-outlined /></template>
                            编排
                        </a-button>
                        <a-button
                            size="small"
                            class="btn-edit"
                            @click="handleEdit(record)"
                        >
                            <template #icon><edit-outlined /></template> 编辑
                        </a-button>
                        <a-button
                            v-if="record.status !== 1"
                            size="small"
                            @click="handlePublish(record)"
                        >
                            发布
                        </a-button>
                        <a-button
                            v-else
                            size="small"
                            @click="handleUnpublish(record)"
                        >
                            撤回
                        </a-button>
                        <a-button
                            size="small"
                            class="btn-delete"
                            @click="handleDelete(record)"
                        >
                            <template #icon><delete-outlined /></template> 删除
                        </a-button>
                    </div>
                </template>
            </template>
        </a-table>

        <a-modal
            v-model:open="modalVisible"
            :title="editing ? '编辑智能体' : '添加智能体'"
            :width="620"
            :ok-text="editing ? '保存' : '添加'"
            cancel-text="取消"
            destroy-on-close
            @ok="handleSubmit"
        >
            <a-alert
                v-if="!editing"
                type="info"
                show-icon
                style="margin-bottom: 16px"
                message="新建后会自带一条可用的编排"
                description="开始 → 检索知识库 → 大模型 → 结束。创建完去「编排」里调提示词就能用。"
            />

            <a-form :model="form" layout="vertical" ref="formRef">
                <a-form-item
                    label="名称"
                    name="name"
                    :rules="[{ required: true, message: '请输入名称' }]"
                >
                    <a-input
                        v-model:value="form.name"
                        placeholder="如租房咨询顾问"
                        :maxlength="100"
                    />
                </a-form-item>

                <a-form-item
                    label="默认模型"
                    name="modelConfigId"
                    :rules="[{ required: true, message: '请选择默认模型' }]"
                    extra="编排里的大模型节点没单独指定时用它"
                >
                    <a-select
                        v-model:value="form.modelConfigId"
                        placeholder="选一个已启用的模型配置"
                        :options="modelOptions"
                    />
                </a-form-item>

                <a-form-item label="简介" name="description">
                    <a-textarea
                        v-model:value="form.description"
                        :rows="2"
                        :maxlength="500"
                        show-count
                        placeholder="前台卡片上展示，告诉用户它能干什么"
                    />
                </a-form-item>

                <a-form-item label="开场白" name="greeting">
                    <a-textarea
                        v-model:value="form.greeting"
                        :rows="3"
                        :maxlength="500"
                        show-count
                        placeholder="新建会话时的第一句话，带上例子能引导用户提问"
                    />
                </a-form-item>

                <a-form-item
                    label="排序值"
                    name="sort"
                    extra="越小越靠前"
                >
                    <a-input-number
                        v-model:value="form.sort"
                        :min="0"
                        :max="9999"
                        style="width: 160px"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-card>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Modal, message } from "ant-design-vue";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ShareAltOutlined,
} from "@ant-design/icons-vue";
import {
    pageQueryAgent,
    addAgent,
    updateAgent,
    deleteAgent,
    publishAgent,
    unpublishAgent,
} from "@/api/agent";
import { listEnabledModelConfig } from "@/api/modelConfig";

const router = useRouter();

const statusOptions = [
    { value: 0, label: "草稿" },
    { value: 1, label: "已发布" },
];

const columns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "名称", dataIndex: "name", key: "name", width: 160 },
    {
        title: "简介",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
    },
    {
        title: "默认模型",
        dataIndex: "modelConfigName",
        key: "modelConfigName",
        width: 150,
    },
    {
        title: "知识条目",
        dataIndex: "knowledgeCount",
        key: "knowledgeCount",
        width: 100,
    },
    { title: "会话数", dataIndex: "chatCount", key: "chatCount", width: 90 },
    { title: "状态", dataIndex: "status", key: "status", width: 100 },
    { title: "操作", key: "op", width: 330 },
];

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 10;
const name = ref("");
const status = ref(undefined);

const modelOptions = ref([]);
const modalVisible = ref(false);
const editing = ref(null);
const formRef = ref(null);

const emptyForm = () => ({
    name: "",
    modelConfigId: undefined,
    description: "",
    greeting: "",
    avatar: "",
    sort: 0,
});

const form = reactive(emptyForm());

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryAgent({
            pageNum: pageNum.value,
            pageSize,
            name: name.value,
            status: status.value,
        });
        list.value = res.data.records;
        total.value = res.data.total;
    } finally {
        loading.value = false;
    }
};

const fetchModels = async () => {
    const res = await listEnabledModelConfig();
    modelOptions.value = res.data.map((m) => ({
        value: m.id,
        label: m.isDefault === 1 ? `${m.name}（默认）` : m.name,
    }));
};

const onSearch = () => {
    pageNum.value = 1;
    fetchList();
};

const goFlow = (id) => {
    router.push(`/admin/agent/${id}/flow`);
};

const handleAdd = async () => {
    editing.value = null;
    Object.assign(form, emptyForm());
    await fetchModels();

    if (!modelOptions.value.length) {
        message.warning("还没有启用中的模型配置，先去「模型配置」添一个");
        return;
    }
    // 默认选上第一个（列表已按默认项置顶），少一步点击
    form.modelConfigId = modelOptions.value[0].value;
    modalVisible.value = true;
};

const handleEdit = async (record) => {
    editing.value = record;
    await fetchModels();
    Object.assign(form, {
        name: record.name,
        modelConfigId: record.modelConfigId,
        description: record.description || "",
        greeting: record.greeting || "",
        avatar: record.avatar || "",
        sort: record.sort ?? 0,
    });
    modalVisible.value = true;
};

const handlePublish = (record) => {
    Modal.confirm({
        title: "发布智能体",
        content: `发布后【${record.name}】会出现在前台列表里。发布前会先校一遍编排。`,
        onOk: async () => {
            await publishAgent(record.id);
            message.success("发布成功");
            fetchList();
        },
    });
};

const handleUnpublish = (record) => {
    Modal.confirm({
        title: "撒回为草稿",
        content: `撒回后【${record.name}】在前台立即不可见，已有的会话不会删。`,
        onOk: async () => {
            await unpublishAgent(record.id);
            message.success("已撒回为草稿");
            fetchList();
        },
    });
};

const handleDelete = (record) => {
    Modal.confirm({
        title: "确认删除",
        content: `删除【${record.name}】会一并清掉它名下的知识条目与全部会话，不可恢复。`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteAgent(record.id);
            message.success("删除成功");
            fetchList();
        },
    });
};

const handleSubmit = async () => {
    await formRef.value.validate();
    if (editing.value) {
        await updateAgent({ ...form, id: editing.value.id });
        message.success("更新成功");
    } else {
        await addAgent({ ...form });
        message.success("添加成功");
    }
    modalVisible.value = false;
    fetchList();
};

onMounted(fetchList);
</script>
