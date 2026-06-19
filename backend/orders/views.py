from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart

from .models import Order, OrderItem, Payment
from .serializers import CheckoutSerializer, OrderSerializer


class OrderListView(generics.ListAPIView):
    """目前會員的歷史訂單"""

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
    """結帳台：將購物車內容轉成訂單並建立電子支付紀錄"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = (
            Cart.objects.filter(user=request.user)
            .prefetch_related("items__variant")
            .first()
        )
        if not cart or not cart.items.exists():
            return Response({"detail": "購物車是空的"}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=request.user,
            shipping_address=serializer.validated_data["shipping_address"],
            total_amount=0,
        )

        total = 0
        for cart_item in cart.items.all():
            variant = cart_item.variant
            OrderItem.objects.create(
                order=order,
                variant=variant,
                product_name=variant.product.name,
                variant_name=variant.name,
                price=variant.price,
                quantity=cart_item.quantity,
            )
            total += variant.price * cart_item.quantity

        order.total_amount = total
        order.save()

        Payment.objects.create(
            order=order,
            method=serializer.validated_data["payment_method"],
        )

        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class PaymentConfirmView(APIView):
    """模擬電子支付完成回呼，實際串接金流服務商時改由其 webhook 呼叫"""

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

        return Response(OrderSerializer(order).data)
