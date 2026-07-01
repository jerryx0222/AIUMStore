from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Person


@admin.register(Person)
class PersonAdmin(UserAdmin):
    list_display = ["username", "name", "email", "level", "is_staff"]
    list_filter = UserAdmin.list_filter + ("level",)
    fieldsets = UserAdmin.fieldsets + (
        (
            "人員資料",
            {
                "fields": (
                    "level",
                    "name",
                    "mobile",
                    "phone",
                    "line_id",
                    "address",
                    "note",
                    "employer_brand",
                    "manager",
                    "franchised_brands",
                )
            },
        ),
        ("會員資料", {"fields": ("member_level", "points", "total_spent", "favorite_products")}),
    )
    filter_horizontal = UserAdmin.filter_horizontal + ("favorite_products", "franchised_brands")
