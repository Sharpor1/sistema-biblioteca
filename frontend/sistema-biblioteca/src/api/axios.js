import axios from 'axios';

// Cambiar entre desarrollo local y producción
const isDevelopment = import.meta.env.DEV;

const api = axios.create({
    baseURL: isDevelopment 
        ? 'http://127.0.0.1:8000/api'  // Desarrollo local
        : 'https://rinconcitomagico-d2ejfmc8aebdbqag.canadacentral-01.azurewebsites.net/api',  // Producción Azure
});

// INTERCEPTOR DE PETICIONES (REQUEST)
// "Antes de que la petición salga hacia Django, haz esto:"
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Django DRF espera: 'Bearer <token>' o 'Token <token>'
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// INTERCEPTOR DE RESPUESTAS (RESPONSE) - Opcional pero recomendado
// "Si Django responde 401 (No autorizado), sácame del sistema"
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // El token expiró o es falso
            localStorage.removeItem('token');
            window.location.href = '/login'; // Forzar redirección al login
        }
        return Promise.reject(error);
    }
);

export default api;