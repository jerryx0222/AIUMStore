from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartSerializer


class CartView(APIView):
    """取得目前會員的購物車內容"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)


class CartItemListView(APIView):
    """加入購物車項目"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        listing_id = request.data.get("listing_id")
        combo_listing_id = request.data.get("combo_listing_id")
        quantity = int(request.data.get("quantity", 1))

        if bool(listing_id) == bool(combo_listing_id):
            raise ValidationError("需擇一指定 listing_id 或 combo_listing_id")

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            listing_id=listing_id,
            combo_listing_id=combo_listing_id,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save()
        return Response(CartSerializer(cart).data)


class CartItemDetailView(APIView):
    """更新數量或移除購物車項目"""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        item = get_object_or_404(CartItem, pk=pk, cart__user=request.user)
        cart = item.cart
        quantity = int(request.data.get("quantity", item.quantity))
        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request, pk):
        item = get_object_or_404(CartItem, pk=pk, cart__user=request.user)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart).data)
