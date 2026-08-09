<template>
    <a-card title="商品管理">
        <template #extra>
            <a-button type="primary" @click="handleAdd">
                <template #icon><plus-outlined /></template> 新增商品
            </a-button>
        </template>

        <div class="toolbar">
            <a-input-search
                v-model:value="queryName"
                placeholder="搜索商品名称"
                style="width: 220px"
                allow-clear
                @search="onSearch"
            />
            <a-select
                v-model:value="queryStatus"
                placeholder="状态筛选"
                style="width: 120px"
                allow-clear
                @change="onSearch"
            >
                <a-select-option :value="0">下架</a-select-option>
                <a-select-option :value="1">上架</a-select-option>
            </a-select>
        </div>

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :components="tableComponents"
            :pagination="{
                current: pageNum,
                pageSize,
                total,
                onChange: (p) => { pageNum = p; fetchList(); },
                showTotal: (t) => `共 ${t} 条`,
            }"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'idx'">
                    {{ (pageNum - 1) * pageSize + index + 1 }}
                </template>
                <template v-else-if="column.key === 'cover'">
                    <a-image
                        :src="record.cover"
                        :width="48"
                        :height="48"
                        style="object-fit: cover; border-radius: 4px"
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    />
                </template>
                <template v-else-if="column.key === 'price'">
                    ¥{{ record.price }}
                </template>
                <template v-else-if="column.key === 'status'">
                    <a-switch
                        :checked="record.status === 1"
                        checked-children="上架"
                        un-checked-children="下架"
                        :loading="record._toggling"
                        @change="(v) => handleToggleStatus(record, v)"
                    />
                </template>
                <template v-else-if="column.key === 'op'">
                    <div class="table-actions">
                        <a-button size="small" class="btn-edit" @click="handleEdit(record)">
                            <template #icon><edit-outlined /></template> 编辑
                        </a-button>
                        <a-button size="small" class="btn-delete" @click="handleDelete(record.id)">
                            <template #icon><delete-outlined /></template> 删除
                        </a-button>
                    </div>
                </template>
            </template>
        </a-table>

        <!-- 新增/编辑弹窗 -->
        <a-modal
            v-model:open="modalVisible"
            :title="editing ? '编辑商品' : '新增商品'"
            :width="680"
            :ok-text="editing ? '保存' : '创建'"
            cancel-text="取消"
            destroy-on-close
            @ok="handleSubmit"
        >
            <a-form :model="form" ref="formRef" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-form-item label="封面图">
                            <avatar-upload v-model:value="form.cover" :size="100" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="16">
                        <a-form-item
                            label="商品名称"
                            name="name"
                            :rules="[{ required: true, message: '请输入商品名称' }]"
                        >
                            <a-input v-model:value="form.name" :maxlength="200" show-count />
                        </a-form-item>
                        <a-form-item label="分类" name="categoryId">
                            <a-select v-model:value="form.categoryId" placeholder="选择分类" allow-clear>
                                <a-select-option
                                    v-for="cat in categories"
                                    :key="cat.id"
                                    :value="cat.id"
                                >
                                    {{ cat.name }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item
                            label="单价（元）"
                            name="price"
                            :rules="[{ required: true, message: '请输入价格' }]"
                        >
                            <a-input-number
                                v-model:value="form.price"
                                :min="0.01"
                                :precision="2"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item
                            label="库存"
                            name="stock"
                            :rules="[{ required: true, message: '请输入库存' }]"
                        >
                            <a-input-number
                                v-model:value="form.stock"
                                :min="0"
                                :precision="0"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-form-item label="商品详情（富文本）">
                    <rich-text-editor
                        v-model="form.description"
                        :height="260"
                        placeholder="详细介绍商品的规格、材质、使用说明等"
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
    pageQueryMyProduct,
    addMyProduct,
    updateMyProduct,
    changeMyProductStatus,
    deleteMyProduct,
} from "@/api/product";
import { listAllCategory } from "@/api/category";
import AvatarUpload from "@/components/AvatarUpload.vue";
import RichTextEditor from "@/components/RichTextEditor.vue";
import ResizableTitle from "@/components/ResizableTitle.vue";

const baseColumns = [
    { title: "序号", key: "idx", width: 60 },
    { title: "封面", key: "cover", width: 72 },
    { title: "商品名称", dataIndex: "name", key: "name", ellipsis: true },
    { title: "分类", dataIndex: "categoryName", key: "categoryName", width: 100 },
    { title: "单价", key: "price", width: 90 },
    { title: "库存", dataIndex: "stock", key: "stock", width: 80 },
    { title: "销量", dataIndex: "sales", key: "sales", width: 80 },
    { title: "状态", key: "status", width: 100 },
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
const queryName = ref("");
const queryStatus = ref(undefined);
const categories = ref([]);

const modalVisible = ref(false);
const editing = ref(null);
const formRef = ref(null);
const form = reactive({
    name: "",
    cover: "",
    categoryId: undefined,
    price: null,
    stock: null,
    description: "",
});

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryMyProduct({
            pageNum: pageNum.value,
            pageSize,
            name: queryName.value || undefined,
            status: queryStatus.value !== undefined ? queryStatus.value : undefined,
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

const resetForm = () => {
    form.name = "";
    form.cover = "";
    form.categoryId = undefined;
    form.price = null;
    form.stock = null;
    form.description = "";
};

const handleAdd = () => {
    editing.value = null;
    resetForm();
    modalVisible.value = true;
};

const handleEdit = (r) => {
    editing.value = r;
    form.name = r.name;
    form.cover = r.cover || "";
    form.categoryId = r.categoryId || undefined;
    form.price = r.price;
    form.stock = r.stock;
    form.description = r.description || "";
    modalVisible.value = true;
};

const handleSubmit = async () => {
    await formRef.value.validate();
    if (editing.value) {
        await updateMyProduct({ ...form, id: editing.value.id });
        message.success("更新成功");
    } else {
        await addMyProduct({ ...form });
        message.success("创建成功，商品默认下架，确认无误后再上架");
    }
    modalVisible.value = false;
    fetchList();
};

const handleToggleStatus = async (record, checked) => {
    const newStatus = checked ? 1 : 0;
    record._toggling = true;
    try {
        await changeMyProductStatus(record.id, newStatus);
        record.status = newStatus;
        message.success(checked ? "已上架" : "已下架");
    } finally {
        record._toggling = false;
    }
};

const handleDelete = (id) => {
    Modal.confirm({
        title: "确认删除",
        content: "删除后不可恢复，确定要删除这个商品吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteMyProduct(id);
            message.success("删除成功");
            fetchList();
        },
    });
};

onMounted(async () => {
    const res = await listAllCategory();
    categories.value = res.data || [];
    fetchList();
});
</script>
