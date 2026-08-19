<template>
    <a-card title="模型配置">
        <template #extra>
            <a-button type="primary" @click="handleAdd">
                <template #icon><plus-outlined /></template> 添加配置
            </a-button>
        </template>

        <a-alert
            v-if="hasMissingKey"
            type="warning"
            show-icon
            style="margin-bottom: 16px"
            message="有配置还没填 API Key"
            description="没填 Key 的模型无法对话。点「编辑」把自己的 Key 填进去即可，本地 Ollama 可以留空。"
        />

        <div class="toolbar">
            <a-input-search
                v-model:value="name"
                placeholder="搜索配置名称"
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
                <template v-else-if="column.key === 'name'">
                    {{ record.name }}
                    <a-tag v-if="record.isDefault === 1" color="blue">默认</a-tag>
                </template>
                <template v-else-if="column.key === 'apiKey'">
                    <span v-if="record.keyConfigured" class="text-sub">
                        {{ record.apiKey }}
                    </span>
                    <a-tag v-else color="orange">未配置</a-tag>
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
                            v-if="record.isDefault !== 1"
                            size="small"
                            @click="handleSetDefault(record)"
                        >
                            设为默认
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
            :title="editing ? '编辑模型配置' : '添加模型配置'"
            :width="640"
            placement="right"
            destroy-on-close
        >
            <a-form :model="form" layout="vertical" ref="formRef">
                <a-form-item
                    label="配置名称"
                    name="name"
                    :rules="[{ required: true, message: '请输入配置名称' }]"
                >
                    <a-input
                        v-model:value="form.name"
                        placeholder="如 DeepSeek 快速版"
                        :maxlength="100"
                    />
                </a-form-item>

                <a-form-item label="厂商" name="provider">
                    <a-select
                        v-model:value="form.provider"
                        :options="providerOptions"
                        @change="onProviderChange"
                    />
                </a-form-item>

                <a-form-item
                    label="接口地址"
                    name="baseUrl"
                    :rules="[{ required: true, message: '请输入接口地址' }]"
                    extra="只填到域名，/v1/chat/completions 由后端拼接"
                >
                    <a-input
                        v-model:value="form.baseUrl"
                        placeholder="https://api.deepseek.com"
                    />
                </a-form-item>

                <a-form-item
                    label="模型名"
                    name="model"
                    :rules="[{ required: true, message: '请输入模型名' }]"
                >
                    <a-input
                        v-model:value="form.model"
                        placeholder="deepseek-v4-flash"
                    />
                </a-form-item>

                <a-form-item label="API Key" name="apiKey" :extra="keyHint">
                    <a-input-password
                        v-model:value="form.apiKey"
                        placeholder="sk-..."
                        autocomplete="new-password"
                    />
                </a-form-item>

                <a-row :gutter="16">
                    <a-col :span="8">
                        <a-form-item label="采样温度" name="temperature">
                            <a-input-number
                                v-model:value="form.temperature"
                                :min="0"
                                :max="2"
                                :step="0.1"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="最大 token" name="maxTokens">
                            <a-input-number
                                v-model:value="form.maxTokens"
                                :min="1"
                                :max="32768"
                                :step="512"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="超时（秒）" name="timeout">
                            <a-input-number
                                v-model:value="form.timeout"
                                :min="5"
                                :max="300"
                                :step="10"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="状态" name="status">
                            <a-radio-group v-model:value="form.status">
                                <a-radio :value="1">启用</a-radio>
                                <a-radio :value="0">停用</a-radio>
                            </a-radio-group>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="设为默认" name="isDefault">
                            <a-switch
                                :checked="form.isDefault === 1"
                                @change="(v) => (form.isDefault = v ? 1 : 0)"
                            />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="备注" name="remark">
                    <a-input
                        v-model:value="form.remark"
                        placeholder="选填，如“响应快、价格低，日常咨询够用”"
                        :maxlength="255"
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
import { computed, onMounted, reactive, ref } from "vue";
import { Modal, message } from "ant-design-vue";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons-vue";
import {
    pageQueryModelConfig,
    addModelConfig,
    updateModelConfig,
    deleteModelConfig,
    setDefaultModelConfig,
} from "@/api/modelConfig";

