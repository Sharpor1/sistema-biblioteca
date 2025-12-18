from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Count, Q, F
from inventario.models import Libro
from rest_framework import status
from django.utils import timezone
from .models import Prestamo, Multa
from .serializers import PrestamoReadSerializer, PrestamoWriteSerializer, MultaSerializer
from rest_framework import viewsets
from django.db import transaction
from usuarios.models import Lector

# Create your views here.

class PrestamoViewSet(viewsets.ModelViewSet):

    queryset = Prestamo.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return PrestamoReadSerializer
        return PrestamoWriteSerializer
    
    def list(self, request, *args, **kwargs):
        # Antes de listar, actualizar préstamos atrasados automáticamente
        self._actualizar_prestamos_vencidos()
        return super().list(request, *args, **kwargs)
    
    def _actualizar_prestamos_vencidos(self):
        """Actualiza automáticamente los préstamos vencidos a estado 'atrasado' y bloquea usuarios"""
        hoy = timezone.now().date()
        
        # Buscar préstamos activos cuya fecha de devolución ya pasó
        prestamos_vencidos = Prestamo.objects.filter(
            estado='activo',
            fecha_devolucion__lt=hoy
        )
        
        # Actualizar a estado atrasado
        prestamos_vencidos.update(estado='atrasado')
        
        # Bloquear usuarios con préstamos atrasados
        lectores_con_atrasos = Lector.objects.filter(
            prestamo__estado='atrasado'
        ).distinct()
        
        for lector in lectores_con_atrasos:
            if lector.estado != 'bloqueado':
                lector.estado = 'bloqueado'
                lector.save()
            return PrestamoReadSerializer
        return PrestamoWriteSerializer

    def perform_create(self, serializer):
        ejemplar_fisico = serializer.validated_data['codigoEjemplar']
        estadoLector = serializer.validated_data['lector']
        print(f"Estado del lector: {estadoLector.estado}")
        
        if estadoLector.estado == 'bloqueado':
            raise ValidationError({'detail': 'El lector se encuentra BLOQUEADO y no puede realizar préstamos.'})
        
        # Verificar si tiene multas pendientes
        multas_pendientes = Multa.objects.filter(
            idPrestamo__lector=estadoLector,
            estadoPago='pendiente'
        ).exists()
        
        if multas_pendientes:
            raise ValidationError({'detail': 'El lector tiene multas pendientes. Debe pagarlas antes de realizar un nuevo préstamo.'})
        
        # Verificar si tiene préstamos atrasados
        prestamos_atrasados = Prestamo.objects.filter(
            lector=estadoLector,
            estado='atrasado'
        ).exists()
        
        if prestamos_atrasados:
            raise ValidationError({'detail': 'El lector tiene préstamos atrasados. Debe devolverlos antes de realizar un nuevo préstamo.'})
        
        print(f"Ejemplar detectado: {ejemplar_fisico}")
        print(f"Estado actual del ejemplar en BD: '{ejemplar_fisico.estado}'")
        
        # Contar préstamos activos y atrasados (no finalizados)
        prestamos_activos = Prestamo.objects.filter(
            lector=estadoLector, 
            estado__in=['activo', 'atrasado']
        ).count()
        limite_maximo = estadoLector.rol.cupoPrestamoMax

        # Verificar si ya tiene un ejemplar del mismo libro (activo o atrasado)
        if Prestamo.objects.filter(
            lector=estadoLector, 
            estado__in=['activo', 'atrasado'], 
            codigoEjemplar__libro=ejemplar_fisico.libro
        ).exists():
            raise ValidationError({'detail': f'El lector ya tiene un ejemplar prestado del libro "{ejemplar_fisico.libro}". Debe devolverlo antes de solicitar otro igual.'})
        
        if prestamos_activos >= limite_maximo:
            raise ValidationError({'detail': f'El lector ya tiene {prestamos_activos} libros prestados. El límite es {limite_maximo}.'})
        
        # if ejemplar_fisico.habilitado == False:
        #     raise ValidationError({'detail': f'El ejemplar "{ejemplar_fisico.codigoEjemplar}" no está habilitado para préstamo.'})

        if ejemplar_fisico.estado != 'disponible':
            print("entrando en error")
            raise ValidationError({'detail': f'No hay stock disponible del libro "{ejemplar_fisico.libro}".'})
        
        with transaction.atomic():
            ejemplar_fisico.estado = 'prestado'
            ejemplar_fisico.save()
            prestamo_creado = serializer.save()
            multa = Multa.objects.create(
                idPrestamo=prestamo_creado,
                diasRetraso=0,
                monto=0,
                estadoPago='pendiente',
            )
            print("estado ejemplar:", ejemplar_fisico.estado)


    @action(detail=True, methods=['post'], url_path='devolver-prestamo')
    def devolverPrestamo(self, request, pk=None):
        with transaction.atomic():
            prestamo = self.get_object()

            if prestamo.estado == 'finalizado':
                return Response({'detail': 'El préstamo ya ha sido devuelto.'}, status=status.HTTP_400_BAD_REQUEST)
            
            devolucion = timezone.now()
            devolucion_date = devolucion.date()
            fecha_devolucion_date = prestamo.fecha_devolucion.date()
            diferencia = (devolucion_date - fecha_devolucion_date).days

            try:
                multa = Multa.objects.get(idPrestamo=prestamo)
            except Multa.DoesNotExist:
                multa = Multa.objects.create(idPrestamo=prestamo, diasRetraso=0, monto=0, estadoPago='pendiente')

            datosMulta = None
            mensaje = 'Préstamo devuelto a tiempo.'

            if diferencia > 0:
                valorDia = 1000
                totalMulta = diferencia * valorDia

                multa.diasRetraso = diferencia
                multa.monto = totalMulta
                multa.estadoPago = 'pagado'
                multa.save()
            
                mensaje = f"Libro devuelto"
                datosMulta = {'id': multa.idMulta, 'monto': multa.monto, 'estado': 'pagado'}
            else:
                multa.diasRetraso = 0
                multa.monto = 0
                multa.estadoPago = 'pagado'
                multa.save()
                mensaje = f"Libro devuelto"
                datosMulta = {'id': multa.idMulta, 'monto': multa.monto, 'estado': 'pagado'}

                prestamo.lector.estado = 'activo'
                prestamo.lector.save()
            
            prestamo.estado = 'finalizado'
            inventarion_ejemplar = prestamo.codigoEjemplar
            inventarion_ejemplar.estado = 'disponible'
            inventarion_ejemplar.save()
            prestamo.fecha_devolucion_real = devolucion 
            prestamo.save()
            
            # Verificar si el usuario aún tiene préstamos atrasados
            # Si no tiene más préstamos atrasados, desbloquear el usuario
            lector = prestamo.lector
            tiene_prestamos_atrasados = Prestamo.objects.filter(
                lector=lector,
                estado='atrasado'
            ).exists()
            
            if not tiene_prestamos_atrasados and lector.estado == 'bloqueado':
                lector.estado = 'activo'
                lector.save()
            

            return Response({
                'status': 'ok',
                'mensaje': mensaje,
                'multa': datosMulta,
            })
        
            
            if not tiene_prestamos_atrasados and lector.estado == 'bloqueado':
                lector.estado = 'activo'
                lector.save()
            

            return Response({
                'status': 'ok',
                'mensaje': mensaje,
                'multa': datosMulta,
            })
        
    @action(detail=True, methods=['post'], url_path='renovar-prestamo')
    def renovar_prestamo(self, request, pk=None):
        prestamo = self.get_object()
        usuarioLector = prestamo.lector
        if usuarioLector.estado == 'bloqueado':
             return Response(
                 {'detail': 'Su cuenta está bloqueada. No puede renovar libros.'}, 
                 status=status.HTTP_400_BAD_REQUEST
             )

        if prestamo.fecha_devolucion < timezone.now():
                return Response({'detail': 'No se puede renovar un préstamo vencido. Por favor, devuelva el libro primero.'}, status=status.HTTP_400_BAD_REQUEST)

        if prestamo.estado == 'finalizado':
                return Response({'detail': 'El préstamo ya ha sido devuelto y no puede ser renovado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if prestamo.renovacionesUtilizadas >= usuarioLector.rol.maxRenovaciones:
                return Response({'detail': 'El préstamo ya ha sido renovado hasta su limite'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener días de renovación del request, o usar días máximos del rol por defecto
        dias_renovacion = request.data.get('dias', usuarioLector.rol.diasPrestamoMax)
        
        # Validar que los días no excedan el máximo permitido
        if dias_renovacion > usuarioLector.rol.diasPrestamoMax:
            return Response({
                'detail': f'No se puede renovar por más de {usuarioLector.rol.diasPrestamoMax} días.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if dias_renovacion < 1:
            return Response({
                'detail': 'El número de días debe ser al menos 1.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        nuevo_vencimiento = prestamo.fecha_devolucion + timezone.timedelta(days=dias_renovacion)
        prestamo.fecha_devolucion = nuevo_vencimiento
        prestamo.renovacionesUtilizadas += 1
        prestamo.save()
        return Response({
                'status': 'ok',
                'mensaje': f'Préstamo renovado exitosamente por {dias_renovacion} días. Nueva fecha de vencimiento: {nuevo_vencimiento.date()}.'
            })
        

class MultaViewSet(viewsets.ModelViewSet):
    queryset = Multa.objects.all()
    serializer_class = MultaSerializer

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Accion no permitida'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['post'], url_path='pagar-multa')
    def pagar(self, request, pk=None):
        multa = self.get_object()

        if multa.estadoPago == 'pagado':
            return Response(
                {'detail': 'Esta multa ya fue pagada anteriormente.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if multa.monto <= 0:
            return Response(
                {'detail': 'No hay deuda que pagar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        multa.estadoPago = 'pagado'
        estadoLector = multa.idPrestamo.lector
        estadoLector.estado = 'activo'
        estadoLector.save()
        multa.save()

        return Response({
            'status': 'ok',
            'mensaje': f'Multa de ${multa.monto} pagada exitosamente.',
            'estado_actual': multa.estadoPago
        })
    
class reportesViewSet(viewsets.ViewSet):

    @action(detail=False, methods=['get'], url_path='reporte-prestamos-activos')
    def reporte_prestamos_activos(self, request):
        hoy = timezone.now().date()
        prestamos_activos = Prestamo.objects.filter(estado='activo').select_related('lector', 'lector__rol', 'codigoEjemplar', 'codigoEjemplar__libro')
        reporte_prestamos_activos = []
        for p in prestamos_activos:
            es_retrasado = p.fecha_devolucion and p.fecha_devolucion < hoy
            estado = "Retrasado" if es_retrasado else "Al día"
            
            libro_titulo = p.codigoEjemplar.libro.titulo if p.codigoEjemplar and p.codigoEjemplar.libro else "N/A"
            libro_codigo = p.codigoEjemplar.libro.isbn if p.codigoEjemplar and p.codigoEjemplar.libro else "N/A"

            reporte_prestamos_activos.append({
                "id_prestamo": p.idPrestamo,
                "codigo_libro": libro_codigo,
                "libro": libro_titulo,
                "usuario": f"{p.lector.nombre} {p.lector.apellido}",
                "tipo_usuario": p.lector.rol.nombre if p.lector.rol else "Sin rol",
                "fecha_prestamo": p.fecha_prestamo.date(),
                "fecha_vencimiento": p.fecha_devolucion.date() if p.fecha_devolucion else None,
                "estado_etiqueta": estado
            })
        return Response(reporte_prestamos_activos)

    @action(detail=False, methods=['get'], url_path='reporte-multas-pendientes')
    def reporte_multas_pendientes(self, request):
        multas_pendientes = Multa.objects.filter(estadoPago='pendiente').select_related('idPrestamo__lector', 'idPrestamo__lector__rol', 'idPrestamo__codigoEjemplar', 'idPrestamo__codigoEjemplar__libro')
        reporte_multas_pendientes = []
        
        for m in multas_pendientes:
            libro_titulo = m.idPrestamo.codigoEjemplar.libro.titulo if m.idPrestamo.codigoEjemplar and m.idPrestamo.codigoEjemplar.libro else "N/A"
            reporte_multas_pendientes.append({
                "id_multa": m.idMulta,
                "libro": libro_titulo,
                "usuario": f"{m.idPrestamo.lector.nombre} {m.idPrestamo.lector.apellido}",
                "tipo_usuario": m.idPrestamo.lector.rol.nombre if m.idPrestamo.lector.rol else "Sin rol",
                "dias_retraso": m.diasRetraso,
                "monto": m.monto,
            })
        return Response(reporte_multas_pendientes)
    
    @action(detail=False, methods=['get'], url_path='reporte-renovaciones')
    def reporte_renovaciones(self, request):
        prestamos_renovados = Prestamo.objects.filter(renovacionesUtilizadas__gt=0).select_related('lector', 'lector__rol', 'codigoEjemplar', 'codigoEjemplar__libro')
        reporte_renovaciones = []
        
        for p in prestamos_renovados:
            libro_titulo = p.codigoEjemplar.libro.titulo if p.codigoEjemplar and p.codigoEjemplar.libro else "N/A"
            reporte_renovaciones.append({
                "libro": libro_titulo,
                "usuario": f"{p.lector.nombre} {p.lector.apellido}",
                "tipo_usuario": p.lector.rol.nombre if p.lector.rol else "Sin rol",
                "fecha_prestamo": p.fecha_prestamo.date(),
                "renovaciones_utilizadas": p.renovacionesUtilizadas,
            })
        return Response(reporte_renovaciones)
    
    @action(detail=False, methods=['get'], url_path='stock-disponible')
    def stock_disponible(self, request):
        libros = Libro.objects.annotate(
            disponibles=Count('ejemplar', filter=Q(ejemplar__estado__iexact='disponible'))
        ).filter(disponibles__gt=0).values('titulo', 'autor', 'isbn', 'disponibles')
        
        
        return Response(libros)

    