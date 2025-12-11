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
      const created = await createUsuario(form);
      setUsers((u) => [created, ...u]);
      setModalOpen(false);
    } catch (err) {
      setError('No se pudo crear el usuario');
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
                <div key={u.id} className="border rounded p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{u.nombreCompleto}</div>
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
    </div>
  );
}
