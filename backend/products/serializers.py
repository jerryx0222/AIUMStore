from rest_framework import serializers

from .models import Brand, Category, Product, ProductImage, StoreProductListing


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


class StoreProductListingSerializer(serializers.ModelSerializer):
    """門市商品上架：供顧客瀏覽某門市在賣的商品(含庫存/是否上架)"""

    product = ProductSerializer(read_only=True)
    franchise_brand_name = serializers.CharField(source="franchise_brand.name_zh", read_only=True)

    class Meta:
        model = StoreProductListing
        fields = ["id", "franchise_brand", "franchise_brand_name", "product", "stock", "is_active"]


class ManagedStoreProductListingSerializer(serializers.ModelSerializer):
    """店主管理自己門市的商品上架：只調整庫存與是否上架，門市由後端依操作者身分帶入"""

    class Meta:
        model = StoreProductListing
        fields = ["id", "franchise_brand", "product", "stock", "is_active"]
        read_only_fields = ["franchise_brand"]

    def validate_product(self, product):
        franchise_brand = self.context.get("franchise_brand")
        if franchise_brand and not franchise_brand.carried_product_brands.filter(
            pk=product.product_brand_id
        ).exists():
            raise serializers.ValidationError("該門市未掛載此產品所屬的產品品牌")
        return product
