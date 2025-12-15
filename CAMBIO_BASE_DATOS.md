# 🔄 Guía de Cambio Entre Bases de Datos

## 📍 Estado Actual del Sistema

El sistema está configurado para cambiar fácilmente entre:
- **Desarrollo Local**: SQLite (db.sqlite3)
- **Producción en la Nube**: PostgreSQL en Azure

---

## 🖥️ MODO DESARROLLO LOCAL (SQLite)

### ✅ Configuración Actual (Por Defecto)
El sistema está configurado para usar SQLite localmente SIN necesidad de archivo `.env`.

### Ejecutar en Local:
```bash
cd backend
pipenv run python manage.py runserver
```

**Base de datos utilizada**: `db.sqlite3` (archivo local)

---

## ☁️ MODO PRODUCCIÓN (Azure PostgreSQL)

### Cambiar a Base de Datos en la Nube:

**Opción 1: Copiar archivo de configuración**
```bash
cd backend
cp .env.production .env
```

**Opción 2: Crear archivo .env manualmente**
```bash
# Contenido del archivo .env:
USE_POSTGRES=True
DEBUG=False
```

### Ejecutar con PostgreSQL:
```bash
pipenv run python manage.py runserver
```

**Base de datos utilizada**: PostgreSQL en `db-biblioteca-prod.postgres.database.azure.com`

---

## 🔄 Volver a Modo Local

Para volver a usar SQLite local:

**Opción 1: Eliminar el archivo .env**
```bash
cd backend
rm .env  # o del .env en Windows
```

**Opción 2: Editar .env y comentar/eliminar USE_POSTGRES**
```bash
# USE_POSTGRES=True  (comentado)
```

---

## 📋 Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `.env.production` | Configuración completa para Azure (NO editar) |
| `.env.example` | Plantilla de ejemplo con documentación |
| `.env` | Tu archivo de configuración activo (NO subir a Git) |
| `db.sqlite3` | Base de datos local SQLite |

---

## 🔐 Credenciales Guardadas

Las credenciales de la base de datos de Azure están guardadas en:
- `settings.py` (hardcoded como fallback)
- `.env.production` (archivo de referencia)

### PostgreSQL Azure:
- Host: `db-biblioteca-prod.postgres.database.azure.com`
- Database: `biblioteca_db`
- User: `postgresql`
- Password: `Rinconcito-magico`

---

## 🚀 Despliegue a Azure

### Antes de desplegar:

1. **Verificar configuración de producción**:
```bash
# Asegurarse que .env.production tiene los valores correctos
cat .env.production
```

2. **Configurar variables de entorno en Azure**:
En Azure App Service > Configuration > Application Settings:
```
USE_POSTGRES = True
DEBUG = False
SECRET_KEY = [tu_secret_key]
WEBSITE_HOSTNAME = rinconcitomagico-d2ejfmc8aebdbqag.canadacentral-01.azurewebsites.net
```

3. **Desplegar**:
```bash
git push azure main
# o el método de despliegue que uses
```

---

## ⚠️ IMPORTANTE

### Archivos en .gitignore:
```
.env
db.sqlite3
*.pyc
__pycache__/
```

### NO subir a Git:
- ❌ `.env` (contiene credenciales)
- ❌ `db.sqlite3` (base de datos local)

### SÍ subir a Git:
- ✅ `.env.example` (plantilla sin credenciales)
- ✅ `.env.production` (referencia de configuración de producción)
- ✅ `settings.py` (código de configuración)

---

## 🧪 Verificar Configuración Actual

Para saber qué base de datos está usando:

```bash
cd backend
pipenv run python manage.py shell
```

Luego en el shell de Python:
```python
from django.conf import settings
print(f"Database Engine: {settings.DATABASES['default']['ENGINE']}")
print(f"Database Name: {settings.DATABASES['default']['NAME']}")
```

**Resultado esperado**:
- Local: `django.db.backends.sqlite3` + `db.sqlite3`
- Azure: `django.db.backends.postgresql` + `biblioteca_db`

---

## 📞 Troubleshooting

### Error: "No module named 'psycopg2'"
```bash
pipenv install psycopg2-binary
```

### Error: "Unable to connect to PostgreSQL"
- Verificar que USE_POSTGRES=True en .env
- Verificar credenciales en .env.production
- Verificar conexión a internet
- Verificar que Azure DB está activa

### Los cambios no se reflejan
```bash
# Reiniciar el servidor Django
# Ctrl+C y luego:
pipenv run python manage.py runserver
```

---

**Última actualización**: Diciembre 15, 2025
