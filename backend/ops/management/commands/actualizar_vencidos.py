from django.core.management.base import BaseCommand
from django.utils import timezone
from ops.models import Prestamo
from usuarios.models import Lector

class Command(BaseCommand):
    help = 'Busca préstamos cuya fecha de devolución ya pasó y los marca como atrasados, bloqueando a los usuarios'

    def handle(self, *args, **kwargs):
        hoy = timezone.now().date()
        
        # Buscar préstamos activos cuya fecha de devolución ya pasó
        prestamos_vencidos = Prestamo.objects.filter(
            estado='activo',
            fecha_devolucion__lt=hoy
        )
        
        # Actualizar préstamos a estado atrasado
        cantidad = prestamos_vencidos.update(estado='atrasado')
        
        # Bloquear usuarios con préstamos atrasados
        lectores_con_atrasos = Lector.objects.filter(
            prestamo__estado='atrasado'
        ).distinct()
        
        usuarios_bloqueados = 0
        for lector in lectores_con_atrasos:
            if lector.estado != 'bloqueado':
                lector.estado = 'bloqueado'
                lector.save()
                usuarios_bloqueados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Se actualizaron {cantidad} préstamos a estado ATRASADO y se bloquearon {usuarios_bloqueados} usuarios'
        ))