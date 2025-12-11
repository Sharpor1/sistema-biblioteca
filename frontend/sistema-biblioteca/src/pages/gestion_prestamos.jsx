import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchPrestamos, devolverPrestamo } from '../services/prestamosService';

const LoansManager = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPrestamos();
        setLoans(data);
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
      setLoans((prev) => prev.filter((l) => l.idPrestamo !== returningLoan.idPrestamo));
    } catch (err) {
      setError('No se pudo registrar la devolución');
    } finally {
      closeReturn();
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
            { label: 'Préstamos Activos', val: '24', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Atrasados', val: '3', color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Devueltos Hoy', val: '12', color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
               <input type="text" placeholder="Buscar por libro o usuario..." className="pl-10 w-full py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
            </div>
            <div className="flex gap-2">
                <select className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 text-slate-600">
                    <option>Todos los estados</option>
                    <option>Atrasados</option>
                    <option>En curso</option>
                </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="px-6 py-4">Código Ejemplar</th>
                  <th className="px-6 py-4">Lector</th>
                  <th className="px-6 py-4">Fecha Préstamo</th>
                  <th className="px-6 py-4">Fecha Devolución</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td className="px-6 py-4 text-sm text-slate-500" colSpan={6}>Cargando...</td></tr>
                ) : (
                loans.map((loan) => (
                  <tr key={loan.idPrestamo} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{loan.codigoEjemplar?.codigoEjemplar || loan.codigoEjemplar || '-'}</div>
                        <div className="text-xs text-slate-400">ID: #{loan.idPrestamo}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {loan.lector?.nombreCompleto ? loan.lector.nombreCompleto.charAt(0) : (loan.lector?.charAt ? loan.lector.charAt(0) : '?')}
                            </div>
                            <span className="text-slate-600 text-sm">{loan.lector?.nombreCompleto || loan.lector || '-'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{loan.fecha_prestamo}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{loan.fecha_devolucion}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.estado)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${loan.estado === 'activo' ? 'bg-emerald-500' : loan.estado === 'atrasado' ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
                        {getStatusLabel(loan.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => openReturn(loan)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline">Devolver</button>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors ml-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                    </td>
                  </tr>
                ))}
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginación simple */}
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
            <span>Mostrando 4 de 24 resultados</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50" disabled>Anterior</button>
                <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Siguiente</button>
            </div>
          </div>
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