"""
Script para revisar todos los préstamos activos
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'biblioteca_ERM.settings')
django.setup()

from ops.models import Prestamo
from usuarios.models import Lector

print("📋 PRÉSTAMOS ACTIVOS Y ATRASADOS:\n")

for lector in Lector.objects.all():
    prestamos = Prestamo.objects.filter(
        lector=lector,
        estado__in=['activo', 'atrasado']
    ).select_related('codigoEjemplar__libro')
    
    if prestamos.exists():
        print(f"\n👤 {lector.nombreCompleto} ({lector.rut}):")
        libros_prestados = {}
        
        for p in prestamos:
            libro_titulo = p.codigoEjemplar.libro.titulo
            if libro_titulo not in libros_prestados:
                libros_prestados[libro_titulo] = []
            libros_prestados[libro_titulo].append(p)
        
        for titulo, lista_prestamos in libros_prestados.items():
            if len(lista_prestamos) > 1:
                print(f"   ⚠️  {titulo}: {len(lista_prestamos)} préstamos (DUPLICADO)")
                for p in lista_prestamos:
                    print(f"      - ID: {p.idPrestamo}, Ejemplar: {p.codigoEjemplar.codigoEjemplar}, Estado: {p.estado}, Fecha: {p.fecha_prestamo}")
            else:
                p = lista_prestamos[0]
                print(f"   ✓ {titulo} (Ejemplar: {p.codigoEjemplar.codigoEjemplar}, Estado: {p.estado})")
