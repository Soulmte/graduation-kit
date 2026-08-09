<template>
    <a-card title="分类管理">
        <template #extra>
            <a-button type="primary" @click="handleAdd">
                <template #icon><plus-outlined /></template> 添加分类
            </a-button>
        </template>

        <a-alert
            type="info"
            show-icon
            message="分类下还挂着商品时无法删除，需要先把商品改到其他分类。"
            style="margin-bottom: 16px"
        />

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :components="tableComponents"
            :pagination="false"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'idx'">
                    {{ index + 1 }}
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
            :title="editing ? '编辑分类' : '添加分类'"
            :ok-text="editing ? '保存' : '添加'"
            cancel-text="取消"
            destroy-on-close
            @ok="handleSubmit"
        >
            <a-form :model="form" ref="formRef" layout="vertical">
                <a-form-item
                    label="分类名称"
                    name="name"
                    :rules="[
                        { required: true, message: '请输入分类名称' },
                        { max: 50, message: '分类名称过长' },
                    ]"
                >
                    <a-input
                        v-model:value="form.name"
                        placeholder="例如：茶叶"
                        :maxlength="50"
                        show-count
                    />
                </a-form-item>
                <a-form-item label="排序值" name="sort">
                    <a-input-number
                        v-model:value="form.sort"
                        :min="0"
                        :precision="0"
                        style="width: 100%"
                        placeholder="数值越小越靠前"
                    />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-card>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { Modal, message } from "ant-design-vue";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons-vue";
import {
    listAllCategory,
    addCategory,
    updateCategory,
    deleteCategory,
} from "@/api/category";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "分类名称", dataIndex: "name", key: "name" },
    { title: "排序值", dataIndex: "sort", key: "sort", width: 100 },
    { title: "创建时间", dataIndex: "createTime", key: "createTime", width: 180 },
    { title: "更新时间", dataIndex: "updateTime", key: "updateTime", width: 180 },
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

const modalVisible = ref(false);
const editing = ref(null);
const formRef = ref(null);
const form = reactive({ name: "", sort: 0 });

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await listAllCategory();
        list.value = res.data || [];
    } finally {
        loading.value = false;
    }
};

const handleAdd = () => {
    editing.value = null;
    form.name = "";
    form.sort = 0;
    modalVisible.value = true;
};

const handleEdit = (r) => {
    editing.value = r;
    form.name = r.name;
    form.sort = r.sort ?? 0;
    modalVisible.value = true;
};

const handleSubmit = async () => {
    await formRef.value.validate();
    if (editing.value) {
        await updateCategory({ ...form, id: editing.value.id });
        message.success("更新成功");
    } else {
        await addCategory({ ...form });
        message.success("创建成功");
    }
    modalVisible.value = false;
    fetchList();
};

const handleDelete = (record) => {
    Modal.confirm({
        title: "确认删除",
        content: `确定要删除分类「${record.name}」吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteCategory(record.id);
            message.success("删除成功");
            fetchList();
        },
    });
};

onMounted(fetchList);
</script>
