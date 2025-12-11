from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    UsersViewSet, 
    CustomTokenObtainPairView, 
    CookieTokenRefreshView, 
    LogoutView
)

router = DefaultRouter()
router.register(r'usuarios', UsersViewSet, basename='usuarios')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
]

urlpatterns += router.urls