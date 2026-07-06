from django.contrib.auth import get_user_model
from rest_framework import serializers

from products.serializers import BrandSerializer, ProductSerializer

Person = get_user_model()


class PersonBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ["id", "username", "name", "level", "mobile", "phone", "email"]


class BrandWithProductsSerializer(BrandSerializer):
    products = ProductSerializer(many=True, read_only=True)

    class Meta(BrandSerializer.Meta):
        fields = BrandSerializer.Meta.fields + ["products"]


class PersonSerializer(serializers.ModelSerializer):
    discount_percent = serializers.DecimalField(max_digits=4, decimal_places=1, read_only=True)

    class Meta:
        model = Person
        fields = [
            "id",
            "username",
            "email",
            "level",
            "is_superuser",
            "name",
            "mobile",
            "phone",
            "line_id",
            "address",
            "member_level",
            "points",
            "total_spent",
            "discount_percent",
        ]
        read_only_fields = ["level", "is_superuser", "member_level", "points", "total_spent"]


class RegisterSerializer(serializers.ModelSerializer):
    """一般會員自助註冊，角色固定為會員，不可由前端指定"""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Person
        fields = ["id", "username", "email", "password", "name", "mobile", "phone", "address"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        person = Person(level=Person.Level.MEMBER, **validated_data)
        person.set_password(password)
        person.save()
        return person


class AccountAdminSerializer(serializers.ModelSerializer):
    """superuser/加盟主 代為建立與維護下層帳號(加盟主/店主)：直接設定帳號密碼，
    角色(level)由呼叫的 view 決定，不開放前端指定"""

    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)

    class Meta:
        model = Person
        fields = ["id", "username", "password", "name", "email", "mobile", "phone", "level"]
        read_only_fields = ["level"]

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "新增帳號時必須設定密碼"})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        person = Person(**validated_data)
        person.set_password(password)
        person.save()
        return person

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
