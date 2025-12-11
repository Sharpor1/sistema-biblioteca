"""
Script para generar datos de prueba: 10 usuarios y 10 libros
Ejecutar desde el directorio backend con: python generar_datos.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'biblioteca_ERM.settings')
django.setup()

from usuarios.models import Lector, TipoUsuario
from inventario.models import Libro, Ejemplar
from django.db import transaction

# Datos de usuarios
usuarios_data = [
    {"rut": "12345678-9", "nombreCompleto": "María García López", "contacto": "maria.garcia@example.com", "tipo": "Estudiante"},
    {"rut": "98765432-1", "nombreCompleto": "Juan Pérez Soto", "contacto": "juan.perez@example.com", "tipo": "Docente"},
    {"rut": "11223344-5", "nombreCompleto": "Ana Martínez Rojas", "contacto": "ana.martinez@example.com", "tipo": "Estudiante"},
    {"rut": "55667788-9", "nombreCompleto": "Carlos Silva Vargas", "contacto": "carlos.silva@example.com", "tipo": "Docente"},
    {"rut": "22334455-6", "nombreCompleto": "Laura Fernández Castro", "contacto": "laura.fernandez@example.com", "tipo": "Estudiante"},
    {"rut": "66778899-0", "nombreCompleto": "Pedro Ramírez Muñoz", "contacto": "pedro.ramirez@example.com", "tipo": "Estudiante"},
    {"rut": "33445566-7", "nombreCompleto": "Isabel Torres Morales", "contacto": "isabel.torres@example.com", "tipo": "Docente"},
    {"rut": "77889900-1", "nombreCompleto": "Roberto Campos Ortiz", "contacto": "roberto.campos@example.com", "tipo": "Estudiante"},
    {"rut": "44556677-8", "nombreCompleto": "Carmen Vega Navarro", "contacto": "carmen.vega@example.com", "tipo": "Estudiante"},
    {"rut": "88990011-2", "nombreCompleto": "Francisco Herrera Díaz", "contacto": "francisco.herrera@example.com", "tipo": "Docente"},
]

# Datos de libros
libros_data = [
    {"titulo": "El Principito", "autor": "Antoine de Saint-Exupéry", "editorial": "Salamandra", "isbn": "978-8498381498", "fecha_publicacion": "1943-04-06"},
    {"titulo": "1984", "autor": "George Orwell", "editorial": "Debolsillo", "isbn": "978-8497594257", "fecha_publicacion": "1949-06-08"},
    {"titulo": "Rayuela", "autor": "Julio Cortázar", "editorial": "Punto de Lectura", "isbn": "978-8466320832", "fecha_publicacion": "1963-06-28"},
    {"titulo": "La Casa de los Espíritus", "autor": "Isabel Allende", "editorial": "Plaza & Janés", "isbn": "978-8401337819", "fecha_publicacion": "1982-01-01"},
    {"titulo": "Don Quijote de la Mancha", "autor": "Miguel de Cervantes", "editorial": "Austral", "isbn": "978-8467033410", "fecha_publicacion": "1605-01-16"},
    {"titulo": "El Alquimista", "autor": "Paulo Coelho", "editorial": "Planeta", "isbn": "978-8408043638", "fecha_publicacion": "1988-01-01"},
    {"titulo": "Como Agua para Chocolate", "autor": "Laura Esquivel", "editorial": "Debolsillo", "isbn": "978-8490322581", "fecha_publicacion": "1989-01-01"},
    {"titulo": "La Sombra del Viento", "autor": "Carlos Ruiz Zafón", "editorial": "Planeta", "isbn": "978-8408072560", "fecha_publicacion": "2001-04-17"},
    {"titulo": "Crónica de una Muerte Anunciada", "autor": "Gabriel García Márquez", "editorial": "Debolsillo", "isbn": "978-8497592437", "fecha_publicacion": "1981-01-01"},
    {"titulo": "Los Detectives Salvajes", "autor": "Roberto Bolaño", "editorial": "Anagrama", "isbn": "978-8433920522", "fecha_publicacion": "1998-01-01"},
]

def generar_datos():
    try:
        with transaction.atomic():
            print("🚀 Iniciando generación de datos...")
            
            # Obtener o crear tipos de usuario
            tipo_estudiante, _ = TipoUsuario.objects.get_or_create(
                nombre="Estudiante",
                defaults={
                    'diasPrestamoMin': 7,
                    'diasPrestamoMax': 14,
                    'cupoLibros': 3,
                    'renovacionesMax': 1
                }
            )
            
            tipo_docente, _ = TipoUsuario.objects.get_or_create(
                nombre="Docente",
                defaults={
                    'diasPrestamoMin': 14,
                    'diasPrestamoMax': 30,
                    'cupoLibros': 5,
                    'renovacionesMax': 2
                }
            )
            
            print(f"✅ Tipos de usuario configurados")
            
            # Crear usuarios
            usuarios_creados = 0
            for usuario_data in usuarios_data:
                tipo = tipo_docente if usuario_data['tipo'] == 'Docente' else tipo_estudiante
                
                if not Lector.objects.filter(rut=usuario_data['rut']).exists():
                    Lector.objects.create(
                        rut=usuario_data['rut'],
                        nombreCompleto=usuario_data['nombreCompleto'],
                        contacto=usuario_data['contacto'],
                        rol=tipo,
                        estado='activo'
                    )
                    usuarios_creados += 1
            
            print(f"✅ {usuarios_creados} usuarios creados")
            
            # Crear libros y ejemplares
            libros_creados = 0
            ejemplares_creados = 0
            
            for libro_data in libros_data:
                if not Libro.objects.filter(isbn=libro_data['isbn']).exists():
                    libro = Libro.objects.create(**libro_data)
                    libros_creados += 1
                    
                    # Crear 2-3 ejemplares por libro
                    import random
                    num_ejemplares = random.randint(2, 3)
                    
                    for i in range(num_ejemplares):
                        # Generar código único
                        prefijo = ''.join([c[0].upper() for c in libro.titulo.split()[:3]])[:3]
                        codigo = f"{prefijo}{libro.idLibro}{i+1:04d}"
                        
                        Ejemplar.objects.create(
                            codigoEjemplar=codigo,
                            libro=libro,
                            estado='disponible'
                        )
                        ejemplares_creados += 1
            
            print(f"✅ {libros_creados} libros creados")
            print(f"✅ {ejemplares_creados} ejemplares creados")
            print("\n🎉 ¡Datos generados exitosamente!")
            
            # Resumen
            print("\n📊 RESUMEN:")
            print(f"   Total usuarios: {Lector.objects.count()}")
            print(f"   Total libros: {Libro.objects.count()}")
            print(f"   Total ejemplares: {Ejemplar.objects.count()}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    generar_datos()
