<template>
    <a-card title="用户管理">
        <template #extra>
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon><plus-outlined /></template> 添加用户
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
                v-model:value="filters.username"
                placeholder="搜索用户名"
                style="width: 220px"
                allow-clear
                @search="onFilter"
            />
            <a-select
                v-model:value="filters.role"
                placeholder="选择角色"
                style="width: 150px"
                allow-clear
                @change="onFilter"
            >
                <a-select-option value="admin">管理员</a-select-option>
                <a-select-option value="user">普通用户</a-select-option>
            </a-select>
        </div>

        <a-table
            :loading="loading"
            :columns="columns"
            :data-source="list"
            row-key="id"
            :scroll="{ x: 'max-content' }"
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
                <template v-else-if="column.key === 'role'">
                    <a-tag :color="record.role === 'admin' ? 'red' : 'blue'">
                        {{ record.role === "admin" ? "管理员" : "普通用户" }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'gender'">
                    {{ genderLabel(record.gender) }}
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
                <template v-else>
                    {{ record[column.dataIndex] || "-" }}
                </template>
            </template>
        </a-table>

        <!-- 添加 / 编辑弹窗 -->
        <a-modal
            v-model:open="modalVisible"
            :title="editing ? '编辑用户' : '添加用户'"
            :width="640"
            :ok-text="editing ? '保存' : '添加'"
            cancel-text="取消"
            @ok="handleSubmit"
        >
            <div style="text-align: center; margin-bottom: 16px">
                <avatar-upload
                    :value="avatar"
                    @update:value="avatar = $event"
                    :size="88"
                />
            </div>

            <a-alert
                type="info"
                :closable="false"
                show-icon
                style="margin-bottom: 16px"
                message="新增用户走注册接口，角色固定为普通用户；密码由用户自行在个人中心修改，此处不提供改密与改角色"
            />

            <a-form :model="form" layout="vertical" ref="formRef">
                <div
                    style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0 16px;
                    "
                >
                    <a-form-item
                        label="用户名"
                        name="username"
                        :rules="[{ required: true, message: '请输入用户名' }]"
                    >
                        <a-input
                            v-model:value="form.username"
                            placeholder="请输入用户名"
                            :disabled="!!editing"
                        />
                    </a-form-item>
                    <a-form-item
                        v-if="!editing"
                        label="密码"
                        name="password"
                        :rules="[{ required: true, message: '请输入密码' }]"
                    >
                        <a-input-password
                            v-model:value="form.password"
                            placeholder="请输入密码"
                        />
                    </a-form-item>
                    <a-form-item label="昵称" name="nickname">
                        <a-input
                            v-model:value="form.nickname"
                            placeholder="请输入昵称"
                            :maxlength="50"
                        />
                    </a-form-item>
                    <a-form-item label="年龄" name="age">
                        <a-input-number
                            v-model:value="form.age"
                            :min="1"
                            :max="150"
                            placeholder="年龄"
                            style="width: 100%"
                        />
                    </a-form-item>
                    <a-form-item label="性别" name="gender">
                        <a-select
                            v-model:value="form.gender"
                            placeholder="请选择性别"
                            allow-clear
                            :options="GENDER_OPTIONS"
                        />
                    </a-form-item>
                    <a-form-item
                        label="手机号"
                        name="phone"
                        :rules="[
                            {
                                pattern: /^1\d{10}$/,
                                message: '手机号格式不正确',
                            },
                        ]"
                    >
                        <a-input
                            v-model:value="form.phone"
                            placeholder="请输入手机号"
                            :maxlength="11"
                        />
                    </a-form-item>
                    <a-form-item
                        label="邮箱"
                        name="email"
                        :rules="[{ type: 'email', message: '邮箱格式不正确' }]"
                    >
                        <a-input
                            v-model:value="form.email"
                            placeholder="请输入邮箱"
                        />
                    </a-form-item>
                </div>
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
    pageQueryUser,
    register,
    updateUser,
    deleteUser,
    deleteUserBatch,
} from "@/api/user";
import AvatarUpload from "@/components/AvatarUpload.vue";
import ResizableTitle from "@/components/ResizableTitle.vue";
import { computed } from "vue";

const GENDER_OPTIONS = [
    { value: "male", label: "男" },
    { value: "female", label: "女" },
    { value: "other", label: "其他" },
];
const genderLabel = (g) =>
    GENDER_OPTIONS.find((o) => o.value === g)?.label || "-";

const baseColumns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "用户名", dataIndex: "username", key: "username", width: 120 },
    { title: "昵称", dataIndex: "nickname", key: "nickname", width: 120 },
    { title: "性别", dataIndex: "gender", key: "gender", width: 70 },
    { title: "年龄", dataIndex: "age", key: "age", width: 70 },
    { title: "手机号", dataIndex: "phone", key: "phone", width: 130 },
    { title: "邮箱", dataIndex: "email", key: "email", ellipsis: true },
    { title: "角色", dataIndex: "role", key: "role", width: 110 },
    {
        title: "创建时间",
        dataIndex: "createTime",
        key: "createTime",
        width: 170,
    },
    { title: "操作", key: "op", width: 180, fixed: "right" },
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
const filters = reactive({ username: "", role: undefined });

const modalVisible = ref(false);
const editing = ref(null);
const avatar = ref("");
const formRef = ref(null);
const form = reactive({
    username: "",
    password: "",
    nickname: "",
    age: null,
    gender: undefined,
    phone: "",
    email: "",
});

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryUser({
            pageNum: pageNum.value,
            pageSize,
            username: filters.username,
            role: filters.role || "",
        });
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

const resetForm = (u = {}) => {
    form.username = u.username || "";
    form.password = "";
    form.nickname = u.nickname || "";
    form.age = u.age ?? null;
    form.gender = u.gender || undefined;
    form.phone = u.phone || "";
    form.email = u.email || "";
    avatar.value = u.avatar || "";
};

const handleAdd = () => {
    editing.value = null;
    resetForm();
    modalVisible.value = true;
};

const handleEdit = (record) => {
    editing.value = record;
    resetForm(record);
    modalVisible.value = true;
};

const handleDelete = (id) => {
    Modal.confirm({
        title: "确认删除",
        content: "确定要删除这个用户吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteUser(id);
            message.success("删除成功");
            fetchList();
        },
    });
};

const handleBatchDelete = () => {
    if (!selectedIds.value.length)
        return message.warning("请先选择要删除的用户");
    Modal.confirm({
        title: "确认批量删除",
        content: `确定要删除选中的 ${selectedIds.value.length} 个用户吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteUserBatch(selectedIds.value);
            message.success("批量删除成功");
            selectedIds.value = [];
            fetchList();
        },
    });
};

const handleSubmit = async () => {
    await formRef.value.validate();
    if (editing.value) {
        // 后端 update 接口只接收基本资料，username/role/password 不在此修改
        await updateUser({
            id: editing.value.id,
            nickname: form.nickname,
            age: form.age,
            gender: form.gender,
            phone: form.phone,
            email: form.email,
            avatar: avatar.value,
        });
        message.success("更新成功");
    } else {
        // 注册接口角色由后端写死为 user
        await register({ ...form, avatar: avatar.value });
        message.success("添加成功");
    }
    modalVisible.value = false;
    fetchList();
};

onMounted(fetchList);
</script>
