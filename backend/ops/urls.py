from rest_framework.routers import DefaultRouter
from .views import PrestamoViewSet, MultaViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'prestamos', PrestamoViewSet, basename='prestamo')
router.register(r'multas', MultaViewSet, basename='multa')


urlpatterns = [
    path('api/', include(router.urls)),
]