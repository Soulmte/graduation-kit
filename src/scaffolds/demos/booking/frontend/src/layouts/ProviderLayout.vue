<template>
    <a-layout class="a-layout">
        <a-layout-sider
            v-model:collapsed="collapsed"
            :trigger="null"
            collapsible
            :width="220"
            class="a-sider"
        >
            <div class="a-logo">
                <span class="a-logo-mark">P</span>
                <span v-if="!collapsed">机构中心</span>
            </div>
            <a-menu
                mode="inline"
                :selected-keys="[route.path]"
                class="a-menu"
                @click="({ key }) => router.push(key)"
            >
                <a-menu-item key="/provider/shop">
                    <template #icon><shop-outlined /></template>
                    机构信息
                </a-menu-item>
                <a-menu-item key="/provider/service">
                    <template #icon><appstore-outlined /></template>
                    服务项管理
                </a-menu-item>
                <a-menu-item key="/provider/schedule">
                    <template #icon><calendar-outlined /></template>
                    排班管理
                </a-menu-item>
                <a-menu-item key="/provider/appointment">
                    <template #icon><file-text-outlined /></template>
                    预约管理
                </a-menu-item>
                <a-menu-item key="/provider/review">
                    <template #icon><star-outlined /></template>
                    评价管理
                </a-menu-item>
            </a-menu>
        </a-layout-sider>

        <a-layout class="a-body">
            <a-layout-header class="a-header">
                <div class="a-header-left">
                    <menu-unfold-outlined
                        v-if="collapsed"
                        class="a-trigger"
                        @click="collapsed = false"
                    />
                    <menu-fold-outlined
                        v-else
                        class="a-trigger"
                        @click="collapsed = true"
                    />
                    <span class="a-breadcrumb">
                        {{ providerName || "机构控制台" }}
                    </span>
                </div>
                <a-dropdown placement="bottomRight">
                    <div class="a-user">
                        <a-avatar :src="userStore.userInfo?.avatar" :size="32">
                            <template #icon><user-outlined /></template>
                        </a-avatar>
                        <span class="a-user-name">
                            {{
                                userStore.userInfo?.nickname ||
                                userStore.userInfo?.username ||
                                "未登录"
                            }}
                        </span>
                    </div>
                    <template #overlay>
                        <a-menu>
                            <a-menu-item @click="router.push('/user/home')">
                                <compass-outlined /> 去逛逛
                            </a-menu-item>
                            <a-menu-item @click="router.push('/user/profile')">
                                <user-outlined /> 个人中心
                            </a-menu-item>
                            <a-menu-divider />
                            <a-menu-item @click="handleLogout">
                                <logout-outlined /> 退出登录
                            </a-menu-item>
                        </a-menu>
                    </template>
                </a-dropdown>
            </a-layout-header>

            <a-layout-content class="a-content">
                <router-view />
            </a-layout-content>

            <a-layout-footer class="a-footer-slot">
                <app-footer />
            </a-layout-footer>
        </a-layout>
    </a-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import {
    ShopOutlined,
    AppstoreOutlined,
    CalendarOutlined,
    FileTextOutlined,
    StarOutlined,
    CompassOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import { getMyProvider } from "@/api/provider";
import AppFooter from "@/components/AppFooter.vue";
import "@/styles/admin.css";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const collapsed = ref(false);
const providerName = ref("");

const handleLogout = () => {
    userStore.logout();
    message.success("退出成功");
    router.push("/login");
};

// 标题栏显示机构名，顺带确认当前账号确实有机构
onMounted(async () => {
    try {
        const res = await getMyProvider();
        providerName.value = res.data?.name || "";
    } catch {
        // 拉不到机构信息不影响页面使用，各子页面会各自提示
    }
});
</script>
