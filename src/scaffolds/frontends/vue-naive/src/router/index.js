import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/', redirect: '/user/home' },
  {
    path: '/user',
    component: () => import('@/layouts/UserLayout.vue'),
    children: [
      { path: 'home', component: () => import('@/views/user/Home.vue') },
      { path: 'notice', component: () => import('@/views/user/Notice.vue') },
      { path: 'notice/:id', component: () => import('@/views/user/NoticeDetail.vue') },
      {
        path: 'profile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'user', component: () => import('@/views/admin/UserManage.vue') },
      { path: 'notice', component: () => import('@/views/admin/NoticeManage.vue') },
      { path: 'log', component: () => import('@/views/admin/LogManage.vue') },
      { path: 'profile', component: () => import('@/views/admin/Profile.vue') },
      {
        path: 'status',
        component: () => import('@/views/admin/SystemStatus.vue'),
        meta: { title: '系统状态' }
      }
    ]
  },
  { path: '/login', component: () => import('@/views/Login.vue') },
  { path: '/register', component: () => import('@/views/Register.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.token) return next('/login')
  if (to.meta.requiresAdmin && userStore.userInfo?.role !== 'admin') return next('/user/home')
  next()
})

export default router
