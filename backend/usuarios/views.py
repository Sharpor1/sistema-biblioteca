from .serializers import CustomUserSerializer, CustomTokenObtainPairSerializer
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from .models import CustomUser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer


# Create your views here.

class UsersViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permissions = [IsAdminUser]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        access = data.get('access')
        refresh = data.get('refresh')
        response = Response({'access': access}, status=status.HTTP_200_OK)
        response.set_cookie(
            key='refresh_token',
            value=refresh,
            httponly=True,
            secure=False, #en true no funciona en postman
            samesite='Lax', #stric pero Lax para que funcione con postman
            max_age=24*3600,
            path='/api/token/refresh'
        )
        return response

class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'detail': 'Refresh token not provided.'}, status=401)
        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        access = data.get('access')
        new_refresh = data.get('refresh')  # si rota
        response = Response({'access': access}, status=200)
        if new_refresh:
            response.set_cookie( new_refresh)  # actualiza cookie
        return response
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token', path='/api/token/refresh/')
        return response





