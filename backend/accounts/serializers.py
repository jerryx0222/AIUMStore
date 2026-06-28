from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import MemberProfile

User = get_user_model()


class MemberProfileSerializer(serializers.ModelSerializer):
    discount_percent = serializers.DecimalField(max_digits=4, decimal_places=1, read_only=True)

    class Meta:
        model = MemberProfile
        fields = ["level", "points", "total_spent", "discount_percent"]


class UserSerializer(serializers.ModelSerializer):
    member_profile = MemberProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "phone", "address", "role", "member_profile"]
        read_only_fields = ["role"]


class RegisterSerializer(serializers.ModelSerializer):
    """一般會員自助註冊，角色固定為 member，不可由前端指定"""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "phone", "address"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
