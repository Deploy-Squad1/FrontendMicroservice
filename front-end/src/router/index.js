import {createRouter, createWebHistory} from 'vue-router'
import Gatekeeper from "../pages/Gatekeeper.vue";
import Register from "../pages/Register.vue"
import Login from "../pages/Login.vue"
import Map from "../pages/Map.vue"

const routes = [
    {path: '/', name: 'Gatekeeper', component: Gatekeeper},
    {path: '/register', name: 'Register', component: Register},
    {path: '/login', name: 'Login', component: Login},
    {path: '/map', name: 'Map', component: Map},
    {path: '/:pathMatch(.*)*', redirect: '/'}
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const publicPages = ['Gatekeeper', 'Login', 'Register'];
    if (!publicPages.includes(to.name) && !isAuthenticated) {
        next('/login/');
    }
    if(to.path === '/login') {
        const passcode = sessionStorage.getItem('passcode');
        if (!passcode) {
            return next('/');
        }
        try {
            await api.post('/passcode/verify/', { passcode: passcode });
            return next();
        } catch (error) {
            sessionStorage.removeItem('passcode');
            return next('/');
        }
    }
    next();
})
export default router
