from django.conf import settings
from django.db import models


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "購物車"
        verbose_name_plural = "購物車"

    def __str__(self):
        return f"{self.user.username} 的購物車"


class CartItem(models.Model):
    """購物車項目：listing(商品上架) 與 combo_listing(套餐上架) 恰擇一，
    比照 Person/Brand 的作法用 nullable 欄位攤平，不拆子表"""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    listing = models.ForeignKey(
        "products.StoreProductListing",
        on_delete=models.CASCADE,
        related_name="cart_items",
        null=True,
        blank=True,
    )
    combo_listing = models.ForeignKey(
        "products.StoreComboListing",
        on_delete=models.CASCADE,
        related_name="cart_items",
        null=True,
        blank=True,
    )
    quantity = models.PositiveIntegerField("數量", default=1)

    class Meta:
        verbose_name = "購物車項目"
        verbose_name_plural = "購物車項目"
        unique_together = ["cart", "listing", "combo_listing"]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(listing__isnull=False, combo_listing__isnull=True)
                    | models.Q(listing__isnull=True, combo_listing__isnull=False)
                ),
                name="cartitem_listing_xor_combo_listing",
            )
        ]

    def __str__(self):
        target = self.listing or self.combo_listing
        return f"{target} x {self.quantity}"

    @property
    def subtotal(self):
        target = self.listing or self.combo_listing
        return target.effective_price * self.quantity
