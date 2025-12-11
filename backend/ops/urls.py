from rest_framework.routers import DefaultRouter
from .views import PrestamoViewSet, MultaViewSet, reportesViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'prestamos', PrestamoViewSet, basename='prestamo')
router.register(r'multas', MultaViewSet, basename='multa')
router.register(r'reportes', reportesViewSet, basename='reporte')


urlpatterns = [
    path('', include(router.urls)),
]