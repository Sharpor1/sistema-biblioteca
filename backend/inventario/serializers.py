from rest_framework import serializers
from .models import Libro, Ejemplar


class LibroSerializer(serializers.ModelSerializer):
    
    stock_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Libro
        fields = ['idLibro', 'titulo', 'autor', 'isbn', 'editorial', 'fecha_publicacion','stock_disponible']

    def get_stock_disponible(self, obj):
        return obj.ejemplares.filter(estado='DISPONIBLE').count()


class EjemplarSerializer(serializers.ModelSerializer):

    titulo_libro = serializers.CharField(source='libro.titulo', read_only=True)

    class Meta:
        model = Ejemplar
        fields = ['codigoEjemplar', 'libro', 'estado', 'titulo_libro']
