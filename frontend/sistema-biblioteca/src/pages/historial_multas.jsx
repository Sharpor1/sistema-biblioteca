import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchMultas } from '../services/multasService';
import { fetchPrestamos } from '../services/prestamosService';

export default function HistorialMultas() {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [multasData, prestamosData] = await Promise.all([
          fetchMultas(),
          fetchPrestamos()
        ]);

        // Filtrar multas pagadas
        const multasPagadas = multasData.filter(m => 
          m.estadoPago === 'pagada' || m.estadoPago === 'PAGADA'
        );

        // Enriquecer con datos del préstamo
        const multasConDetalles = multasPagadas.map(multa => {
          const prestamo = prestamosData.find(p => p.idPrestamo === multa.idPrestamo);
          return {
            ...multa,
            prestamo,
            lector: prestamo?.lector,
            libro: prestamo?.libro,
            codigoEjemplar: prestamo?.codigoEjemplar
          };
        }).sort((a, b) => new Date(b.fechaMulta) - new Date(a.fechaMulta));

        setMultas(multasConDetalles);
      } catch (err) {
        console.error('Error cargando multas:', err);
        setError('No se pudieron cargar las multas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filtrar por búsqueda
  const filteredMultas = multas.filter(multa => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const nombreLector = multa.lector?.nombreCompleto?.toLowerCase() || '';
    const rutLector = multa.lector?.rut?.toLowerCase() || '';
    const libroTitulo = multa.libro?.titulo?.toLowerCase() || '';
    return nombreLector.includes(search) || rutLector.includes(search) || libroTitulo.includes(search);
  });

  // Paginación
  const totalPages = Math.ceil(filteredMultas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMultas = filteredMultas.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Historial de Multas</h1>
          <p className="text-slate-500 text-sm mt-1">Multas pagadas de préstamos atrasados</p>
        </header>

        {/* Buscador */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o título del libro..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-2 text-slate-600">Cargando multas...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700">
            {error}
          </div>
        ) : filteredMultas.length === 0 ? (
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-slate-600 font-medium">No se encontraron multas pagadas</p>
          </div>
        ) : (
          <>
            {/* Tabla de multas */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Libro</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Días Retraso</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha Multa</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentMultas.map((multa) => (
                    <tr key={multa.idMulta} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                            {multa.lector?.nombreCompleto?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{multa.lector?.nombreCompleto || 'N/A'}</div>
                            <div className="text-sm text-slate-500">RUT: {multa.lector?.rut || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium">{multa.libro?.titulo || 'N/A'}</div>
                        <div className="text-xs text-slate-500">Código: {multa.codigoEjemplar?.codigoEjemplar || multa.codigoEjemplar || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                          {multa.diasRetraso || 0} días
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-900">
                          ${parseFloat(multa.monto || 0).toLocaleString('es-CL')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {multa.fechaMulta ? new Date(multa.fechaMulta).toLocaleDateString('es-CL', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          ✓ Pagada
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMultas.length)} de {filteredMultas.length} multas
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
