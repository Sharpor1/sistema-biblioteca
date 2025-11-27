from rest_framework import serializers
from .models import CustomUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name','rut', 'role', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True},
            }

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod #avisa que es un metodo de clase para herdar la clase
    def get_token(cls, user): #toma la clase y la instacia del usuario
        token = super().get_token(user) #obtiene el token para la instancia llamada
        token['rut'] = user.rut  #crea un claim de email
        token['role'] = getattr(user, 'role', '') #crea un claim de rol del usuario
        #el claim es como agregar una clave valor nueva al jwt
        return token #retornamos el token

#mandamos una respuesta con algunos datos al front
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {'email': self.user.email, 'first_name': self.user.first_name}
        return data
