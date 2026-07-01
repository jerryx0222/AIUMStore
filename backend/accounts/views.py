from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from products.models import Product
from products.serializers import ProductSerializer

from .serializers import PersonSerializer, RegisterSerializer

Person = get_user_model()


class RegisterView(generics.CreateAPIView):
    """會員註冊"""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    """取得 / 更新目前登入人員資料"""

    serializer_class = PersonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """登出：將 refresh token 加入黑名單"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "缺少 refresh token"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "無效的 refresh token"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


def _require_member(request):
    if not request.user.is_superuser and request.user.level != Person.Level.MEMBER:
        raise PermissionDenied("僅會員可使用此功能")


class FavoriteListView(APIView):
    """會員的喜好產品列表"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        _require_member(request)
        products = request.user.favorite_products.all()
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request):
        _require_member(request)
        product = get_object_or_404(Product, pk=request.data.get("product_id"))
        request.user.favorite_products.add(product)
        return Response(status=status.HTTP_201_CREATED)


class FavoriteDetailView(APIView):
    """移除單一喜好產品"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        _require_member(request)
        request.user.favorite_products.remove(product_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
