"""
Script para limpiar préstamos duplicados del mismo libro
Ejecutar desde el directorio backend con: python limpiar_prestamos_duplicados.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'biblioteca_ERM.settings')
django.setup()

from ops.models import Prestamo
from django.db.models import Count

def limpiar_duplicados():
    try:
        print("🚀 Iniciando limpieza de préstamos duplicados...")
        
        # Buscar usuarios con préstamos duplicados del mismo libro
        usuarios_con_duplicados = Prestamo.objects.filter(
            estado__in=['activo', 'atrasado']
        ).values('lector', 'codigoEjemplar__libro').annotate(
            count=Count('idPrestamo')
        ).filter(count__gt=1)
        
        if not usuarios_con_duplicados:
            print("✅ No se encontraron préstamos duplicados")
            return
        
        eliminados = 0
        for item in usuarios_con_duplicados:
            lector_id = item['lector']
            libro_id = item['codigoEjemplar__libro']
            cantidad = item['count']
            
            # Obtener todos los préstamos de este lector y libro
            prestamos = Prestamo.objects.filter(
                lector_id=lector_id,
                codigoEjemplar__libro_id=libro_id,
                estado__in=['activo', 'atrasado']
            ).order_by('fecha_prestamo')
            
            # Mantener solo el más antiguo, eliminar los demás
            prestamos_a_eliminar = list(prestamos[1:])
            
            for prestamo in prestamos_a_eliminar:
                print(f"   Eliminando préstamo #{prestamo.idPrestamo} - {prestamo.codigoEjemplar.libro.titulo}")
                # Liberar el ejemplar
                prestamo.codigoEjemplar.estado = 'disponible'
                prestamo.codigoEjemplar.save()
                # Eliminar el préstamo
                prestamo.delete()
                eliminados += 1
        
        print(f"\n✅ Se eliminaron {eliminados} préstamos duplicados")
        print("🎉 Limpieza completada!")
        
        # Mostrar resumen actual
        print("\n📊 RESUMEN ACTUAL:")
        from usuarios.models import Lector
        for lector in Lector.objects.all():
            prestamos_activos = Prestamo.objects.filter(
                lector=lector,
                estado__in=['activo', 'atrasado']
            ).count()
            if prestamos_activos > 0:
                print(f"   {lector.nombreCompleto}: {prestamos_activos} préstamos activos")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    limpiar_duplicados()
