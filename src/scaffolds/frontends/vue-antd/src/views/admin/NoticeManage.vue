<template>
    <a-card title="公告管理">
        <template #extra>
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon><plus-outlined /></template> 添加公告
                </a-button>
                <a-button
                    danger
                    :disabled="!selectedIds.length"
                    @click="handleBatchDelete"
                >
                    <template #icon><delete-outlined /></template> 批量删除
                </a-button>
            </a-space>
        </template>

        <div class="toolbar">
            <a-input-search
                v-model:value="title"
                placeholder="搜索标题"
                style="width: 250px"
                allow-clear
                @search="onSearch"
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
                <template v-else-if="column.key === 'content'">
                    <span class="text-sub">{{
                        htmlToText(record.content)
                    }}</span>
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

        <a-modal
            v-model:open="modalVisible"
            :title="editing ? '编辑公告' : '添加公告'"
            :width="900"
            :ok-text="editing ? '保存' : '添加'"
            cancel-text="取消"
            destroy-on-close
            @ok="handleSubmit"
        >
            <a-form :model="form" layout="vertical" ref="formRef">
                <a-form-item
                    label="标题"
                    name="title"
                    :rules="[{ required: true, message: '请输入标题' }]"
                >
                    <a-input
                        v-model:value="form.title"
                        placeholder="请输入标题"
                        :maxlength="200"
                        show-count
                    />
                </a-form-item>
                <a-form-item label="内容" required>
                    <rich-text-editor
                        v-model="content"
                        :height="360"
                        placeholder="支持格式、图片、表格等富文本内容..."
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-card>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { Modal, message } from "ant-design-vue";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons-vue";
import {
    pageQueryNotice,
    addNotice,
    updateNotice,
    deleteNotice,
    deleteNoticeBatch,
} from "@/api/notice";
import RichTextEditor from "@/components/RichTextEditor.vue";
import ResizableTitle from "@/components/ResizableTitle.vue";
import { computed } from "vue";

const htmlToText = (html = "") =>
    html
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

const baseColumns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "标题", dataIndex: "title", key: "title", width: 220 },
    { title: "内容预览", dataIndex: "content", key: "content", ellipsis: true },
    {
        title: "发布人",
        dataIndex: "createBy",
        key: "createBy",
        width: 120,
    },
    {
        title: "创建时间",
        dataIndex: "createTime",
        key: "createTime",
        width: 180,
    },
    {
        title: "更新时间",
        dataIndex: "updateTime",
        key: "updateTime",
        width: 180,
    },
    { title: "操作", key: "op", width: 180 },
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
const title = ref("");
const selectedIds = ref([]);

const modalVisible = ref(false);
const editing = ref(null);
const formRef = ref(null);
const form = reactive({ title: "" });
const content = ref("");

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

const handleAdd = () => {
    editing.value = null;
    form.title = "";
    content.value = "";
    modalVisible.value = true;
};

const handleEdit = (r) => {
    editing.value = r;
    form.title = r.title;
    content.value = r.content || "";
    modalVisible.value = true;
};

const handleDelete = (id) => {
    Modal.confirm({
        title: "确认删除",
        content: "确定要删除这条公告吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteNotice(id);
            message.success("删除成功");
            fetchList();
        },
    });
};

const handleBatchDelete = () => {
    if (!selectedIds.value.length)
        return message.warning("请先选择要删除的公告");
    Modal.confirm({
        title: "确认批量删除",
        content: `确定要删除选中的 ${selectedIds.value.length} 条公告吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteNoticeBatch(selectedIds.value);
            message.success("批量删除成功");
            selectedIds.value = [];
            fetchList();
        },
    });
};

const handleSubmit = async () => {
    await formRef.value.validate();
    if (!htmlToText(content.value)) {
        message.warning("请输入公告内容");
        return;
    }
    const payload = { title: form.title, content: content.value };
    if (editing.value) {
        await updateNotice({ ...payload, id: editing.value.id });
        message.success("更新成功");
    } else {
        await addNotice(payload);
        message.success("创建成功");
    }
    modalVisible.value = false;
    fetchList();
};

onMounted(fetchList);
</script>
