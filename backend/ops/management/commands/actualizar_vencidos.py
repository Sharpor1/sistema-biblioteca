from django.core.management.base import BaseCommand
from django.utils import timezone
from ops.models import Prestamo # Ajusta el import a tu app

class Command(BaseCommand):
    help = 'Busca préstamos cuya fecha de devolución ya pasó y los marca como VENCIDOS'

    def handle(self, *args, **kwargs):
        hoy = timezone.now().date()
        
        # Buscamos préstamos que:
        # 1. No estén devueltos
        # 2. No estén ya marcados como vencidos
        # 3. Su fecha de devolución sea MENOR a hoy (< hoy)
        prestamos_vencidos = Prestamo.objects.filter(
            estado='PENDIENTE',  # O el estado que uses para "En curso"
            fecha_devolucion__lt=hoy
        )
        
        # .update() es súper rápido, hace todo en una sola consulta SQL
        cantidad = prestamos_vencidos.update(estado='VENCIDO')

        self.stdout.write(self.style.SUCCESS(f'Se actualizaron {cantidad} préstamos a estado VENCIDO'))