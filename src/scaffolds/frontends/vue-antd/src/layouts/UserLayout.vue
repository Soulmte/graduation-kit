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
                    <a-menu-item key="/user/notice">
                        <template #icon><bell-outlined /></template>
                        公告
                    </a-menu-item>
                </a-menu>

                <div class="u-actions">
                    <template v-if="userStore.token">
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
                                        @click="router.push('/user/profile')"
                                    >
                                        <user-outlined /> 个人中心
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
import { useRouter, useRoute } from "vue-router";
import { message } from "ant-design-vue";
import {
    HomeOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import AppFooter from "@/components/AppFooter.vue";
import "@/styles/user.css";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const handleLogout = () => {
    userStore.logout();
    message.success("退出成功");
    router.push("/login");
};
</script>
