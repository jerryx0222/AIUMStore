from django.db import models


class Category(models.Model):
    """產品種類"""

    name = models.CharField("分類名稱", max_length=100, unique=True)
    slug = models.SlugField("網址代稱", max_length=100, unique=True)
    description = models.TextField("說明", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "產品種類"
        verbose_name_plural = "產品種類"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    """商品"""

    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products", verbose_name="種類"
    )
    name = models.CharField("商品名稱", max_length=150)
    slug = models.SlugField("網址代稱", max_length=150, unique=True)
    description = models.TextField("商品說明", blank=True)
    image = models.ImageField("商品圖片", upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField("上架中", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "商品"
        verbose_name_plural = "商品"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    """商品細項：同一商品下不同規格各自獨立計價與庫存"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants", verbose_name="商品"
    )
    sku = models.CharField("商品編號", max_length=64, unique=True)
    name = models.CharField("規格名稱", max_length=100, help_text="例如：M / 紅色 / 500ml")
    price = models.DecimalField("價格", max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField("庫存", default=0)

    class Meta:
        verbose_name = "商品細項"
        verbose_name_plural = "商品細項"

    def __str__(self):
        return f"{self.product.name} - {self.name}"
