from django.shortcuts import render
from .serializers import CustomUserSerializer
from rest_framework import viewsets, permissions
from .models import CustomUser



# Create your views here.

class UsersViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.AllowAny]


