from django.db import models
from usuarios.models import Lector
from inventario.models import Ejemplar
# Create your models here.

class Prestamo(models.Model):
    ESTADOS=[
    ('activo', 'Activo'),
    ('finalizado', 'Finalizado'),
    ('atrasado', 'Atrasado')]

    idPrestamo = models.AutoField(primary_key=True)
    codigoEjemplar = models.ForeignKey(Ejemplar, on_delete=models.CASCADE)
    fecha_prestamo = models.DateField(auto_now_add=True)
    fecha_devolucion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices = ESTADOS, default='activo')
    lector = models.ForeignKey(Lector, on_delete=models.CASCADE)
    renovacionesUtilizadas = models.IntegerField(default=0)

    def __str__(self):
        return f"Prestamo de {self.codigoEjemplar} a {self.lector}"

class Multa(models.Model):


    ESTADOS=[
    ('pendiente', 'Pendiente'),
    ('pagada', 'Pagada')]
    
    idMulta = models.AutoField(primary_key=True)
    fechaMulta = models.DateField(auto_now_add=True)
    diasRetraso = models.IntegerField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estadoPago = models.CharField(max_length=20, choices = ESTADOS, default='pendiente')    
    idPrestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE)