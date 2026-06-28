from rest_framework.permissions import BasePermission

from .models import User


class IsSuperUser(BasePermission):
    """superuser：無使用限制"""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsFirmRole(BasePermission):
    """firm：店家帳號"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.role == User.Role.FIRM)
        )


class IsMemberRole(BasePermission):
    """member：一般會員帳號"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.role == User.Role.MEMBER)
        )
