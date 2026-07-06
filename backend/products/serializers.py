from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Brand, Category, Product, ProductImage, StoreProductListing

Person = get_user_model()


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = [
            "id",
            "brand_type",
            "name_en",
            "name_zh",
            "icon",
            "contact",
            "website",
            "note",
            "owner",
            "carried_product_brands",
        ]
        read_only_fields = ["brand_type", "owner"]


class BrandAdminSerializer(serializers.ModelSerializer):
    """superuser 維護品牌：開放所有欄位，含指派/更換品牌主(owner)"""

    class Meta:
        model = Brand
        fields = [
            "id",
            "brand_type",
            "name_en",
            "name_zh",
            "icon",
            "contact",
            "website",
            "note",
            "owner",
            "carried_product_brands",
        ]
        read_only_fields = ["brand_type"]

    def validate_owner(self, owner):
        if owner is None:
            return owner
        if owner.level != Person.Level.BRAND_OWNER:
            raise serializers.ValidationError("僅能指派給角色為「品牌主」的帳號")
        existing = getattr(owner, "owned_brand", None)
        if existing and existing.id != (self.instance.id if self.instance else None):
            raise serializers.ValidationError("該品牌主已擁有其他品牌")
        return owner


class CategorySerializer(serializers.ModelSerializer):
    sub_categories = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "sub_category_1",
            "sub_category_2",
            "sub_category_3",
            "sub_category_4",
            "sub_category_5",
            "sub_categories",
            "description",
        ]
        read_only_fields = ["slug"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "sort_order"]


class ProductSerializer(serializers.ModelSerializer):
    """HQ 產品主檔(唯讀，由連鎖總部/後台維護)"""

    category = CategorySerializer(read_only=True)
    product_brand_name = serializers.CharField(source="product_brand.name_zh", read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "product_brand_name",
            "spec",
            "process",
            "suggested_price",
            "selling_price",
            "images",
        ]


class ManagedProductSerializer(serializers.ModelSerializer):
    """品牌主管理自己產品品牌底下的產品：新增/編輯/刪除，設定建議價格與相關內容(種類/規格/製程)。
    實售價格(selling_price)不開放編輯，未指定時自動採用建議價格"""

    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "slug",
            "spec",
            "process",
            "suggested_price",
            "selling_price",
            "images",
        ]
        read_only_fields = ["slug", "selling_price"]


class StoreProductListingSerializer(serializers.ModelSerializer):
    """門市商品上架：供顧客瀏覽某門市在賣的商品(含庫存/實際售價/是否上架)"""

    product = ProductSerializer(read_only=True)
    franchise_brand_name = serializers.CharField(source="franchise_brand.name_zh", read_only=True)
    price = serializers.DecimalField(
        source="effective_price", max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = StoreProductListing
        fields = [
            "id",
            "franchise_brand",
            "franchise_brand_name",
            "product",
            "stock",
            "actual_price",
            "price",
            "is_active",
        ]


class ManagedStoreProductListingSerializer(serializers.ModelSerializer):
    """店主管理自己門市的商品上架：調整庫存、實際價格與是否上架，門市由後端依操作者身分帶入"""

    class Meta:
        model = StoreProductListing
        fields = ["id", "franchise_brand", "product", "stock", "actual_price", "is_active"]
        read_only_fields = ["franchise_brand"]

    def validate_product(self, product):
        franchise_brand = self.context.get("franchise_brand")
        if franchise_brand and not franchise_brand.carried_product_brands.filter(
            pk=product.product_brand_id
        ).exists():
            raise serializers.ValidationError("該門市未掛載此產品所屬的產品品牌")
        return product


class FranchiseListingSerializer(serializers.ModelSerializer):
    """加盟主管理其下所有店主門市的商品：只能調整實際價格與是否上下架，不可動庫存或新增/刪除上架項目"""

    franchise_brand_name = serializers.CharField(source="franchise_brand.name_zh", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = StoreProductListing
        fields = [
            "id",
            "franchise_brand",
            "franchise_brand_name",
            "product",
            "product_name",
            "stock",
            "actual_price",
            "is_active",
        ]
        read_only_fields = ["franchise_brand", "product", "stock"]
