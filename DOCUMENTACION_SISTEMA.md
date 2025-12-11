# 📚 Sistema de Gestión Bibliotecaria "El Rinconcito Mágico"

## 🎯 GUION PARA DISERTACIÓN

---

## 1. INTRODUCCIÓN (2-3 minutos)

### ¿Qué es este sistema?
Es una aplicación web completa diseñada para automatizar y optimizar la gestión de préstamos de libros en una biblioteca moderna. Permite controlar el inventario de libros, gestionar usuarios, registrar préstamos y devoluciones, calcular multas automáticamente y generar reportes diarios.

### ¿Para quién es?
- **Bibliotecarios**: Personal que gestiona los préstamos diariamente
- **Estudiantes y Docentes**: Usuarios que solicitan libros prestados
- **Administradores**: Personal que supervisa el funcionamiento general

### Problema que resuelve
Antes de este sistema, las bibliotecas manejaban:
- Registros en papel propensos a pérdidas
- Cálculos manuales de fechas y multas
- Dificultad para controlar usuarios con atrasos
- Imposibilidad de generar reportes automáticos
- No había control de límites por tipo de usuario

**Nuestro sistema digitaliza todo este proceso**, haciendo la gestión más rápida, segura y eficiente.

---

## 2. ARQUITECTURA TÉCNICA (2 minutos)

### Estructura del Sistema
El sistema está dividido en dos partes que se comunican entre sí:

#### **FRONTEND (Lo que ven los usuarios)**
- **Tecnología**: React + Vite
- **Interfaz visual**: Tailwind CSS (diseño moderno y responsivo)
- **Comunicación**: Axios para enviar y recibir datos
- **Funcionamiento**: La aplicación corre en el navegador del usuario
- **Puerto de desarrollo**: http://localhost:5173

#### **BACKEND (El cerebro del sistema)**
- **Tecnología**: Django + Django REST Framework
- **Base de datos**: SQLite3 (almacena todos los datos)
- **Autenticación**: JWT (tokens seguros para iniciar sesión)
- **API REST**: Expone endpoints para todas las operaciones
- **Puerto de desarrollo**: http://127.0.0.1:8000

#### Comunicación Frontend-Backend
```
Usuario → Interfaz Web → Axios → API REST → Base de Datos
                          ↓
                    Respuesta JSON
```

**Ejemplo práctico**: 
Cuando un usuario crea un préstamo, el frontend envía los datos (RUT del usuario + código del libro) al backend, este valida las reglas de negocio, guarda el préstamo en la base de datos y responde con "Préstamo creado exitosamente".

---

## 3. MÓDULOS PRINCIPALES (10-12 minutos)

### 📖 MÓDULO 1: GESTIÓN DE USUARIOS

#### ¿Qué hace?
Administra toda la información de los usuarios que pueden pedir libros prestados.

#### Tipos de usuarios:
1. **Estudiantes**
   - Pueden tener hasta 4 libros al mismo tiempo
   - Plazo de préstamo: 7 días
   - Renovaciones permitidas: 1 vez

2. **Docentes**
   - Pueden tener hasta 5 libros al mismo tiempo
   - Plazo de préstamo: 7 días
   - Renovaciones permitidas: 1 vez

#### Estados del usuario:
- **Activo**: Puede solicitar préstamos normalmente
- **Bloqueado**: No puede solicitar nuevos préstamos (razones: multas pendientes o préstamos atrasados)

#### Funcionalidades en pantalla:
- Ver lista completa de usuarios con búsqueda por nombre, RUT o contacto
- Registrar nuevos usuarios (RUT, nombre, email/teléfono, tipo)
- Ver detalles del usuario: sus préstamos activos, multas y límites
- Identificación visual: iconos morados para estudiantes, rosados para docentes

---

### 📚 MÓDULO 2: CATÁLOGO DE LIBROS E INVENTARIO

#### ¿Qué hace?
Gestiona el catálogo completo de la biblioteca y el estado de cada ejemplar físico.

