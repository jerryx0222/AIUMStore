from decimal import Decimal

from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStoreOwnerRole
from cart.models import Cart
from products.models import Brand

from .models import Order, OrderItem, Payment
from .serializers import CheckoutSerializer, OrderSerializer


class OrderListView(generics.ListAPIView):
    """目前使用者的歷史訂單"""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "items", "payment"
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class CheckoutView(APIView):
    """結帳台：將購物車內容轉成訂單，並套用會員等級折扣"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = (
            Cart.objects.filter(user=request.user)
            .prefetch_related("items__listing__product", "items__listing__franchise_brand")
            .first()
        )
        if not cart or not cart.items.exists():
            return Response({"detail": "購物車是空的"}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=request.user,
            shipping_address=serializer.validated_data["shipping_address"],
            total_amount=0,
        )

        subtotal = Decimal("0")
        for cart_item in cart.items.all():
            listing = cart_item.listing
            price = listing.product.selling_price
            OrderItem.objects.create(
                order=order,
                listing=listing,
                product_name=listing.product.name,
                store_name=listing.franchise_brand.name_zh,
                price=price,
                quantity=cart_item.quantity,
            )
            subtotal += price * cart_item.quantity

        discount_amount = (subtotal * request.user.discount_percent / 100).quantize(Decimal("0.01"))

        order.total_amount = subtotal - discount_amount
        order.discount_amount = discount_amount
        order.save()

        Payment.objects.create(
            order=order,
            method=serializer.validated_data["payment_method"],
        )

        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class PaymentConfirmView(APIView):
    """模擬會員線上付款完成回呼，實際串接金流服務商時改由其 webhook 呼叫"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        order = Order.objects.filter(id=order_id, user=request.user).first()
        if not order or not hasattr(order, "payment"):
            return Response({"detail": "找不到訂單"}, status=status.HTTP_404_NOT_FOUND)

        payment = order.payment
        payment.status = Payment.Status.SUCCESS
        payment.transaction_id = request.data.get("transaction_id", "")
        payment.paid_at = timezone.now()
        payment.save()

        order.status = Order.Status.PAID
        order.save()

        if order.user.level == order.user.Level.MEMBER:
            order.user.register_purchase(order.total_amount)

        return Response(OrderSerializer(order).data)


class StoreDashboardView(APIView):
    """店主檢視自己門市的營收與經營狀態。可用 ?store_id=<id> 指定名下哪一間門市"""

    permission_classes = [IsStoreOwnerRole]

    def get(self, request):
        stores = (
            Brand.objects.filter(brand_type=Brand.BrandType.FRANCHISE_BRAND)
            if request.user.is_superuser
            else Brand.objects.filter(
                brand_type=Brand.BrandType.FRANCHISE_BRAND, owner=request.user
            )
        )
        store_id = request.query_params.get("store_id")
        if store_id:
            store = stores.filter(id=store_id).first()
            if not store:
                return Response({"detail": "無權檢視此門市"}, status=status.HTTP_403_FORBIDDEN)
        else:
            store = stores.first()
        if not store:
            return Response({"detail": "尚未建立門市資料"}, status=status.HTTP_404_NOT_FOUND)

        items = OrderItem.objects.filter(
            listing__franchise_brand=store,
            order__status__in=[
                Order.Status.PAID,
                Order.Status.SHIPPED,
                Order.Status.COMPLETED,
            ],
        )
        revenue = items.aggregate(total=Sum(F("price") * F("quantity")))["total"] or Decimal("0")
        order_count = items.values("order").distinct().count()
        top_products = list(
            items.values("product_name")
            .annotate(quantity_sold=Sum("quantity"))
            .order_by("-quantity_sold")[:5]
        )

        return Response(
            {
                "revenue": revenue,
                "order_count": order_count,
                "top_products": top_products,
            }
        )
