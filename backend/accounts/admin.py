from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import MemberProfile, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "role", "is_staff"]
    list_filter = UserAdmin.list_filter + ("role",)
    fieldsets = UserAdmin.fieldsets + (
        ("會員角色與聯絡資訊", {"fields": ("role", "phone", "address")}),
    )


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "level", "points", "total_spent"]
    filter_horizontal = ["favorite_products"]
