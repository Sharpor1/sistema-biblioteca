from rest_framework.routers import DefaultRouter
from .views import LibroViewSet, EjemplarViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'libros', LibroViewSet, basename='libro')
router.register(r'ejemplares', EjemplarViewSet, basename='ejemplar')


urlpatterns = [
    path('', include(router.urls)),
]