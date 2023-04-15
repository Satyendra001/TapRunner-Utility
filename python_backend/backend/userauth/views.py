from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from rest_framework import permissions
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect,csrf_exempt
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        # ...

        return token
        
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class SignUp(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self,request):
        first_name = request.data['firstName']
        last_name = request.data['lastName']
        password = request.data['password']
        email = request.data['email']
        try:
            username = "_".join([first_name.lower(),last_name.lower()])
            if User.objects.filter(username=username).exists():
                return Response({"data" : {'error':'User already exists'}})
            else:
                user = User.objects.create_user(username,email,password)
                user.save()
            
            return Response({"data":{"success":"User created"}})
        except:
            return Response({"data":{"error":"Some error occured"}})

@method_decorator(ensure_csrf_cookie,name='dispatch')
@method_decorator(csrf_protect, name='dispatch')
class Login(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self,request):
        username = request.data['username']
        password = request.data['password']

        try:
            user = authenticate(username=username,password=password)

            if user is not None:
                print(user.id)
                login(request,user)
                return Response({"data":{"success":"User Authenticated","username":username}})
            else:
                return Response({"data":{"error":"User not Authenticated"}})
        except:
            return Response({"data":{"error":"Some error occured"}})


class Logout(APIView):
    permission_classes = [IsAuthenticated, ]
    authentication_classes = [SessionAuthentication, ]

    def post(self,request):
        try:
            logout(request)
            return Response({"data":{"success":"Logged out"}})
        except:
            return Response({"data":{"error":"Error logging out"}})

class DeleteUser(APIView):
    def delete(self,request):
        user = self.request.user

        try:
            user = User.objects.filter(id = user.id).delete()
            return Response({"data":{"success":"User deleted"}})
        except:
            return Response({"data":{"error":"Some Error Occured"}})

class GetLoggedUser(APIView):
    permission_classes = [IsAuthenticated, ]
    authentication_classes = [SessionAuthentication, ]
    permission_classes = (permissions.AllowAny,)

    def get(self,request):
        return Response({"data":{"success":request.user.username}})

# @method_decorator(ensure_csrf_cookie,name='dispatch')
class Session(APIView):
    def get(self,request):
        user = request.user
        print(user)
        if not request.user.is_authenticated:
            return Response({"data":{"isAuthenticated":False,"session":request.session}})
        return Response({"data":{"isAuthenticated":True,"session":request.session}})


@method_decorator(ensure_csrf_cookie,name='dispatch')
class GetCSRFToken(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self,request):
        print(get_token(request))
        return Response({'data':{'success':"CSRF cookie set","CSRFToken":get_token(request)}})

    
