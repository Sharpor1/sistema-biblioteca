import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchUsuarios } from '../services/usuariosService';
import { fetchEjemplares } from '../services/librosService';
import { createPrestamo } from '../services/prestamosService';

export default function NuevoPrestamo() {
  const [rut, setRut] = useState('');
  const [codigoEjemplar, setCodigoEjemplar] = useState('LIB001');
  const [usuarioValid, setUsuarioValid] = useState(null);
  const [ejemplarValid, setEjemplarValid] = useState(null);
  const [dias, setDias] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [u, e] = await Promise.all([fetchUsuarios(), fetchEjemplares()]);
        setUsuarios(u);
        setEjemplares(e);
      } catch (err) {
        setError('No se pudieron cargar usuarios o ejemplares');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function validarUsuario() {
    if (!rut) return setUsuarioValid({ ok: false, msg: 'Ingrese RUT' });
    const usuario = usuarios.find((u) => u.rut === rut);
    if (usuario) {
      const diasMax = usuario.rol?.diasPrestamoMax || usuario.rol?.diasPrestamoMin || usuario.diasPrestamo || 0;
      setDias(diasMax);
      return setUsuarioValid({ ok: true, msg: `Usuario válido (${usuario.tipoUsuario || 'Tipo no especificado'}) - ${diasMax} días`, tipo: usuario.tipoUsuario, id: usuario.id });
    }
    return setUsuarioValid({ ok: false, msg: 'Usuario no encontrado' });
  }

  function validarEjemplar() {
    if (!codigoEjemplar) return setEjemplarValid({ ok: false, msg: 'Ingrese código' });
    const ej = ejemplares.find((e) => e.codigoEjemplar === codigoEjemplar && e.estado?.toLowerCase() === 'disponible');
    if (ej) return setEjemplarValid({ ok: true, msg: 'Ejemplar válido', id: ej.id || ej.codigoEjemplar });
    return setEjemplarValid({ ok: false, msg: 'Ejemplar no encontrado o no disponible' });
  }

  const canRegister = usuarioValid && usuarioValid.ok && ejemplarValid && ejemplarValid.ok;

  async function registrarPrestamo() {
    if (!canRegister) return;
    try {
      await createPrestamo({
        lector: usuarioValid.id,
        codigoEjemplar: ejemplarValid.id,
      });
      alert('Préstamo registrado');
    } catch (err) {
      setError('No se pudo registrar el préstamo');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Registro de Préstamos</h1>
          <p className="text-slate-500 text-sm">Crea nuevos préstamos y valida requisitos</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h3 className="font-semibold mb-4">Datos del Préstamo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">RUT del Usuario</label>
                <div className="flex gap-3">
                  <input value={rut} onChange={(e) => setRut(e.target.value)} className="flex-1 rounded-lg border px-3 py-2 bg-slate-50" placeholder="12345678-9" />
                  <button onClick={validarUsuario} className="bg-indigo-600 text-white px-4 rounded-lg">Validar</button>
                </div>
                {usuarioValid && <div className={`mt-2 text-sm ${usuarioValid.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{usuarioValid.msg}</div>}
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Código de Ejemplar</label>
                <div className="flex gap-3">
                  <input value={codigoEjemplar} onChange={(e) => setCodigoEjemplar(e.target.value)} className="flex-1 rounded-lg border px-3 py-2 bg-slate-50" />
                  <button onClick={validarEjemplar} className="bg-indigo-600 text-white px-4 rounded-lg">Validar</button>
                </div>
                {ejemplarValid && <div className={`mt-2 text-sm ${ejemplarValid.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{ejemplarValid.msg}</div>}
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Días de Préstamo (Automático)</label>
                <input type="number" value={dias} disabled className="w-full rounded-lg border px-3 py-2 bg-slate-100 text-slate-600 cursor-not-allowed" />
                <p className="text-xs text-slate-500 mt-1">Se calcula automáticamente según el tipo de usuario</p>
              </div>

              <div className="mt-4 bg-indigo-50 border border-indigo-100 p-3 rounded">
                <strong className="text-sm">Datos cargados:</strong>
                <div className="text-sm text-slate-600 mt-2">Usuarios: {usuarios.length}</div>
                <div className="text-sm text-slate-600 mt-1">Ejemplares disponibles: {ejemplares.filter(e => e.estado?.toLowerCase() === 'disponible').length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold mb-4">Estado de Validación</h3>
            <div className="min-h-[200px] text-sm text-slate-600">
              {error && <div className="text-rose-600 mb-2">{error}</div>}
              {loading && <div>Cargando...</div>}
              {!usuarioValid && !ejemplarValid && !loading && <div>Presiona "Validar" para ver el estado.</div>}
              {usuarioValid && <div className={`${usuarioValid.ok ? 'text-emerald-600' : 'text-rose-600'}`}>Usuario: {usuarioValid.msg}</div>}
              {ejemplarValid && <div className={`${ejemplarValid.ok ? 'text-emerald-600' : 'text-rose-600'}`}>Ejemplar: {ejemplarValid.msg}</div>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 mt-6 flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Confirmar Préstamo</h4>
            <p className="text-sm text-slate-500">Completa las validaciones para continuar</p>
          </div>
          <div>
            <button disabled={!canRegister} onClick={registrarPrestamo} className={`px-4 py-2 rounded-lg ${canRegister ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Registrar Préstamo</button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mt-6">
          <h3 className="font-semibold mb-4">Ejemplares Disponibles Recientes</h3>
          <div className="space-y-3">
            <div className="border rounded p-3">
              <div className="font-medium">Cien Años de Soledad</div>
              <div className="text-sm text-slate-500">Código: LIB001 — Estado: Disponible</div>
            </div>
            <div className="border rounded p-3">
              <div className="font-medium">1984</div>
              <div className="text-sm text-slate-500">Código: LIB003 — Estado: Disponible</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
