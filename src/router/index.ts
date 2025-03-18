import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        meta: { requiresAuth: true },
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
    },
    {
        path: '/playlist/detail',
        name: 'PlaylistDetail',
        component: () => import('../views/PlaylistDetail.vue')
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

router.beforeEach((to, from, next) => {
    const loginData = localStorage.getItem('loginData') // 你的登录标识
    // 未登录且前往的不是登录页
    if (!loginData && to.name !== 'Login') {
        next({ name: 'Login' })
    }
    // 已登录且要访问登录页
    else if (loginData && to.name === 'Login') {
        next({ name: 'Home' })
    }
    // 正常放行
    else {
        next()
    }
})


export default router
