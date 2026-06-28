from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from products.models import Product
from products.serializers import ProductListSerializer

from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """會員註冊"""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    """取得 / 更新目前登入會員資料"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """會員登出：將 refresh token 加入黑名單"""

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


def _get_member_profile(request):
    if not hasattr(request.user, "member_profile"):
        raise PermissionDenied("僅會員可使用此功能")
    return request.user.member_profile


class FavoriteListView(APIView):
    """會員的喜好產品列表"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = _get_member_profile(request)
        products = profile.favorite_products.all()
        return Response(ProductListSerializer(products, many=True).data)

    def post(self, request):
        profile = _get_member_profile(request)
        product = get_object_or_404(Product, pk=request.data.get("product_id"))
        profile.favorite_products.add(product)
        return Response(status=status.HTTP_201_CREATED)


class FavoriteDetailView(APIView):
    """移除單一喜好產品"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        profile = _get_member_profile(request)
        profile.favorite_products.remove(product_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
