from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    """自訂會員模型，於 AbstractUser 基礎上擴充常用欄位。"""

    class Role(models.TextChoices):
        SUPERUSER = "superuser", "系統管理員"
        FIRM = "firm", "店家"
        MEMBER = "member", "會員"

    role = models.CharField("角色", max_length=20, choices=Role.choices, default=Role.MEMBER)
    phone = models.CharField("電話", max_length=20, blank=True)
    address = models.CharField("收件地址", max_length=255, blank=True)

    def __str__(self):
        return self.username


class MemberProfile(models.Model):
    """會員等級、點數與喜好產品。僅 role=member 的帳號會擁有此資料。"""

    # 等級對應的累積消費門檻 (index 0 -> LV1 門檻, ... index 9 -> LV10 門檻)
    LEVEL_THRESHOLDS = [
        Decimal(v)
        for v in [0, 500, 1500, 3000, 6000, 10000, 16000, 24000, 35000, 50000]
    ]
    POINTS_PER_SPENDING = Decimal("0.1")  # 消費 10 元累積 1 點
    DISCOUNT_PERCENT_PER_LEVEL = Decimal("2")  # 每級多 2% 折扣 (LV1 無折扣, LV10 最高 18%)

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="member_profile"
    )
    level = models.PositiveSmallIntegerField("會員等級", default=1)
    points = models.PositiveIntegerField("累積點數", default=0)
    total_spent = models.DecimalField("累積消費金額", max_digits=12, decimal_places=2, default=0)
    favorite_products = models.ManyToManyField(
        "products.Product", blank=True, related_name="favorited_by", verbose_name="喜好產品"
    )

    class Meta:
        verbose_name = "會員資料"
        verbose_name_plural = "會員資料"

    def __str__(self):
        return f"{self.user.username} (LV{self.level})"

    @property
    def discount_percent(self) -> Decimal:
        return (self.level - 1) * self.DISCOUNT_PERCENT_PER_LEVEL

    def _level_for_spending(self, total_spent: Decimal) -> int:
        level = 1
        for index, threshold in enumerate(self.LEVEL_THRESHOLDS, start=1):
            if total_spent >= threshold:
                level = index
        return level

    def register_purchase(self, amount: Decimal):
        """付款成功後呼叫：累積消費金額、點數並重新計算等級"""

        self.total_spent += amount
        self.points += int(amount * self.POINTS_PER_SPENDING)
        self.level = self._level_for_spending(self.total_spent)
        self.save()


@receiver(post_save, sender=User)
def create_member_profile(sender, instance, created, **kwargs):
    """一般會員註冊時自動建立對應的會員資料(等級/點數/收藏)"""

    if created and instance.role == User.Role.MEMBER and not instance.is_superuser:
        MemberProfile.objects.create(user=instance)
