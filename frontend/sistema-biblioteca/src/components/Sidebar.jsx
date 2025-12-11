import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpiar todos los tokens del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh_token');
    
    // Redirigir al login
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Libros', path: '/libros', icon: '📚' },
    { label: 'Usuarios', path: '/usuarios', icon: '👥' },
    { label: 'Préstamos', path: '/prestamos', icon: '📝' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          📘
        </div>
        <span className="font-bold text-lg text-slate-800">El Rinconcito Mágico</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon && <span className="text-lg">{item.icon}</span>}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-200">
        <button 
          onClick={handleLogout}
          className="w-full text-left text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors flex items-center gap-2 px-2 py-2 rounded hover:bg-rose-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