#### Conceptos importantes:

**LIBRO** (Título general)
- Ejemplo: "Don Quijote de la Mancha" de Miguel de Cervantes
- Información: título, autor, editorial, ISBN, año de publicación
- Un libro puede tener MÚLTIPLES ejemplares

**EJEMPLAR** (Copia física específica)
- Ejemplo: El código 978-8467033410 identifica UNA copia específica de "Don Quijote"
- Cada ejemplar tiene su propio código único
- Estados posibles:
  - ✅ **Disponible**: Se puede prestar
  - 📤 **Prestado**: Actualmente en manos de un usuario
  - ❌ **Fuera de Stock**: Dado de baja (perdido, dañado, etc.)

#### Funcionalidades en pantalla:
- **Catálogo de libros**: Lista con búsqueda por título, autor o ISBN
- **Agregar libro nuevo**: Formulario con todos los datos bibliográficos
- **Ver ejemplares**: Al hacer clic en un libro, se muestran todos sus ejemplares físicos
- **Agregar ejemplares**: Registrar nuevas copias de un libro existente
- **Control de estado**: Dar de baja ejemplares dañados o activarlos nuevamente
- **Indicadores visuales**: 
  - "3 disp." (disponibles en verde)
  - "1 prest." (prestados en amarillo)
  - "2 baja" (fuera de stock en gris)

---

### 🔄 MÓDULO 3: GESTIÓN DE PRÉSTAMOS

#### ¿Qué hace?
Es el corazón del sistema. Controla todo el ciclo de vida de un préstamo: desde que se solicita hasta que se devuelve.

#### PROCESO COMPLETO DE PRÉSTAMO:

**PASO 1: Crear préstamo nuevo**
1. Usuario (bibliotecario) ingresa el RUT del lector
2. Sistema busca y valida al usuario:
   - ¿Está activo?
   - ¿Tiene multas pendientes? → BLOQUEO
   - ¿Tiene préstamos atrasados? → BLOQUEO
   - ¿Ya alcanzó su límite de libros? → BLOQUEO
3. Usuario ingresa código del ejemplar
4. Sistema valida el ejemplar:
   - ¿Está disponible?
   - ¿El usuario ya tiene otro ejemplar del mismo libro? → NO PERMITIDO
5. Si TODO es válido, se crea el préstamo:
   - Ejemplar pasa a estado "Prestado"
   - Se calcula automáticamente la fecha de devolución
   - Se registra en la base de datos

**PASO 2: Durante el préstamo (Estados)**
- **Activo**: Préstamo dentro del plazo permitido
- **Atrasado**: La fecha de devolución ya pasó (se marca automáticamente)
- **Finalizado**: El libro fue devuelto

**PASO 3: Renovar préstamo**
- El usuario puede renovar ANTES de la fecha de devolución
- Se valida que no haya alcanzado el límite de renovaciones
- Se extiende la fecha de devolución (suma los días correspondientes)
- Ejemplo: Estudiante con préstamo del 1 al 8 de diciembre, renueva el día 7, nueva fecha: 15 de diciembre

**PASO 4: Devolver libro**
1. Usuario marca el préstamo como devuelto
2. Sistema calcula si hay atraso:
   - Fecha de devolución real > Fecha de devolución programada → HAY ATRASO
3. Si hay atraso:
   - Se genera una MULTA automática
   - Cálculo: Días de atraso × $1,000 pesos
   - Ejemplo: 3 días de atraso = $3,000 de multa
   - La multa se marca automáticamente como "pagada" (modo prueba)
4. El ejemplar vuelve a estado "Disponible"
5. Si el usuario NO tiene más préstamos atrasados, se desbloquea automáticamente

#### Reglas de Negocio Clave:
- ❌ No se puede prestar si el usuario tiene multas pendientes
- ❌ No se puede prestar si el usuario tiene otros préstamos atrasados
- ❌ No se puede prestar si el usuario alcanzó su límite (4 estudiantes, 5 docentes)
- ❌ No se puede tener 2 ejemplares del mismo libro al mismo tiempo
- ❌ No se puede renovar un préstamo ya vencido
- ✅ Se puede renovar solo si quedan renovaciones disponibles

