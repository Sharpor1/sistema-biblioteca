import { Routes, Route, Navigate } from 'react-router-dom'; // 1. Importar herramientas de rutas
import './App.css';
import LoansManager from './pages/gestion_prestamos';
import Login from './pages/login';
import Libros from './pages/libros';

function App() {  
  return (
    <Routes>
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="/login" element={<Login />} />
      
      <Route path="/prestamos" element={<LoansManager />} />
      <Route path="/libros" element={<Libros />} />

    </Routes>
  )
}

export default App