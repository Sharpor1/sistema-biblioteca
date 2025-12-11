import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchUsuarios, createUsuario } from '../services/usuariosService';

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
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'No se pudo crear el usuario';
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
            <input placeholder="Ingresa el RUT del usuario" className="w-full rounded-lg border px-3 py-2 bg-slate-50" />
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded text-sm text-slate-600">RUTs de prueba: 12345678-9 (Alumno), 23456789-0 (Docente)</div>
        </div>

        <div className="mt-6 bg-white rounded-xl p-6">
          <h3 className="font-semibold mb-4">Usuarios Recientes</h3>
          {loading ? (
            <div className="text-sm text-slate-500">Cargando...</div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div 
                  key={u.id} 
                  className="border rounded p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    setSelectedUser(u);
                    setShowUserDetails(true);
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.nombreCompleto}</span>
                      {u.tipoUsuario && (
                        u.tipoUsuario.toLowerCase().includes('docente') || u.tipoUsuario.toLowerCase().includes('profesor') ? (
                          <span className="text-base" title="Docente">👨‍🏫</span>
                        ) : (
                          <span className="text-base" title="Estudiante">🎓</span>
                        )
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{u.rut} • {u.tipoUsuario || tiposUsuario.find(t => t.idTipo === u.rol)?.nombre}</div>
                  </div>
                  <div className="text-sm text-slate-500">{u.contacto}</div>
                </div>
              ))}
            </div>
          )}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Detalles del Usuario</h3>
                {selectedUser.tipoUsuario && (
                  selectedUser.tipoUsuario.toLowerCase().includes('docente') || selectedUser.tipoUsuario.toLowerCase().includes('profesor') ? (
                    <span className="text-lg" title="Docente">👨‍🏫</span>
                  ) : (
                    <span className="text-lg" title="Estudiante">🎓</span>
                  )
                )}
              </div>
              <button onClick={() => setShowUserDetails(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            
            <div className="p-6 space-y-4">
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
