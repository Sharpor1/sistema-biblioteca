"""
Script para actualizar los tipos de usuario con los límites correctos
Ejecutar desde el directorio backend con: python actualizar_tipos_usuario.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'biblioteca_ERM.settings')
django.setup()

from usuarios.models import TipoUsuario

def actualizar_tipos():
    try:
        print("🚀 Actualizando tipos de usuario...")
        
        # Actualizar Estudiante
        tipo_estudiante = TipoUsuario.objects.get(nombre="Estudiante")
        tipo_estudiante.cupoPrestamoMax = 4
        tipo_estudiante.maxRenovaciones = 1
        tipo_estudiante.save()
        print(f"✅ Estudiante actualizado: {tipo_estudiante.cupoPrestamoMax} libros, {tipo_estudiante.maxRenovaciones} renovaciones")
        
        # Actualizar Docente
        tipo_docente = TipoUsuario.objects.get(nombre="Docente")
        tipo_docente.cupoPrestamoMax = 5
        tipo_docente.maxRenovaciones = 2
        tipo_docente.save()
        print(f"✅ Docente actualizado: {tipo_docente.cupoPrestamoMax} libros, {tipo_docente.maxRenovaciones} renovaciones")
        
        print("\n🎉 Tipos de usuario actualizados correctamente!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    actualizar_tipos()
