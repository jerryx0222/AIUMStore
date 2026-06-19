from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """自訂會員模型，於 AbstractUser 基礎上擴充常用欄位。"""

    phone = models.CharField("電話", max_length=20, blank=True)
    address = models.CharField("收件地址", max_length=255, blank=True)

    def __str__(self):
        return self.username
