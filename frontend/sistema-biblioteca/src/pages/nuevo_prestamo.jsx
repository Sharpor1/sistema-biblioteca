import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchUsuarios } from '../services/usuariosService';
import { fetchEjemplares, fetchLibros } from '../services/librosService';
import { createPrestamo, fetchPrestamos } from '../services/prestamosService';
import { fetchMultas } from '../services/multasService';
import libraryBg from '../assets/sitio-fondo.png';

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
        const [u, e, l, m, p] = await Promise.all([fetchUsuarios(), fetchEjemplares(), fetchLibros(), fetchMultas(), fetchPrestamos()]);
        
        // No filtrar usuarios, incluir todos
        // Agregar información de multas y préstamos a cada usuario
        const usuariosConInfo = u.map(usuario => {
          // Calcular multas en tiempo real para préstamos atrasados
          const prestamosUsuario = p.filter(prestamo => 
            (prestamo.lector?.id === usuario.id || prestamo.lector === usuario.id) &&
            (prestamo.estado === 'activo' || prestamo.estado === 'atrasado')
          );
          
          const prestamosAtrasados = prestamosUsuario.filter(pr => pr.estado === 'atrasado');
          const prestamosActivos = prestamosUsuario.filter(pr => pr.estado === 'activo');
          
          const multasCalculadas = prestamosAtrasados.map(pr => {
            const today = new Date();
            const dueDate = new Date(pr.fecha_devolucion);
            const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
            return daysLate > 0 ? daysLate * 1000 : 0;
          });
          
          const totalMultas = multasCalculadas.reduce((sum, monto) => sum + monto, 0);
          const cupoMaximo = usuario.rol?.cupoPrestamoMax || 0;
          const llegaAlMaximo = cupoMaximo > 0 && prestamosActivos.length >= cupoMaximo;
          
          return {
            ...usuario,
            tieneMultas: totalMultas > 0,
            montoMultas: totalMultas,
            cantidadPrestamos: prestamosActivos.length,
            llegaAlMaximo
          };
        });
        
        // Filtrar ejemplares disponibles
        const ejemplaresDisponibles = e.filter(ej => ej.estado?.toLowerCase() === 'disponible');
        
        setUsuarios(usuariosConInfo);
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
    <div className="min-h-screen flex font-sans text-slate-800 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${libraryBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="absolute inset-0 bg-white/90"/>
      
      <div className="relative z-10 flex w-full">
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

          <div className="bg-white rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h4 className="font-semibold mb-2">Confirmar Préstamo</h4>
              <p className="text-sm text-slate-500 mb-6">Completa las validaciones para continuar</p>
            </div>
            <button 
              disabled={!canRegister} 
              onClick={registrarPrestamo} 
              className={`w-full px-6 py-3 rounded-lg font-semibold text-base transition-all ${
                canRegister 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Registrar Préstamo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold mb-4">Usuarios ({usuarios.filter(u => {
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
                <div className="text-sm text-slate-500">No hay usuarios disponibles</div>
              ) : (
                usuarios
                  .filter(u => {
                    const search = searchUsuarios.toLowerCase();
                    return u.nombreCompleto.toLowerCase().includes(search) || u.rut.toLowerCase().includes(search);
                  })
                  .map((u) => {
                    const tieneProblemas = u.tieneMultas || u.llegaAlMaximo;
                    return (
                  <div 
                    key={u.rut} 
                    className={`border rounded p-3 cursor-pointer transition-colors ${
                      tieneProblemas 
                        ? 'border-rose-300 bg-rose-50 hover:bg-rose-100' 
                        : 'hover:bg-indigo-50'
                    }`}
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
                      <span className={tieneProblemas ? 'text-rose-700' : ''}>{u.nombreCompleto}</span>
                      {u.rol?.nombre && (
                        u.rol.nombre.toLowerCase().includes('docente') || u.rol.nombre.toLowerCase().includes('profesor') ? (
                          <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24" title="Docente">
                            <path d="M12 2L1 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-11-5zm0 2.18l9 4.09v6.73c0 4.52-3.07 8.78-7.5 10.08V14l-1.5-1.5-1.5 1.5v11.08C6.07 23.78 3 19.52 3 15V8.27l9-4.09z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24" title="Estudiante">
                            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                          </svg>
                        )
                      )}
                      {u.tieneMultas && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-semibold">
                          Multa: ${u.montoMultas.toLocaleString('es-CL')}
                        </span>
                      )}
                      {u.llegaAlMaximo && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-semibold">
                          Máx. préstamos
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${tieneProblemas ? 'text-rose-600' : 'text-slate-500'}`}>
                      RUT: {u.rut} — Tipo: {u.rol?.nombre || 'N/A'}
                      {u.cantidadPrestamos > 0 && ` — Préstamos activos: ${u.cantidadPrestamos}`}
                    </div>
                  </div>
                  );
                })
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
    </div>
  );
}
