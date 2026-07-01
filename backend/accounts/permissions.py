from rest_framework.permissions import BasePermission

from .models import Person


class IsSuperUser(BasePermission):
    """superuser：無使用限制"""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsStoreOwnerRole(BasePermission):
    """品牌主/店主：管理自己名下的加盟品牌門市與商品上架"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.level in (Person.Level.BRAND_OWNER, Person.Level.STORE_OWNER)
            )
        )


class IsStoreStaffRole(BasePermission):
    """品牌主/店主/店員：可於門市現場操作"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.level
                in (Person.Level.BRAND_OWNER, Person.Level.STORE_OWNER, Person.Level.STORE_CLERK)
            )
        )


class IsMemberRole(BasePermission):
    """會員：一般會員帳號"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.level == Person.Level.MEMBER)
        )
