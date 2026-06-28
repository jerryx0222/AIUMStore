from rest_framework import serializers

from .models import Order, OrderItem, Payment


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "variant_name", "price", "quantity", "subtotal"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "method", "status", "transaction_id", "paid_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "fulfillment_type",
            "guest_name",
            "guest_phone",
            "total_amount",
            "discount_amount",
            "shipping_address",
            "items",
            "payment",
            "created_at",
        ]
        read_only_fields = ["status", "total_amount", "discount_amount"]


class CheckoutSerializer(serializers.Serializer):
    """會員結帳：線上付款 + 宅配，從購物車轉成訂單"""

    shipping_address = serializers.CharField(max_length=255)
    payment_method = serializers.ChoiceField(
        choices=[
            choice
            for choice in Payment.Method.choices
            if choice[0] != Payment.Method.STORE_CASH
        ]
    )


class GuestOrderItemInputSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class GuestCheckoutSerializer(serializers.Serializer):
    """訪客(guest)結帳：免登入，僅能到店付款取貨"""

    guest_name = serializers.CharField(max_length=100)
    guest_phone = serializers.CharField(max_length=20)
    items = GuestOrderItemInputSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("購買項目不可為空")
        return items
