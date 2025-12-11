import React, { useState, useRef, useEffect } from "react";
import Sidebar from '../components/Sidebar';
import "./libros.css";
import { fetchLibros, fetchEjemplares, createLibro } from '../services/librosService';

export default function Libros() {
	const [books, setBooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editingBook, setEditingBook] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [form, setForm] = useState({
		titulo: "",
		autor: "",
		editorial: "",
		isbn: "",
		fecha_publicacion: "",
	});

	const codigoRef = useRef(null);

	function openModal() {
		const samples = [
			{ titulo: 'El Gran Gatsby', autor: 'F. Scott Fitzgerald', editorial: 'Scribner', isbn: '978-0743273565', fecha_publicacion: '1925-04-10' },
			{ titulo: 'Cien Años de Soledad', autor: 'Gabriel García Márquez', editorial: 'Editorial Sudamericana', isbn: '978-0307474728', fecha_publicacion: '1967-05-30' },
			{ titulo: '1984', autor: 'George Orwell', editorial: 'Secker & Warburg', isbn: '978-0451524935', fecha_publicacion: '1949-06-08' },
			{ titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', editorial: 'Francisco de Robles', isbn: '978-8424934873', fecha_publicacion: '1605-01-16' },
			{ titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', editorial: 'Reynal & Hitchcock', isbn: '978-0156012195', fecha_publicacion: '1943-04-06' },
		];
		const pick = samples[Math.floor(Math.random() * samples.length)];
		setForm({
			titulo: pick.titulo,
			autor: pick.autor,
			editorial: pick.editorial,
			isbn: pick.isbn,
			fecha_publicacion: pick.fecha_publicacion,
		});
		setErrors({});
		setIsModalOpen(true);
	}

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const [libros, ejemplares] = await Promise.all([
					fetchLibros(),
					fetchEjemplares(),
				]);
				const ejemplaresPorLibro = ejemplares.reduce((acc, ej) => {
					if (!acc[ej.libro]) acc[ej.libro] = [];
					acc[ej.libro].push({
						idEjemplar: ej.id || ej.codigoEjemplar,
						codigoEjemplar: ej.codigoEjemplar,
						estado: ej.estado?.toLowerCase?.() || ej.estado || 'disponible',
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
		if (!values.isbn || !String(values.isbn).trim()) e.isbn = 'ISBN requerido';
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
			const created = await createLibro({
				titulo: form.titulo,
				autor: form.autor,
				editorial: form.editorial || "",
				isbn: form.isbn,
				fecha_publicacion: form.fecha_publicacion,
			});
			setBooks((b) => [{ ...created, ejemplares: [] }, ...b]);
			setIsModalOpen(false);
		} catch (err) {
			setError('No se pudo crear el libro');
		}
	}

	return (
		<div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
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
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
									<th className="px-6 py-4">Libro</th>
									<th className="px-6 py-4">Autor</th>
									<th className="px-6 py-4">Editorial</th>
									<th className="px-6 py-4">ISBN</th>
									<th className="px-6 py-4">Año</th>
									<th className="px-6 py-4">Ejemplares</th>
									<th className="px-6 py-4">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td className="px-6 py-4 text-sm text-slate-500" colSpan={7}>Cargando...</td></tr>
								) : (
									books.map((book) => (
										<tr key={book.idLibro} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
											<td className="px-6 py-4">
												<div className="text-sm font-medium text-slate-900">{book.titulo}</div>
												<div className="text-xs text-slate-500">ID: #{book.idLibro}</div>
											</td>
											<td className="px-6 py-4 text-sm text-slate-700">{book.autor}</td>
											<td className="px-6 py-4 text-sm text-slate-700">{book.editorial}</td>
											<td className="px-6 py-4 text-sm text-slate-700">{book.isbn}</td>
											<td className="px-6 py-4 text-sm text-slate-700">{book.fecha_publicacion ? new Date(book.fecha_publicacion).getFullYear() : '-'}</td>
											<td className="px-6 py-4">
												<div className="flex gap-2">
													<span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
														{book.ejemplares.filter(e => e.estado === 'disponible').length} disp.
													</span>
													<span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
														{book.ejemplares.filter(e => e.estado === 'prestado').length} prest.
													</span>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="flex gap-2">
													<button onClick={() => setEditingBook(book)} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
														Editar
													</button>
													<button onClick={() => {
														const prestamoCount = book.ejemplares.filter(e => e.estado === 'prestado').length;
														if (prestamoCount > 0) {
															alert('Este libro tiene ejemplares en préstamo. No se puede desactivar.');
															return;
														}
														setBooks((prev) => prev.map(b => b.idLibro === book.idLibro ? {...b, ejemplares: b.ejemplares.map(ej => ({...ej, estado: ej.estado === 'disponible' ? 'baja' : 'disponible'}))} : b));
													}} className="text-rose-600 hover:text-rose-700 font-medium text-sm">
														Desactivar
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
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
										<label className="block text-sm font-medium text-slate-700 mb-1">Código *</label>
										<input ref={codigoRef} name="codigo" value={form.codigo} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.codigo ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.codigo && <p className="text-red-600 text-xs mt-1">{errors.codigo}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial *</label>
										<input type="number" name="stockInicial" min="1" value={form.stockInicial} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.stockInicial ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.stockInicial && <p className="text-red-600 text-xs mt-1">{errors.stockInicial}</p>}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
										<input name="titulo" value={form.titulo} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.titulo ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.titulo && <p className="text-red-600 text-xs mt-1">{errors.titulo}</p>}
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Autor *</label>
										<input name="autor" value={form.autor} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.autor ? 'border-red-500' : 'border-slate-300'}`} />
										{errors.autor && <p className="text-red-600 text-xs mt-1">{errors.autor}</p>}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
										<input name="isbn" value={form.isbn} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
										<input name="anio" value={form.anio} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Editorial</label>
									<input name="editorial" value={form.editorial} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
								</div>
								<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
									<button type="button" onClick={closeModal} className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancelar</button>
									<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Crear Libro</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Edit Book Modal */}
				{editingBook && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog">
						<div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 overflow-hidden">
							<div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
								<h3 className="text-lg font-bold text-slate-900">Editar Libro</h3>
								<button onClick={() => setEditingBook(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
							</div>
							<form onSubmit={(e) => {
								e.preventDefault();
								setBooks((prev) => prev.map(b => b.idLibro === editingBook.idLibro ? editingBook : b));
								setEditingBook(null);
							}} className="p-6 space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
										<input name="titulo" value={editingBook.titulo} onChange={(e) => setEditingBook({...editingBook, titulo: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Autor</label>
										<input name="autor" value={editingBook.autor} onChange={(e) => setEditingBook({...editingBook, autor: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
										<input name="isbn" value={editingBook.isbn} onChange={(e) => setEditingBook({...editingBook, isbn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
									</div>
									<div>
										<label className="block text-sm font-medium text-slate-700 mb-1">Fecha Publicación</label>
										<input type="date" name="fecha_publicacion" value={editingBook.fecha_publicacion} onChange={(e) => setEditingBook({...editingBook, fecha_publicacion: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Editorial</label>
									<input name="editorial" value={editingBook.editorial} onChange={(e) => setEditingBook({...editingBook, editorial: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
								</div>
								<div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
									<button type="button" onClick={() => setEditingBook(null)} className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancelar</button>
									<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Guardar Cambios</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

