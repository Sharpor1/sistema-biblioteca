from rest_framework import viewsets, status
from .models import Libro
from .models import Ejemplar
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import LibroSerializer, EjemplarSerializer

# Create your views here.

class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer

class EjemplarViewSet(viewsets.ModelViewSet):
    queryset = Ejemplar.objects.all()
    serializer_class = EjemplarSerializer

    @action(detail=True, methods=['post'], url_path='dar-baja')
    def dar_baja(self, request, pk=None):
        ejemplar = self.get_object()
        
        if ejemplar.estado == 'PRESTADO':
            return Response(
                {"error": "No se puede dar de baja un libro que está prestado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ejemplar.estado = 'BAJA'
        ejemplar.save()
        
        return Response({"status": "Ejemplar dado de baja correctamente"})
    
    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        ejemplar = self.get_object()
        
        if ejemplar.estado == 'PRESTADO':
            return Response(
                {"error": "No se puede activar un ejemplar que está prestado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ejemplar.estado = 'DISPONIBLE'
        ejemplar.save()
        
        return Response({"status": "Ejemplar activado correctamente"})