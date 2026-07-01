from django.contrib.auth import get_user_model
from rest_framework import serializers

Person = get_user_model()


class PersonSerializer(serializers.ModelSerializer):
    discount_percent = serializers.DecimalField(max_digits=4, decimal_places=1, read_only=True)

    class Meta:
        model = Person
        fields = [
            "id",
            "username",
            "email",
            "level",
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
        read_only_fields = ["level", "member_level", "points", "total_spent"]


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
