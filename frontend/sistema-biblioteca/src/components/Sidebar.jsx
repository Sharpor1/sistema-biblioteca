import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: '≡' },
    { label: 'Libros', path: '/libros', icon: '+' },
    { label: 'Usuarios', path: '/usuarios', icon: '' },
    { label: 'Préstamos', path: '/prestamos', icon: '' },
    { label: 'Configuración', path: '/configuracion', icon: '' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          📘
        </div>
        <span className="font-bold text-lg text-slate-800">El Rinconcito</span>
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
        <button className="w-full text-left text-sm text-rose-600 hover:text-rose-700 font-medium">
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
