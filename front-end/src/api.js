import axios from 'axios';
import router from './router';

const api = axios.create({
    baseURL: `/core/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});
const mapApi = axios.create({
    baseURL: `/map/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});
const emailApi = axios.create({
    baseURL: `/email`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});
const votingApi = axios.create({
    baseURL: `/voting/api`,
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
            if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/token/refresh/'
                && originalRequest.url !== '/passcode/verify/' && originalRequest.url !== '/login/') {
                originalRequest._retry = true;
                try{
                    await api.post('/token/refresh/');
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('isAuthenticated');
                    router.push('/');
                    return Promise.reject(refreshError);
                }
        }
        return Promise.reject(error);
});
}
setupInterceptors(api);
setupInterceptors(mapApi);
setupInterceptors(emailApi);
setupInterceptors(votingApi);
export { api, mapApi, emailApi, votingApi };
