from django.conf import settings
from django.db import models


class Firm(models.Model):
    """店家(分店)：一個 owner 可以擁有多間分店，只能管理自己名下的商品"""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="firms"
    )
    name = models.CharField("店家名稱", max_length=150)
    branch_name = models.CharField("分店名", max_length=150, blank=True)
    address = models.CharField("地址", max_length=255, blank=True)
    phone = models.CharField("電話", max_length=20, blank=True)
    brand = models.ForeignKey(
        "Brand",
        on_delete=models.SET_NULL,
        related_name="firms",
        verbose_name="商店分類",
        null=True,
        blank=True,
        help_text="所賣的產品為同商店分類中的產品",
    )
    description = models.TextField("店家簡介", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "店家"
        verbose_name_plural = "店家"

    def __str__(self):
        return f"{self.name}-{self.branch_name}" if self.branch_name else self.name


class Brand(models.Model):
    """商店分類：以品牌統籌可能橫跨多家分店(Firm)的商家"""

    name = models.CharField("品牌", max_length=150)
    logo = models.ImageField("品牌LOGO", upload_to="brands/", blank=True, null=True)
    founding_firm = models.ForeignKey(
        Firm,
        on_delete=models.SET_NULL,
        related_name="founded_brands",
        verbose_name="創始店面",
        null=True,
        blank=True,
    )
    founder = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="founded_brands",
        verbose_name="創始店主",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "商店分類"
        verbose_name_plural = "商店分類"

    def __str__(self):
        return self.name


class Category(models.Model):
    """產品種類"""

    name = models.CharField("分類名稱", max_length=100)
    slug = models.SlugField("網址代稱", max_length=100, unique=True)
    sub_category_1 = models.CharField("子種類1", max_length=50, blank=True)
    sub_category_2 = models.CharField("子種類2", max_length=50, blank=True)
    sub_category_3 = models.CharField("子種類3", max_length=50, blank=True)
    sub_category_4 = models.CharField("子種類4", max_length=50, blank=True)
    sub_category_5 = models.CharField("子種類5", max_length=50, blank=True)
    description = models.TextField("說明", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "產品種類"
        verbose_name_plural = "產品種類"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def sub_categories(self):
        return [
            value
            for value in [
                self.sub_category_1,
                self.sub_category_2,
                self.sub_category_3,
                self.sub_category_4,
                self.sub_category_5,
            ]
            if value
        ]


class Product(models.Model):
    """商品"""

    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="所屬店家分類",
        null=True,
        blank=True,
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="種類",
        help_text="種類名稱可能重複，實際選擇的是某一筆種類紀錄(以網址代稱區分)",
    )
    name = models.CharField("商品名稱", max_length=150)
    slug = models.SlugField(
        "網址代稱", max_length=150, unique=True, blank=True, help_text="自動生成流水號"
    )
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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.slug:
            self.slug = str(self.pk)
            super().save(update_fields=["slug"])


class ProductVariant(models.Model):
    """商品細項：同一商品下不同規格各自獨立計價與庫存"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants", verbose_name="商品"
    )
    sku = models.CharField(
        "商品編號", max_length=64, unique=True, blank=True, help_text="自動生成流水號"
    )
    name = models.CharField("規格名稱", max_length=100, help_text="例如：M / 紅色 / 500ml")
    price = models.DecimalField("價格", max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField("庫存", default=0)

    class Meta:
        verbose_name = "商品細項"
        verbose_name_plural = "商品細項"

    def __str__(self):
        return f"{self.product.name} - {self.name}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.sku:
            self.sku = f"VAR-{self.pk}"
            super().save(update_fields=["sku"])
