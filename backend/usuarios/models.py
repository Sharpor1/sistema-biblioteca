# users/models.py
from django.contrib.auth.models import AbstractUser
from .managers import UserManager
from django.db import models


class Encargado(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, default='bibliotecario')
    rut = models.CharField(max_length=200, unique=True)

    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['first_name','email']

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"


class Lector(models.Model):

    ESTADOS = (
        ('activo', 'Activo'),
        ('bloqueado', 'Bloqueado'),
    )

    rut = models.CharField(max_length=200, unique=True)
    nombreCompleto = models.CharField(max_length=100)
    contacto = models.EmailField(unique=True)
    rol = models.ForeignKey('TipoUsuario', on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='activo')
    
    def __str__(self):
        return self.nombreCompleto


class TipoUsuario(models.Model):
    idTipo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    diasPrestamoMax = models.IntegerField()
    diasPrestamoMin = models.IntegerField()
    cupoPrestamoMax = models.IntegerField(null=True, blank=True)
    diaMaxRenovacion = models.IntegerField(null=True, blank=True)
    maxRenovaciones = models.IntegerField()
    
    def __str__(self):
        return self.nombre