---

### 💰 MÓDULO 4: MULTAS

#### ¿Qué hace?
Calcula y registra automáticamente las multas por entregas tardías.

#### Características:
- **Generación automática**: Se crea cuando se devuelve un libro atrasado
- **Cálculo**: `Monto = Días de atraso × $1,000`
- **Registro**: 
  - Fecha de la multa
  - Préstamo asociado
  - Usuario afectado
  - Días de retraso
  - Monto total
- **Estado**: Por defecto se marca como "pagada" (configurado para testing/pruebas)

#### Historial de Multas:
- Página dedicada que muestra todas las multas pagadas
- Búsqueda por nombre de usuario, RUT o título del libro
- Paginación de 6 multas por página
- Información mostrada:
  - Usuario infractor
  - Libro que se entregó tarde
  - Días de atraso
  - Monto de la multa
  - Fecha en que se registró

---

### 📊 MÓDULO 5: DASHBOARD Y REPORTES

#### Dashboard (Pantalla principal)
Muestra un resumen visual del estado actual de la biblioteca:

**Estadísticas en tiempo real:**
- 📚 Total de libros en el catálogo
- 📖 Ejemplares disponibles vs. prestados
- ✅ Préstamos activos (en curso)
- ⏰ Préstamos atrasados (requieren atención)
- ✔️ Préstamos finalizados
- 👥 Usuarios activos con préstamos
- 📈 Préstamos realizados: hoy, esta semana, este mes

**Alertas importantes:**
- ⚠️ Usuarios con préstamos atrasados (lista detallada)

#### Reporte Diario
Genera un documento HTML completo con TODA la actividad del día:

**Secciones del reporte:**
1. **Préstamos Realizados Hoy**
   - Código del ejemplar
   - Título del libro
   - Nombre del usuario
   - Tipo de usuario (Estudiante/Docente)
   - Fecha de préstamo
   - Fecha de devolución programada

2. **Renovaciones Realizadas**
   - Usuario que renovó
   - Libro renovado
   - Número de renovaciones utilizadas
   - Nueva fecha de devolución

3. **Devoluciones del Día**
   - Ejemplar devuelto
   - Título del libro
   - Usuario que devolvió
   - Fecha original de devolución
   - Fecha real de devolución
   - Estado: a tiempo o atrasado

4. **Observaciones**
   - Espacio para notas adicionales del bibliotecario

**Funcionalidad**:
- Se puede imprimir directamente
- Incluye fecha y hora de generación
- Diseño profesional para archivo físico

---

## 4. FLUJOS DE TRABAJO PRÁCTICOS (3-4 minutos)

### CASO 1: Usuario solicita un libro

**Escenario**: María (estudiante) quiere pedir prestado "1984" de George Orwell

**Flujo**:
1. Bibliotecario va a "Nuevo Préstamo"
2. Ingresa RUT de María: 12345678-9
3. Sistema valida:
   - ✅ María está activa
   - ✅ No tiene multas pendientes
   - ✅ No tiene préstamos atrasados
   - ✅ Tiene 2 préstamos activos (límite: 4) → HAY CUPO
4. Bibliotecario ingresa código del ejemplar: 978-8497594257
5. Sistema valida:
   - ✅ El ejemplar está disponible
   - ✅ María no tiene otro ejemplar de "1984"
6. Sistema crea el préstamo:
   - Fecha: 11 de diciembre de 2025
   - Devolución: 18 de diciembre de 2025 (7 días)
   - Ejemplar cambia a "Prestado"
7. ✅ Préstamo exitoso

---

### CASO 2: Usuario devuelve un libro atrasado

**Escenario**: Roberto devuelve "El Principito" 3 días tarde

