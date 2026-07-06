from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    BrandOwnerDetailView,
    BrandOwnerListCreateView,
    FavoriteDetailView,
    FavoriteListView,
    FranchiseMasterDetailView,
    FranchiseMasterListCreateView,
    LogoutView,
    ManagementDashboardView,
    MeView,
    RegisterView,
    StoreOwnerDetailView,
    StoreOwnerListCreateView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="login-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("favorites/", FavoriteListView.as_view(), name="favorite-list"),
    path("favorites/<int:product_id>/", FavoriteDetailView.as_view(), name="favorite-detail"),
    path("dashboard/", ManagementDashboardView.as_view(), name="management-dashboard"),
    path("brand-owners/", BrandOwnerListCreateView.as_view(), name="brand-owner-list"),
    path("brand-owners/<int:pk>/", BrandOwnerDetailView.as_view(), name="brand-owner-detail"),
    path(
        "franchise-masters/",
        FranchiseMasterListCreateView.as_view(),
        name="franchise-master-list",
    ),
    path(
        "franchise-masters/<int:pk>/",
        FranchiseMasterDetailView.as_view(),
        name="franchise-master-detail",
    ),
    path("store-owners/", StoreOwnerListCreateView.as_view(), name="store-owner-list"),
    path("store-owners/<int:pk>/", StoreOwnerDetailView.as_view(), name="store-owner-detail"),
]
