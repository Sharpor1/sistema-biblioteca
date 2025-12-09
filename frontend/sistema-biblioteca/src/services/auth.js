import api from '../api/axios';

export const loginUser = async (email, password) => {
    try {
        const response = await api.post('/token/',{
            email : email,
            password :password
        });

        if (response.data.access) {
            localStorage.setItem('accessToken', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
        }

        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
};