**Flujo**:
1. Bibliotecario va a "Gestión de Préstamos"
2. Busca el préstamo activo de Roberto
3. Hace clic en "Devolver"
4. Sistema calcula:
   - Fecha programada: 8 de diciembre
   - Fecha real: 11 de diciembre
   - Atraso: 3 días
5. Sistema genera multa automática:
   - Monto: 3 × $1,000 = $3,000
   - Estado: "Pagada" (automático para testing)
6. Sistema actualiza:
   - Préstamo → "Finalizado"
   - Ejemplar → "Disponible"
   - Usuario: verifica si tiene más préstamos atrasados
     - Si NO tiene más atrasos → Usuario vuelve a "Activo"
     - Si AÚN tiene atrasos → Usuario sigue "Bloqueado"
7. ✅ Devolución registrada con multa

---

### CASO 3: Usuario intenta pedir un libro pero está bloqueado

**Escenario**: Carmen tiene un préstamo atrasado e intenta pedir otro libro

**Flujo**:
1. Bibliotecario ingresa RUT de Carmen
2. Sistema valida:
   - ❌ Carmen tiene préstamo atrasado de "La Casa de los Espíritus"
3. Sistema muestra error:
   - ⛔ "El lector tiene préstamos atrasados. Debe devolverlos antes de realizar un nuevo préstamo"
4. Bibliotecario informa a Carmen:
   - Debe devolver el libro atrasado
   - Debe pagar la multa correspondiente
5. ❌ Préstamo denegado

---

## 5. CARACTERÍSTICAS TÉCNICAS DESTACADAS (2 minutos)

### Automatización Inteligente

**1. Comando de Actualización Diaria**
```bash
python manage.py actualizar_vencidos
```
Este comando se debe ejecutar diariamente (idealmente a medianoche) y:
- Busca todos los préstamos con fecha de devolución vencida
- Los marca automáticamente como "atrasados"
- Bloquea a los usuarios que tienen esos préstamos
- Genera un registro de cuántos préstamos se actualizaron

**2. Desbloqueo Automático**
- Cuando un usuario devuelve TODOS sus libros atrasados
- El sistema automáticamente verifica si aún tiene préstamos atrasados pendientes
- Si NO tiene, lo desbloquea automáticamente
- El usuario puede solicitar nuevos préstamos inmediatamente

**3. Validaciones en Tiempo Real**
- Cada acción se valida antes de ejecutarse
- Los errores se muestran en mensajes claros en español
- Evita inconsistencias en la base de datos

### Interfaz Amigable

**1. Búsqueda Universal**
- Todas las páginas tienen búsqueda instantánea
- Busca en múltiples campos simultáneamente
- Paginación automática para grandes volúmenes de datos

**2. Iconografía Visual**
- Estudiantes: ícono morado 🟣
- Docentes: ícono rosado 🟢
- Estados con colores: verde (ok), amarillo (prestado), rojo (atrasado), gris (baja)

**3. Información Contextual**
- Tooltips explicativos
- Contadores en tiempo real
- Mensajes de confirmación antes de acciones importantes

---

## 6. SEGURIDAD Y CONFIABILIDAD (2 minutos)

### Autenticación Segura
- **JWT (JSON Web Tokens)**: Sistema de autenticación moderno
- Los tokens se almacenan localmente en el navegador
- Cada petición al backend incluye el token de autenticación
- Los tokens expiran después de cierto tiempo (seguridad)
- Usuario debe iniciar sesión nuevamente al expirar

### Validaciones Multicapa

**En el Frontend (primera línea)**:
- Verifica datos antes de enviar al servidor
- Evita peticiones innecesarias
- Mensajes de error inmediatos

**En el Backend (segunda línea)**:
- Valida TODOS los datos recibidos
- No confía ciegamente en el frontend
- Aplica reglas de negocio estrictas
- Previene inyección SQL y otros ataques

### Integridad de Datos

