# Inconsistencias Corregidas - Frontend vs Backend

## Resumen de Cambios Realizados

Se han identificado y corregido todas las incongruencias entre la estructura del frontend (React) y el backend (Django REST Framework) para asegurar que el frontend se alinea exactamente con los modelos y endpoints disponibles en el backend.

---

## 1. **Autenticación (`src/services/auth.js`)**

### ❌ Problema:
- Endpoint incorrecto: `/token/` en lugar de `/auth/login/`
- Token guardado de forma incompleta (solo `accessToken` y `refreshToken`)
- Axios interceptor esperaba clave `token` en localStorage pero no se guardaba

### ✅ Solución:
- Cambiar endpoint de `POST /token/` a `POST /auth/login/`
- Guardar **3 claves** en localStorage:
  - `accessToken` (del response `access`)
  - `refreshToken` (del response `refresh`)
  - `token` (copia de `accessToken` para compatibilidad con axios interceptor)
- Limpiar todas las 4 claves al hacer logout

### 📝 Archivos Modificados:
- `src/services/auth.js` - Función `loginUser()` y `logoutUser()`

---

## 2. **Gestión de Usuarios (`src/pages/usuarios.jsx`)**

### ❌ Problema:
- Campos no coincidían con modelo `Lector`:
  - Frontend: `nombre`, `email`, `telefono`
  - Backend: `nombreCompleto`, `contacto`, `rol` (FK)
- Campo `rol` era string hardcodeado (`"Estudiante"` / `"Docente"`)
- Sin acceso a datos de `TipoUsuario`

### ✅ Solución:
- Cambiar campo `nombre` → `nombreCompleto`
- Cambiar campo `email` → `contacto`
- Eliminar campo `telefono`
- Cambiar `rol` de string a **Number** (ID de TipoUsuario)
- Agregar estado `tiposUsuario` con array de tipos disponibles
- Actualizar select dropdown para mapear `rol` a ID de TipoUsuario
- Mostrar nombre del tipo en tabla usando lookup desde array `tiposUsuario`

### 📝 Campos en Mock Data:
```javascript
{
  id: 1,
  rut: "12345678-9",
  nombreCompleto: "Ana García",
  contacto: "ana@example.com",
  rol: 1, // ID de TipoUsuario, NO string
  estado: "activo"
}
```

### 📝 Archivos Modificados:
- `src/pages/usuarios.jsx` - Estado, validación, formulario, tabla

---

## 3. **Gestión de Libros (`src/pages/libros.jsx`)**

### ❌ Problema:
- Estructura completamente incorrecta - no reflejaba relación FK entre `Libro` y `Ejemplar`:
  - Frontend tenía campos `codigo`, `stockTotal`, `disponibles`, `enPrestamo`, `baja`
  - Backend tiene: `idLibro` y array de `Ejemplar` con `idEjemplar`, `codigoEjemplar`, `estado`
- Campo `anio` en lugar de `fecha_publicacion`
- Cálculos de estado asumían lógica plana, no relacional

### ✅ Solución:
- Cambiar estructura a **relacional**:
  - `id` → `idLibro`
  - Agregar `ejemplares: []` array con estructura:
    - `idEjemplar` (Primary Key)
    - `codigoEjemplar` (Unique)
    - `estado` (choices: `"disponible"`, `"prestado"`, `"baja"`)
- Cambiar campo `anio` → `fecha_publicacion` (tipo Date)
- Actualizar estadísticas:
  - `disponibles` = count donde `ejemplar.estado === "disponible"`
  - `prestados` = count donde `ejemplar.estado === "prestado"`
  - `baja` = count donde `ejemplar.estado === "baja"`
- Tabla muestra `ejemplares.length` en lugar de `stockTotal`
- Año extraído de `fecha_publicacion.getFullYear()`

### 📝 Estructura Mock Data:
```javascript
{
  idLibro: 1,
  titulo: "Cien Años de Soledad",
  autor: "Gabriel García Márquez",
  isbn: "978-0-06-088328-7",
  editorial: "Harper Perennial",
  fecha_publicacion: new Date("1967-05-30"),
  ejemplares: [
    {
      idEjemplar: 1,
      codigoEjemplar: "LIB001",
      estado: "disponible"
    },
    {
      idEjemplar: 2,
      codigoEjemplar: "LIB001-A",
      estado: "prestado"
    }
  ]
}
```

### 📝 Archivos Modificados:
- `src/pages/libros.jsx` - Estructura, formulario, validación, estadísticas, tabla

---

## 4. **Gestión de Préstamos (`src/pages/gestion_prestamos.jsx`)**

### ❌ Problema:
- Campos no coincidían con modelo `Prestamo`:
  - Frontend: `id`, `book`, `user`, `loanDate`, `returnDate`, `status`
  - Backend: `idPrestamo`, `codigoEjemplar` (FK a Ejemplar), `lector` (FK a Lector), `fecha_prestamo`, `fecha_devolucion`, `estado`
