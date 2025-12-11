import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchUsuarios } from '../services/usuariosService';
import { fetchEjemplares, fetchLibros } from '../services/librosService';
import { createPrestamo } from '../services/prestamosService';
import { fetchMultas } from '../services/multasService';

export default function NuevoPrestamo() {
  const [rut, setRut] = useState('');
  const [codigoEjemplar, setCodigoEjemplar] = useState('');
  const [usuarioValid, setUsuarioValid] = useState(null);
  const [ejemplarValid, setEjemplarValid] = useState(null);
  const [dias, setDias] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [libros, setLibros] = useState([]);
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [searchLibros, setSearchLibros] = useState('');
  const [expandedLibro, setExpandedLibro] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [u, e, l, m] = await Promise.all([fetchUsuarios(), fetchEjemplares(), fetchLibros(), fetchMultas()]);
        
        // Filtrar usuarios sin multas pendientes
        const rutosConMultas = new Set(m.filter(multa => multa.estadoPago?.toLowerCase() === 'pendiente').map(multa => multa.idPrestamo?.lector?.rut || multa.lector?.rut));
        const usuariosSinMultas = u.filter(usuario => !rutosConMultas.has(usuario.rut));
        
        // Filtrar ejemplares disponibles
        const ejemplaresDisponibles = e.filter(ej => ej.estado?.toLowerCase() === 'disponible');
        
        setUsuarios(usuariosSinMultas);
        setEjemplares(ejemplaresDisponibles);
        setLibros(l);
        setMultas(m);
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
      const diasMin = usuario.rol?.diasPrestamoMin || 1;
      const diasMax = usuario.rol?.diasPrestamoMax || usuario.rol?.diasPrestamoMin || usuario.diasPrestamo || 7;
      setDias(diasMin); // Establecer el mínimo por defecto
      return setUsuarioValid({ ok: true, msg: `Usuario válido (${usuario.tipoUsuario || 'Tipo no especificado'}) - ${diasMin} a ${diasMax} días`, tipo: usuario.tipoUsuario, id: usuario.id, diasMin, diasMax });
    }
    return setUsuarioValid({ ok: false, msg: 'Usuario no encontrado' });
  }

  function validarEjemplar() {
    if (!codigoEjemplar) return setEjemplarValid({ ok: false, msg: 'Ingrese código' });
    const ej = ejemplares.find((e) => e.codigoEjemplar === codigoEjemplar && e.estado?.toLowerCase() === 'disponible');
    if (ej) return setEjemplarValid({ ok: true, msg: 'Ejemplar válido', id: ej.id, codigoEjemplar: ej.codigoEjemplar });
    return setEjemplarValid({ ok: false, msg: 'Ejemplar no encontrado o no disponible' });
  }

  const canRegister = usuarioValid && usuarioValid.ok && ejemplarValid && ejemplarValid.ok;

  async function registrarPrestamo() {
    if (!canRegister) return;
    if (dias <= 0) {
      alert('Los días de préstamo deben ser mayor a 0');
      return;
    }
    if (usuarioValid.diasMax && dias > usuarioValid.diasMax) {
      alert(`Los días no pueden exceder el máximo permitido (${usuarioValid.diasMax} días)`);
      return;
    }
    if (usuarioValid.diasMin && dias < usuarioValid.diasMin) {
      alert(`Los días no pueden ser menores al mínimo permitido (${usuarioValid.diasMin} días)`);
      return;
    }
    
    try {
      await createPrestamo({
        lector: usuarioValid.id,
        codigoEjemplar: ejemplarValid.id,
      });
      alert('Préstamo registrado');
      // Recargar datos
      setRut('');
      setCodigoEjemplar('');
      setUsuarioValid(null);
      setEjemplarValid(null);
      setDias(0);
    } catch (err) {
      console.error('Error al registrar préstamo:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Error desconocido';
      alert('No se pudo registrar el préstamo: ' + errorMsg);
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
                <label className="block text-sm text-slate-600 mb-1">Días de Préstamo</label>
                <input 
                  type="number" 
                  value={dias} 
                  onChange={(e) => setDias(parseInt(e.target.value) || 0)}
                  min={usuarioValid?.diasMin || 1}
                  max={usuarioValid?.diasMax || 30}
                  className="w-full rounded-lg border px-3 py-2 bg-slate-50" 
                />
                <p className="text-xs text-slate-500 mt-1">
                  {usuarioValid && usuarioValid.ok 
                    ? `Rango permitido: ${usuarioValid.diasMin || 1} - ${usuarioValid.diasMax || 30} días`
                    : 'Valida el usuario primero para ver el rango permitido'}
                </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold mb-4">Usuarios Sin Multas ({usuarios.filter(u => {
              const search = searchUsuarios.toLowerCase();
              return u.nombreCompleto.toLowerCase().includes(search) || u.rut.toLowerCase().includes(search);
            }).length})</h3>
            
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Buscar usuario..." 
                value={searchUsuarios}
                onChange={(e) => setSearchUsuarios(e.target.value)}
                className="pl-10 w-full py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {usuarios.length === 0 ? (
                <div className="text-sm text-slate-500">No hay usuarios disponibles sin multas</div>
              ) : (
                usuarios
                  .filter(u => {
                    const search = searchUsuarios.toLowerCase();
                    return u.nombreCompleto.toLowerCase().includes(search) || u.rut.toLowerCase().includes(search);
                  })
                  .slice(0, 10)
                  .map((u) => (
                  <div 
                    key={u.rut} 
                    className="border rounded p-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                    onClick={() => {
                      setRut(u.rut);
                      // Validar después de actualizar el estado
                      setTimeout(() => {
                        const usuario = usuarios.find((usr) => usr.rut === u.rut);
                        if (usuario) {
                          const diasMin = usuario.rol?.diasPrestamoMin || 1;
                          const diasMax = usuario.rol?.diasPrestamoMax || usuario.rol?.diasPrestamoMin || usuario.diasPrestamo || 7;
                          setDias(diasMin);
                          setUsuarioValid({ ok: true, msg: `Usuario válido (${usuario.tipoUsuario || 'Tipo no especificado'}) - ${diasMin} a ${diasMax} días`, tipo: usuario.tipoUsuario, id: usuario.id, diasMin, diasMax });
                        }
                      }, 0);
                    }}
                  >
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <span>{u.nombreCompleto}</span>
                      {u.rol?.nombre && (
                        u.rol.nombre.toLowerCase().includes('docente') || u.rol.nombre.toLowerCase().includes('profesor') ? (
                          <span className="text-sm" title="Docente">👨‍🏫</span>
                        ) : (
                          <span className="text-sm" title="Estudiante">🎓</span>
                        )
                      )}
                    </div>
                    <div className="text-xs text-slate-500">RUT: {u.rut} — Tipo: {u.rol?.nombre || 'N/A'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold mb-4">Libros Disponibles ({
              (() => {
                const librosConEjemplares = {};
                ejemplares.forEach(ej => {
                  const libro = libros.find(l => l.idLibro === ej.libro);
                  if (libro) {
                    const search = searchLibros.toLowerCase();
                    if (libro.titulo.toLowerCase().includes(search) || libro.autor.toLowerCase().includes(search) || ej.codigoEjemplar.toLowerCase().includes(search)) {
                      if (!librosConEjemplares[libro.idLibro]) {
                        librosConEjemplares[libro.idLibro] = { libro, ejemplares: [] };
                      }
                      librosConEjemplares[libro.idLibro].ejemplares.push(ej);
                    }
                  }
                });
                return Object.values(librosConEjemplares).reduce((sum, l) => sum + l.ejemplares.length, 0);
              })()
            } ejemplares)</h3>
            
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Buscar libro o código..." 
                value={searchLibros}
                onChange={(e) => setSearchLibros(e.target.value)}
                className="pl-10 w-full py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ejemplares.length === 0 ? (
                <div className="text-sm text-slate-500">No hay ejemplares disponibles</div>
              ) : (
                (() => {
                  // Agrupar ejemplares por libro
                  const librosConEjemplares = {};
                  ejemplares.forEach(ej => {
                    const libro = libros.find(l => l.idLibro === ej.libro);
                    if (libro) {
                      const search = searchLibros.toLowerCase();
                      if (libro.titulo.toLowerCase().includes(search) || libro.autor.toLowerCase().includes(search) || ej.codigoEjemplar.toLowerCase().includes(search)) {
                        if (!librosConEjemplares[libro.idLibro]) {
                          librosConEjemplares[libro.idLibro] = { libro, ejemplares: [] };
                        }
                        librosConEjemplares[libro.idLibro].ejemplares.push(ej);
                      }
                    }
                  });
                  
                  return Object.values(librosConEjemplares).map(({ libro, ejemplares: ejemplaresLibro }) => {
                    const isExpanded = expandedLibro === libro.idLibro;
                    
                    return (
                      <div key={libro.idLibro} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedLibro(isExpanded ? null : libro.idLibro)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm text-slate-900">{libro.titulo}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{libro.autor}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                              {ejemplaresLibro.length}
                            </span>
                            <svg 
                              className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50 p-2 space-y-1">
                            {ejemplaresLibro.map((ej) => (
                              <div 
                                key={ej.codigoEjemplar} 
                                className="bg-white border border-slate-200 rounded p-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                                onClick={() => {
                                  setCodigoEjemplar(ej.codigoEjemplar);
                                  setTimeout(() => {
                                    const ejemplarFound = ejemplares.find((e) => e.codigoEjemplar === ej.codigoEjemplar && e.estado?.toLowerCase() === 'disponible');
                                    if (ejemplarFound) {
                                      setEjemplarValid({ ok: true, msg: 'Ejemplar válido', id: ejemplarFound.id, codigoEjemplar: ejemplarFound.codigoEjemplar });
                                    }
                                  }, 0);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold">Código</div>
                                    <div className="font-bold text-base text-slate-900 mt-0.5">{ej.codigoEjemplar}</div>
                                  </div>
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                                    Disponible
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-2">Ejemplar ID: #{ej.id}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
