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
                path: "mall",
                name: "Mall",
                component: () => import("@/views/user/Mall.vue"),
                meta: { title: "商城" },
            },
            {
                path: "product/:id",
                name: "ProductDetail",
                component: () => import("@/views/user/ProductDetail.vue"),
                meta: { title: "商品详情" },
            },
            {
                path: "cart",
                name: "Cart",
                component: () => import("@/views/user/Cart.vue"),
                meta: { title: "购物车", requiresAuth: true },
            },
            {
                path: "checkout",
                name: "Checkout",
                component: () => import("@/views/user/Checkout.vue"),
                meta: { title: "确认订单", requiresAuth: true },
            },
            {
                path: "order",
                name: "MyOrder",
                component: () => import("@/views/user/MyOrder.vue"),
                meta: { title: "我的订单", requiresAuth: true },
            },
            {
                path: "apply-shop",
                name: "ApplyShop",
                // 与商家端共用同一个页面：没店时是申请表单，有店时显示审核状态
                component: () => import("@/views/merchant/Shop.vue"),
                meta: { title: "申请开店", requiresAuth: true },
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
    // 商家端路由
    {
        path: "/merchant",
        component: () => import("@/layouts/MerchantLayout.vue"),
        meta: { requiresAuth: true, requiresMerchant: true },
        children: [
            {
                path: "shop",
                name: "MerchantShop",
                component: () => import("@/views/merchant/Shop.vue"),
                meta: { title: "店铺信息" },
            },
            {
                path: "product",
                name: "MerchantProduct",
                component: () => import("@/views/merchant/ProductManage.vue"),
                meta: { title: "商品管理" },
            },
            {
                path: "order",
                name: "MerchantOrder",
                component: () => import("@/views/merchant/OrderManage.vue"),
                meta: { title: "订单管理" },
            },
            {
                path: "refund",
                name: "MerchantRefund",
                component: () => import("@/views/merchant/RefundAudit.vue"),
                meta: { title: "退款审核" },
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
                path: "merchant",
                name: "MerchantManage",
                component: () => import("@/views/admin/MerchantManage.vue"),
                meta: { title: "店铺审核" },
            },
            {
                path: "category",
                name: "CategoryManage",
                component: () => import("@/views/admin/CategoryManage.vue"),
                meta: { title: "分类管理" },
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

    // 需要商家权限，管理员也放行，与后端 JwtInterceptor 的判断保持一致
    if (
        to.meta.requiresMerchant &&
        !["merchant", "admin"].includes(userStore.userInfo?.role)
    ) {
        next("/user/home");
        return;
    }

    next();
});

export default router;
