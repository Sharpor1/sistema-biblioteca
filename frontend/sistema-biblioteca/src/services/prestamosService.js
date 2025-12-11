import api from '../api/axios';

export const fetchPrestamos = async () => {
  const { data } = await api.get('/ops/prestamos/');
  return data;
};

export const createPrestamo = async (payload) => {
  const { data } = await api.post('/ops/prestamos/', payload);
  return data;
};

export const devolverPrestamo = async (idPrestamo) => {
  const { data } = await api.post(`/ops/prestamos/${idPrestamo}/devolver-prestamo/`);
  return data;
};

export const renovarPrestamo = async (idPrestamo) => {
  const { data } = await api.post(`/ops/prestamos/${idPrestamo}/renovar-prestamo/`);
  return data;
};