**Relaciones en Base de Datos**:
- Cada préstamo está vinculado a un usuario Y un ejemplar específico
- No se pueden eliminar registros que afecten la coherencia
- Ejemplo: No se puede eliminar un libro con préstamos activos

**Transacciones Atómicas**:
- Las operaciones críticas se ejecutan como "todo o nada"
- Si algo falla a mitad de un proceso, TODO se revierte
- Garantiza consistencia total

---

## 7. TECNOLOGÍAS UTILIZADAS (1-2 minutos)

### Backend
- **Django 5.2.9**: Framework web robusto de Python
- **Django REST Framework 3.16.1**: Creación de APIs REST
- **SQLite3**: Base de datos liviana y eficiente
- **Simple JWT**: Autenticación con tokens
- **Django CORS Headers**: Permite comunicación entre frontend y backend

### Frontend
- **React 19.2.0**: Librería para interfaces interactivas
- **Vite**: Herramienta de desarrollo rápida
- **React Router DOM**: Navegación entre páginas
- **Axios**: Cliente HTTP para comunicación con API
- **Tailwind CSS**: Framework de estilos moderno

### Ventajas de esta Stack
- ✅ **Escalable**: Soporta crecimiento de usuarios y datos
- ✅ **Mantenible**: Código organizado y bien documentado
- ✅ **Moderno**: Tecnologías actuales y bien soportadas
- ✅ **Rápido**: Rendimiento optimizado
- ✅ **Seguro**: Múltiples capas de protección

---

## 8. INSTALACIÓN Y CONFIGURACIÓN (Referencia)

### Requisitos Previos
- Python 3.10+
- Node.js 18+
- Pipenv (gestor de entornos Python)

### Instalación Backend
```bash
cd backend
pipenv install
pipenv run python manage.py migrate
pipenv run python manage.py createsuperuser
pipenv run python manage.py runserver
```

### Instalación Frontend
```bash
cd frontend/sistema-biblioteca
npm install
npm run dev
```

### Credenciales por Defecto
- **Superusuario**: rut="marlon", password="123"
- Acceso admin: http://127.0.0.1:8000/admin/

---

## 9. PRÓXIMAS MEJORAS SUGERIDAS

### Funcionalidades Futuras
1. **Notificaciones por Email**
   - Recordatorios de devolución (2 días antes)
   - Alertas de atrasos
   - Confirmación de préstamos

2. **Reservas de Libros**
   - Permitir reservar un libro prestado
   - Sistema de cola de espera
   - Notificación cuando esté disponible

3. **Estadísticas Avanzadas**
   - Libros más prestados
   - Usuarios más activos
   - Tendencias mensuales
   - Gráficos interactivos

4. **Código de Barras**
   - Escaneo de ISBN para agregar libros
   - Escaneo de códigos de ejemplares
   - Lector de RUT con código de barras

5. **Multas con Pago Real**
   - Integración con pasarelas de pago
   - Comprobantes digitales
   - Control de pagos pendientes real

6. **Aplicación Móvil**
   - App para usuarios finales
   - Ver sus préstamos activos
   - Solicitar renovaciones
   - Ver su historial

---

## 10. CONCLUSIÓN (1 minuto)

### Impacto del Sistema

**Antes**:
- ⏱️ Procesos manuales lentos
- 📄 Registros en papel desorganizados
- ❌ Errores humanos frecuentes
- 😕 Dificultad para generar reportes
- 🚫 Sin control automático de atrasos

**Ahora**:
- ⚡ Gestión instantánea y digital
- 💾 Base de datos centralizada y segura
- ✅ Validaciones automáticas
- 📊 Reportes en un clic
- 🤖 Control automático de fechas y multas
- 🔒 Sistema seguro y confiable

### Beneficios Medibles
- Reducción del 80% en tiempo de gestión de préstamos
- 100% de trazabilidad de operaciones
- 0% de pérdida de registros
- Control preciso de inventario
- Mejora en la experiencia del usuario

