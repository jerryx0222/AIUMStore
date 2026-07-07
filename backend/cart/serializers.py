from rest_framework import serializers

from products.models import StoreComboListing, StoreProductListing
from products.serializers import StoreComboListingSerializer, StoreProductListingSerializer

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    listing = StoreProductListingSerializer(read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(
        queryset=StoreProductListing.objects.all(), source="listing", write_only=True, required=False
    )
    combo_listing = StoreComboListingSerializer(read_only=True)
    combo_listing_id = serializers.PrimaryKeyRelatedField(
        queryset=StoreComboListing.objects.all(),
        source="combo_listing",
        write_only=True,
        required=False,
    )
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "listing",
            "listing_id",
            "combo_listing",
            "combo_listing_id",
            "quantity",
            "subtotal",
        ]

    def validate(self, attrs):
        has_listing = bool(attrs.get("listing"))
        has_combo_listing = bool(attrs.get("combo_listing"))
        if has_listing == has_combo_listing:
            raise serializers.ValidationError("需擇一指定 listing_id 或 combo_listing_id")
        return attrs


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total"]

    def get_total(self, obj):
        return sum((item.subtotal for item in obj.items.all()), 0)
