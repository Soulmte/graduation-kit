<template>
    <a-spin :spinning="loading">
        <a-row :gutter="16">
            <a-col :xs="24" :md="14">
                <a-card title="收货信息" :bordered="false">
                    <a-form :model="form" ref="formRef" layout="vertical">
                        <a-form-item
                            label="收货人姓名"
                            name="receiverName"
                            :rules="[
                                { required: true, message: '请输入收货人姓名' },
                                { max: 50, message: '姓名过长' },
                            ]"
                        >
                            <a-input
                                v-model:value="form.receiverName"
                                placeholder="请输入收货人姓名"
                                :maxlength="50"
                            />
                        </a-form-item>
                        <a-form-item
                            label="联系电话"
                            name="receiverPhone"
                            :rules="[
                                { required: true, message: '请输入联系电话' },
                                {
                                    pattern: /^1[3-9]\d{9}$/,
                                    message: '手机号格式不正确',
                                },
                            ]"
                        >
                            <a-input
                                v-model:value="form.receiverPhone"
                                placeholder="11 位手机号"
                                :maxlength="11"
                            />
                        </a-form-item>
                        <a-form-item
                            label="收货地址"
                            name="receiverAddr"
                            :rules="[
                                { required: true, message: '请输入收货地址' },
                                { max: 255, message: '地址过长' },
                            ]"
                        >
                            <a-textarea
                                v-model:value="form.receiverAddr"
                                placeholder="省市区 + 详细地址"
                                :rows="3"
                                :maxlength="255"
                                show-count
                            />
                        </a-form-item>
                        <a-form-item label="订单备注" name="remark">
                            <a-textarea
                                v-model:value="form.remark"
                                placeholder="对本单的特殊要求，可不填"
                                :rows="2"
                                :maxlength="255"
                                show-count
                            />
                        </a-form-item>
                    </a-form>
                </a-card>
            </a-col>

            <a-col :xs="24" :md="10">
                <a-card title="商品清单" :bordered="false">
                    <a-empty v-if="!items.length" description="没有待结算的商品">
                        <a-button type="primary" @click="router.push('/user/mall')">
                            去商城看看
                        </a-button>
                    </a-empty>

                    <template v-else>
                        <div class="shop-name">
                            <shop-outlined /> {{ items[0].shopName || "店铺" }}
                        </div>
                        <div v-for="it in items" :key="it.key" class="ck-item">
                            <a-image
                                :src="it.cover"
                                :width="52"
                                :height="52"
                                style="object-fit: cover; border-radius: 4px"
                            />
                            <div class="ck-item-main">
                                <div class="ck-item-name">{{ it.name }}</div>
                                <div class="text-sub">
                                    ¥{{ it.price }} × {{ it.quantity }}
                                </div>
                            </div>
                            <div class="ck-item-sub">¥{{ it.subtotal }}</div>
                        </div>

                        <a-divider style="margin: 12px 0" />

                        <div class="ck-total">
                            <span>应付金额</span>
                            <span class="price">¥{{ totalAmount }}</span>
                        </div>
                        <div class="text-sub ck-hint">
                            金额以后端按商品现价计算的结果为准
                        </div>

                        <a-button
                            type="primary"
                            size="large"
                            block
                            :loading="submitting"
                            style="margin-top: 16px"
                            @click="handleSubmit"
                        >
                            提交订单
                        </a-button>
                    </template>
                </a-card>
            </a-col>
        </a-row>
    </a-spin>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { ShopOutlined } from "@ant-design/icons-vue";
import { listMyCart } from "@/api/cart";
import { getProductById } from "@/api/product";
import { createOrder } from "@/api/order";
import "@/styles/user.css";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const items = ref([]);
const formRef = ref(null);
const form = reactive({
    receiverName: "",
    receiverPhone: "",
    receiverAddr: "",
    remark: "",
});

/** 购物车结算时带 cartItemIds，直接购买时带 productId + quantity */
const cartItemIds = computed(() =>
    route.query.cartItemIds
        ? String(route.query.cartItemIds)
              .split(",")
              .filter(Boolean)
              .map(Number)
        : [],
);

const totalAmount = computed(() =>
    items.value
        .reduce((acc, it) => acc + Number(it.price) * Number(it.quantity), 0)
        .toFixed(2),
);

const fetchFromCart = async () => {
    const res = await listMyCart();
    const all = res.data || [];
    items.value = all
        .filter((r) => cartItemIds.value.includes(r.id))
        .map((r) => ({
            key: `cart-${r.id}`,
            name: r.productName,
            cover: r.productCover,
            price: r.price,
            quantity: r.quantity,
            shopName: r.shopName,
            subtotal: (Number(r.price) * Number(r.quantity)).toFixed(2),
        }));
};

const fetchFromProduct = async () => {
    const quantity = Number(route.query.quantity || 1);
    const res = await getProductById(route.query.productId);
    const p = res.data;
    items.value = [
        {
            key: `product-${p.id}`,
            name: p.name,
            cover: p.cover,
            price: p.price,
            quantity,
            shopName: p.shopName,
            subtotal: (Number(p.price) * quantity).toFixed(2),
        },
    ];
};

const handleSubmit = async () => {
    await formRef.value.validate();
    submitting.value = true;
    try {
        const payload = { ...form };
        if (cartItemIds.value.length) {
            payload.cartItemIds = cartItemIds.value;
        } else {
            payload.productId = Number(route.query.productId);
            payload.quantity = Number(route.query.quantity || 1);
        }
        await createOrder(payload);
        message.success("下单成功，请尽快完成支付");
        router.push("/user/order");
    } finally {
        submitting.value = false;
    }
};

onMounted(async () => {
    loading.value = true;
    try {
        if (cartItemIds.value.length) {
            await fetchFromCart();
        } else if (route.query.productId) {
            await fetchFromProduct();
        }
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.shop-name {
    font-weight: 600;
    margin-bottom: 12px;
}
.ck-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border, #f0f0f0);
}
.ck-item-main {
    flex: 1;
    min-width: 0;
}
.ck-item-name {
    font-weight: 500;
    margin-bottom: 4px;
}
.ck-item-sub {
    color: #cf1322;
    font-weight: 600;
}
.ck-total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
}
.price {
    color: #cf1322;
    font-size: 24px;
    font-weight: 700;
}
.ck-hint {
    margin-top: 4px;
    text-align: right;
}
</style>
