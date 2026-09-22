import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }
    return config;
})

api.interceptors.response.use(
    (response) => response, 
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const storedRefreshToken = localStorage.getItem("refreshToken");
                
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/refresh`, {
                    refreshToken: storedRefreshToken
                });
                
                const { token, refreshToken } = res.data;
                localStorage.setItem('token', token);
                localStorage.setItem("refreshToken", refreshToken);
                
                originalRequest.headers.Authorization = `Bearer ${token}`;
                
                return api(originalRequest)
            }catch(refreshError) {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                
                window.location.href = "/signin";
                
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;