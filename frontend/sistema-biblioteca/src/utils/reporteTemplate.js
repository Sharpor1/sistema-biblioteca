// Plantilla para el reporte diario de préstamos y multas

export const generarReporteHTML = ({
  prestamosConDetalles,
  renovacionesHoy,
  devolucionesConDetalles,
  multasConLector,
  observaciones,
  fecha
}) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Diario de Préstamos y Multas - Biblioteca El Rinconcito Mágico</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 30px;
      color: #000;
      background: #fff;
    }
    h1 {
      font-size: 18px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .fecha {
      margin-bottom: 30px;
      font-size: 14px;
    }
    h2 {
      font-size: 14px;
      margin: 25px 0 10px 0;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    th {
      background: #1a1a1a;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: normal;
      border: 1px solid #000;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #000;
      background: #fff;
    }
    tr {
      background: #fff;
    }
    .observaciones-box {
      border: 1px solid #000;
      min-height: 100px;
      padding: 10px;
      margin-top: 10px;
      white-space: pre-wrap;
    }
    .empty-row td {
      height: 40px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
    .section-number {
      display: inline-block;
      margin-right: 5px;
    }
  </style>
</head>
<body>
  <h1>Reporte Diario de Préstamos y Multas</h1>
  
  <div class="fecha">
    Fecha: ${fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
  </div>

  <h2><span class="section-number">1.</span> Préstamos realizados:</h2>
  <table>
    <thead>
      <tr>
        <th>Código del libro</th>
        <th>Título</th>
        <th>Usuario (Nombre y RUT)</th>
        <th>Tipo de usuario (Docente/Estudiante)</th>
        <th>Fecha de préstamo</th>
        <th>Fecha de devolución</th>
      </tr>
    </thead>
    <tbody>
      ${prestamosConDetalles.length > 0 ? prestamosConDetalles.map(p => `
        <tr>
          <td>${p.ejemplar?.codigoEjemplar || 'N/A'}</td>
          <td>${p.libro?.titulo || 'N/A'}</td>
          <td>${p.lector?.nombreCompleto || 'N/A'} (${p.lector?.rut || 'N/A'})</td>
          <td>${p.lector?.rol?.nombre || p.lector?.tipoUsuario || 'N/A'}</td>
          <td>${new Date(p.fecha_prestamo).toLocaleDateString('es-CL')}</td>
          <td>${p.fecha_devolucion ? new Date(p.fecha_devolucion).toLocaleDateString('es-CL') : 'N/A'}</td>
        </tr>
      `).join('') : '<tr class="empty-row"><td colspan="6">No se realizaron préstamos en esta fecha</td></tr>'}
    </tbody>
  </table>

  <h2><span class="section-number">2.</span> Renovaciones:</h2>
  <table>
    <thead>
      <tr>
        <th>Usuario (Nombre y RUT)</th>
        <th>Código del libro</th>
        <th>Título</th>
        <th>Renovaciones utilizadas</th>
        <th>Fecha nueva de devolución</th>
      </tr>
    </thead>
    <tbody>
      ${renovacionesHoy.length > 0 ? renovacionesHoy.map(p => `
        <tr>
          <td>${p.lector?.nombreCompleto || 'N/A'} (${p.lector?.rut || 'N/A'})</td>
          <td>${p.ejemplar?.codigoEjemplar || 'N/A'}</td>
          <td>${p.libro?.titulo || 'N/A'}</td>
          <td>${p.renovacionesUtilizadas || 0}</td>
          <td>${p.fecha_devolucion ? new Date(p.fecha_devolucion).toLocaleDateString('es-CL') : 'N/A'}</td>
        </tr>
      `).join('') : '<tr class="empty-row"><td colspan="5">No se realizaron renovaciones en esta fecha</td></tr>'}
    </tbody>
  </table>

  <h2><span class="section-number">3.</span> Devoluciones realizadas:</h2>
  <table>
    <thead>
      <tr>
        <th>Código del libro</th>
        <th>Título</th>
        <th>Usuario (Nombre y RUT)</th>
        <th>Tipo de usuario</th>
        <th>Fecha de préstamo</th>
        <th>Fecha de devolución</th>
      </tr>
    </thead>
    <tbody>
      ${devolucionesConDetalles.length > 0 ? devolucionesConDetalles.map(p => `
        <tr>
          <td>${p.ejemplar?.codigoEjemplar || 'N/A'}</td>
          <td>${p.libro?.titulo || 'N/A'}</td>
          <td>${p.lector?.nombreCompleto || 'N/A'} (${p.lector?.rut || 'N/A'})</td>
          <td>${p.lector?.rol?.nombre || p.lector?.tipoUsuario || 'N/A'}</td>
          <td>${new Date(p.fecha_prestamo).toLocaleDateString('es-CL')}</td>
          <td>${p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString('es-CL') : 'N/A'}</td>
        </tr>
      `).join('') : '<tr class="empty-row"><td colspan="6">No se realizaron devoluciones en esta fecha</td></tr>'}
    </tbody>
  </table>

  <h2><span class="section-number">4.</span> Multas registradas:</h2>
  <table>
    <thead>
      <tr>
        <th>Usuario (Nombre y RUT)</th>
        <th>Código del libro</th>
        <th>Días de retraso</th>
        <th>Monto cobrado</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        // Filtrar multas con monto mayor a 0
        const multasConMonto = multasConLector.filter(m => parseFloat(m.monto || 0) > 0);
        return multasConMonto.length > 0 ? multasConMonto.map(m => `
        <tr>
          <td>${m.prestamo?.lector?.nombreCompleto || 'N/A'} (${m.prestamo?.lector?.rut || 'N/A'})</td>
          <td>${m.ejemplar?.codigoEjemplar || 'N/A'}</td>
          <td>${m.diasRetraso || 0}</td>
          <td>$${parseFloat(m.monto || 0).toLocaleString('es-CL')}</td>
        </tr>
      `).join('') : '<tr class="empty-row"><td colspan="4">No se registraron multas en esta fecha</td></tr>';
      })()}
    </tbody>
  </table>

  <h2><span class="section-number">5.</span> Observaciones:</h2>
  <div class="observaciones-box">${observaciones || ''}</div>

  <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #666;" class="no-print">
    <button onclick="window.print()" style="background: #000; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px; margin-bottom: 20px;">
      🖨️ Imprimir Reporte
    </button>
  </div>
</body>
</html>
  `;
};
