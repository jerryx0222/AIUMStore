from django.conf import settings
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "待付款"
        PAID = "paid", "已付款"
        SHIPPED = "shipped", "已出貨"
        COMPLETED = "completed", "已完成"
        CANCELLED = "cancelled", "已取消"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        help_text="結帳一律需登入，不支援匿名訪客",
    )
    status = models.CharField(
        "狀態", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    total_amount = models.DecimalField("總金額", max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField("折扣金額", max_digits=12, decimal_places=2, default=0)
    shipping_address = models.CharField("收件地址", max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "訂單"
        verbose_name_plural = "訂單"
        ordering = ["-created_at"]

    def __str__(self):
        return f"訂單 #{self.id}"


class OrderItem(models.Model):
    """訂單項目：listing(商品上架) 與 combo_listing(套餐上架) 恰擇一，比照 CartItem 的作法"""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    listing = models.ForeignKey(
        "products.StoreProductListing",
        on_delete=models.PROTECT,
        related_name="order_items",
        null=True,
        blank=True,
    )
    combo_listing = models.ForeignKey(
        "products.StoreComboListing",
        on_delete=models.PROTECT,
        related_name="order_items",
        null=True,
        blank=True,
    )
    product_name = models.CharField("商品名稱", max_length=150)
    store_name = models.CharField("門市名稱", max_length=150)
    price = models.DecimalField("單價", max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField("數量")

    class Meta:
        verbose_name = "訂單項目"
        verbose_name_plural = "訂單項目"
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(listing__isnull=False, combo_listing__isnull=True)
                    | models.Q(listing__isnull=True, combo_listing__isnull=False)
                ),
                name="orderitem_listing_xor_combo_listing",
            )
        ]

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"

    @property
    def subtotal(self):
        return self.price * self.quantity


class Payment(models.Model):
    """付款紀錄：線上電子支付預留串接第三方金流(綠界/Stripe/LINE Pay)，到店取貨則由店員確認現場付款"""

    class Method(models.TextChoices):
        CREDIT_CARD = "credit_card", "信用卡"
        LINE_PAY = "line_pay", "LINE Pay"
        ATM = "atm", "ATM 轉帳"
        STORE_CASH = "store_cash", "到店付款"

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
        verbose_name = "付款紀錄"
        verbose_name_plural = "付款紀錄"

    def __str__(self):
        return f"訂單 #{self.order_id} 的付款"
