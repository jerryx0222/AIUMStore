from django.conf import settings
from django.db import models

from products.models import ProductVariant


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "待付款"
        PAID = "paid", "已付款"
        SHIPPED = "shipped", "已出貨"
        COMPLETED = "completed", "已完成"
        CANCELLED = "cancelled", "已取消"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders"
    )
    status = models.CharField(
        "狀態", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    total_amount = models.DecimalField("總金額", max_digits=12, decimal_places=2, default=0)
    shipping_address = models.CharField("收件地址", max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "訂單"
        verbose_name_plural = "訂單"
        ordering = ["-created_at"]

    def __str__(self):
        return f"訂單 #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.PROTECT, related_name="order_items"
    )
    product_name = models.CharField("商品名稱", max_length=150)
    variant_name = models.CharField("規格名稱", max_length=100)
    price = models.DecimalField("單價", max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField("數量")

    class Meta:
        verbose_name = "訂單項目"
        verbose_name_plural = "訂單項目"

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"

    @property
    def subtotal(self):
        return self.price * self.quantity


class Payment(models.Model):
    """電子支付紀錄，預留串接第三方金流服務商（如綠界 / Stripe / LINE Pay）"""

    class Method(models.TextChoices):
        CREDIT_CARD = "credit_card", "信用卡"
        LINE_PAY = "line_pay", "LINE Pay"
        ATM = "atm", "ATM 轉帳"

    class Status(models.TextChoices):
        PENDING = "pending", "待付款"
        SUCCESS = "success", "付款成功"
        FAILED = "failed", "付款失敗"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    method = models.CharField("付款方式", max_length=20, choices=Method.choices)
    status = models.CharField(
        "狀態", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    transaction_id = models.CharField("金流交易序號", max_length=128, blank=True)
    paid_at = models.DateTimeField("付款時間", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "電子支付"
        verbose_name_plural = "電子支付"

    def __str__(self):
        return f"訂單 #{self.order_id} 的付款"
