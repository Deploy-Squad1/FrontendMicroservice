import axios from 'axios';
import router from './router';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});
const mapApi = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

const setupInterceptors = (axiosInstance) => {
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/token/refresh/' && originalRequest.url !== '/passcode/verify/') {
                originalRequest._retry = true;
                try{
                    await api.post('/token/refresh/');
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('isAuthenticated');
                    router.push('/login');
                    return Promise.reject(refreshError);
                }
        }
        return Promise.reject(error);
});
}
setupInterceptors(api);
setupInterceptors(mapApi);
export { api, mapApi };
