from rest_framework import serializers

from .models import Brand, Category, Firm, Product, ProductVariant


class FirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firm
        fields = ["id", "name", "branch_name", "address", "phone", "brand", "description"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "logo", "founding_firm", "founder"]


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


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "sku", "name", "price", "stock"]


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True, default=None)
    min_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "category", "brand_name", "image", "min_price"]

    def get_min_price(self, obj):
        prices = [variant.price for variant in obj.variants.all()]
        return min(prices) if prices else None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True, default=None)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "brand_name",
            "description",
            "image",
            "variants",
        ]


class ManagedProductSerializer(serializers.ModelSerializer):
    """店家自行管理商品：上架狀態與基本資料。category 由前端依「種類→子種類1~5」逐層篩選後，
    送出唯一對應的種類紀錄 id(同名種類可能有多筆，靠子種類與網址代稱區分)。
    brand 由所屬店家的商店分類自動帶入，同商店分類底下的所有店家共用同一份商品"""

    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "variants",
        ]
        read_only_fields = ["slug"]


class ManagedProductVariantSerializer(serializers.ModelSerializer):
    """店家自行管理商品細項與優惠價格"""

    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = ProductVariant
        fields = ["id", "product", "sku", "name", "price", "stock"]

    def validate_product(self, product):
        request = self.context["request"]
        if not request.user.is_superuser:
            brand_ids = set(
                Firm.objects.filter(owner=request.user, brand__isnull=False).values_list(
                    "brand_id", flat=True
                )
            )
            if product.brand_id not in brand_ids:
                raise serializers.ValidationError("只能管理自己商店分類底下的商品細項")
        return product
