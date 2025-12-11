from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Encargado, Lector, TipoUsuario
# Register your models here.




class CustomUserAdmin(UserAdmin):
    model = Encargado
    list_display = ('email', 'first_name', 'last_name','rut', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    ordering = ('email',)
    search_fields = ('email', 'first_name', 'last_name')
    fieldsets = (
        (None, {'fields': ('email', 'password', 'role','rut')}),
        ('Información personal', {'fields': ('first_name', 'last_name')}),
        ('Permisos', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('rut', 'email', 'first_name', 'last_name', 'role', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

admin.site.register(Encargado, CustomUserAdmin)
admin.site.register(Lector)
admin.site.register(TipoUsuario)
