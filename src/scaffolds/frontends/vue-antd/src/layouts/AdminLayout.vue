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
                <span class="a-logo-mark">S</span>
                <span v-if="!collapsed">后台管理</span>
            </div>
            <a-menu
                mode="inline"
                :selected-keys="[route.path]"
                class="a-menu"
                @click="({ key }) => router.push(key)"
            >
                <a-menu-item key="/admin/dashboard">
                    <template #icon><dashboard-outlined /></template>
                    仪表盘
                </a-menu-item>
                <a-menu-item key="/admin/user">
                    <template #icon><user-outlined /></template>
                    用户管理
                </a-menu-item>
                <a-menu-item key="/admin/notice">
                    <template #icon><bell-outlined /></template>
                    公告管理
                </a-menu-item>
                <a-menu-item key="/admin/log">
                    <template #icon><file-text-outlined /></template>
                    日志管理
                </a-menu-item>
                <a-menu-item key="/admin/status">
                    <template #icon><dashboard-outlined /></template>
                    系统状态
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
                    <span class="a-breadcrumb">管理控制台</span>
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
                            <a-menu-item @click="router.push('/admin/profile')">
                                <user-outlined /> 个人中心
                            </a-menu-item>
                            <a-menu-item @click="router.push('/user/home')">
                                <dashboard-outlined /> 用户端
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
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import {
    DashboardOutlined,
    UserOutlined,
    BellOutlined,
    FileTextOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import AppFooter from "@/components/AppFooter.vue";
import "@/styles/admin.css";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const collapsed = ref(false);

const handleLogout = () => {
    userStore.logout();
    message.success("退出成功");
    router.push("/login");
};
</script>
