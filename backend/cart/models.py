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
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    listing = models.ForeignKey(
        "products.StoreProductListing", on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField("數量", default=1)

    class Meta:
        verbose_name = "購物車項目"
        verbose_name_plural = "購物車項目"
        unique_together = ["cart", "listing"]

    def __str__(self):
        return f"{self.listing} x {self.quantity}"

    @property
    def subtotal(self):
        return self.listing.effective_price * self.quantity
