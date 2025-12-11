from rest_framework import serializers
from .models import Encargado, TipoUsuario, Lector
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod 
    def get_token(cls, user): 
        token = super().get_token(user) 
        token['rut'] = user.rut  
        token['role'] = getattr(user, 'role', '')
        return token 

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {'email': self.user.email, 'first_name': self.user.first_name}
        return data
    
class EncargadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encargado
        fields = ['idEncargado', 'first_name', 'last_name', 'email', 'role', 'rut']

class TipoUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoUsuario
        fields = '__all__'
     
class LectorSerializer(serializers.ModelSerializer):
    
    tipoUsuario = serializers.CharField(source='rol.nombre', read_only=True)
    rol = TipoUsuarioSerializer(read_only=True)

    class Meta:
        model = Lector
        fields = ['id', 'rut', 'nombreCompleto', 'contacto', 'rol', 'tipoUsuario', 'estado']

class LectorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lector
        fields = ['id', 'rut', 'nombreCompleto', 'contacto', 'rol', 'estado']