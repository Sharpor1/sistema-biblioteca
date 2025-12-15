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
    multas_pendientes = serializers.SerializerMethodField()
    prestamos_activos = serializers.SerializerMethodField()
    prestamos_atrasados = serializers.SerializerMethodField()

    class Meta:
        model = Lector
        fields = ['id', 'rut', 'nombreCompleto', 'contacto', 'rol', 'tipoUsuario', 'estado', 
                  'multas_pendientes', 'prestamos_activos', 'prestamos_atrasados']
    
    def get_multas_pendientes(self, obj):
        from ops.models import Multa
        multas = Multa.objects.filter(
            idPrestamo__lector=obj,
            estadoPago='pendiente'
        )
        return [{
            'idMulta': m.idMulta,
            'monto': str(m.monto),
            'diasRetraso': m.diasRetraso,
            'fechaMulta': m.fechaMulta
        } for m in multas]
    
    def get_prestamos_activos(self, obj):
        from ops.models import Prestamo
        return Prestamo.objects.filter(lector=obj, estado='activo').count()
    
    def get_prestamos_atrasados(self, obj):
        from ops.models import Prestamo
        return Prestamo.objects.filter(lector=obj, estado='atrasado').count()

class LectorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lector
        fields = ['id', 'rut', 'nombreCompleto', 'contacto', 'rol', 'estado']