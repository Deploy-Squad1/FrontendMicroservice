import {createRouter, createWebHistory} from 'vue-router'
import Gatekeeper from "../pages/Gatekeeper.vue";
import Register from "../pages/Register.vue"
import Login from "../pages/Login.vue"
import api from "@/api.js";

const routes = [
    {path: '/', name: 'Gatekeeper', component: Gatekeeper},
    {path: '/register', name: 'Register', component: Register},
    {path: '/login', name: 'Login', component: Login},
    {path: '/:pathMatch(.*)*', redirect: '/'}
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    try {
        await api.get('/ip/check/');
    } catch (error) {
        if (error.response.status === 403) {
            window.location.href = error.response.data['redirect'];
            return false;
        }
        throw error;
    }

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const publicPages = ['Gatekeeper', 'Login', 'Register'];
    if (!publicPages.includes(to.name) && !isAuthenticated) {
        next('/login');
    } else {
        next();
    }
})
export default router
