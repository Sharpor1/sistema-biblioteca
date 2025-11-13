from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name','rut', 'role', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True},
            }
