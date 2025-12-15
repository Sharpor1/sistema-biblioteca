import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { fetchMultas } from '../services/multasService';
import { fetchPrestamos } from '../services/prestamosService';
import { fetchEjemplares } from '../services/librosService';
import libraryBg from '../assets/sitio-fondo.png';

export default function HistorialMultas() {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaMulta, setFechaMulta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [selectedMulta, setSelectedMulta] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [multasData, prestamosData, ejemplaresData] = await Promise.all([
          fetchMultas(),
          fetchPrestamos(),
          fetchEjemplares()
        ]);

        // Filtrar multas pagadas con monto mayor a 0
        const multasPagadas = multasData.filter(m => {
          const estadoValido = m.estadoPago === 'pagada' || m.estadoPago === 'PAGADA' || m.estadoPago === 'pagado';
          const montoValido = parseFloat(m.monto || 0) > 0;
          return estadoValido && montoValido;
        });

        // Enriquecer con datos del préstamo y código de ejemplar
        const multasConDetalles = multasPagadas.map(multa => {
          const prestamo = prestamosData.find(p => p.idPrestamo === multa.idPrestamo);
          
          // Obtener el código real del ejemplar
          let codigoEjemplarTexto = prestamo?.codigoEjemplar;
          if (typeof prestamo?.codigoEjemplar === 'number') {
            const ejemplar = ejemplaresData.find(e => e.id === prestamo.codigoEjemplar);
            if (ejemplar) {
              codigoEjemplarTexto = ejemplar.codigoEjemplar;
            }
          }
          
          return {
            ...multa,
            prestamo,
            lector: prestamo?.lector,
            libro: prestamo?.libro,
            codigoEjemplar: prestamo?.codigoEjemplar,
            codigoEjemplarTexto
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

  // Filtrar por búsqueda y fecha
  const filteredMultas = multas.filter(multa => {
    // Filtro por búsqueda de texto
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const nombreLector = multa.lector?.nombreCompleto?.toLowerCase() || '';
      const rutLector = multa.lector?.rut?.toLowerCase() || '';
      const libroTitulo = multa.libro?.titulo?.toLowerCase() || '';
      if (!nombreLector.includes(search) && !rutLector.includes(search) && !libroTitulo.includes(search)) {
        return false;
      }
    }
    
    // Filtro por fecha de multa
    if (fechaMulta) {
      const fechaMultaStr = multa.fechaMulta?.split('T')[0];
      if (fechaMultaStr !== fechaMulta) return false;
    }
    
    return true;
  });

  // Paginación
  const totalPages = Math.ceil(filteredMultas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMultas = filteredMultas.slice(startIndex, endIndex);

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
      <div className="absolute inset-0 bg-white/95"/>
      
      <div className="relative z-10 flex w-full">
        <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Historial de Multas</h1>
          <p className="text-slate-500 text-sm mt-1">Multas pagadas de préstamos atrasados</p>
        </header>

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
              
              {/* Buscadores dentro del recuadro */}
              <div className="p-5 border-b border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div>
                    <input
                      type="date"
                      value={fechaMulta}
                      onChange={(e) => {
                        setFechaMulta(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Filtrar por fecha de multa"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

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
                    <tr 
                      key={multa.idMulta} 
                      className="hover:bg-indigo-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMulta(multa)}
                    >
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
                        <div className="text-xs text-slate-500 mt-1">Ejemplar: {multa.codigoEjemplarTexto || multa.codigoEjemplar?.codigoEjemplar || multa.codigoEjemplar || 'N/A'}</div>
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

            {/* Paginación - Siempre visible */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Mostrando {filteredMultas.length > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, filteredMultas.length)} de {filteredMultas.length} multas
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 text-sm font-medium text-slate-700">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Modal de detalles del préstamo */}
        {selectedMulta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedMulta(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Detalles del Préstamo</h3>
                <button 
                  onClick={() => setSelectedMulta(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Información del Usuario */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase mb-3">Usuario</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Nombre:</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedMulta.lector?.nombreCompleto || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">RUT:</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedMulta.lector?.rut || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Tipo:</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedMulta.lector?.tipoUsuario || selectedMulta.lector?.rol?.nombre || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Información del Libro */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase mb-3">Libro</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Título:</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedMulta.libro?.titulo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Autor:</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedMulta.libro?.autor || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Código Ejemplar:</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedMulta.codigoEjemplarTexto || selectedMulta.codigoEjemplar?.codigoEjemplar || selectedMulta.codigoEjemplar || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Información del Préstamo */}
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase mb-3">Préstamo</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">ID Préstamo:</span>
                      <span className="text-sm font-semibold text-slate-900">#{selectedMulta.prestamo?.idPrestamo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Fecha Préstamo:</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedMulta.prestamo?.fecha_prestamo 
                          ? new Date(selectedMulta.prestamo.fecha_prestamo).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Fecha Devolución Pactada:</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedMulta.prestamo?.fecha_devolucion 
                          ? new Date(selectedMulta.prestamo.fecha_devolucion).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Fecha Devolución Real:</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedMulta.prestamo?.fecha_devolucion_real 
                          ? new Date(selectedMulta.prestamo.fecha_devolucion_real).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Pendiente'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Estado:</span>
                      <span className={`text-sm font-semibold ${
                        selectedMulta.prestamo?.estado === 'activo' ? 'text-emerald-600' : 
                        selectedMulta.prestamo?.estado === 'atrasado' ? 'text-rose-600' : 
                        'text-slate-600'
                      }`}>
                        {selectedMulta.prestamo?.estado === 'activo' ? 'Activo' :
                         selectedMulta.prestamo?.estado === 'atrasado' ? 'Atrasado' :
                         selectedMulta.prestamo?.estado === 'finalizado' ? 'Finalizado' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de la Multa */}
                <div className="bg-rose-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase mb-3">Multa</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">ID Multa:</span>
                      <span className="text-sm font-semibold text-slate-900">#{selectedMulta.idMulta || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Días de Retraso:</span>
                      <span className="text-sm font-semibold text-amber-700">{selectedMulta.diasRetraso || 0} días</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Monto:</span>
                      <span className="text-lg font-bold text-rose-700">${parseFloat(selectedMulta.monto || 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Fecha Multa:</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedMulta.fechaMulta 
                          ? new Date(selectedMulta.fechaMulta).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Estado:</span>
                      <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        ✓ Pagada
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
                <button 
                  onClick={() => setSelectedMulta(null)}
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
