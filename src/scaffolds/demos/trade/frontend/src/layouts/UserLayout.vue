<template>
    <a-layout class="u-layout">
        <a-layout-header class="u-header">
            <div class="u-header-inner">
                <div class="u-logo" @click="router.push('/user/home')">
                    <span class="u-logo-mark">S</span>
                    <span class="u-logo-text">脚手架平台</span>
                </div>

                <a-menu
                    mode="horizontal"
                    :selected-keys="[route.path]"
                    class="u-nav"
                    @click="({ key }) => router.push(key)"
                >
                    <a-menu-item key="/user/home">
                        <template #icon><home-outlined /></template>
                        首页
                    </a-menu-item>
                    <a-menu-item key="/user/mall">
                        <template #icon><appstore-outlined /></template>
                        商城
                    </a-menu-item>
                    <a-menu-item key="/user/notice">
                        <template #icon><bell-outlined /></template>
                        公告
                    </a-menu-item>
                </a-menu>

                <div class="u-actions">
                    <template v-if="userStore.token">
                        <a-badge :count="cartCount" :offset="[-2, 4]">
                            <a-button
                                type="text"
                                class="u-cart"
                                @click="router.push('/user/cart')"
                            >
                                <template #icon><shopping-cart-outlined /></template>
                            </a-button>
                        </a-badge>
                        <a-dropdown placement="bottomRight">
                            <div class="u-user">
                                <a-avatar
                                    :src="userStore.userInfo?.avatar"
                                    :size="32"
                                >
                                    <template #icon><user-outlined /></template>
                                </a-avatar>
                                <span class="u-user-name">
                                    {{
                                        userStore.userInfo?.nickname ||
                                        userStore.userInfo?.username
                                    }}
                                </span>
                            </div>
                            <template #overlay>
                                <a-menu>
                                    <a-menu-item
                                        @click="router.push('/user/order')"
                                    >
                                        <file-text-outlined /> 我的订单
                                    </a-menu-item>
                                    <a-menu-item
                                        @click="router.push('/user/profile')"
                                    >
                                        <user-outlined /> 个人中心
                                    </a-menu-item>
                                    <a-menu-item
                                        v-if="isMerchant"
                                        @click="router.push('/merchant/shop')"
                                    >
                                        <shop-outlined /> 商家中心
                                    </a-menu-item>
                                    <a-menu-item
                                        v-else
                                        @click="router.push('/user/apply-shop')"
                                    >
                                        <shop-outlined /> 申请开店
                                    </a-menu-item>
                                    <a-menu-item
                                        v-if="
                                            userStore.userInfo?.role === 'admin'
                                        "
                                        @click="router.push('/admin/dashboard')"
                                    >
                                        <dashboard-outlined /> 管理后台
                                    </a-menu-item>
                                    <a-menu-divider />
                                    <a-menu-item @click="handleLogout">
                                        <logout-outlined /> 退出登录
                                    </a-menu-item>
                                </a-menu>
                            </template>
                        </a-dropdown>
                    </template>
                    <template v-else>
                        <a-button type="text" @click="router.push('/login')"
                            >登录</a-button
                        >
                        <a-button
                            type="primary"
                            @click="router.push('/register')"
                            >注册</a-button
                        >
                    </template>
                </div>
            </div>
        </a-layout-header>

        <a-layout-content class="u-content">
            <div class="u-content-inner">
                <router-view />
            </div>
        </a-layout-content>

        <a-layout-footer class="u-footer-slot">
            <app-footer />
        </a-layout-footer>
    </a-layout>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import {
    HomeOutlined,
    BellOutlined,
    AppstoreOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    ShopOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import { listMyCart } from "@/api/cart";
import AppFooter from "@/components/AppFooter.vue";
import "@/styles/user.css";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const cartCount = ref(0);

const isMerchant = computed(() =>
    ["merchant", "admin"].includes(userStore.userInfo?.role),
);

const fetchCartCount = async () => {
    if (!userStore.token) {
        cartCount.value = 0;
        return;
    }
    try {
        const res = await listMyCart();
        cartCount.value = (res.data || []).length;
    } catch {
        // 角标取不到不影响页面使用，静默忽略
    }
};

// 路由切换时刷新角标，加车、下单后回到列表能看到最新数量
watch(() => route.path, fetchCartCount);

const handleLogout = () => {
    userStore.logout();
    message.success("退出成功");
    router.push("/login");
};

onMounted(fetchCartCount);
</script>
