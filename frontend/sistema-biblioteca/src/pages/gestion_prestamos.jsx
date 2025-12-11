import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchPrestamos, devolverPrestamo, renovarPrestamo } from '../services/prestamosService';
import { fetchEjemplares } from '../services/librosService';

const LoansManager = () => {
  const [loans, setLoans] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [prestamosData, ejemplaresData] = await Promise.all([
          fetchPrestamos(),
          fetchEjemplares()
        ]);
        
        // Enriquecer préstamos con código de ejemplar
        const prestamosEnriquecidos = prestamosData.map(prestamo => {
          let codigoEjemplarReal = prestamo.codigoEjemplar;
          
          // Si codigoEjemplar es solo un ID numérico, buscar el código real
          if (typeof prestamo.codigoEjemplar === 'number') {
            const ejemplar = ejemplaresData.find(e => e.id === prestamo.codigoEjemplar);
            if (ejemplar) {
              codigoEjemplarReal = ejemplar.codigoEjemplar;
            }
          }
          
          return {
            ...prestamo,
            codigoEjemplarTexto: codigoEjemplarReal
          };
        });
        
        setLoans(prestamosEnriquecidos);
        setEjemplares(ejemplaresData);
      } catch (err) {
        setError('No se pudieron cargar los préstamos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Helper para los colores de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'activo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'atrasado': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'finalizado': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'activo': return 'Activo';
      case 'atrasado': return 'Atrasado';
      case 'finalizado': return 'Finalizado';
      default: return status;
    }
  };

  const navigate = useNavigate();

  // Return modal state
  const [returningLoan, setReturningLoan] = useState(null);

  function calculateFine(returnDate) {
    const today = new Date();
    const dueDate = new Date(returnDate);
    const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    if (daysLate <= 0) return 0;
    return daysLate * 1000; // $1000 por día de retraso
  }

  function openReturn(loan) {
    setReturningLoan(loan);
  }

  function closeReturn() {
    setReturningLoan(null);
  }

  async function confirmReturn() {
    try {
      await devolverPrestamo(returningLoan.idPrestamo);
      // Recargar la lista completa con códigos de ejemplares
      const [prestamosData, ejemplaresData] = await Promise.all([
        fetchPrestamos(),
        fetchEjemplares()
      ]);
      
      const prestamosEnriquecidos = prestamosData.map(prestamo => {
        let codigoEjemplarReal = prestamo.codigoEjemplar;
        
        if (typeof prestamo.codigoEjemplar === 'number') {
          const ejemplar = ejemplaresData.find(e => e.id === prestamo.codigoEjemplar);
          if (ejemplar) {
            codigoEjemplarReal = ejemplar.codigoEjemplar;
          }
        }
        
        return {
          ...prestamo,
          codigoEjemplarTexto: codigoEjemplarReal
        };
      });
      
      setLoans(prestamosEnriquecidos);
      setEjemplares(ejemplaresData);
      alert('Préstamo devuelto correctamente');
    } catch (err) {
      setError('No se pudo registrar la devolución');
      alert('Error al devolver: ' + (err.response?.data?.detail || err.message));
    } finally {
      closeReturn();
    }
  }

  async function handleRenovar(loan) {
    const maxRenovaciones = loan.lector?.rol?.maxRenovaciones || 0;
    const renovacionesUsadas = loan.renovacionesUtilizadas || 0;
    
    if (renovacionesUsadas >= maxRenovaciones) {
      alert(`Este préstamo ya alcanzó el límite de ${maxRenovaciones} renovaciones.`);
      return;
    }
    
    if (!confirm(`¿Desea renovar el préstamo de "${loan.libro?.titulo || 'este libro'}"?`)) return;
    
    try {
      const response = await renovarPrestamo(loan.idPrestamo);
      
      // Recargar la lista completa con códigos de ejemplares
      const [prestamosData, ejemplaresData] = await Promise.all([
        fetchPrestamos(),
        fetchEjemplares()
      ]);
      
      const prestamosEnriquecidos = prestamosData.map(prestamo => {
        let codigoEjemplarReal = prestamo.codigoEjemplar;
        
        if (typeof prestamo.codigoEjemplar === 'number') {
          const ejemplar = ejemplaresData.find(e => e.id === prestamo.codigoEjemplar);
          if (ejemplar) {
            codigoEjemplarReal = ejemplar.codigoEjemplar;
          }
        }
        
        return {
          ...prestamo,
          codigoEjemplarTexto: codigoEjemplarReal
        };
      });
      
      setLoans(prestamosEnriquecidos);
      setEjemplares(ejemplaresData);
      alert(response.mensaje || 'Préstamo renovado exitosamente.');
    } catch (err) {
      console.error('Error al renovar préstamo:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.mensaje || 'No se pudo renovar el préstamo';
      alert(`Error: ${errorMsg}`);
    }
  }

  function goToNewLoan() {
    navigate('/prestamos/nuevo');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      <Sidebar />

      {/* --- Contenido Principal --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Header de la sección */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Préstamos</h1>
            <p className="text-slate-500 text-sm mt-1">Administra las devoluciones y salidas de libros.</p>
          </div>
          <button onClick={goToNewLoan} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Préstamo
          </button>
        </header>

        {/* Tarjetas de Resumen (Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { 
              label: 'Préstamos Activos', 
              val: loans.filter(l => l.estado === 'activo').length.toString(), 
              color: 'text-indigo-600', 
              bg: 'bg-indigo-50' 
            },
            { 
              label: 'Atrasados', 
              val: loans.filter(l => l.estado === 'atrasado').length.toString(), 
              color: 'text-rose-600', 
              bg: 'bg-rose-50' 
            },
            { 
              label: 'Finalizados', 
              val: loans.filter(l => l.estado === 'finalizado').length.toString(), 
              color: 'text-emerald-600', 
              bg: 'bg-emerald-50' 
            },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stat.val}</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                 <svg className={`h-6 w-6 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de Préstamos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Filtros de Tabla */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </span>
               <input 
                 type="text" 
                 placeholder="Buscar por libro o usuario..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 w-full py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" 
               />
            </div>
            <div className="flex gap-2">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 text-slate-600"
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="finalizado">Finalizado</option>
                </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="px-6 py-4">Libro / Ejemplar</th>
                  <th className="px-6 py-4">Lector</th>
                  <th className="px-6 py-4">Fecha Préstamo</th>
                  <th className="px-6 py-4">Devolución Pactada</th>
                  <th className="px-6 py-4">Devolución Real</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td className="px-6 py-4 text-sm text-slate-500" colSpan={7}>Cargando...</td></tr>
                ) : (
                (() => {
                  const filteredLoans = loans
                    .filter(loan => {
                      // Filtro por estado
                      if (statusFilter !== 'todos' && loan.estado !== statusFilter) return false;
                      
                      // Filtro por búsqueda
                      if (searchTerm) {
                        const search = searchTerm.toLowerCase();
                        const nombreUsuario = (loan.lector?.nombreCompleto || '').toLowerCase();
                        const codigoEj = (loan.codigoEjemplar?.codigoEjemplar || loan.codigoEjemplar || '').toString().toLowerCase();
                        const nombreLibro = (loan.libro?.titulo || loan.codigoEjemplar?.libro?.titulo || '').toLowerCase();
                        
                        return nombreUsuario.includes(search) || codigoEj.includes(search) || nombreLibro.includes(search);
                      }
                      
                      return true;
                    })
                    // Ordenar: activos primero, luego atrasados, finalmente finalizados
                    .sort((a, b) => {
                      const orderMap = { 'activo': 1, 'atrasado': 2, 'finalizado': 3 };
                      return (orderMap[a.estado] || 999) - (orderMap[b.estado] || 999);
                    });
                  
                  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);
                  
                  return paginatedLoans.map((loan) => (
                  <tr key={loan.idPrestamo} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-base">{loan.libro?.titulo || loan.codigoEjemplar?.libro?.titulo || 'Libro no especificado'}</div>
                        <div className="text-sm text-slate-700 mt-1 font-semibold">Ejemplar: {loan.codigoEjemplarTexto || loan.codigoEjemplar?.codigoEjemplar || '-'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">ID Préstamo: #{loan.idPrestamo}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {loan.lector?.nombreCompleto ? loan.lector.nombreCompleto.charAt(0) : (loan.lector?.charAt ? loan.lector.charAt(0) : '?')}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 text-sm">{loan.lector?.nombreCompleto || loan.lector || '-'}</span>
                                    {loan.lector?.rol?.nombre && (
                                        loan.lector.rol.nombre.toLowerCase().includes('docente') || loan.lector.rol.nombre.toLowerCase().includes('profesor') ? (
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
                                </div>
                                {loan.lector?.rol?.nombre && (
                                    <span className="text-xs text-slate-400">{loan.lector.rol.nombre}</span>
                                )}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {loan.fecha_prestamo ? new Date(loan.fecha_prestamo).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {loan.fecha_devolucion ? new Date(loan.fecha_devolucion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {loan.fecha_devolucion_real ? (
                        <span className="text-emerald-600 font-medium">
                          {new Date(loan.fecha_devolucion_real).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.estado)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${loan.estado === 'activo' ? 'bg-emerald-500' : loan.estado === 'atrasado' ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
                        {getStatusLabel(loan.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        {loan.estado !== 'finalizado' ? (
                            <div className="flex gap-2 justify-end">
                                {(() => {
                                    const maxRenovaciones = loan.lector?.rol?.maxRenovaciones || 0;
                                    const renovacionesUsadas = loan.renovacionesUtilizadas || 0;
                                    const puedeRenovar = renovacionesUsadas < maxRenovaciones;
                                    
                                    return puedeRenovar && (
                                        <button 
                                            onClick={() => handleRenovar(loan)} 
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                                            title={`Renovaciones: ${renovacionesUsadas}/${maxRenovaciones}`}
                                        >
                                            Renovar
                                        </button>
                                    );
                                })()}
                                <button onClick={() => openReturn(loan)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline">Devolver</button>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-sm">Finalizado</span>
                        )}
                    </td>
                  </tr>
                  ));
                })()
                )}
                {error && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-rose-600" colSpan={7}>{error}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {(() => {
            const filteredLoans = loans.filter(loan => {
              if (statusFilter !== 'todos' && loan.estado !== statusFilter) return false;
              if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const nombreUsuario = (loan.lector?.nombreCompleto || '').toLowerCase();
                const codigoEj = (loan.codigoEjemplar?.codigoEjemplar || loan.codigoEjemplar || '').toString().toLowerCase();
                const nombreLibro = (loan.libro?.titulo || loan.codigoEjemplar?.libro?.titulo || '').toLowerCase();
                return nombreUsuario.includes(search) || codigoEj.includes(search) || nombreLibro.includes(search);
              }
              return true;
            });
            
            const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage + 1;
            const endIndex = Math.min(currentPage * itemsPerPage, filteredLoans.length);
            
            if (filteredLoans.length === 0) return null;
            
            return (
              <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                <span>Mostrando {startIndex} a {endIndex} de {filteredLoans.length} resultados</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1">Página {currentPage} de {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Return Loan Modal */}
        {returningLoan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Registrar Devolución</h3>
                <button onClick={closeReturn} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Código Ejemplar</p>
                  <p className="text-lg font-semibold text-slate-900">{returningLoan.codigoEjemplar?.codigoEjemplar || returningLoan.codigoEjemplar}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">Lector</p>
                    <p className="text-sm font-medium text-slate-900">{returningLoan.lector?.nombreCompleto || returningLoan.lector}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">Préstamo</p>
                    <p className="text-sm font-medium text-slate-900">{returningLoan.fecha_prestamo}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Fecha de Devolución Pactada</p>
                  <p className="text-lg font-semibold text-slate-900">{returningLoan.fecha_devolucion}</p>
                </div>

                {(() => {
                  const fine = calculateFine(returningLoan.fecha_devolucion);
                  const daysLate = Math.floor((new Date() - new Date(returningLoan.fecha_devolucion)) / (1000 * 60 * 60 * 24));
                  return (
                    <div className={`p-4 rounded-lg ${fine > 0 ? 'bg-rose-50 border-2 border-rose-200' : 'bg-emerald-50 border-2 border-emerald-200'}`}>
                      {fine > 0 ? (
                        <>
                          <p className="text-sm font-medium text-rose-700">Multa por Retraso</p>
                          <p className="text-3xl font-bold text-rose-700 mt-1">${fine.toLocaleString()}</p>
                          <p className="text-xs text-rose-600 mt-2">{daysLate} días de retraso × $1.000/día</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-emerald-700">Sin multa</p>
                          <p className="text-lg font-semibold text-emerald-700 mt-1">Devuelto a tiempo</p>
                        </>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button onClick={closeReturn} className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancelar</button>
                  <button onClick={confirmReturn} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">Confirmar Devolución</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LoansManager;