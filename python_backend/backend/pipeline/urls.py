from django.urls import path
from .views import *

urlpatterns = [
    path('discovery', Discovery.as_view()),
    path('stream-selection', StreamSelection.as_view()),
    path('state', State.as_view()),
    path('sync', Sync.as_view()),
    path('logs', Logs.as_view()),
    path('reports', Reports.as_view()),
    path('compare', Compare.as_view()),
    path('coverage', Coverage.as_view()),
    path('<file>', ViewFiles.as_view())
]