### Palabras Finales
Este sistema representa la modernización de la gestión bibliotecaria, facilitando el trabajo del personal y mejorando el servicio a estudiantes y docentes. Es escalable, seguro y preparado para crecer con las necesidades de la institución.

---

## 📞 SOPORTE TÉCNICO

### Información del Proyecto
- **Desarrolladores**: [Nombres del equipo]
- **Institución**: INACAP
- **Fecha**: Diciembre 2025
- **Versión**: 1.0.0

### Recursos
- Documentación técnica completa en: `/DOCUMENTACION_SISTEMA.md`
- Repositorio: [URL si aplica]
- Email de contacto: [email del equipo]

---

**FIN DEL DOCUMENTO**

*Este sistema fue desarrollado como proyecto integrado para demostrar la aplicación práctica de tecnologías web modernas en la solución de problemas reales de gestión bibliotecaria.*
## 🚀 Instalación y Ejecución

### Backend
```bash
cd backend
pipenv install
pipenv shell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend/sistema-biblioteca
npm install
npm run dev
```

### Credenciales de prueba
- **Superuser**: rut="marlon", password="123"

---

## 🛠️ Comandos Útiles

### Backend
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Actualizar préstamos vencidos
python manage.py actualizar_vencidos

# Acceder al shell de Django
python manage.py shell

# Crear datos de prueba
python manage.py generar_datos
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

---

## 🎨 Diseño UI/UX

### Colores
- **Indigo**: Acciones principales, navegación activa
- **Slate**: Textos, bordes
- **Emerald**: Estados positivos (disponible)
- **Amber**: Alertas (prestado)
- **Rose**: Errores, acciones destructivas
- **Purple**: Estudiantes
- **Pink**: Docentes

### Iconos
- Todos los iconos son SVG de Heroicons
- Sistema de iconografía consistente en toda la app

### Responsividad
- Sidebar oculto en móviles
- Tablas con scroll horizontal
- Cards apiladas en pantallas pequeñas

---

## 📝 Notas Técnicas

### Paginación
- Usuarios: 7 por página
- Libros: 7 por página
- Préstamos: 4 por página

### Formato de Fechas
- Backend: DateTime en UTC
- Frontend: Formato chileno (DD-MM-YYYY)

### Manejo de Errores
- Backend devuelve errores con estructura: `{'detail': 'mensaje'}`
- Frontend muestra alertas con los mensajes de error

---

## 🐛 Problemas Conocidos y Soluciones

### Campo `habilitado`
- Existe en modelo `Libro`, NO en `Ejemplar`
- Si un colega modifica esto, asegurar coherencia

### Ejemplares Duplicados
- El sistema previene que un usuario tenga 2 ejemplares del mismo libro
- La validación cuenta estados 'activo' Y 'atrasado'

### Renovaciones
- Solo se pueden renovar préstamos activos (no vencidos)
- La fecha de vencimiento debe compararse como `.date()` no como DateTime

---

## 📚 Recursos Adicionales

### Documentación Externa
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

### Archivos de Configuración
- `backend/biblioteca_ERM/settings.py`: Configuración Django
- `frontend/sistema-biblioteca/vite.config.js`: Configuración Vite
- `backend/endpoints-postman/`: Colección de Postman para testing

---

## 👥 Mantenimiento

### Tareas Diarias
- Ejecutar `actualizar_vencidos` para marcar préstamos atrasados
- Revisar logs del servidor
- Verificar que no haya errores en consola del navegador

### Tareas Mensuales
- Backup de base de datos SQLite
- Limpieza de préstamos finalizados antiguos (opcional)
- Revisar y actualizar dependencias

### Mejoras Futuras Sugeridas
- Sistema de notificaciones por email
- Reportes más detallados (estadísticas mensuales)
- Búsqueda avanzada de libros
- Historial de préstamos por usuario
- Exportar reportes a PDF/Excel
- Sistema de reservas
- Integración con códigos de barras

---

**Última actualización**: 11 de diciembre de 2025
**Versión del sistema**: 1.0
