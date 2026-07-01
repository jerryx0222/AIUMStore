from rest_framework.permissions import BasePermission

from .models import Person


class IsSuperUser(BasePermission):
    """superuser：無使用限制"""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsBrandOwnerRole(BasePermission):
    """品牌主：管理自己唯一擁有的產品品牌與其產品"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.level == Person.Level.BRAND_OWNER)
        )


class IsFranchiseMasterRole(BasePermission):
    """加盟主：決定其管理的所有店主門市，商品的實際價格與是否上下架"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.level == Person.Level.FRANCHISE_MASTER)
        )


class IsStoreOwnerRole(BasePermission):
    """店主：管理自己唯一經營的加盟品牌門市與商品上架"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.level == Person.Level.STORE_OWNER)
        )


class IsStoreStaffRole(BasePermission):
    """店主/店員：可於門市現場操作"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.level in (Person.Level.STORE_OWNER, Person.Level.STORE_CLERK)
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
