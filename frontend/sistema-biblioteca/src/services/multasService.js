import api from '../api/axios';

export const fetchMultas = async () => {
  const response = await api.get('/ops/multas/');
  return response.data;
};

export const createMulta = async (multaData) => {
  const response = await api.post('/ops/multas/', multaData);
  return response.data;
};

export const updateMulta = async (idMulta, multaData) => {
  const response = await api.put(`/ops/multas/${idMulta}/`, multaData);
  return response.data;
};
