import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/stores/user";

const routes = [
    {
        path: "/",
        redirect: "/user/home",
    },
    // 用户端路由
    {
        path: "/user",
        component: () => import("@/layouts/UserLayout.vue"),
        children: [
            {
                path: "home",
                name: "UserHome",
                component: () => import("@/views/user/Home.vue"),
                meta: { title: "首页" },
            },
            {
                path: "notice",
                name: "UserNotice",
                component: () => import("@/views/user/Notice.vue"),
                meta: { title: "公告" },
            },
            {
                path: "profile",
                name: "UserProfile",
                component: () => import("@/views/user/Profile.vue"),
                meta: { title: "个人中心", requiresAuth: true },
            },
            {
                path: "notice/:id",
                name: "NoticeDetail",
                component: () => import("@/views/user/NoticeDetail.vue"),
                meta: { title: "公告详情" },
            },
        ],
    },
    // 管理端路由
    {
        path: "/admin",
        component: () => import("@/layouts/AdminLayout.vue"),
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
            {
                path: "dashboard",
                name: "Dashboard",
                component: () => import("@/views/admin/Dashboard.vue"),
                meta: { title: "仪表盘" },
            },
            {
                path: "user",
                name: "UserManage",
                component: () => import("@/views/admin/UserManage.vue"),
                meta: { title: "用户管理" },
            },
            {
                path: "notice",
                name: "NoticeManage",
                component: () => import("@/views/admin/NoticeManage.vue"),
                meta: { title: "公告管理" },
            },
            {
                path: "log",
                name: "LogManage",
                component: () => import("@/views/admin/LogManage.vue"),
                meta: { title: "日志管理" },
            },
            {
                path: "profile",
                name: "AdminProfile",
                component: () => import("@/views/admin/Profile.vue"),
                meta: { title: "个人中心" },
            },
            {
                path: "status",
                name: "SystemStatus",
                component: () => import("@/views/admin/SystemStatus.vue"),
                meta: { title: "系统状态" },
            },
        ],
    },
    // 登录页
    {
        path: "/login",
        name: "Login",
        component: () => import("@/views/Login.vue"),
        meta: { title: "登录" },
    },
    // 注册页
    {
        path: "/register",
        name: "Register",
        component: () => import("@/views/Register.vue"),
        meta: { title: "注册" },
    },
    // 404
    {
        path: "/:pathMatch(.*)*",
        component: () => import("@/views/NotFound.vue"),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
    const userStore = useUserStore();

    // 需要登录
    if (to.meta.requiresAuth && !userStore.token) {
        next("/login");
        return;
    }

    // 需要管理员权限
    if (to.meta.requiresAdmin && userStore.userInfo?.role !== "admin") {
        next("/user/home");
        return;
    }

    next();
});

export default router;
