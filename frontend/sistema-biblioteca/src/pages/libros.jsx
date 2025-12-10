import React, { useState, useRef, useEffect } from "react";
import "./libros.css";

const initialBooks = [
	{
		id: 1,
		codigo: "LIB001",
		titulo: "Cien Años de Soledad",
		autor: "Gabriel García Márquez",
		editorial: "Editorial Sudamericana",
		isbn: "978-0307474728",
		anio: 1967,
		stockTotal: 5,
		disponibles: 3,
		enPrestamo: 2,
		baja: false,
	},
	{
		id: 2,
		codigo: "LIB002",
		titulo: "El Principito",
		autor: "Antoine de Saint-Exupéry",
		editorial: "Reynal & Hitchcock",
		isbn: "978-0156012195",
		anio: 1943,
		stockTotal: 3,
		disponibles: 0,
		enPrestamo: 2,
		baja: false,
	},
	{
		id: 3,
		codigo: "LIB003",
		titulo: "1984",
		autor: "George Orwell",
		editorial: "Secker & Warburg",
		isbn: "978-0451524935",
		anio: 1949,
		stockTotal: 4,
		disponibles: 4,
		enPrestamo: 0,
		baja: false,
	},
	{
		id: 4,
		codigo: "LIB004",
		titulo: "Don Quijote de la Mancha",
		autor: "Miguel de Cervantes",
		editorial: "Francisco de Robles",
		isbn: "978-8424934873",
		anio: 1605,
		stockTotal: 2,
		disponibles: 1,
		enPrestamo: 1,
		baja: true,
	},
];

export default function Libros() {
	const [books, setBooks] = useState(initialBooks);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [form, setForm] = useState({
		codigo: "",
		titulo: "",
		autor: "",
		editorial: "",
		isbn: "",
		anio: "",
		stockInicial: 1,
	});

	const codigoRef = useRef(null);

	function openModal() {
		// Prefill with random example data to save user's time
		const samples = [
			{ titulo: 'El Gran Gatsby', autor: 'F. Scott Fitzgerald', editorial: 'Scribner', isbn: '978-0743273565', anio: '1925' },
			{ titulo: 'Cien Años de Soledad', autor: 'Gabriel García Márquez', editorial: 'Editorial Sudamericana', isbn: '978-0307474728', anio: '1967' },
			{ titulo: '1984', autor: 'George Orwell', editorial: 'Secker & Warburg', isbn: '978-0451524935', anio: '1949' },
			{ titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', editorial: 'Francisco de Robles', isbn: '978-8424934873', anio: '1605' },
			{ titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', editorial: 'Reynal & Hitchcock', isbn: '978-0156012195', anio: '1943' },
		];
		const pick = samples[Math.floor(Math.random() * samples.length)];
		setForm({
			codigo: `LIB${String(books.length + 1).padStart(3, "0")}`,
			stockInicial: 1,
			titulo: pick.titulo,
			autor: pick.autor,
			editorial: pick.editorial,
			isbn: pick.isbn,
			anio: pick.anio,
		});
		setErrors({});
		setIsModalOpen(true);
	}

	useEffect(() => {
		if (isModalOpen && codigoRef.current) {
			// focus the Código input when modal opens
			codigoRef.current.focus();
			codigoRef.current.select();
		}
	}, [isModalOpen]);

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
		if (!values.codigo || !String(values.codigo).trim()) e.codigo = 'Código requerido';
		if (!values.titulo || !String(values.titulo).trim()) e.titulo = 'Título requerido';
		if (!values.autor || !String(values.autor).trim()) e.autor = 'Autor requerido';
		if (!values.stockInicial || Number(values.stockInicial) < 1) e.stockInicial = 'Stock debe ser mayor o igual a 1';
		return e;
	}

	function handleCreate(e) {
		e.preventDefault();
		const validation = validateForm(form);
		if (Object.keys(validation).length > 0) {
			setErrors(validation);
			return;
		}

		const newBook = {
			id: books.length + 1,
			codigo: form.codigo || `LIB${String(books.length + 1).padStart(3, "0")}`,
			titulo: form.titulo || "Sin título",
			autor: form.autor || "-",
			editorial: form.editorial || "-",
			isbn: form.isbn || "-",
			anio: form.anio || "-",
			stockTotal: Number(form.stockInicial) || 1,
			disponibles: Number(form.stockInicial) || 1,
			enPrestamo: 0,
			baja: false,
		};
		setBooks((b) => [newBook, ...b]);
		setIsModalOpen(false);
	}

	return (
		<div className="lb-page">
			<div className="lb-header">
				<div>
					<h1>Catálogo de Libros</h1>
					<p className="subtitle">Administra el inventario de libros y ejemplares</p>
				</div>
				<button className="btn-primary" onClick={openModal}>+ Agregar Nuevo Libro</button>
			</div>

			<div className="lb-list">
				{books.map((book) => (
					<div key={book.id} className={`lb-card ${book.baja ? 'baja' : ''}`}>
						<div className="lb-card-left">
							<div className="icon-box">📘</div>
						</div>
						<div className="lb-card-body">
							<div className="title-row">
								<div>
									<div className="lb-title">{book.titulo}</div>
									<div className="lb-author"><strong>Autor</strong><br />{book.autor}</div>
								</div>
								<div className="meta">
									<div><strong>Editorial</strong><br />{book.editorial}</div>
									<div><strong>ISBN</strong><br />{book.isbn}</div>
									<div><strong>Año</strong><br />{book.anio}</div>
								</div>
							</div>

							<div className="stats-row">
								<div className="stat"><span className="dot blue" /> Stock Total: {book.stockTotal}</div>
								<div className="stat"><span className="dot green" /> Disponibles: {book.disponibles}</div>
								<div className="stat"><span className="dot orange" /> En Préstamo: {book.enPrestamo}</div>
							</div>
						</div>
						<div className="lb-card-actions">
							<button className="action">✏️</button>
							<button className="action">⚠️</button>
							<button className="action">🗑️</button>
						</div>
					</div>
				))}
			</div>

			{isModalOpen && (
				<div className="modal-overlay" role="dialog">
					<div className="modal">
						<div className="modal-header">
							<h3>Agregar Nuevo Libro</h3>
							<button className="close" onClick={closeModal}>×</button>
						</div>
						<form className="modal-body" onSubmit={handleCreate}>
							<div className="form-row">
								<label>Código *</label>
								<input name="codigo" ref={codigoRef} value={form.codigo} onChange={handleChange} />
								<label>Stock Inicial *</label>
								<input name="stockInicial" type="number" min="1" value={form.stockInicial} onChange={handleChange} />
							</div>
							<div className="form-row">
								<label>Título *</label>
								<input name="titulo" value={form.titulo} onChange={handleChange} />
								<label>Autor *</label>
								<input name="autor" value={form.autor} onChange={handleChange} />
							</div>
							<div className="form-row">
								<label>ISBN</label>
								<input name="isbn" value={form.isbn} onChange={handleChange} />
								<label>Año</label>
								<input name="anio" value={form.anio} onChange={handleChange} />
							</div>
							<div className="form-row single">
								<label>Editorial</label>
								<input name="editorial" value={form.editorial} onChange={handleChange} />
							</div>

							<div className="modal-actions">
								<button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
								<button type="submit" className="btn-primary">Crear Libro</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

