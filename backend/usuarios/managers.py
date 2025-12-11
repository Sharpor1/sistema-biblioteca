from django.contrib.auth.models import BaseUserManager



class UserManager(BaseUserManager):
    
    def create_user(self,rut,password=None,**extra_fields):
        if not rut:
            raise  ValueError("el usuario debe tener rut")

        rut = self.normalize_email(rut)
        user = self.model(rut=rut, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, rut, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'administrador')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(rut, password, **extra_fields)
