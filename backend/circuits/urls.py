from django.urls import path
from .views import CompileArduinoView

urlpatterns = [
    path('compile/', CompileArduinoView.as_view(), name='compile_arduino'),
]
