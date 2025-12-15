import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { fetchPrestamos } from '../services/prestamosService';
import { fetchLibros, fetchEjemplares } from '../services/librosService';
import { fetchUsuarios } from '../services/usuariosService';
import { fetchMultas } from '../services/multasService';
import { generarReporteHTML } from '../utils/reporteTemplate';
import libraryBg from '../assets/sitio-fondo.png';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLibros: 0,
    ejemplaresDisponibles: 0,
    ejemplaresPrestados: 0,
    prestamosActivos: 0,
    prestamosAtrasados: 0,
    prestamosFinalizados: 0,
    usuariosConPrestamos: 0,
    prestamosEstaSemana: 0,
    prestamosEsteMes: 0,
    multasPendientes: 0,
    prestamosHoy: 0,
    devolucionesHoy: 0,
    usuariosConMultas: 0,
    multasPagadasHoy: 0,
    usuariosConPrestamosAtrasados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [modalReporte, setModalReporte] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Cargar todos los datos en paralelo
        const [prestamos, libros, ejemplares, usuarios, multas] = await Promise.all([
          fetchPrestamos(),
          fetchLibros(),
          fetchEjemplares(),
          fetchUsuarios(),
          fetchMultas(),
        ]);

        // Guardar datos completos para el reporte
        setDatosCompletos({ prestamos, libros, ejemplares, usuarios, multas });

        // Calcular fecha límites
        const hoy = new Date();
        const inicioDeSemana = new Date(hoy);
        inicioDeSemana.setDate(hoy.getDate() - 7);
        const inicioDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const finDelDia = new Date(inicioDelDia);
        finDelDia.setDate(finDelDia.getDate() + 1);

        // Calcular stats de préstamos
        const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length;
        const prestamosAtrasados = prestamos.filter(p => p.estado === 'atrasado').length;
        const prestamosFinalizados = prestamos.filter(p => p.estado === 'finalizado').length;

        // Préstamos de la semana y del mes
        const prestamosEstaSemana = prestamos.filter(p => {
          const fechaPrestamo = new Date(p.fecha_prestamo);
          return fechaPrestamo >= inicioDeSemana;
        }).length;

        const prestamosEsteMes = prestamos.filter(p => {
          const fechaPrestamo = new Date(p.fecha_prestamo);
          return fechaPrestamo >= inicioDeMes;
        }).length;

        // Préstamos realizados hoy
        const prestamosHoy = prestamos.filter(p => {
          const fechaPrestamo = new Date(p.fecha_prestamo);
          return fechaPrestamo >= inicioDelDia && fechaPrestamo < finDelDia;
        }).length;

        // Devoluciones realizadas hoy
        const devolucionesHoy = prestamos.filter(p => {
          if (!p.fecha_devolucion_real) return false;
          const fechaDevolucion = new Date(p.fecha_devolucion_real);
          return fechaDevolucion >= inicioDelDia && fechaDevolucion < finDelDia;
        }).length;

        // Usuarios únicos con préstamos activos
        const usuariosUnicos = new Set(
          prestamos
            .filter(p => p.estado === 'activo')
            .map(p => p.lector?.id || p.lector)
        );
        const usuariosConPrestamos = usuariosUnicos.size;

        // Calcular stats de ejemplares
        const ejemplaresDisponibles = ejemplares.filter(e => 
          e.estado === 'disponible' || e.estado === 'DISPONIBLE'
        ).length;
        const ejemplaresPrestados = ejemplares.filter(e => 
          e.estado === 'prestado' || e.estado === 'PRESTADO'
        ).length;

        // Multas pendientes
        const multasPendientes = multas.filter(m => 
          m.estadoPago === 'pendiente' || m.estadoPago === 'PENDIENTE'
        ).length;

        // Usuarios únicos con multas pendientes
        const usuariosConMultasUnicos = new Set(
          multas
            .filter(m => m.estadoPago === 'pendiente' || m.estadoPago === 'PENDIENTE')
            .map(m => {
              const prestamo = prestamos.find(p => p.idPrestamo === m.idPrestamo);
              return prestamo?.lector?.id || prestamo?.lector;
            })
            .filter(id => id !== undefined)
        );
        const usuariosConMultas = usuariosConMultasUnicos.size;

        // Multas pagadas hoy
        const multasPagadasHoy = multas.filter(m => {
          if (m.estadoPago !== 'pagada' && m.estadoPago !== 'PAGADA') return false;
          if (!m.fechaMulta) return false;
          const fecha = new Date(m.fechaMulta);
          return fecha >= inicioDelDia && fecha < finDelDia;
        }).length;

        // Usuarios únicos con préstamos atrasados
        const usuariosConPrestamosAtrasadosUnicos = new Set(
          prestamos
            .filter(p => p.estado === 'atrasado')
            .map(p => p.lector?.id || p.lector)
        );
        const usuariosConPrestamosAtrasados = usuariosConPrestamosAtrasadosUnicos.size;

        setStats({
          totalLibros: libros.length,
          ejemplaresDisponibles,
          ejemplaresPrestados,
          prestamosActivos,
          prestamosAtrasados,
          prestamosFinalizados,
          usuariosConPrestamos,
          prestamosEstaSemana,
          prestamosEsteMes,
          multasPendientes,
          prestamosHoy,
          devolucionesHoy,
          usuariosConMultas,
          multasPagadasHoy,
          usuariosConPrestamosAtrasados,
        });
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setError('No se pudieron cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const abrirModalReporte = () => {
    if (!datosCompletos) {
      alert('No hay datos disponibles para generar el reporte');
      return;
    }
    setModalReporte(true);
  };

  const generarReporteDiario = () => {

    const hoy = new Date();
    const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDelDia = new Date(inicioDelDia);
    finDelDia.setDate(finDelDia.getDate() + 1);

    // Filtrar datos del día
    const prestamosHoy = datosCompletos.prestamos.filter(p => {
      const fecha = new Date(p.fecha_prestamo);
      return fecha >= inicioDelDia && fecha < finDelDia;
    });

    const devolucionesHoy = datosCompletos.prestamos.filter(p => {
      if (!p.fecha_devolucion_real) return false;
      const fecha = new Date(p.fecha_devolucion_real);
      return fecha >= inicioDelDia && fecha < finDelDia;
    });

    const multasHoy = datosCompletos.multas.filter(m => {
      const fecha = new Date(m.fechaMulta);
      return fecha >= inicioDelDia && fecha < finDelDia;
    });

    // Obtener información del libro para cada préstamo
    const prestamosConDetalles = prestamosHoy.map(p => {
      // codigoEjemplar puede venir como ID o como objeto
      const ejemplarId = typeof p.codigoEjemplar === 'object' ? p.codigoEjemplar?.id : p.codigoEjemplar;
      
      // Buscar el ejemplar por ID
      const ejemplar = datosCompletos.ejemplares.find(e => e.id === ejemplarId || e.idEjemplar === ejemplarId);
      
      // Buscar el libro por ID del ejemplar
      const libro = ejemplar ? datosCompletos.libros.find(l => l.idLibro === ejemplar.libro) : null;
      
      // También intentar usar el libro que viene en el préstamo si existe
      const libroFinal = libro || p.libro;
      
      return { ...p, libro: libroFinal, ejemplar };
    });

    // Obtener renovaciones del día (préstamos que fueron renovados hoy)
    const renovacionesHoy = datosCompletos.prestamos.filter(p => {
      // Aquí asumimos que hay una fecha de última renovación, si no existe, usar otra lógica
      if (!p.renovacionesUtilizadas || p.renovacionesUtilizadas === 0) return false;
      // Por ahora mostraremos todos los préstamos con renovaciones activas
      return p.estado === 'activo' || p.estado === 'atrasado';
    }).map(p => {
      const ejemplarId = typeof p.codigoEjemplar === 'object' ? p.codigoEjemplar?.id : p.codigoEjemplar;
      const ejemplar = datosCompletos.ejemplares.find(e => e.id === ejemplarId || e.idEjemplar === ejemplarId);
      const libro = ejemplar ? datosCompletos.libros.find(l => l.idLibro === ejemplar.libro) : null;
      const libroFinal = libro || p.libro;
      return { ...p, libro: libroFinal, ejemplar };
    });

    // Obtener devoluciones del día con información completa
    const devolucionesConDetalles = devolucionesHoy.map(p => {
      const ejemplarId = typeof p.codigoEjemplar === 'object' ? p.codigoEjemplar?.id : p.codigoEjemplar;
      const ejemplar = datosCompletos.ejemplares.find(e => e.id === ejemplarId || e.idEjemplar === ejemplarId);
      const libro = ejemplar ? datosCompletos.libros.find(l => l.idLibro === ejemplar.libro) : null;
      const libroFinal = libro || p.libro;
      return { ...p, libro: libroFinal, ejemplar };
    });

    const multasConLector = multasHoy.map(m => {
      const prestamo = datosCompletos.prestamos.find(p => p.idPrestamo === m.idPrestamo);
      if (prestamo) {
        const ejemplarId = typeof prestamo.codigoEjemplar === 'object' ? prestamo.codigoEjemplar?.id : prestamo.codigoEjemplar;
        const ejemplar = datosCompletos.ejemplares.find(e => e.id === ejemplarId || e.idEjemplar === ejemplarId);
        return { ...m, prestamo, ejemplar };
      }
      return { ...m, prestamo, ejemplar: null };
    });

    const multasPagadas = datosCompletos.multas.filter(m => {
      if (m.estadoPago !== 'pagada' && m.estadoPago !== 'PAGADA') return false;
      if (!m.fechaMulta) return false;
      const fecha = new Date(m.fechaMulta);
      return fecha >= inicioDelDia && fecha < finDelDia;
    });

    // Generar HTML del reporte usando la plantilla importada
    const reporteHTML = generarReporteHTML({
      prestamosConDetalles,
      renovacionesHoy,
      devolucionesConDetalles,
      multasConLector,
      observaciones,
      fecha: hoy
    });

    // Abrir reporte en nueva ventana
    const ventana = window.open('', '_blank');
    ventana.document.write(reporteHTML);
    ventana.document.close();
    
    // Cerrar modal y limpiar observaciones
    setModalReporte(false);
    setObservaciones('');
  };

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
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Vista general del sistema de biblioteca</p>
          </div>
          <button
            onClick={abrirModalReporte}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar Reporte Diario
          </button>
        </header>

        {/* Modal para Observaciones */}
        {modalReporte && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Generar Reporte Diario</h3>
                <button onClick={() => setModalReporte(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observaciones (Opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={6}
                    placeholder="Ingrese cualquier observación relevante sobre la actividad del día..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalReporte(false)}
                    className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={generarReporteDiario}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generar Reporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Cargando datos...</div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Sección: Actividad del Día */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Actividad de Hoy
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  label="Préstamos Realizados Hoy"
                  value={stats.prestamosHoy}
                  color="orange"
                  icon="calendar"
                  link="/prestamos"
                />
                <StatCard
                  label="Devoluciones de Hoy"
                  value={stats.devolucionesHoy}
                  color="green"
                  icon="check"
                  link="/prestamos"
                />
              </div>
            </section>

            {/* Sección: Alertas de Usuarios */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Alertas de Usuarios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  label="Multas Pagadas Hoy"
                  value={stats.multasPagadasHoy}
                  color="emerald"
                  icon="check"
                  link="/historial-multas"
                />
                <StatCard
                  label="Usuarios con Préstamos Atrasados"
                  value={stats.usuariosConPrestamosAtrasados}
                  color="amber"
                  icon="alert"
                  link="/usuarios"
                />
              </div>
            </section>

            {/* Sección: Actividad Reciente */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Actividad Reciente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Préstamos Esta Semana"
                  value={stats.prestamosEstaSemana}
                  color="purple"
                  icon="calendar"
                  link="/prestamos"
                />
                <StatCard
                  label="Préstamos Este Mes"
                  value={stats.prestamosEsteMes}
                  color="cyan"
                  icon="calendar"
                  link="/prestamos"
                />
                <StatCard
                  label="Usuarios con Préstamos Activos"
                  value={stats.usuariosConPrestamos}
                  color="teal"
                  icon="users"
                  link="/usuarios"
                />
              </div>
            </section>
            
            {/* Sección: Inventario de Libros */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Inventario de Libros
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Total de Libros"
                  value={stats.totalLibros}
                  color="indigo"
                  icon="book"
                  link="/libros"
                />
                <StatCard
                  label="Ejemplares Disponibles"
                  value={stats.ejemplaresDisponibles}
                  color="emerald"
                  icon="check"
                  link="/libros"
                />
                <StatCard
                  label="Ejemplares Prestados"
                  value={stats.ejemplaresPrestados}
                  color="amber"
                  icon="clock"
                  link="/libros"
                />
              </div>
            </section>

            {/* Sección: Préstamos */}
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Estado de Préstamos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Préstamos Activos"
                  value={stats.prestamosActivos}
                  color="blue"
                  icon="active"
                  link="/prestamos"
                />
                <StatCard
                  label="Préstamos Atrasados"
                  value={stats.prestamosAtrasados}
                  color="rose"
                  icon="alert"
                  link="/prestamos"
                />
                <StatCard
                  label="Préstamos Finalizados"
                  value={stats.prestamosFinalizados}
                  color="slate"
                  icon="check"
                  link="/prestamos"
                />
              </div>
            </section>

          </div>
        )}
      </main>
      </div>
    </div>
  );
}

// Componente reutilizable para tarjetas de estadísticas
function StatCard({ label, value, color, icon, large = false, link }) {
  const navigate = useNavigate();
  
  const colorClasses = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    rose: { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    slate: { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    teal: { text: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  };

  const colors = colorClasses[color] || colorClasses.slate;

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-white p-4 rounded-xl shadow-sm border ${colors.border} hover:shadow-lg transition-all ${link ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
          <p className={`${large ? 'text-4xl' : 'text-3xl'} font-bold text-slate-800`}>{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colors.bg} flex-shrink-0 ml-3`}>
          <IconComponent icon={icon} className={`h-6 w-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}

// Componente de íconos
function IconComponent({ icon, className }) {
  const icons = {
    book: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    check: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    clock: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    active: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    alert: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    calendar: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    users: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    warning: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return icons[icon] || icons.check;
}
