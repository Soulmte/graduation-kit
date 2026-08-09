<template>
    <a-card :title="cardTitle" :loading="loading">
        <!-- 已封禁：只提示，不给改资料 -->
        <a-alert
            v-if="status === 2"
            type="error"
            show-icon
            message="店铺已被封禁"
            description="当前店铺已被管理员封禁，无法继续经营。如有疑问请联系平台管理员。"
            style="margin-bottom: 16px"
        />

        <!-- 待审核：展示已提交的资料，可继续修改 -->
        <a-alert
            v-else-if="status === 0"
            type="warning"
            show-icon
            message="资料已提交，等待管理员审核"
            description="审核通过后即可发布商品。等待期间仍可修改店铺资料。"
            style="margin-bottom: 16px"
        />

        <!-- 未申请：说明一下开店流程 -->
        <a-alert
            v-else-if="status === null"
            type="info"
            show-icon
            message="你还没有店铺"
            description="填写下方资料提交开店申请，管理员审核通过后即可上架商品。"
            style="margin-bottom: 16px"
        />

        <a-form
            :model="form"
            ref="formRef"
            layout="vertical"
            style="max-width: 560px"
        >
            <a-form-item label="店铺 Logo">
                <avatar-upload
                    v-model:value="form.logo"
                    :size="96"
                    :disabled="readonly"
                />
            </a-form-item>
            <a-form-item
                label="店铺名称"
                name="shopName"
                :rules="[
                    { required: true, message: '请输入店铺名称' },
                    { max: 100, message: '店铺名称过长' },
                ]"
            >
                <a-input
                    v-model:value="form.shopName"
                    placeholder="例如：青山茶叶旗舰店"
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
            <a-form-item label="店铺简介" name="description">
                <a-textarea
                    v-model:value="form.description"
                    placeholder="简单介绍一下你的店铺，买家会在店铺页看到"
                    :rows="4"
                    :maxlength="500"
                    :disabled="readonly"
                    show-count
                />
            </a-form-item>
            <a-form-item v-if="!readonly">
                <a-button type="primary" :loading="saving" @click="handleSubmit">
                    {{ status === null ? "提交开店申请" : "保存修改" }}
                </a-button>
            </a-form-item>
        </a-form>

        <a-descriptions
            v-if="status !== null"
            :column="2"
            bordered
            size="small"
            title="店铺状态"
            style="margin-top: 8px"
        >
            <a-descriptions-item label="当前状态">
                <a-tag :color="MERCHANT_STATUS[status].color">
                    {{ MERCHANT_STATUS[status].text }}
                </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="店铺 ID">
                {{ shop?.id }}
            </a-descriptions-item>
            <a-descriptions-item label="申请时间">
                {{ shop?.createTime }}
            </a-descriptions-item>
            <a-descriptions-item label="最近更新">
                {{ shop?.updateTime }}
            </a-descriptions-item>
        </a-descriptions>
    </a-card>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import {
    getMyMerchant,
    applyMerchant,
    updateMyMerchant,
} from "@/api/merchant";
import AvatarUpload from "@/components/AvatarUpload.vue";

/** 店铺状态字典，与后端 Merchant 常量一致 */
const MERCHANT_STATUS = {
    0: { text: "待审核", color: "orange" },
    1: { text: "正常营业", color: "green" },
    2: { text: "已封禁", color: "red" },
};

const loading = ref(false);
const saving = ref(false);
const shop = ref(null);
const formRef = ref(null);
const form = reactive({
    shopName: "",
    logo: "",
    description: "",
    contactPhone: "",
});

/** null 表示还没申请过，其余对应后端状态值 */
const status = computed(() =>
    shop.value ? Number(shop.value.status) : null,
);

/** 封禁状态下资料只读，避免改完还是用不了造成误解 */
const readonly = computed(() => status.value === 2);

const cardTitle = computed(() => {
    if (status.value === null) return "申请开店";
    return shop.value.shopName || "店铺信息";
});

const fetchShop = async () => {
    loading.value = true;
    try {
        const res = await getMyMerchant();
        shop.value = res.data || null;
        if (shop.value) {
            form.shopName = shop.value.shopName || "";
            form.logo = shop.value.logo || "";
            form.description = shop.value.description || "";
            form.contactPhone = shop.value.contactPhone || "";
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
            await applyMerchant(payload);
            message.success("申请已提交，请等待审核");
        } else {
            await updateMyMerchant(payload);
            message.success("保存成功");
        }
        await fetchShop();
    } finally {
        saving.value = false;
    }
};

onMounted(fetchShop);
</script>
