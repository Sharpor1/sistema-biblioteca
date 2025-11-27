from django.db import models

# Create your models here.

# ================================ Género y Libro ==============================
class Genero(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre


class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    genero = models.ManyToManyField(Genero, related_name='books')
    publisher = models.CharField(max_length=100)
    year_published = models.IntegerField()
    isbn = models.CharField(max_length=13, unique=True)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return self.title
# =====================================================================

#=============================== Usuario y Préstamo ==============================

class Usuario(models.Model):
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=15)

    def __str__(self):
        return self.nombre

