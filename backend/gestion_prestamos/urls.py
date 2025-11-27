from rest_framework.routers import DefaultRouter
from .views import BookViewSet , GeneroViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'generos', GeneroViewSet, basename='genero')

urlpatterns = [
    path('', include(router.urls)),
]