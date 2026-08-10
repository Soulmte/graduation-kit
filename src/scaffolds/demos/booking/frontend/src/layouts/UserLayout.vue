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
                    <a-menu-item key="/user/service">
                        <template #icon><appstore-outlined /></template>
                        找服务
                    </a-menu-item>
                    <a-menu-item key="/user/notice">
                        <template #icon><bell-outlined /></template>
                        公告
                    </a-menu-item>
                </a-menu>

                <div class="u-actions">
                    <template v-if="userStore.token">
                        <a-badge :count="pendingCount" :offset="[-2, 4]">
                            <a-button
                                type="text"
                                class="u-cart"
                                @click="router.push('/user/appointment')"
                            >
                                <template #icon><calendar-outlined /></template>
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
                                        @click="router.push('/user/appointment')"
                                    >
                                        <file-text-outlined /> 我的预约
                                    </a-menu-item>
                                    <a-menu-item
                                        @click="router.push('/user/profile')"
                                    >
                                        <user-outlined /> 个人中心
                                    </a-menu-item>
                                    <a-menu-item
                                        v-if="isProvider"
                                        @click="router.push('/provider/shop')"
                                    >
                                        <shop-outlined /> 机构中心
                                    </a-menu-item>
                                    <a-menu-item
                                        v-else
                                        @click="
                                            router.push('/user/apply-provider')
                                        "
                                    >
                                        <shop-outlined /> 申请入驻
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
    CalendarOutlined,
    FileTextOutlined,
    ShopOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import { pageQueryMyAppointment } from "@/api/appointment";
import AppFooter from "@/components/AppFooter.vue";
import "@/styles/user.css";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const pendingCount = ref(0);

const isProvider = computed(() =>
    ["provider", "admin"].includes(userStore.userInfo?.role),
);

// 角标只要个总数，所以 pageSize 给 1，拿 IPage.total 就行
const fetchPendingCount = async () => {
    if (!userStore.token) {
        pendingCount.value = 0;
        return;
    }
    try {
        const res = await pageQueryMyAppointment({
            pageNum: 1,
            pageSize: 1,
            status: 0,
        });
        pendingCount.value = res.data?.total || 0;
    } catch {
        // 角标取不到不影响页面使用，静默忽略
    }
};

// 路由切换时刷新角标，下单、取消后回到列表能看到最新数量
watch(() => route.path, fetchPendingCount);

const handleLogout = () => {
    userStore.logout();
    message.success("退出成功");
    router.push("/login");
};

onMounted(fetchPendingCount);
</script>
