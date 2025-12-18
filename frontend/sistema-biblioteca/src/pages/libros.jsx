import React, { useState, useRef, useEffect } from "react";
import Sidebar from '../components/Sidebar';
import { fetchLibros, fetchEjemplares, createLibro, createEjemplar, darBajaEjemplar, activarEjemplar as activarEjemplarService } from '../services/librosService';
import libraryBg from '../assets/sitio-fondo.png';

export default function Libros() {
	const [books, setBooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 7;
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedBook, setSelectedBook] = useState(null);
	const [showEjemplares, setShowEjemplares] = useState(false);
	const [showAddEjemplar, setShowAddEjemplar] = useState(false);
	const [ejemplarForm, setEjemplarForm] = useState({ codigoEjemplar: '', estado: 'disponible' });
	const [form, setForm] = useState({
		titulo: "",
		autor: "",
		editorial: "",
		isbn: "",
		fecha_publicacion: "",
	});

	const codigoRef = useRef(null);

	function openModal() {
		setForm({
			titulo: '',
			autor: '',
			editorial: '',
			isbn: '',
			fecha_publicacion: '',
		});
		setErrors({});
		setIsModalOpen(true);
	}

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const { fetchPrestamos } = await import('../services/prestamosService');
				const [libros, ejemplares, prestamos] = await Promise.all([
					fetchLibros(),
					fetchEjemplares(),
					fetchPrestamos().catch(() => []),
				]);
				
				// Crear mapa de ejemplares prestados
				const ejemplaresPrestados = {};
				prestamos.filter(p => p.estado === 'activo').forEach(p => {
					// El codigoEjemplar puede venir como ID o como objeto
					let ejemplarId = null;
					let codigoEj = null;
					
					if (typeof p.codigoEjemplar === 'object' && p.codigoEjemplar !== null) {
						// Es un objeto anidado
						codigoEj = p.codigoEjemplar.codigoEjemplar;
					} else if (typeof p.codigoEjemplar === 'number') {
						// Es solo el ID, necesito buscar el código en ejemplares
						ejemplarId = p.codigoEjemplar;
						const ejemplar = ejemplares.find(e => e.id === ejemplarId);
						if (ejemplar) {
							codigoEj = ejemplar.codigoEjemplar;
						}
					}
					
					if (codigoEj) {
						ejemplaresPrestados[codigoEj] = {
							lector: p.lector?.nombreCompleto || p.lector,
							fechaDevolucion: p.fecha_devolucion,
							tipoUsuario: p.lector?.tipoUsuario || p.lector?.rol?.nombre || ''
						};
					}
				});
				
				const ejemplaresPorLibro = ejemplares.reduce((acc, ej) => {
					if (!acc[ej.libro]) acc[ej.libro] = [];
					const prestado = ejemplaresPrestados[ej.codigoEjemplar];
					acc[ej.libro].push({
						id: ej.id,
						idEjemplar: ej.id,
						codigoEjemplar: ej.codigoEjemplar,
						estado: ej.estado?.toLowerCase?.() || ej.estado || 'disponible',
						prestadoA: prestado,
					});
					return acc;
				}, {});
				const merged = libros.map((lib) => ({
					...lib,
					ejemplares: ejemplaresPorLibro[lib.idLibro] || [],
				}));
				setBooks(merged);
			} catch (err) {
				setError('No se pudieron cargar los libros');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	function closeModal() {
		setIsModalOpen(false);
	}

	async function desactivarLibroCompleto(book) {
		const prestamoCount = book.ejemplares.filter(e => e.estado === 'prestado').length;
		if (prestamoCount > 0) {
			alert('Este libro tiene ejemplares en préstamo. No se puede desactivar.');
			return;
		}
		const disponibles = book.ejemplares.filter(e => e.estado === 'disponible');
		if (disponibles.length === 0) {
			alert('No hay ejemplares disponibles para desactivar.');
			return;
		}
		if (!confirm(`¿Desactivar todos los ejemplares de "${book.titulo}"?`)) return;
		try {
			for (const ejemplar of disponibles) {
				console.log(`Desactivando ejemplar: ${ejemplar.codigoEjemplar} del libro ID: ${book.idLibro}`);
				// Pasar tanto el código como el ID del libro
				await darBajaEjemplar(ejemplar.codigoEjemplar, book.idLibro);
			}
			
			await recargarDatos();
			// Actualizar libro seleccionado si está abierto
			if (selectedBook && selectedBook.idLibro === book.idLibro) {
				const updated = books.find(b => b.idLibro === book.idLibro);
				if (updated) setSelectedBook(updated);
			}
			alert('Libro desactivado correctamente.');
			setShowEjemplares(false);
			setSelectedBook(null);
		} catch (err) {
			console.error('Error desactivando libro:', err);
			const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Error desconocido';
			alert(`Error al desactivar el libro: ${errorMsg}`);
		}
	}



	async function desactivarEjemplar(ejemplar) {
		if (ejemplar.estado === 'prestado') {
			alert('Este ejemplar está en préstamo. No se puede desactivar.');
			return;
		}
		if (ejemplar.estado === 'baja') {
			alert('Este ejemplar ya está desactivado.');
			return;
		}
		if (!confirm(`¿Desactivar ejemplar ${ejemplar.codigoEjemplar}?`)) return;
		try {
			console.log('Desactivando ejemplar:', ejemplar.codigoEjemplar, 'del libro ID:', selectedBook.idLibro);
			// Pasar tanto el código como el ID del libro
			await darBajaEjemplar(ejemplar.codigoEjemplar, selectedBook.idLibro);
			await recargarDatos();
			alert('Ejemplar desactivado correctamente.');
			// Actualizar libro seleccionado
			if (selectedBook) {
				const updated = books.find(b => b.idLibro === selectedBook.idLibro);
				if (updated) setSelectedBook(updated);
			}
		} catch (err) {
			console.error('Error desactivando ejemplar:', err);
			const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Error desconocido';
			alert(`Error al desactivar el ejemplar: ${errorMsg}`);
		}
	}

	async function activarEjemplar(ejemplar) {
		if (ejemplar.estado === 'prestado') {
			alert('Este ejemplar está en préstamo. No se puede activar.');
			return;
		}
		if (ejemplar.estado === 'disponible') {
			alert('Este ejemplar ya está disponible.');
			return;
		}
		if (!confirm(`¿Activar ejemplar ${ejemplar.codigoEjemplar}?`)) return;
		try {
			console.log('Activando ejemplar:', ejemplar.codigoEjemplar, 'del libro ID:', selectedBook.idLibro);
			await activarEjemplarService(ejemplar.codigoEjemplar, selectedBook.idLibro);
			await recargarDatos();
			alert('Ejemplar activado correctamente.');
			// Actualizar libro seleccionado
			if (selectedBook) {
				const updated = books.find(b => b.idLibro === selectedBook.idLibro);
				if (updated) setSelectedBook(updated);
			}
		} catch (err) {
			console.error('Error activando ejemplar:', err);
			const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Error desconocido';
			alert(`Error al activar el ejemplar: ${errorMsg}`);
		}
	}

	async function recargarDatos() {
		const { fetchPrestamos } = await import('../services/prestamosService');
		const [libros, ejemplares, prestamos] = await Promise.all([
			fetchLibros(), 
			fetchEjemplares(),
			fetchPrestamos().catch(() => [])
		]);
		
		// Crear mapa de ejemplares prestados
		const ejemplaresPrestados = {};
		prestamos.filter(p => p.estado === 'activo').forEach(p => {
			// El codigoEjemplar puede venir como ID o como objeto
			let ejemplarId = null;
			let codigoEj = null;
			
			if (typeof p.codigoEjemplar === 'object' && p.codigoEjemplar !== null) {
				// Es un objeto anidado
				codigoEj = p.codigoEjemplar.codigoEjemplar;
			} else if (typeof p.codigoEjemplar === 'number') {
				// Es solo el ID, necesito buscar el código en ejemplares
				ejemplarId = p.codigoEjemplar;
				const ejemplar = ejemplares.find(e => e.id === ejemplarId);
				if (ejemplar) {
					codigoEj = ejemplar.codigoEjemplar;
				}
			}
			
			if (codigoEj) {
				ejemplaresPrestados[codigoEj] = {
					lector: p.lector?.nombreCompleto || p.lector,
					fechaDevolucion: p.fecha_devolucion,
					tipoUsuario: p.lector?.tipoUsuario || p.lector?.rol?.nombre || ''
				};
			}
		});
		
		const ejemplaresPorLibro = ejemplares.reduce((acc, ej) => {
			if (!acc[ej.libro]) acc[ej.libro] = [];
			acc[ej.libro].push({
				id: ej.id,
				idEjemplar: ej.id,
				codigoEjemplar: ej.codigoEjemplar,
				estado: ej.estado?.toLowerCase?.() || ej.estado || 'disponible',
				prestadoA: ejemplaresPrestados[ej.codigoEjemplar] || null,
			});
			return acc;
		}, {});
		const merged = libros.map((lib) => ({
			...lib,
			ejemplares: ejemplaresPorLibro[lib.idLibro] || [],
		}));
		setBooks(merged);
	}

	function generarCodigoEjemplar(libro) {
		// Generar código único basado en título del libro y timestamp
		const prefix = libro.titulo.substring(0, 3).toUpperCase().replace(/\s/g, '');
		const timestamp = Date.now().toString().slice(-6);
		return `${prefix}${timestamp}`;
	}

	function openAddEjemplarModal(libro) {
		const codigoGenerado = generarCodigoEjemplar(libro);
		setEjemplarForm({ codigoEjemplar: codigoGenerado, estado: 'disponible' });
		setSelectedBook(libro);
		setShowAddEjemplar(true);
	}

	async function handleCreateEjemplar(e) {
		e.preventDefault();
		if (!ejemplarForm.codigoEjemplar.trim()) {
			alert('El código del ejemplar es requerido');
			return;
		}
		try {
			await createEjemplar({
				codigoEjemplar: ejemplarForm.codigoEjemplar.trim(),
				libro: selectedBook.idLibro,
				estado: ejemplarForm.estado
			});
			await recargarDatos();
			// Actualizar libro seleccionado
			const updated = books.find(b => b.idLibro === selectedBook.idLibro);
			if (updated) setSelectedBook(updated);
			setShowAddEjemplar(false);
			alert('Ejemplar creado correctamente');
		} catch (err) {
			console.error('Error creando ejemplar:', err);
			const errorMsg = err.response?.data?.codigoEjemplar?.[0] || err.response?.data?.detail || 'Error al crear ejemplar';
			alert(errorMsg);
		}
	}

	function handleChange(e) {
		const { name, value } = e.target;
		setForm((s) => ({ ...s, [name]: value }));
		// clear individual field error when user types
		setErrors((err) => ({ ...err, [name]: undefined }));
	}

	const [errors, setErrors] = useState({});

	function validateForm(values) {
		const e = {};
		if (!values.titulo || !String(values.titulo).trim()) e.titulo = 'Título requerido';
		if (!values.autor || !String(values.autor).trim()) e.autor = 'Autor requerido';
		if (!values.isbn || !String(values.isbn).trim()) {
			e.isbn = 'ISBN requerido';
		} else if (values.isbn.length > 13) {
			e.isbn = 'El ISBN no puede tener más de 13 caracteres';
		}
		if (!values.fecha_publicacion || !String(values.fecha_publicacion).trim()) e.fecha_publicacion = 'Fecha de publicación requerida';
		return e;
	}

	async function handleCreate(e) {
		e.preventDefault();
		const validation = validateForm(form);
		if (Object.keys(validation).length > 0) {
			setErrors(validation);
			return;
		}

		try {
			const payload = {
				titulo: form.titulo.trim(),
				autor: form.autor.trim(),
				isbn: form.isbn.trim(),
				fecha_publicacion: form.fecha_publicacion,
				editorial: form.editorial?.trim() || '',
			};
			console.log('Enviando libro:', payload);
			const created = await createLibro(payload);
			setBooks((b) => [{ ...created, ejemplares: [] }, ...b]);
			setIsModalOpen(false);
			setForm({
				titulo: "",
				autor: "",
				editorial: "",
				isbn: "",
				fecha_publicacion: "",
			});
			setError('');
		} catch (err) {
			console.error('Error creando libro:', err);
			const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'No se pudo crear el libro';
			setError(`Error: ${errorMsg}`);
		}
	}

	return (
	<div className="min-h-screen flex font-sans text-slate-800 relative">
		{/* Imagen de fondo */}
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
				<header className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-2xl font-bold text-slate-800">Catálogo de Libros</h1>
						<p className="text-slate-500 text-sm mt-1">Administra el inventario de libros y ejemplares</p>
					</div>
					<button onClick={openModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
						Agregar Nuevo Libro
					</button>
				</header>

				{error && <div className="mb-4 text-rose-600 text-sm">{error}</div>}

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					{[
						{ label: 'Total de Libros', val: books.length.toString(), color: 'text-indigo-600', bg: 'bg-indigo-50' },
						{ label: 'Ejemplares Disponibles', val: books.reduce((sum, b) => sum + b.ejemplares.filter(e => e.estado === 'disponible').length, 0).toString(), color: 'text-emerald-600', bg: 'bg-emerald-50' },
						{ label: 'Ejemplares Prestados', val: books.reduce((sum, b) => sum + b.ejemplares.filter(e => e.estado === 'prestado').length, 0).toString(), color: 'text-amber-600', bg: 'bg-amber-50' },
					].map((stat, idx) => (
						<div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
							<div>
								<p className="text-slate-500 text-sm font-medium">{stat.label}</p>
								<p className="text-3xl font-bold text-slate-800 mt-1">{stat.val}</p>
							</div>
							<div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg}`}>
								<svg className={`h-6 w-6 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
							</div>
						</div>
					))}
				</div>

				{/* Table */}
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
					<div className="p-5 border-b border-slate-100">
						<div className="relative w-full sm:w-80">
						<svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<input 
							type="text" 
							placeholder="Buscar por título, autor o ISBN..." 
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							/>
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
									<th className="px-6 py-4">Libro</th>
									<th className="px-6 py-4">Autor</th>
									<th className="px-6 py-4">Editorial</th>
								<th className="px-6 py-4">ISBN</th>
								<th className="px-6 py-4">Año</th>
								<th className="px-6 py-4">Estado</th>
									<th className="px-6 py-4">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td className="px-6 py-4 text-sm text-slate-500" colSpan={7}>Cargando...</td></tr>
							) : (() => {
								const filteredBooks = books.filter(book => {
									if (!searchTerm) return true;
									const search = searchTerm.toLowerCase();
									return book.titulo.toLowerCase().includes(search) || 
										   book.autor.toLowerCase().includes(search) || 
										   book.isbn.toLowerCase().includes(search);
								});

								const startIndex = (currentPage - 1) * itemsPerPage;
								const endIndex = startIndex + itemsPerPage;
								const currentBooks = filteredBooks.slice(startIndex, endIndex);

								if (currentBooks.length === 0) {
									return <tr><td className="px-6 py-4 text-sm text-slate-500 text-center" colSpan={7}>No se encontraron libros</td></tr>;
								}

								return currentBooks.map((book) => (
										<tr key={book.idLibro} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
											<td className="px-6 py-4">
												<div 
													className="text-sm font-medium text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
													onClick={() => { setSelectedBook(book); setShowEjemplares(true); }}
												>
													{book.titulo}
													{book.ejemplares.length > 0 && book.ejemplares.every(e => e.estado === 'baja') && 
														<span className="ml-2 text-xs text-rose-600 font-semibold">(Fuera de Stock)</span>
													}
													{book.ejemplares.length > 0 && book.ejemplares.every(e => e.estado === 'prestado' || e.estado === 'baja') && 
														book.ejemplares.some(e => e.estado === 'prestado') &&
														<span className="ml-2 text-xs text-amber-600 font-semibold">(Fuera de Stock)</span>
													}
												</div>
											</td>
											<td className="px-6 py-4 text-sm text-slate-700">{book.autor}</td>
											<td className="px-6 py-4 text-sm text-slate-700">{book.editorial}</td>
										<td className="px-6 py-4 text-sm text-slate-700">{book.isbn || '-'}</td>
											<td className="px-6 py-4 text-sm text-slate-700">{book.fecha_publicacion ? new Date(book.fecha_publicacion).getFullYear() : '-'}</td>
											<td className="px-6 py-4">
												<div className="flex gap-2">
													<span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
														{book.ejemplares.filter(e => e.estado === 'disponible').length} disp.
													</span>
													<span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
														{book.ejemplares.filter(e => e.estado === 'prestado').length} prest.
													</span>
													<span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
														{book.ejemplares.filter(e => e.estado === 'baja').length} baja
													</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex gap-2">
													<button 
														onClick={() => { setSelectedBook(book); setShowEjemplares(true); }} 
														className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
													>
														Ver Ejemplares
													</button>
												</div>
										</td>
									</tr>
								));
							})()}
						</tbody>
				</table>
			</div>

			{/* Paginación */}
			{(() => {
				const filteredBooks = books.filter(book => {
					if (!searchTerm) return true;
					const search = searchTerm.toLowerCase();
					return book.titulo.toLowerCase().includes(search) || 
						   book.autor.toLowerCase().includes(search) || 
						   book.isbn.toLowerCase().includes(search);
				});
				const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

				if (totalPages <= 1) return null;

				const startIndex = (currentPage - 1) * itemsPerPage;
				const endIndex = startIndex + itemsPerPage;

				return (
					<div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
						<div className="text-sm text-slate-600">
							Mostrando {startIndex + 1}-{Math.min(endIndex, filteredBooks.length)} de {filteredBooks.length} libros
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
							>
								← Anterior
							</button>
							<span className="px-4 py-2 text-sm text-slate-600 flex items-center">
								Página {currentPage} de {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
								className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
							>
								Siguiente →
							</button>
						</div>
					</div>
				);
			})()}
				</div>


				{/* Add Book Modal */}
				{isModalOpen && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog">
						<div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 overflow-hidden">
							<div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
								<h3 className="text-lg font-bold text-slate-900">Agregar Nuevo Libro</h3>
								<button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
							</div>
							<form onSubmit={handleCreate} className="p-6 space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
							<input name="titulo" value={form.titulo} onChange={handleChange} placeholder="El Principito" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.titulo ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.titulo && <p className="text-red-600 text-xs mt-1">{errors.titulo}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Autor *</label>
							<input name="autor" value={form.autor} onChange={handleChange} placeholder="Antoine de Saint-Exupéry" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.autor ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.autor && <p className="text-red-600 text-xs mt-1">{errors.autor}</p>}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">ISBN *</label>
							<input name="isbn" value={form.isbn} onChange={handleChange} placeholder="978015601219" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.isbn ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.isbn && <p className="text-red-600 text-xs mt-1">{errors.isbn}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Publicación *</label>
										<input type="date" name="fecha_publicacion" value={form.fecha_publicacion} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.fecha_publicacion ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.fecha_publicacion && <p className="text-red-600 text-xs mt-1">{errors.fecha_publicacion}</p>}
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Editorial</label>
					<input name="editorial" value={form.editorial} onChange={handleChange} placeholder="Reynal & Hitchcock" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
								</div>
								<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
									<button type="button" onClick={closeModal} className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancelar</button>
									<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Crear Libro</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Modal de Ejemplares */}
				{showEjemplares && selectedBook && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog">
						<div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
							<div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
								<div>
									<h3 className="text-lg font-bold text-slate-900">{selectedBook.titulo}</h3>
									<p className="text-sm text-slate-500">{selectedBook.autor} • ISBN: {selectedBook.isbn}</p>
								</div>
								<button onClick={() => { setShowEjemplares(false); setSelectedBook(null); }} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
							</div>
							
							<div className="p-6 overflow-auto flex-1">
								<div className="flex justify-between items-center mb-4">
									<h4 className="font-semibold text-slate-700">Ejemplares ({selectedBook.ejemplares.length})</h4>
									<div className="flex gap-2">
										<button 
											onClick={() => openAddEjemplarModal(selectedBook)}
											className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
										>
											+ Agregar Ejemplar
										</button>
										<button 
											onClick={() => desactivarLibroCompleto(selectedBook)}
											className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium"
										>
											Desactivar Todos
										</button>
									</div>
								</div>

								{selectedBook.ejemplares.length === 0 ? (
									<div className="text-center py-8 text-slate-500">
										<p>No hay ejemplares registrados para este libro</p>
									</div>
								) : (
									<div className="grid gap-3">
										{selectedBook.ejemplares.map((ej) => (
											<div key={ej.codigoEjemplar} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
												<div className="flex justify-between items-start mb-3">
													<div className="flex-1">
														<div className="font-medium text-slate-900">Código: {ej.codigoEjemplar}</div>
														
														{ej.prestadoA && (
															<div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
																<div className="flex items-center gap-2 mb-1">
																	{ej.prestadoA.tipoUsuario === 'Docente' ? (
																		<svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24" title="Docente">
																			<path d="M12 2L1 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-11-5zm0 2.18l9 4.09v6.73c0 4.52-3.07 8.78-7.5 10.08V14l-1.5-1.5-1.5 1.5v11.08C6.07 23.78 3 19.52 3 15V8.27l9-4.09z"/>
																			<circle cx="12" cy="10" r="3"/>
																		</svg>
																	) : (
																		<svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24" title="Estudiante">
																			<path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
																		</svg>
																	)}
																	<div className="font-semibold text-amber-900">{ej.prestadoA.lector}</div>
																</div>
																<div className="text-sm text-amber-700 mt-1">
																	Debe devolverse el: <span className="font-medium">{new Date(ej.prestadoA.fechaDevolucion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
																</div>
															</div>
														)}
													</div>
												</div>
												<div className="flex items-center justify-end gap-3">
													<span className={`px-3 py-1 text-xs font-semibold rounded-full ${
														ej.estado === 'disponible' ? 'bg-emerald-100 text-emerald-800' :
														ej.estado === 'prestado' ? 'bg-amber-100 text-amber-800' :
														'bg-slate-100 text-slate-800'
													}`}>
														{ej.estado === 'disponible' ? 'Disponible' : 
														 ej.estado === 'prestado' ? 'Prestado' : 
														 'Fuera de Stock'}
													</span>
													{ej.estado === 'disponible' && (
														<button 
															onClick={() => desactivarEjemplar(ej)}
															className="text-rose-600 hover:text-rose-700 font-medium text-sm"
														>
															Desactivar
														</button>
													)}
													{ej.estado === 'baja' && (
														<button 
															onClick={() => activarEjemplar(ej)}
															className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
														>
															Activar
														</button>
													)}
												</div>
											</div>
										))}
									</div>
								)}

								{selectedBook.ejemplares.every(e => e.estado === 'baja') && selectedBook.ejemplares.length > 0 && (
									<div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
										<p className="text-sm text-rose-700">
										<strong>Fuera de Stock:</strong> Todos los ejemplares de este libro están dados de baja.
										</p>
									</div>
								)}
							</div>

							<div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
								<button 
									onClick={() => { setShowEjemplares(false); setSelectedBook(null); }}
									className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
								>
									Cerrar
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Modal Agregar Ejemplar */}
				{showAddEjemplar && selectedBook && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog">
						<div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
							<div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
								<h3 className="text-lg font-bold text-slate-900">Agregar Ejemplar</h3>
								<button onClick={() => setShowAddEjemplar(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
							</div>
							
							<form onSubmit={handleCreateEjemplar} className="p-6 space-y-4">
								<div>
									<p className="text-sm text-slate-600 mb-3">
										<strong>Libro:</strong> {selectedBook.titulo}
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Código del Ejemplar *</label>
									<input 
										name="codigoEjemplar" 
										value={ejemplarForm.codigoEjemplar} 
										onChange={(e) => setEjemplarForm({...ejemplarForm, codigoEjemplar: e.target.value})}
										className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
										placeholder="Código único del ejemplar"
									/>
									<p className="text-xs text-slate-500 mt-1">Código generado automáticamente. Puedes modificarlo si lo deseas.</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
									<select 
										name="estado"
										value={ejemplarForm.estado}
										onChange={(e) => setEjemplarForm({...ejemplarForm, estado: e.target.value})}
										className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
									>
										<option value="disponible">Disponible</option>
										<option value="prestado">Prestado</option>
										<option value="baja">Baja</option>
									</select>
								</div>

								<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
									<button type="button" onClick={() => setShowAddEjemplar(false)} className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">
										Cancelar
									</button>
									<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
										Crear Ejemplar
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</main>
		</div>
	</div>
  );
}

