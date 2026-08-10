<template>
    <a-card :title="cardTitle" :loading="loading">
        <!-- 已封禁：只提示，不给改资料 -->
        <a-alert
            v-if="status === 2"
            type="error"
            show-icon
            message="机构已被封禁"
            description="当前机构已被管理员封禁，无法继续接单。如有疑问请联系平台管理员。"
            style="margin-bottom: 16px"
        />

        <!-- 待审核：展示已提交的资料，可继续修改 -->
        <a-alert
            v-else-if="status === 0"
            type="warning"
            show-icon
            message="资料已提交，等待管理员审核"
            description="审核通过后即可发布服务项并排班。等待期间仍可修改机构资料。"
            style="margin-bottom: 16px"
        />

        <!-- 未申请：说明一下入驻流程 -->
        <a-alert
            v-else-if="status === null"
            type="info"
            show-icon
            message="你还没有机构"
            description="填写下方资料提交入驻申请，管理员审核通过后即可发布服务项、排班接单。"
            style="margin-bottom: 16px"
        />

        <a-form
            :model="form"
            ref="formRef"
            layout="vertical"
            style="max-width: 560px"
        >
            <a-form-item label="机构头像">
                <avatar-upload
                    v-model:value="form.logo"
                    :size="96"
                    :disabled="readonly"
                />
            </a-form-item>
            <a-form-item
                label="机构名称"
                name="name"
                :rules="[
                    { required: true, message: '请输入机构名称' },
                    { max: 100, message: '机构名称过长' },
                ]"
            >
                <a-input
                    v-model:value="form.name"
                    placeholder="例如：清河理发工作室"
                    :maxlength="100"
                    :disabled="readonly"
                    show-count
                />
            </a-form-item>
            <a-form-item
                label="联系电话"
                name="contactPhone"
                :rules="[
                    { required: true, message: '请输入联系电话' },
                    {
                        pattern: /^1[3-9]\d{9}$/,
                        message: '手机号格式不正确',
                    },
                ]"
            >
                <a-input
                    v-model:value="form.contactPhone"
                    placeholder="11 位手机号"
                    :maxlength="11"
                    :disabled="readonly"
                />
            </a-form-item>
            <a-form-item
                label="到店地址"
                name="address"
                :rules="[{ required: true, message: '请输入到店地址' }]"
            >
                <a-input
                    v-model:value="form.address"
                    placeholder="用户按这个地址上门，写详细一些"
                    :maxlength="255"
                    :disabled="readonly"
                />
            </a-form-item>
            <a-form-item label="营业时间" name="openTime">
                <a-input
                    v-model:value="form.openTime"
                    placeholder="例如：09:00-20:00"
                    :maxlength="50"
                    :disabled="readonly"
                />
            </a-form-item>
            <a-form-item label="机构简介" name="description">
                <a-textarea
                    v-model:value="form.description"
                    placeholder="简单介绍一下你的机构，用户会在服务详情页看到"
                    :rows="4"
                    :maxlength="500"
                    :disabled="readonly"
                    show-count
                />
            </a-form-item>
            <a-form-item v-if="!readonly">
                <a-button type="primary" :loading="saving" @click="handleSubmit">
                    {{ status === null ? "提交入驻申请" : "保存修改" }}
                </a-button>
            </a-form-item>
        </a-form>

        <a-descriptions
            v-if="status !== null"
            :column="2"
            bordered
            size="small"
            title="机构状态"
            style="margin-top: 8px"
        >
            <a-descriptions-item label="当前状态">
                <a-tag :color="PROVIDER_STATUS[status].color">
                    {{ PROVIDER_STATUS[status].text }}
                </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="机构 ID">
                {{ provider?.id }}
            </a-descriptions-item>
            <a-descriptions-item label="申请时间">
                {{ provider?.createTime }}
            </a-descriptions-item>
            <a-descriptions-item label="最近更新">
                {{ provider?.updateTime }}
            </a-descriptions-item>
        </a-descriptions>
    </a-card>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import {
    getMyProvider,
    applyProvider,
    updateMyProvider,
    PROVIDER_STATUS,
} from "@/api/provider";
import AvatarUpload from "@/components/AvatarUpload.vue";

const loading = ref(false);
const saving = ref(false);
const provider = ref(null);
const formRef = ref(null);
const form = reactive({
    name: "",
    logo: "",
    description: "",
    address: "",
    contactPhone: "",
    openTime: "",
});

/** null 表示还没申请过，其余对应后端状态值 */
const status = computed(() =>
    provider.value ? Number(provider.value.status) : null,
);

/** 封禁状态下资料只读，避免改完还是用不了造成误解 */
const readonly = computed(() => status.value === 2);

const cardTitle = computed(() => {
    if (status.value === null) return "申请入驻";
    return provider.value.name || "机构信息";
});

const fetchProvider = async () => {
    loading.value = true;
    try {
        const res = await getMyProvider();
        provider.value = res.data || null;
        if (provider.value) {
            form.name = provider.value.name || "";
            form.logo = provider.value.logo || "";
            form.description = provider.value.description || "";
            form.address = provider.value.address || "";
            form.contactPhone = provider.value.contactPhone || "";
            form.openTime = provider.value.openTime || "";
        }
    } finally {
        loading.value = false;
    }
};

const handleSubmit = async () => {
    await formRef.value.validate();
    saving.value = true;
    try {
        const payload = { ...form };
        if (status.value === null) {
            await applyProvider(payload);
            message.success("申请已提交，请等待审核");
        } else {
            await updateMyProvider(payload);
            message.success("保存成功");
        }
        await fetchProvider();
    } finally {
        saving.value = false;
    }
};

onMounted(fetchProvider);
</script>
