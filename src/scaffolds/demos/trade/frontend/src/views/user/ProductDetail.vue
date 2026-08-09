<template>
    <a-spin :spinning="loading">
        <a-breadcrumb style="margin-bottom: 16px">
            <a-breadcrumb-item>
                <router-link to="/user/mall">商城</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item>{{ product?.name || "商品详情" }}</a-breadcrumb-item>
        </a-breadcrumb>

        <a-card v-if="product" :bordered="false">
            <a-row :gutter="24">
                <a-col :xs="24" :md="10">
                    <div class="cover-box">
                        <img
                            v-if="product.cover"
                            :src="product.cover"
                            :alt="product.name"
                        />
                        <div v-else class="cover-empty">暂无图片</div>
                    </div>
                </a-col>
                <a-col :xs="24" :md="14">
                    <h2 class="p-name">{{ product.name }}</h2>
                    <div class="p-price-box">
                        <span class="p-label">价格</span>
                        <span class="p-price">¥{{ product.price }}</span>
                    </div>
                    <div class="p-line">
                        <span class="p-label">库存</span>
                        <span>{{ product.stock }} 件</span>
                        <a-divider type="vertical" />
                        <span class="p-label">销量</span>
                        <span>{{ product.sales || 0 }} 件</span>
                    </div>
                    <div class="p-line">
                        <span class="p-label">分类</span>
                        <a-tag v-if="product.categoryName" color="blue">
                            {{ product.categoryName }}
                        </a-tag>
                        <span v-else>未分类</span>
                    </div>
                    <div class="p-line">
                        <span class="p-label">店铺</span>
                        <span>{{ product.shopName || "-" }}</span>
                    </div>

                    <a-alert
                        v-if="soldOut"
                        type="warning"
                        show-icon
                        message="该商品暂时缺货"
                        style="margin: 16px 0"
                    />

                    <div class="p-line">
                        <span class="p-label">数量</span>
                        <a-input-number
                            v-model:value="quantity"
                            :min="1"
                            :max="Math.max(product.stock, 1)"
                            :precision="0"
                            :disabled="soldOut"
                        />
                    </div>

                    <a-space style="margin-top: 24px">
                        <a-button
                            size="large"
                            :disabled="soldOut"
                            :loading="adding"
                            @click="handleAddCart"
                        >
                            <template #icon><shopping-cart-outlined /></template>
                            加入购物车
                        </a-button>
                        <a-button
                            type="primary"
                            size="large"
                            :disabled="soldOut"
                            @click="handleBuyNow"
                        >
                            立即购买
                        </a-button>
                    </a-space>
                </a-col>
            </a-row>

            <a-divider />

            <h3 class="detail-title">商品详情</h3>
            <div
                v-if="product.description"
                class="detail-html"
                v-html="product.description"
            ></div>
            <a-empty v-else description="商家还没有填写详情" />
        </a-card>
    </a-spin>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { ShoppingCartOutlined } from "@ant-design/icons-vue";
import { getProductById } from "@/api/product";
import { addToCart } from "@/api/cart";
import { useUserStore } from "@/stores/user";
import "@/styles/user.css";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const adding = ref(false);
const product = ref(null);
const quantity = ref(1);

const soldOut = computed(() => !product.value || product.value.stock <= 0);

const fetchDetail = async () => {
    loading.value = true;
    try {
        const res = await getProductById(route.params.id);
        product.value = res.data;
    } finally {
        loading.value = false;
    }
};

/** 未登录时先去登录，登录后带 redirect 回到当前页 */
const requireLogin = () => {
    if (!userStore.token) {
        message.warning("请先登录");
        router.push({ path: "/login", query: { redirect: route.fullPath } });
        return false;
    }
    return true;
};

const handleAddCart = async () => {
    if (!requireLogin()) return;
    adding.value = true;
    try {
        await addToCart(product.value.id, quantity.value);
        message.success("已加入购物车");
    } finally {
        adding.value = false;
    }
};

/** 立即购买不进购物车，直接把商品和数量带到结算页 */
const handleBuyNow = () => {
    if (!requireLogin()) return;
    router.push({
        path: "/user/checkout",
        query: { productId: product.value.id, quantity: quantity.value },
    });
};

onMounted(fetchDetail);
</script>

<style scoped>
.cover-box {
    width: 100%;
    height: 340px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 8px;
    background: var(--color-bg-hover, #fafafa);
}
.cover-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.cover-empty {
    color: var(--color-text-mute, #999);
}
.p-name {
    margin: 0 0 16px;
    font-size: 22px;
    font-weight: 600;
}
.p-price-box {
    padding: 12px 16px;
    border-radius: 8px;
    background: var(--color-bg-hover, #fafafa);
    margin-bottom: 16px;
}
.p-price {
    color: #cf1322;
    font-size: 28px;
    font-weight: 700;
}
.p-line {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.p-label {
    display: inline-block;
    min-width: 44px;
    color: var(--color-text-mute, #999);
}
.detail-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
}
.detail-html {
    line-height: 1.8;
}
.detail-html :deep(img) {
    max-width: 100%;
}
</style>
