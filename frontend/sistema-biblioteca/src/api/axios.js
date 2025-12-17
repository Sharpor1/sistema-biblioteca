import axios from 'axios';

// Cambiar entre desarrollo local y producción
const isDevelopment = import.meta.env.DEV;

const api = axios.create({
    baseURL: isDevelopment 
        ? 'http://127.0.0.1:8000/api'  // Desarrollo local
        : 'https://rinconcitomagico-d2ejfmc8aebdbqag.canadacentral-01.azurewebsites.net/api',  // Producción Azure
});

// Variable para evitar múltiples solicitudes de refresh simultáneas
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// INTERCEPTOR DE PETICIONES (REQUEST)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// INTERCEPTOR DE RESPUESTAS (RESPONSE) - Con refresh token automático
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no hemos intentado refresh aún
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Si ya hay un refresh en progreso, poner esta petición en cola
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                // No hay refresh token, ir al login
                localStorage.removeItem('token');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Intentar renovar el token
                const response = await axios.post(
                    `${api.defaults.baseURL}/auth/token/refresh/`,
                    { refresh: refreshToken }
                );

                const newAccessToken = response.data.access;

                // Guardar el nuevo token
                localStorage.setItem('token', newAccessToken);
                localStorage.setItem('accessToken', newAccessToken);

                // Actualizar el header de la petición original
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Procesar la cola de peticiones pendientes
                processQueue(null, newAccessToken);

                // Reintentar la petición original
                return api(originalRequest);

            } catch (refreshError) {
                // El refresh token también expiró o es inválido
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;