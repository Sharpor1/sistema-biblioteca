import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { loginUser } from '../services/auth';   

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ rut: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
   
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 

    try {
      await loginUser(formData.rut, formData.password);
      navigate('/prestamos'); 

    } catch (err) {
      console.error("Login fallido:", err);
      setError(err.detail || 'Credenciales incorrectas o error de servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      
      {/* Tarjeta Principal */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Encabezado */}
        <div className="bg-indigo-600 p-8 text-center">
          <div className="mx-auto h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">El Rinconcito Mágico</h2>
          <p className="text-indigo-200 mt-2 text-sm">Tu puerta de entrada a la lectura</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          
          {/* SECCIÓN NUEVA: Mensaje de Error Visual */}
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Input rut */}
            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-slate-700 mb-1">
                RUT
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="rut"
                  name="rut"
                  type="text" // Si usas username en Django, cambia esto a type="text"
                  required
                  className="pl-10 block w-full rounded-lg border-slate-300 bg-slate-50 border focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition-colors duration-200 ease-in-out outline-none"
                  placeholder="1234567-0"
                  value={formData.rut}
                  onChange={handleChange}
                  disabled={loading} // Deshabilitar input al cargar
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="pl-10 block w-full rounded-lg border-slate-300 bg-slate-50 border focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 transition-colors duration-200 ease-in-out outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading} // Deshabilitar input al cargar
                />
              </div>
            </div>

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={loading} // Importante: evita doble click
              className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform 
                ${!loading && 'hover:scale-[1.02]'}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Entrar a la biblioteca'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;