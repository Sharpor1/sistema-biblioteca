from django.db import models

# Create your models here.

class Libro(models.Model):
    idLibro = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=200)
    autor = models.CharField(max_length=100)
    isbn = models.CharField(max_length=13, unique=True)
    editorial = models.CharField(max_length=100)
    fecha_publicacion = models.DateField()

    def __str__(self):
        return self.titulo

class Ejemplar(models.Model):

    ESTADOS = (
        ('prestado', 'Prestado'),
        ('disponible', 'Disponible'),
        ('baja', 'Baja')
    )

    codigoEjemplar = models.CharField(max_length=20, unique=True)
    libro = models.ForeignKey(Libro, on_delete=models.CASCADE, related_name='ejemplares')
    estado = models.CharField(max_length=20, choices = ESTADOS, default='disponible')
    
    def __str__(self):
        return self.codigoEjemplar

