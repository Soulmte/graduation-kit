<template>
    <a-card title="我的购物车" :loading="loading">
        <template #extra>
            <a-space>
                <a-button
                    danger
                    :disabled="!selectedIds.length"
                    @click="handleDeleteBatch"
                >
                    <template #icon><delete-outlined /></template> 移除选中
                </a-button>
                <a-button :disabled="!list.length" @click="handleClear">
                    清空购物车
                </a-button>
            </a-space>
        </template>

        <a-empty v-if="!list.length && !loading" description="购物车还是空的">
            <a-button type="primary" @click="router.push('/user/mall')">
                去挑点东西
            </a-button>
        </a-empty>

        <template v-else>
            <a-alert
                v-if="hasInvalid"
                type="warning"
                show-icon
                message="购物车里有失效商品"
                description="已下架或被删除的商品无法结算，建议先移除。"
                style="margin-bottom: 16px"
            />

            <a-table
                :columns="columns"
                :data-source="list"
                row-key="id"
                :pagination="false"
                :row-selection="{
                    selectedRowKeys: selectedIds,
                    onChange: (v) => (selectedIds = v),
                    getCheckboxProps: (record) => ({
                        disabled: !isValid(record),
                    }),
                }"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'product'">
                        <div
                            class="cart-product"
                            :class="{ invalid: !isValid(record) }"
                        >
                            <a-image
                                :src="record.productCover"
                                :width="56"
                                :height="56"
                                style="object-fit: cover; border-radius: 4px"
                            />
                            <div class="cart-product-info">
                                <div
                                    class="cart-product-name"
                                    @click="goDetail(record)"
                                >
                                    {{ record.productName || "商品已被删除" }}
                                </div>
                                <div class="text-sub">
                                    {{ record.shopName || "-" }}
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else-if="column.key === 'price'">
                        <span v-if="record.price != null" class="price">
                            ¥{{ record.price }}
                        </span>
                        <span v-else class="text-sub">-</span>
                    </template>
                    <template v-else-if="column.key === 'quantity'">
                        <a-input-number
                            :value="record.quantity"
                            :min="1"
                            :max="Math.max(record.stock || 1, 1)"
                            :precision="0"
                            :disabled="!isValid(record)"
                            size="small"
                            @change="(v) => handleQuantityChange(record, v)"
                        />
                        <div
                            v-if="isValid(record) && record.stock < record.quantity"
                            class="text-danger"
                        >
                            库存仅剩 {{ record.stock }} 件
                        </div>
                    </template>
                    <template v-else-if="column.key === 'subtotal'">
                        <span v-if="record.price != null" class="price">
                            ¥{{ rowSubtotal(record) }}
                        </span>
                        <span v-else class="text-sub">-</span>
                    </template>
                    <template v-else-if="column.key === 'state'">
                        <a-tag v-if="record.productName == null" color="red">
                            已删除
                        </a-tag>
                        <a-tag
                            v-else-if="record.productStatus === 0"
                            color="default"
                        >
                            已下架
                        </a-tag>
                        <a-tag v-else-if="record.stock <= 0" color="orange">
                            缺货
                        </a-tag>
                        <a-tag v-else color="green">可购买</a-tag>
                    </template>
                    <template v-else-if="column.key === 'op'">
                        <a-button
                            size="small"
                            class="btn-delete"
                            @click="handleDelete(record.id)"
                        >
                            <template #icon><delete-outlined /></template> 移除
                        </a-button>
                    </template>
                </template>
            </a-table>

            <div class="cart-bar">
                <div class="cart-bar-info">
                    已选
                    <span class="strong">{{ selectedIds.length }}</span>
                    件，合计
                    <span class="price total">¥{{ totalAmount }}</span>
                </div>
                <a-button
                    type="primary"
                    size="large"
                    :disabled="!selectedIds.length"
                    @click="handleCheckout"
                >
                    去结算
                </a-button>
            </div>
        </template>
    </a-card>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Modal, message } from "ant-design-vue";
