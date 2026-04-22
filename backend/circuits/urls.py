from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompileArduinoView, CircuitViewSet

router = DefaultRouter()
router.register(r'circuits', CircuitViewSet, basename='circuit')

urlpatterns = [
    path('compile/', CompileArduinoView.as_view(), name='compile_arduino'),
    path('', include(router.urls)),
]
