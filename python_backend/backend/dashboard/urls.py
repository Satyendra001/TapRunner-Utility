from django.urls import path
from .views import GetInstance, ChartData

urlpatterns = [
    path("tap-setup", GetInstance.as_view()),
    path("chart-data",ChartData.as_view()),

]
