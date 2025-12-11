import api from '../api/axios';

export const fetchUsuarios = async () => {
  const { data } = await api.get('/auth/usuarios/');
  return data;
};

export const createUsuario = async (payload) => {
  const { data } = await api.post('/auth/usuarios/', payload);
  return data;
};
