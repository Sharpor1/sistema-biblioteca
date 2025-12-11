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

export const darBajaEjemplar = async (codigoEjemplar, libroId) => {
  try {
    // Obtener todos los ejemplares
    const { data: todosEjemplares } = await api.get('/inventario/ejemplares/');
    
    // Buscar el ejemplar que coincida con el código Y el libro
    const ejemplar = todosEjemplares.find(e => 
      e.codigoEjemplar === codigoEjemplar && e.libro === libroId
    );
    
    if (!ejemplar) {
      throw new Error(`Ejemplar con código ${codigoEjemplar} no encontrado`);
    }
    
    if (!ejemplar.id) {
      throw new Error('El ejemplar no tiene ID');
    }
    
    // Usar el ID del ejemplar para dar de baja
    const { data } = await api.post(`/inventario/ejemplares/${ejemplar.id}/dar-baja/`);
    return data;
  } catch (error) {
    console.error('Error en darBajaEjemplar:', error);
    throw error;
  }
};

export const activarEjemplar = async (codigoEjemplar, libroId) => {
  try {
    // Obtener todos los ejemplares
    const { data: todosEjemplares } = await api.get('/inventario/ejemplares/');
    
    // Buscar el ejemplar que coincida con el código Y el libro
    const ejemplar = todosEjemplares.find(e => 
      e.codigoEjemplar === codigoEjemplar && e.libro === libroId
    );
    
    if (!ejemplar) {
      throw new Error(`Ejemplar con código ${codigoEjemplar} no encontrado`);
    }
    
    if (!ejemplar.id) {
      throw new Error('El ejemplar no tiene ID');
    }
    
    // Usar el ID del ejemplar para activar
    const { data } = await api.post(`/inventario/ejemplares/${ejemplar.id}/activar/`);
    return data;
  } catch (error) {
    console.error('Error en activarEjemplar:', error);
    throw error;
  }
};

