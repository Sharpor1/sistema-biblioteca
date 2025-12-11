import api from '../api/axios';

export const fetchLibros = async () => {
  const { data } = await api.get('/inventario/libros/');
  return data;
};

export const fetchEjemplares = async () => {
  const { data } = await api.get('/inventario/ejemplares/');
  return data;
};

export const createLibro = async (payload) => {
  const { data } = await api.post('/inventario/libros/', payload);
  return data;
};

export const createEjemplar = async (payload) => {
  const { data } = await api.post('/inventario/ejemplares/', payload);
  return data;
};

export const updateLibro = async (idLibro, payload) => {
  const { data } = await api.put(`/inventario/libros/${idLibro}/`, payload);
  return data;
};

export const updateEjemplar = async (idEjemplar, payload) => {
  const { data } = await api.put(`/inventario/ejemplares/${idEjemplar}/`, payload);
  return data;
};

export const darBajaEjemplar = async (idEjemplar) => {
  const { data } = await api.post(`/inventario/ejemplares/${idEjemplar}/dar-baja/`);
  return data;
};
