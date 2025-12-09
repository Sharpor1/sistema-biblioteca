import React, { useState } from 'react';

const LoansManager = () => {
  // Datos simulados (Mock Data) - Esto vendría de tu API Django
  const [loans, setLoans] = useState([
    { id: 1, book: "Cien Años de Soledad", user: "Ana García", loanDate: "2023-10-15", returnDate: "2023-10-30", status: "active" },
    { id: 2, book: "El Principito", user: "Carlos Ruiz", loanDate: "2023-09-01", returnDate: "2023-09-15", status: "overdue" },
    { id: 3, book: "1984", user: "Lucía Méndez", loanDate: "2023-10-20", returnDate: "2023-11-05", status: "pending" },
    { id: 4, book: "Harry Potter y la Piedra...", user: "Mario Bros", loanDate: "2023-10-22", returnDate: "2023-11-07", status: "active" },
  ]);

  // Helper para los colores de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'; // Por vencer pronto
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'En Curso';
      case 'overdue': return 'Atrasado';
      case 'pending': return 'Por Vencer';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* --- Sidebar Minimalista --- */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">El Rinconcito</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {['Dashboard', 'Libros', 'Usuarios', 'Préstamos', 'Configuración'].map((item) => (
            <a key={item} href="#" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item === 'Préstamos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              {/* Icono genérico para ejemplo */}
              <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* --- Contenido Principal --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Header de la sección */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Préstamos</h1>
            <p className="text-slate-500 text-sm mt-1">Administra las devoluciones y salidas de libros.</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2">
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
                  <th className="px-6 py-4">Libro</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Fecha Préstamo</th>
                  <th className="px-6 py-4">Fecha Devolución</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{loan.book}</div>
                        <div className="text-xs text-slate-400">ID: #{loan.id}293</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {loan.user.charAt(0)}
                            </div>
                            <span className="text-slate-600 text-sm">{loan.user}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{loan.loanDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{loan.returnDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${loan.status === 'active' ? 'bg-emerald-500' : loan.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                        {getStatusLabel(loan.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-3 hover:underline">Editar</button>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                    </td>
                  </tr>
                ))}
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
      </main>
    </div>
  );
};

export default LoansManager;