- Estados incorrectos:
  - Frontend: `"active"`, `"overdue"`, `"pending"`
  - Backend: `"activo"`, `"atrasado"`, `"finalizado"`

### ✅ Solución:
- Cambiar campo `id` → `idPrestamo`
- Cambiar campo `book` → `codigoEjemplar` (referencia a Ejemplar)
- Cambiar campo `user` → `lector` (referencia a Lector)
- Cambiar campo `loanDate` → `fecha_prestamo`
- Cambiar campo `returnDate` → `fecha_devolucion`
- Cambiar campo `status` → `estado`
- Actualizar mapeo de estados:
  - `"active"` → `"activo"`
  - `"overdue"` → `"atrasado"`
  - `"pending"` → `"finalizado"`
- Tabla headers actualizados: `Libro` → `Código Ejemplar`, `Usuario` → `Lector`
- Modal de devolución usa campos actualizados

### 📝 Estructura Mock Data:
```javascript
{
  idPrestamo: 1,
  codigoEjemplar: "LIB001",
  lector: "Ana García",
  fecha_prestamo: "2023-10-15",
  fecha_devolucion: "2023-10-30",
  estado: "activo"
}
```

### 📝 Archivos Modificados:
- `src/pages/gestion_prestamos.jsx` - Datos, helpers de estado, tabla, modal

---

## 5. **Nuevo Préstamo (`src/pages/nuevo_prestamo.jsx`)**

### ❌ Problema:
- Nombres de campos inconsistentes:
  - Frontend: `nombre` (debería ser `nombreCompleto`)
  - Frontend: `codigo` (debería ser `codigoEjemplar`)
- Validación de "libros" cuando debería validar "ejemplares"
- Comentarios referenciaban estructura incorrecta

### ✅ Solución:
- Cambiar estado `codigo` → `codigoEjemplar`
- Cambiar referencias a `nombre` → `nombreCompleto`
- Cambiar `testLibros` → `testEjemplares`
- Cambiar función `validarLibro()` → `validarEjemplar()`
- Actualizar estado variable `libroValid` → `ejemplarValid`
- Sección de "Préstamos Activos Recientes" → "Ejemplares Disponibles Recientes"
- Actualizar mock data en sección de ejemplares

### 📝 Archivos Modificados:
- `src/pages/nuevo_prestamo.jsx` - Estados, funciones, inputs, validaciones

---

## 6. **Configuración de Axios (`src/api/axios.js`)**

### ✅ Estado:
- Archivo **correctamente configurado**
- Base URL: `http://127.0.0.1:8000/api`
- Bearer token header correctamente implementado
- Interceptor de 401 redirige a `/login`

**No requiere cambios.**

---

## 7. **Componente Sidebar (`src/components/Sidebar.jsx`)**

### ✅ Estado:
- Componente **reutilizable y correcto**
- No tiene acoplamiento a modelos específicos
- Funciona correctamente con React Router

**No requiere cambios.**

---

## Validación Final

### ✅ Verificaciones Completadas:
- `auth.js` - ✅ Sin errores
- `usuarios.jsx` - ✅ Sin errores
- `libros.jsx` - ✅ Sin errores
- `gestion_prestamos.jsx` - ✅ Sin errores
- `nuevo_prestamo.jsx` - ✅ Sin errores

Todos los archivos compilados sin errores de sintaxis o referencias.

---

## Próximos Pasos (No Completados - Fuera de Scope)

1. **API Integration**: Reemplazar mock data con llamadas reales a endpoints:
   - `GET /api/auth/usuarios/` - Listar usuarios (Lector)
   - `GET /api/inventario/libros/` - Listar libros
   - `GET /api/inventario/ejemplares/` - Listar ejemplares
   - `GET /api/auth/tipos-usuario/` - Listar tipos de usuario
   - `GET /api/ops/prestamos/` - Listar préstamos
   - `POST /api/ops/prestamos/` - Crear préstamo
   - `POST /api/ops/prestamos/{id}/devolver/` - Registrar devolución

2. **Error Handling**: Implementar manejo de errores HTTP desde backend

3. **Validaciones Backend**: Conectar validaciones frontend con respuestas del servidor

4. **Multa Model**: Implementar integración con modelo `Multa` en flujo de devolución

---

## Resumen de Cambios por Archivo

| Archivo | Cambios | Estado |
|---------|---------|--------|
| `auth.js` | Endpoint, tokens | ✅ Completado |
| `usuarios.jsx` | Campo nombres, rol como ID | ✅ Completado |
| `libros.jsx` | Relación Ejemplar, fecha_publicacion | ✅ Completado |
| `gestion_prestamos.jsx` | Nombres campos, estados | ✅ Completado |
| `nuevo_prestamo.jsx` | Nombres campos, ejemplares | ✅ Completado |
| `axios.js` | N/A | ✅ Correcto |
| `Sidebar.jsx` | N/A | ✅ Correcto |

---

**Fecha de Actualización**: 2024
**Estado General**: Todas las incongruencias identificadas han sido corregidas
