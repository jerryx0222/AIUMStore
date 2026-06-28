from django import forms
from django.contrib import admin

from .models import Brand, Category, Firm, Product, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    fields = ["name", "price"]
    extra = 1


@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    list_display = ["name", "branch_name", "owner", "phone", "brand", "created_at"]
    list_filter = ["brand"]


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ["name", "founding_firm", "founder", "created_at"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "sub_category_1",
        "sub_category_2",
        "sub_category_3",
        "sub_category_4",
        "sub_category_5",
    ]
    prepopulated_fields = {"slug": ("name",)}


class ProductAdminForm(forms.ModelForm):
    """種類名稱可能重複(同名種類用子種類1~5逐層區分)，這裡用「種類」+「子種類1~5」
    輔助欄位讓使用者逐層篩選，最終由 product_subcategory.js 解析出唯一的種類紀錄
    並寫入隱藏的 category 欄位"""

    category_name = forms.CharField(label="種類", required=True, widget=forms.Select(choices=[]))
    sub_category_1 = forms.CharField(label="子種類1", required=False, widget=forms.Select(choices=[]))
    sub_category_2 = forms.CharField(label="子種類2", required=False, widget=forms.Select(choices=[]))
    sub_category_3 = forms.CharField(label="子種類3", required=False, widget=forms.Select(choices=[]))
    sub_category_4 = forms.CharField(label="子種類4", required=False, widget=forms.Select(choices=[]))
    sub_category_5 = forms.CharField(label="子種類5", required=False, widget=forms.Select(choices=[]))

    class Meta:
        model = Product
        fields = ["brand", "name", "description", "image", "is_active"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        category = self.instance.category if self.instance.pk else None
        self.fields["category"] = forms.ModelChoiceField(
            queryset=Category.objects.all(),
            required=True,
            widget=forms.HiddenInput(attrs={"data-current": category.id if category else ""}),
            initial=category,
        )

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.category = self.cleaned_data["category"]
        if commit:
            instance.save()
        return instance


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    fields = [
        "brand",
        "category_name",
        "sub_category_1",
        "sub_category_2",
        "sub_category_3",
        "sub_category_4",
        "sub_category_5",
        "category",
        "name",
        "slug",
        "description",
        "image",
        "is_active",
    ]
    list_display = ["name", "brand", "category", "is_active", "created_at"]
    list_filter = ["brand", "category", "is_active"]
    readonly_fields = ["slug"]
    inlines = [ProductVariantInline]

    class Media:
        js = ["products/admin/product_subcategory.js"]
