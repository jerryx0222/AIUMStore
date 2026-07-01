from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models


class Person(AbstractUser):
    """人員：單表，不拆子類別，角色由 level 欄位區分。

    對應 note.txt 的「人員」設計：superuser / 品牌主 / 加盟主 / 店主 / 店員 / 會員 共用同一張表，
    各角色專屬欄位攤平放在這裡（不適用的角色留空）。guest 已取消，結帳一律需要人員帳號。

    角色階層：品牌主(唯一擁有一個產品品牌/連鎖總部) -> 加盟主(加盟多個產品品牌，管理多個店主)
    -> 店主(唯一經營一個加盟品牌/門市) -> 店員(隸屬於某個門市)。
    """

    class Level(models.TextChoices):
        SUPERUSER = "superuser", "系統管理員"
        BRAND_OWNER = "brand_owner", "品牌主"
        FRANCHISE_MASTER = "franchise_master", "加盟主"
        STORE_OWNER = "store_owner", "店主"
        STORE_CLERK = "store_clerk", "店員"
        MEMBER = "member", "會員"

    # 會員等級對應的累積消費門檻 (index 0 -> LV1 門檻, ... index 9 -> LV10 門檻)
    LEVEL_THRESHOLDS = [
        Decimal(v)
        for v in [0, 500, 1500, 3000, 6000, 10000, 16000, 24000, 35000, 50000]
    ]
    POINTS_PER_SPENDING = Decimal("0.1")  # 消費 10 元累積 1 點
    DISCOUNT_PERCENT_PER_LEVEL = Decimal("2")  # 每級多 2% 折扣 (LV1 無折扣, LV10 最高 18%)

    level = models.CharField("角色", max_length=20, choices=Level.choices, default=Level.MEMBER)
    name = models.CharField("名字", max_length=100, blank=True, help_text="可重複，非登入帳號")
    mobile = models.CharField("手機", max_length=20, blank=True)
    phone = models.CharField("電話", max_length=20, blank=True)
    line_id = models.CharField("LINE ID", max_length=100, blank=True)
    address = models.CharField("地址", max_length=255, blank=True)
    note = models.TextField("備註", blank=True, help_text="純文字，用途後續再定義")

    # 僅 level=store_clerk 使用：所屬的加盟品牌門市
    employer_brand = models.ForeignKey(
        "products.Brand",
        on_delete=models.SET_NULL,
        related_name="clerks",
        verbose_name="所屬門市(加盟品牌)",
        null=True,
        blank=True,
    )

    # 僅 level=franchise_master 使用：加盟主可加盟多個產品品牌(連鎖總部)
    franchised_brands = models.ManyToManyField(
        "products.Brand",
        blank=True,
        related_name="franchise_masters",
        verbose_name="加盟的產品品牌",
        limit_choices_to={"brand_type": "product_brand"},
    )
    # 僅 level=store_owner 使用：管理該店主的加盟主
    manager = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="managed_store_owners",
        verbose_name="所屬加盟主",
        null=True,
        blank=True,
        limit_choices_to={"level": "franchise_master"},
    )

    # 僅 level=member 使用：等級/點數/消費/喜好產品
    member_level = models.PositiveSmallIntegerField("會員等級", null=True, blank=True)
    points = models.PositiveIntegerField("累積點數", null=True, blank=True)
    total_spent = models.DecimalField(
        "累積消費金額", max_digits=12, decimal_places=2, null=True, blank=True
    )
    favorite_products = models.ManyToManyField(
        "products.Product", blank=True, related_name="favorited_by", verbose_name="喜好產品"
    )

    class Meta:
        verbose_name = "人員"
        verbose_name_plural = "人員"

    def __str__(self):
        return self.name or self.username

    def save(self, *args, **kwargs):
        creating = self._state.adding
        if creating and self.level == self.Level.MEMBER:
            if self.member_level is None:
                self.member_level = 1
            if self.points is None:
                self.points = 0
            if self.total_spent is None:
                self.total_spent = Decimal("0")
        super().save(*args, **kwargs)

    @property
    def discount_percent(self) -> Decimal:
        if self.member_level is None:
            return Decimal("0")
        return (self.member_level - 1) * self.DISCOUNT_PERCENT_PER_LEVEL

    def _level_for_spending(self, total_spent: Decimal) -> int:
        level = 1
        for index, threshold in enumerate(self.LEVEL_THRESHOLDS, start=1):
            if total_spent >= threshold:
                level = index
        return level

    def register_purchase(self, amount: Decimal):
        """付款成功後呼叫：累積消費金額、點數並重新計算會員等級"""

        self.total_spent = (self.total_spent or Decimal("0")) + amount
        self.points = (self.points or 0) + int(amount * self.POINTS_PER_SPENDING)
        self.member_level = self._level_for_spending(self.total_spent)
        self.save()
