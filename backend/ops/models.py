from django.db import models
from usuarios.models import Lector
from inventario.models import Ejemplar
from django.utils import timezone
from datetime import timedelta
# Create your models here.

class Prestamo(models.Model):
    ESTADOS=[
    ('activo', 'Activo'),
    ('finalizado', 'Finalizado'),
    ('atrasado', 'Atrasado')]

    idPrestamo = models.AutoField(primary_key=True)
    codigoEjemplar = models.ForeignKey(Ejemplar, on_delete=models.CASCADE)
    fecha_prestamo = models.DateTimeField(default=timezone.now)
    fecha_devolucion = models.DateTimeField(null=True, blank=True)
    fecha_devolucion_real = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices = ESTADOS, default='activo')
    lector = models.ForeignKey(Lector, on_delete=models.CASCADE)
    renovacionesUtilizadas = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.fecha_devolucion:
            duracion = self.lector.rol.diasPrestamoMax
            self.fecha_devolucion = self.fecha_prestamo + timedelta(days=duracion)
        super().save(*args, **kwargs)

class Multa(models.Model):


    ESTADOS=[
    ('pendiente', 'Pendiente'),
    ('pagada', 'Pagada')]
    
    idMulta = models.AutoField(primary_key=True)
    fechaMulta = models.DateTimeField(default=timezone.now)
    diasRetraso = models.IntegerField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estadoPago = models.CharField(max_length=20, choices = ESTADOS, default='pendiente')
    idPrestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE)