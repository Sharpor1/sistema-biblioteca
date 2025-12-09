from rest_framework import viewsets
from .models import Libro
from .serializers import LibroSerializer

# Create your views here.

class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer