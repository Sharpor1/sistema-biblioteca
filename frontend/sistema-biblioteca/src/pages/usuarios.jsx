import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchUsuarios, createUsuario } from '../services/usuariosService';
import { fetchPrestamos } from '../services/prestamosService';
import { fetchMultas } from '../services/multasService';

export default function Usuarios() {
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [tiposUsuario] = useState([
    { idTipo: 1, nombre: 'Estudiante', diasPrestamoMax: 14 },
    { idTipo: 2, nombre: 'Docente', diasPrestamoMax: 21 }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [userPrestamos, setUserPrestamos] = useState([]);
  const [userMultas, setUserMultas] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [form, setForm] = useState({ rut: '', nombreCompleto: '', contacto: '', rol: 1, estado: 'activo' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchUsuarios();
        setUsers(data);
      } catch (err) {
        setError('No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function openModal() {
    setForm({ rut: '', nombreCompleto: '', contacto: '', rol: 1, estado: 'activo' });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: name === 'rol' ? Number(value) : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.rut) e.rut = 'RUT requerido';
    if (!form.nombreCompleto) e.nombreCompleto = 'Nombre requerido';
    if (!form.contacto) e.contacto = 'Email requerido';
    return e;
  }

  async function registerUser(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    try {
      console.log('Enviando usuario:', form);
      const created = await createUsuario(form);
      setUsers((u) => [created, ...u]);
      setModalOpen(false);
      setForm({ rut: '', nombreCompleto: '', contacto: '', rol: 1, estado: 'activo' });
      setError('');
    } catch (err) {
      console.error('Error creando usuario:', err);
      if (err.response?.data?.rol) {
        setError('Error: Los tipos de usuario no existen en la base de datos. Por favor, créalos primero en Django Admin (/admin).');
      } else {
        // Procesar mensajes de error del backend
        let errorMsg = 'No se pudo crear el usuario';
        if (err.response?.data) {
          const data = err.response.data;
          const mensajes = [];
          
          if (data.rut) {
            mensajes.push('El RUT ya está registrado en el sistema');
          }
          if (data.contacto) {
            mensajes.push('El contacto (email/teléfono) ya está registrado');
          }
          if (data.nombreCompleto) {
            mensajes.push('Nombre completo: ' + (Array.isArray(data.nombreCompleto) ? data.nombreCompleto[0] : data.nombreCompleto));
          }
          if (data.detail) {
            mensajes.push(data.detail);
          }
          
          // Si no hay mensajes específicos, usar el JSON completo
          if (mensajes.length > 0) {
            errorMsg = mensajes.join('. ');
          } else if (typeof data === 'string') {
            errorMsg = data;
          } else {
            errorMsg = JSON.stringify(data);
          }
        }
        setError(`Error: ${errorMsg}`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
            <p className="text-slate-500 text-sm">Busca y administra información de alumnos y docentes</p>
          </div>
          <div>
            <button onClick={openModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Registrar Nuevo Usuario</button>
          </div>
        </header>

        <div className="bg-white rounded-xl p-6">
          {error && <div className="mb-3 text-rose-600 text-sm">{error}</div>}
          <div className="mb-4">
            <label className="block text-sm text-slate-600">Buscar Usuario</label>
            <input 
              placeholder="Busca por nombre, RUT o email" 
              className="w-full rounded-lg border px-3 py-2 bg-slate-50"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="mt-3 bg-white rounded-xl p-6">
          <h3 className="font-semibold mb-4">Usuarios Recientes</h3>
          {loading ? (
            <div className="text-sm text-slate-500">Cargando...</div>
          ) : (() => {
            // Filtrar usuarios
            const filteredUsers = users.filter(u => {
              if (!searchTerm) return true;
              const search = searchTerm.toLowerCase();
              return u.nombreCompleto?.toLowerCase().includes(search) ||
                     u.rut?.toLowerCase().includes(search) ||
                     u.contacto?.toLowerCase().includes(search);
            });

            // Calcular paginación
            const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentUsers = filteredUsers.slice(startIndex, endIndex);

            return (
              <>
                <div className="space-y-3">
                  {currentUsers.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-8">No se encontraron usuarios</div>
                  ) : (
                    currentUsers.map((u) => (
                      <div 
                        key={u.id} 
                        className="border rounded p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={async () => {
                          setSelectedUser(u);
                          setShowUserDetails(true);
                          setLoadingDetails(true);
                          try {
                            const [prestamos, multas] = await Promise.all([
                              fetchPrestamos(),
                              fetchMultas()
                            ]);
                            // Filtrar solo préstamos activos o atrasados del usuario
                            const prestamosUsuario = prestamos.filter(p => {
                              const esDelUsuario = p.lector?.id === u.id || p.lector === u.id;
                              const estadoValido = p.estado === 'activo' || p.estado === 'atrasado';
                              return esDelUsuario && estadoValido;
                            });
                            
                            // Filtrar multas del usuario
                            const multasUsuario = multas.filter(m => {
                              return m.lector?.id === u.id || m.lector === u.id || m.idPrestamo?.lector?.id === u.id;
                            });
                            
                            setUserPrestamos(prestamosUsuario);
                            setUserMultas(multasUsuario);
                          } catch (err) {
                            console.error('Error cargando detalles:', err);
                          } finally {
                            setLoadingDetails(false);
                          }
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.nombreCompleto}</span>
                            {u.tipoUsuario && (
                              u.tipoUsuario.toLowerCase().includes('docente') || u.tipoUsuario.toLowerCase().includes('profesor') ? (
                                <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24" title="Docente">
                                  <path d="M12 2L1 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-11-5zm0 2.18l9 4.09v6.73c0 4.52-3.07 8.78-7.5 10.08V14l-1.5-1.5-1.5 1.5v11.08C6.07 23.78 3 19.52 3 15V8.27l9-4.09z"/>
                                  <circle cx="12" cy="10" r="3"/>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24" title="Estudiante">
                                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                                </svg>
                              )
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{u.rut} • {u.tipoUsuario || tiposUsuario.find(t => t.idTipo === u.rol)?.nombre}</div>
                        </div>
                        <div className="text-sm text-slate-500">{u.contacto}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-slate-600">
                      Mostrando {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        ← Anterior
                      </button>
                      <span className="px-3 py-1 text-sm text-slate-600">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Usuario</h3>
            <form onSubmit={registerUser} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600">RUT *</label>
                <input name="rut" value={form.rut} onChange={handleChange} className={`w-full rounded px-3 py-2 border ${errors.rut ? 'border-rose-400' : 'border-slate-200'}`} placeholder="12345678-9" />
                {errors.rut && <div className="text-rose-600 text-sm mt-1">{errors.rut}</div>}
              </div>
              <div>
                <label className="block text-sm text-slate-600">Nombre Completo *</label>
                <input name="nombreCompleto" value={form.nombreCompleto} onChange={handleChange} className={`w-full rounded px-3 py-2 border ${errors.nombreCompleto ? 'border-rose-400' : 'border-slate-200'}`} placeholder="Juan Pérez García" />
                {errors.nombreCompleto && <div className="text-rose-600 text-sm mt-1">{errors.nombreCompleto}</div>}
              </div>
              <div>
                <label className="block text-sm text-slate-600">Email (Contacto) *</label>
                <input name="contacto" value={form.contacto} onChange={handleChange} className={`w-full rounded px-3 py-2 border ${errors.contacto ? 'border-rose-400' : 'border-slate-200'}`} placeholder="juan.perez@ejemplo.cl" />
                {errors.contacto && <div className="text-rose-600 text-sm mt-1">{errors.contacto}</div>}
              </div>
              <div>
                <label className="block text-sm text-slate-600">Tipo de Usuario *</label>
                <select name="rol" value={form.rol} onChange={handleChange} className="w-full rounded px-3 py-2 border border-slate-200">
                  {tiposUsuario.map((tipo) => (
                    <option key={tipo.idTipo} value={tipo.idTipo}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={closeModal} className="px-3 py-1 border rounded">Cancelar</button>
                <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Registrar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Usuario */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full mx-4 my-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Detalles del Usuario</h3>
                {selectedUser.tipoUsuario && (
                  selectedUser.tipoUsuario.toLowerCase().includes('docente') || selectedUser.tipoUsuario.toLowerCase().includes('profesor') ? (
                    <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24" title="Docente">
                      <path d="M12 2L1 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-11-5zm0 2.18l9 4.09v6.73c0 4.52-3.07 8.78-7.5 10.08V14l-1.5-1.5-1.5 1.5v11.08C6.07 23.78 3 19.52 3 15V8.27l9-4.09z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24" title="Estudiante">
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                    </svg>
                  )
                )}
              </div>
              <button onClick={() => setShowUserDetails(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Nombre Completo</p>
                <p className="text-base font-semibold text-slate-900">{selectedUser.nombreCompleto}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">RUT</p>
                  <p className="text-sm font-medium text-slate-900">{selectedUser.rut}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Tipo</p>
                  <p className="text-sm font-medium text-slate-900">{selectedUser.tipoUsuario || selectedUser.rol?.nombre || 'N/A'}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Contacto (Email)</p>
                <p className="text-sm font-medium text-slate-900">{selectedUser.contacto || 'No registrado'}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedUser.estado === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedUser.estado === 'activo' ? 'Activo' : 'Bloqueado'}
                </span>
              </div>

              {selectedUser.rol && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold mb-2">Límites de Préstamo</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-600">Días Mínimo</p>
                      <p className="font-semibold text-slate-900">{selectedUser.rol.diasPrestamoMin || 'N/A'} días</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Días Máximo</p>
                      <p className="font-semibold text-slate-900">{selectedUser.rol.diasPrestamoMax || 'N/A'} días</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Libros Simultáneos</p>
                      <p className="font-semibold text-slate-900">{selectedUser.rol.cupoPrestamoMax || 'N/A'} libros</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Renovaciones</p>
                      <p className="font-semibold text-slate-900">{selectedUser.rol.maxRenovaciones || 'N/A'} veces</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Préstamos Activos */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span>📚</span> Préstamos Activos
                </h4>
                {loadingDetails ? (
                  <div className="text-sm text-slate-500 text-center py-4">Cargando...</div>
                ) : userPrestamos.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No tiene préstamos activos</div>
                ) : (
                  <div className="space-y-2">
                    {userPrestamos.map((prestamo) => {
                      const fechaDevolucion = new Date(prestamo.fecha_devolucion);
                      const hoy = new Date();
                      const diasRetraso = Math.floor((hoy - fechaDevolucion) / (1000 * 60 * 60 * 24));
                      const estaRetrasado = prestamo.estado === 'atrasado' || (prestamo.estado === 'activo' && diasRetraso > 0);
                      
                      return (
                        <div key={prestamo.idPrestamo} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 text-sm">{prestamo.libro?.titulo || 'Libro no disponible'}</p>
                              <div className="mt-1 space-y-1">
                                <p className="text-xs text-slate-600">
                                  <span className="font-medium">Fecha préstamo:</span> {new Date(prestamo.fecha_prestamo).toLocaleDateString('es-CL')}
                                </p>
                                <p className="text-xs text-slate-600">
                                  <span className="font-medium">Fecha entrega:</span> {fechaDevolucion.toLocaleDateString('es-CL')}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              estaRetrasado ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {estaRetrasado ? `Retrasado (${diasRetraso}d)` : 'Al día'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Deudas */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span>💰</span> Deudas
                </h4>
                {loadingDetails ? (
                  <div className="text-sm text-slate-500 text-center py-4">Cargando...</div>
                ) : userMultas.length === 0 ? (
                  <div className="text-sm text-emerald-600 text-center py-4 bg-emerald-50 rounded-lg font-medium">✓ Sin deudas pendientes</div>
                ) : (
                  <div className="space-y-2">
                    {userMultas.map((multa) => (
                      <div key={multa.idMulta} className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-rose-900 text-sm">{multa.prestamo?.libro?.titulo || 'Libro no disponible'}</p>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-rose-700">
                                <span className="font-medium">Días de retraso:</span> {multa.diasRetraso || 'N/A'} días
                              </p>
                              <p className="text-xs text-rose-700">
                                <span className="font-medium">Estado:</span> {multa.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-rose-700">${multa.monto?.toLocaleString('es-CL') || '0'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-slate-100 p-3 rounded-lg border-2 border-slate-300">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-slate-900">Total Deudas:</p>
                        <p className="text-xl font-bold text-rose-700">
                          ${userMultas.reduce((sum, m) => sum + (m.monto || 0), 0).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button 
                onClick={() => setShowUserDetails(false)}
                className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