import { DeleteOutlined } from "@ant-design/icons-vue";
import {
    listMyCart,
    updateCartQuantity,
    deleteCartItem,
    deleteCartBatch,
    clearCart,
} from "@/api/cart";
import "@/styles/user.css";

const router = useRouter();

const columns = [
    { title: "商品", key: "product" },
    { title: "单价", key: "price", width: 110 },
    { title: "数量", key: "quantity", width: 150 },
    { title: "小计", key: "subtotal", width: 110 },
    { title: "状态", key: "state", width: 100 },
    { title: "操作", key: "op", width: 110 },
];

const loading = ref(false);
const list = ref([]);
const selectedIds = ref([]);

/**
 * 可结算的条目：商品还在、已上架、库存够
 * productName 为 null 表示商品已被商家删除
 */
const isValid = (record) =>
    record.productName != null &&
    record.productStatus === 1 &&
    record.stock > 0;

const hasInvalid = computed(() => list.value.some((r) => !isValid(r)));

const rowSubtotal = (record) =>
    (Number(record.price || 0) * Number(record.quantity || 0)).toFixed(2);

const totalAmount = computed(() => {
    const sum = list.value
        .filter((r) => selectedIds.value.includes(r.id))
        .reduce(
            (acc, r) => acc + Number(r.price || 0) * Number(r.quantity || 0),
            0,
        );
    return sum.toFixed(2);
});

const fetchList = async () => {
    loading.value = true;
    try {
        const res = await listMyCart();
        list.value = res.data || [];
        // 刷新后把已失效的条目从选中集合里剔掉
        const validIds = list.value.filter(isValid).map((r) => r.id);
        selectedIds.value = selectedIds.value.filter((id) =>
            validIds.includes(id),
        );
    } finally {
        loading.value = false;
    }
};

const handleQuantityChange = async (record, value) => {
    if (!value || value === record.quantity) return;
    await updateCartQuantity(record.id, value);
    record.quantity = value;
};

const handleDelete = async (id) => {
    await deleteCartItem(id);
    message.success("已移除");
    fetchList();
};

const handleDeleteBatch = () => {
    Modal.confirm({
        title: "确认移除",
        content: `确定要移除选中的 ${selectedIds.value.length} 件商品吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
            await deleteCartBatch(selectedIds.value);
            message.success("已移除");
            selectedIds.value = [];
            fetchList();
        },
    });
};

const handleClear = () => {
    Modal.confirm({
        title: "确认清空",
        content: "确定要清空购物车吗？",
        okButtonProps: { danger: true },
        onOk: async () => {
            await clearCart();
            message.success("已清空");
            selectedIds.value = [];
            fetchList();
        },
    });
};

const goDetail = (record) => {
    if (record.productName == null) return;
    router.push(`/user/product/${record.productId}`);
};

/**
 * 后端要求一单只能属于一个商家，跨店时先在前端拦下来给出明确提示，
 * 免得用户提交后才收到"请分开下单"的报错
 */
const handleCheckout = () => {
    const selected = list.value.filter((r) =>
        selectedIds.value.includes(r.id),
    );
    const shopIds = [...new Set(selected.map((r) => r.merchantId))];
    if (shopIds.length > 1) {
        message.warning("同一笔订单只能购买一家店的商品，请分开结算");
        return;
    }
    router.push({
        path: "/user/checkout",
        query: { cartItemIds: selectedIds.value.join(",") },
    });
};

onMounted(fetchList);
</script>

<style scoped>
.cart-product {
    display: flex;
    gap: 12px;
    align-items: center;
}
.cart-product.invalid {
    opacity: 0.45;
}
.cart-product-name {
    font-weight: 500;
    cursor: pointer;
}
.cart-product-name:hover {
    color: var(--color-primary, #1677ff);
}
.price {
    color: #cf1322;
    font-weight: 600;
}
.total {
    font-size: 22px;
}
.text-danger {
    color: #cf1322;
    font-size: 12px;
    margin-top: 4px;
}
.cart-bar {
    margin-top: 20px;
    padding: 16px;
    border-radius: 8px;
    background: var(--color-bg-hover, #fafafa);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}
.strong {
    font-weight: 600;
}
</style>
