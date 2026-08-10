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
                path: "service",
                name: "ServiceList",
                component: () => import("@/views/user/ServiceList.vue"),
                meta: { title: "找服务" },
            },
            {
                path: "service/:id",
                name: "ServiceDetail",
                component: () => import("@/views/user/ServiceDetail.vue"),
                meta: { title: "服务详情" },
            },
            {
                path: "appointment",
                name: "MyAppointment",
                component: () => import("@/views/user/MyAppointment.vue"),
                meta: { title: "我的预约", requiresAuth: true },
            },
            {
                path: "apply-provider",
                name: "ApplyProvider",
                // 与机构端共用同一个页面：没机构时是申请表单，有机构时显示审核状态
                component: () => import("@/views/provider/Shop.vue"),
                meta: { title: "申请入驻", requiresAuth: true },
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
    // 机构端路由
    {
        path: "/provider",
        component: () => import("@/layouts/ProviderLayout.vue"),
        meta: { requiresAuth: true, requiresProvider: true },
        children: [
            {
                path: "shop",
                name: "ProviderShop",
                component: () => import("@/views/provider/Shop.vue"),
                meta: { title: "机构信息" },
            },
            {
                path: "service",
                name: "ProviderService",
                component: () => import("@/views/provider/ServiceManage.vue"),
                meta: { title: "服务项管理" },
            },
            {
                path: "schedule",
                name: "ProviderSchedule",
                component: () => import("@/views/provider/ScheduleManage.vue"),
                meta: { title: "排班管理" },
            },
            {
                path: "appointment",
                name: "ProviderAppointment",
                component: () =>
                    import("@/views/provider/AppointmentManage.vue"),
                meta: { title: "预约管理" },
            },
            {
                path: "review",
                name: "ProviderReview",
                component: () => import("@/views/provider/ReviewManage.vue"),
                meta: { title: "评价管理" },
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
                path: "provider",
                name: "ProviderManage",
                component: () => import("@/views/admin/ProviderManage.vue"),
                meta: { title: "机构审核" },
            },
            {
                path: "category",
                name: "ServiceCategoryManage",
                component: () =>
                    import("@/views/admin/ServiceCategoryManage.vue"),
                meta: { title: "分类管理" },
            },
            {
                path: "appointment",
                name: "AppointmentManage",
                component: () => import("@/views/admin/AppointmentManage.vue"),
                meta: { title: "预约总览" },
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

    // 需要机构权限，管理员也放行，与后端 JwtInterceptor 的判断保持一致
    if (
        to.meta.requiresProvider &&
        !["provider", "admin"].includes(userStore.userInfo?.role)
    ) {
        next("/user/home");
        return;
    }

    next();
});

export default router;
