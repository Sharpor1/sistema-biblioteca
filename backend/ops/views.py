from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Prestamo, Multa
from .serializers import PrestamoReadSerializer, PrestamoWriteSerializer, MultaSerializer
from rest_framework import viewsets
from django.db import transaction

# Create your views here.

class PrestamoViewSet(viewsets.ModelViewSet):
    queryset = Prestamo.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return PrestamoReadSerializer
        return PrestamoWriteSerializer
    @action(detail=True, methods=['post'], url_path='devolver-prestamo')
    def devolverPrestamo(self, request, pk=None):
        with transaction.atomic():
            prestamo = self.get_object()

            if prestamo.estado == 'DEVUELTO':
                return Response({'detail': 'El préstamo ya ha sido devuelto.'}, status=status.HTTP_400_BAD_REQUEST)
            devolucion = timezone.now()
            devolucion_date = devolucion.date()
            fecha_devolucion_date = prestamo.fecha_devolucion.date()
            diferencia = (devolucion_date - fecha_devolucion_date).days

            mensaje = 'Préstamo devuelto a tiempo.'
            datosMulta = None

            if diferencia > 0:
                valorDia = 1000
                totalMulta = diferencia * valorDia

                multa = Multa.objects.create(
                    idPrestamo=prestamo,
                    diasRetraso=diferencia,
                    monto=totalMulta,
                    estadoPago='pendiente',
                )
                mensaje = f"Libro devuelto con RETRASO. Se generó una multa de ${totalMulta}."
                datosMulta = {'id': multa.idMulta, 'monto': multa.monto}
            
            prestamo.estado = 'DEVUELTO'
            prestamo.fecha_devolucion_real = devolucion 
            prestamo.save()

            return Response({
                'status': 'ok',
                'mensaje': mensaje,
                'multa': datosMulta
            })