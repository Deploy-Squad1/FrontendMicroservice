import {createRouter, createWebHistory} from 'vue-router'
import Gatekeeper from "../pages/Gatekeeper.vue";
import Register from "../pages/Register.vue"
import Login from "../pages/Login.vue"

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

export default router
