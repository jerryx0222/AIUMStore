from decimal import Decimal

from django.db import transaction
from django.db.models import F, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsFirmRole
from cart.models import Cart
from products.models import Firm, ProductVariant

from .models import Order, OrderItem, Payment
from .serializers import CheckoutSerializer, GuestCheckoutSerializer, OrderSerializer


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
    """結帳台(會員)：將購物車內容轉成訂單，並套用會員等級折扣"""

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
            fulfillment_type=Order.FulfillmentType.DELIVERY,
            shipping_address=serializer.validated_data["shipping_address"],
            total_amount=0,
        )

        subtotal = Decimal("0")
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
            subtotal += variant.price * cart_item.quantity

        member_profile = getattr(request.user, "member_profile", None)
        discount_percent = member_profile.discount_percent if member_profile else Decimal("0")
        discount_amount = (subtotal * discount_percent / 100).quantize(Decimal("0.01"))

        order.total_amount = subtotal - discount_amount
        order.discount_amount = discount_amount
        order.save()

        Payment.objects.create(
            order=order,
            method=serializer.validated_data["payment_method"],
        )

        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class GuestCheckoutView(APIView):
    """訪客(guest)結帳：免登入，直接建立到店付款取貨訂單"""

    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = GuestCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        order = Order.objects.create(
            user=None,
            fulfillment_type=Order.FulfillmentType.PICKUP,
            guest_name=data["guest_name"],
            guest_phone=data["guest_phone"],
            total_amount=0,
        )

        total = Decimal("0")
        for item in data["items"]:
            variant = get_object_or_404(ProductVariant, pk=item["variant_id"])
            OrderItem.objects.create(
                order=order,
                variant=variant,
                product_name=variant.product.name,
                variant_name=variant.name,
                price=variant.price,
                quantity=item["quantity"],
            )
            total += variant.price * item["quantity"]

        order.total_amount = total
        order.save()

        Payment.objects.create(order=order, method=Payment.Method.STORE_CASH)

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

        member_profile = getattr(order.user, "member_profile", None)
        if member_profile:
            member_profile.register_purchase(order.total_amount)

        return Response(OrderSerializer(order).data)


class StorePickupConfirmView(APIView):
    """店員於現場確認訪客付款並完成取貨"""

    permission_classes = [IsFirmRole]

    def post(self, request, order_id):
        order = Order.objects.filter(
            id=order_id, fulfillment_type=Order.FulfillmentType.PICKUP
        ).first()
        if not order or not hasattr(order, "payment"):
            return Response({"detail": "找不到訂單"}, status=status.HTTP_404_NOT_FOUND)

        payment = order.payment
        payment.status = Payment.Status.SUCCESS
        payment.paid_at = timezone.now()
        payment.save()

        order.status = Order.Status.COMPLETED
        order.save()

        return Response(OrderSerializer(order).data)


class FirmDashboardView(APIView):
    """店家檢視自己商店分類的營收與經營狀態(同分類下所有店家共用同一份統計)。
    可用 ?firm_id=<id> 指定要以名下哪一間店家身分檢視(未指定且僅有一間時自動帶入)"""

    permission_classes = [IsFirmRole]

    def get(self, request):
        firms = Firm.objects.all() if request.user.is_superuser else Firm.objects.filter(
            owner=request.user
        )
        firm_id = request.query_params.get("firm_id")
        if firm_id:
            firm = firms.filter(id=firm_id).first()
            if not firm:
                return Response({"detail": "無權檢視此店家"}, status=status.HTTP_403_FORBIDDEN)
        else:
            firm = firms.first()
        if not firm:
            return Response({"detail": "尚未建立店家資料"}, status=status.HTTP_404_NOT_FOUND)
        if not firm.brand_id:
            return Response({"detail": "尚未設定商店分類"}, status=status.HTTP_404_NOT_FOUND)

        items = OrderItem.objects.filter(
            variant__product__brand=firm.brand,
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
