from .serializers import LectorSerializer, LectorWriteSerializer, CustomTokenObtainPairSerializer
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from .models import Lector
from django.db.models import Q
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.utils import timezone
from ops.models import Prestamo


# Create your views here.

class UsersViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LectorWriteSerializer
        return LectorSerializer
    
    def list(self, request, *args, **kwargs):
        """Actualiza préstamos vencidos antes de listar usuarios"""
        self._actualizar_prestamos_vencidos()
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """Actualiza préstamos vencidos antes de mostrar un usuario"""
        self._actualizar_prestamos_vencidos()
        return super().retrieve(request, *args, **kwargs)
    
    def _actualizar_prestamos_vencidos(self):
        """Actualiza automáticamente los préstamos vencidos y bloquea usuarios"""
        hoy = timezone.now().date()
        
        # Actualizar préstamos vencidos
        prestamos_vencidos = Prestamo.objects.filter(
            estado='activo',
            fecha_devolucion__lt=hoy
        )
        prestamos_vencidos.update(estado='atrasado')
        
        # Bloquear usuarios con préstamos atrasados
        lectores_con_atrasos = Lector.objects.filter(
            prestamo__estado='atrasado'
        ).distinct()
        
        for lector in lectores_con_atrasos:
            if lector.estado != 'bloqueado':
                lector.estado = 'bloqueado'
                lector.save()
    
    def get_queryset(self):
        queryset = Lector.objects.all()

        termBusqueda = self.request.query_params.get('busqueda', None)
        
        if termBusqueda is not None:
            queryset = queryset.filter(rut__icontains=termBusqueda)
        return queryset



class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        access = data.get('access') # aqui se crea el access para el header
        refresh = data.get('refresh') # aqui se crea el refresh que sera almancenado en las cookies
        response = Response({'access': access}, status=status.HTTP_200_OK)
        response.set_cookie(
            key='refresh_token',
            value=refresh,
            httponly=True,
            secure=False, #en true no funciona en postman
            samesite='Lax', #stric pero Lax para que funcione con postman
            max_age=24*3600,
            path='/api/token/refresh'
        ) #aqui se esta seteando el refresh token en la cookie
        return response

class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({'detail': 'Refresh token not provided.'}, status=401)
        try:
            serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({'detail': 'Invalid refresh token.'}, status=401)
            
        data = serializer.validated_data
        access = data.get('access')
        new_refresh = data.get('refresh')  # si rota
        response = Response({'access': access}, status=200)
        if new_refresh:
            response.set_cookie(
            key='refresh_token',
            value=new_refresh,
            httponly=True,
            secure=False, #en true no funciona en postman
            samesite='Lax', #stric pero Lax para que funcione con postman
            max_age=24*3600,
            path='/api/token/refresh'
            )  # actualiza cookie
        return response
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        
        response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        
        response.delete_cookie('refresh_token', path='/api/token/refresh')
        
        return response