// 常见厂商的默认地址与模型名，选了厂商自动填，省得去翻文档
const PROVIDER_PRESETS = {
    deepseek: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
    },
    openai: { baseUrl: "https://api.openai.com", model: "gpt-4o-mini" },
    qwen: {
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode",
        model: "qwen-plus",
    },
    ollama: { baseUrl: "http://localhost:11434", model: "qwen2.5:7b" },
    other: { baseUrl: "", model: "" },
};

const providerOptions = [
    { value: "deepseek", label: "DeepSeek" },
    { value: "openai", label: "OpenAI" },
    { value: "qwen", label: "通义千问" },
    { value: "ollama", label: "本地 Ollama" },
    { value: "other", label: "其他（兼容 OpenAI 协议）" },
];

const columns = [
    { title: "序号", key: "idx", width: 70 },
    { title: "配置名称", dataIndex: "name", key: "name", width: 180 },
    { title: "厂商", dataIndex: "provider", key: "provider", width: 110 },
    { title: "模型名", dataIndex: "model", key: "model", width: 170 },
    { title: "API Key", dataIndex: "apiKey", key: "apiKey", width: 150 },
    { title: "状态", dataIndex: "status", key: "status", width: 90 },
    { title: "备注", dataIndex: "remark", key: "remark", ellipsis: true },
    { title: "操作", key: "op", width: 240 },
];

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = 10;
const name = ref("");

const modalVisible = ref(false);
const submitting = ref(false);
const editing = ref(null);
const formRef = ref(null);

const emptyForm = () => ({
    name: "",
    provider: "deepseek",
    baseUrl: PROVIDER_PRESETS.deepseek.baseUrl,
    model: PROVIDER_PRESETS.deepseek.model,
    apiKey: "",
    temperature: 0.7,
    maxTokens: 2048,
    timeout: 60,
    status: 1,
    isDefault: 0,
    remark: "",
});

const form = reactive(emptyForm());

// 列表里有未配置 Key 的就弹提醒：初次拉代码的人最容易卡在这里
const hasMissingKey = computed(() =>
    list.value.some((r) => !r.keyConfigured && r.provider !== "ollama"),
);

const keyHint = computed(() =>
    editing.value
        ? "留空表示不修改原来的 Key。列表里看到的是掩码值，拿不到原文。"
        : "本地 Ollama 可以留空，其余厂商必填，否则无法对话。",
);

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await pageQueryModelConfig({
            pageNum: pageNum.value,
            pageSize,
            name: name.value,
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

const onProviderChange = (value) => {
    const preset = PROVIDER_PRESETS[value];
    if (!preset) return;
    // 只在新增时自动覆盖，编辑时别把用户自己改的地址冲掉
    if (!editing.value) {
        form.baseUrl = preset.baseUrl;
        form.model = preset.model;
    }
};

const handleAdd = () => {
    editing.value = null;
    Object.assign(form, emptyForm());
    modalVisible.value = true;
};

const handleEdit = (record) => {
    editing.value = record;
    Object.assign(form, {
        ...record,
        // 掩码值不能回填进输入框，否则一提交就把真 Key 覆盖成 sk-***abc
        apiKey: "",
        temperature: Number(record.temperature),
    });
    modalVisible.value = true;
};

const handleSetDefault = (record) => {
    Modal.confirm({
        title: "设为默认模型",
        content: `把【${record.name}】设为默认？原来的默认会被取消。`,
        onOk: async () => {
            await setDefaultModelConfig(record.id);
            message.success("已设为默认");
            fetchList();
        },
    });
};

const handleDelete = (id) => {
    Modal.confirm({
        title: "确认删除",
        content: "删除后引用它的智能体将无法对话。确定删除吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteModelConfig(id);
            message.success("删除成功");
            fetchList();
        },
    });
};

const handleSubmit = async () => {
    await formRef.value.validate();
    const payload = { ...form };

    // 抽屉不会自己关，也没内置 loading，这两件事得自己管：
    // 提交失败时保持打开，用户不用重新填一遍。
    submitting.value = true;
    try {
        if (editing.value) {
            payload.id = editing.value.id;
            // 留空就不传这个字段，后端会沿用原值
            if (!payload.apiKey) delete payload.apiKey;
            await updateModelConfig(payload);
            message.success("更新成功");
        } else {
            await addModelConfig(payload);
            message.success("添加成功");
        }
        modalVisible.value = false;
        fetchList();
    } finally {
        submitting.value = false;
    }
};

onMounted(fetchList);
</script>
