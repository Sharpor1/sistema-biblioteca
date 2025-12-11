from rest_framework import serializers
from .models import Prestamo, Multa
from usuarios.serializers import LectorSerializer
from inventario.serializers import LibroSerializer
from django.utils import timezone

class PrestamoReadSerializer(serializers.ModelSerializer):
    lector = LectorSerializer(read_only=True)
    libro = LibroSerializer(read_only=True)
    class Meta:
        model = Prestamo
        fields = '__all__'


class PrestamoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prestamo
        fields = '__all__'
        read_only_fields = ['fecha_devolucion_estimada']

    def validate(self, data):
        fecha_prestamo = data.get('fecha_prestamo')
        if fecha_prestamo:
            if fecha_prestamo > timezone.now():
                raise serializers.ValidationError({
                    "fecha_prestamo": "La fecha de préstamo no puede ser en el futuro."
                })
        
        return data

class MultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Multa
        fields = '__all__'