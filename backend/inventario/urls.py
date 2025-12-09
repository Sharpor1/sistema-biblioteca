from rest_framework.routers import DefaultRouter
from .views import LibroViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'libros', LibroViewSet, basename='libro')

urlpatterns = [
    path('', include(router.urls)),
]