from django.urls import path
from .views import DeleteUser, GetCSRFToken, GetLoggedUser,  Logout, MyTokenObtainPairView, Session, SignUp,Login
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path("signup", SignUp.as_view()),
    path("login", Login.as_view()),
    path("logout", Logout.as_view()),
    path("delete", DeleteUser.as_view()),
    path("getUser", GetLoggedUser.as_view()),
    path("session", Session.as_view()),
    path('csrf_cookie',GetCSRFToken.as_view()),
    path('token', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),

]