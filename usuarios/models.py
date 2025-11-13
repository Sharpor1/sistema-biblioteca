# users/models.py
from django.contrib.auth.models import AbstractUser
from .managers import UserManager
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('alumno', 'Alumno'),
        ('docente', 'Docente'),
        ('bibliotecario', 'Bibliotecario'),
        ('administrador', 'Administrador'),
    ]

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='alumno')
    rut = models.CharField(max_length=200, unique=True)

    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['first_name','last_name','email']

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

