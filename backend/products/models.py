from django.conf import settings
from django.db import models


class Brand(models.Model):
    """品牌：單表，不拆子類別，brand_type 區分「產品品牌(連鎖總部)」與「加盟品牌(店主整合門市)」"""

    class BrandType(models.TextChoices):
        PRODUCT_BRAND = "product_brand", "產品品牌(連鎖總部)"
        FRANCHISE_BRAND = "franchise_brand", "加盟品牌(門市)"

    brand_type = models.CharField("品牌類型", max_length=20, choices=BrandType.choices)
    name_en = models.CharField("英文名", max_length=150, blank=True)
    name_zh = models.CharField("中文名", max_length=150)
    icon = models.ImageField("ICON", upload_to="brands/", blank=True, null=True)
    contact = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="contact_brands",
        verbose_name="聯絡人",
        null=True,
        blank=True,
    )
    website = models.URLField("網址", blank=True)
    note = models.TextField("備註", blank=True, help_text="純文字，用途後續再定義")

    # 唯一擁有者：brand_type=product_brand 時為品牌主，brand_type=franchise_brand 時為店主
    # 品牌主/店主都只會唯一擁有一個品牌，故用 OneToOneField
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="owned_brand",
        verbose_name="唯一擁有者(品牌主/店主)",
        null=True,
        blank=True,
        help_text="產品品牌的唯一擁有者是品牌主，加盟品牌(門市)的唯一擁有者是店主",
    )
    carried_product_brands = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True,
        related_name="carried_by_franchise_brands",
        verbose_name="掛載的產品品牌",
        help_text="僅加盟品牌使用，指向數筆「產品品牌(連鎖總部)」",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "品牌"
        verbose_name_plural = "品牌"

    def __str__(self):
        return self.name_zh or self.name_en


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
    """產品：連鎖總部(產品品牌)的主檔，庫存與上架與否由門市(加盟品牌)決定，見 StoreProductListing"""

    product_brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="products",
        limit_choices_to={"brand_type": Brand.BrandType.PRODUCT_BRAND},
        verbose_name="所屬產品品牌(連鎖總部)",
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
    spec = models.CharField("規格", max_length=100, blank=True)
    process = models.TextField("製程", blank=True)
    suggested_price = models.DecimalField("建議價格", max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(
        "實售價格", max_digits=10, decimal_places=2, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "產品"
        verbose_name_plural = "產品"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.selling_price is None:
            self.selling_price = self.suggested_price
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.slug:
            self.slug = str(self.pk)
            super().save(update_fields=["slug"])


class ProductImage(models.Model):
    """產品圖：WebP 格式，一個產品可存多張"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images", verbose_name="產品"
    )
    image = models.ImageField("產品圖", upload_to="products/")
    sort_order = models.PositiveIntegerField("排序", default=0)

    class Meta:
        verbose_name = "產品圖"
        verbose_name_plural = "產品圖"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product.name} 圖片 #{self.sort_order}"


class StoreProductListing(models.Model):
    """門市商品上架：庫存/實際價格/是否上架由店主(自己門市)或加盟主(其管理的所有門市)決定，
    同一產品在不同門市可各自維護"""

    franchise_brand = models.ForeignKey(
        Brand,
        on_delete=models.CASCADE,
        related_name="store_listings",
        limit_choices_to={"brand_type": Brand.BrandType.FRANCHISE_BRAND},
        verbose_name="門市(加盟品牌)",
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="store_listings", verbose_name="產品"
    )
    stock = models.PositiveIntegerField("庫存", default=0)
    actual_price = models.DecimalField(
        "實際價格",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="門市實際售價，由店主或加盟主決定；未設定則採用產品的實售價格",
    )
    is_active = models.BooleanField("上架中", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "門市商品上架"
        verbose_name_plural = "門市商品上架"
        unique_together = ["franchise_brand", "product"]

    def __str__(self):
        return f"{self.franchise_brand} - {self.product.name}"

    @property
    def effective_price(self):
        return self.actual_price if self.actual_price is not None else self.product.selling_price
