from django import forms
from django.contrib import admin

from .models import Brand, Category, Product, ProductImage, StoreProductListing


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    fields = ["image", "sort_order"]
    extra = 1


class StoreProductListingInline(admin.TabularInline):
    model = StoreProductListing
    fields = ["franchise_brand", "stock", "is_active"]
    extra = 0


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ["name_zh", "name_en", "brand_type", "owner", "contact", "created_at"]
    list_filter = ["brand_type"]
    filter_horizontal = ["carried_product_brands"]


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
        fields = ["product_brand", "name", "spec", "process", "suggested_price", "selling_price"]

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
        "product_brand",
        "category_name",
        "sub_category_1",
        "sub_category_2",
        "sub_category_3",
        "sub_category_4",
        "sub_category_5",
        "category",
        "name",
        "slug",
        "spec",
        "process",
        "suggested_price",
        "selling_price",
    ]
    list_display = ["name", "product_brand", "category", "suggested_price", "selling_price", "created_at"]
    list_filter = ["product_brand", "category"]
    readonly_fields = ["slug"]
    inlines = [ProductImageInline, StoreProductListingInline]

    class Media:
        js = ["products/admin/product_subcategory.js"]


@admin.register(StoreProductListing)
class StoreProductListingAdmin(admin.ModelAdmin):
    list_display = ["franchise_brand", "product", "stock", "actual_price", "is_active", "updated_at"]
    list_filter = ["franchise_brand", "is_active"]
