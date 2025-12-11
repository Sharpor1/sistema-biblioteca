import { Routes, Route, Navigate } from 'react-router-dom'; // 1. Importar herramientas de rutas
import './App.css';
import LoansManager from './pages/gestion_prestamos';
import Login from './pages/login';
import Libros from './pages/libros';
import NuevoPrestamo from './pages/nuevo_prestamo';
import Usuarios from './pages/usuarios';
import Dashboard from './pages/dashboard';
import HistorialMultas from './pages/historial_multas';

function App() {  
  return (
    <Routes>
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      
      <Route path="/prestamos" element={<LoansManager />} />
      <Route path="/prestamos/nuevo" element={<NuevoPrestamo />} />
      <Route path="/libros" element={<Libros />} />
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/historial-multas" element={<HistorialMultas />} />

    </Routes>
  )
}

export default App