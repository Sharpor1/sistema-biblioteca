from django.contrib import admin
from .models import Prestamo, Multa

# Register your models here.


admin.site.register(Prestamo)
admin.site.register(Multa)