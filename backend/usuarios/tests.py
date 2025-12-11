from django.test import TestCase
from .models import CustomUser

# Create your tests here.

class UserModelTest(TestCase):
    def test_create_user(self):
        user = CustomUser.objects.create_user(
            email ='prueba@erm.cl',
            rut = '123',
            password='1234',
            first_name='Usuario',
            last_name='Prueba',
            role='alumno'
        )
        self.assertEqual(user.email, 'prueba@erm.cl')
        self.assertEqual(user.rut, '123')
        self.assertTrue(user.check_password('1234'))
        self.assertEqual(user.role, 'alumno')

    def test_create_superuser(self):
        super_user = CustomUser.objects.create_superuser(
            email = 'admin@erm.cl',
            rut = '1235',
            password='1234'
        )
        self.assertTrue(super_user.is_superuser)
        self.assertTrue(super_user.is_staff)
        self.assertTrue(super_user.is_active)