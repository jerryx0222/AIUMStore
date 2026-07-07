from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BrandViewSet,
    CategoryViewSet,
    ComboViewSet,
    FranchiseComboListingViewSet,
    FranchiseListingViewSet,
    ManagedComboItemViewSet,
    ManagedComboViewSet,
    ManagedProductImageViewSet,
    ManagedProductViewSet,
    ManagedStoreComboListingViewSet,
    ManagedStoreListingViewSet,
    ProductBrandDetailView,
    ProductBrandListCreateView,
    ProductViewSet,
    StoreComboListingListView,
    StoreDetailView,
    StoreListCreateView,
    StoreListingListView,
)

router = DefaultRouter()
router.register("brands", BrandViewSet, basename="brand")
router.register("categories", CategoryViewSet, basename="category")
router.register("combos", ComboViewSet, basename="combo")
router.register("my-listings", ManagedStoreListingViewSet, basename="managed-listing")
router.register("my-products", ManagedProductViewSet, basename="managed-product")
router.register("my-product-images", ManagedProductImageViewSet, basename="managed-product-image")
router.register("my-combos", ManagedComboViewSet, basename="managed-combo")
router.register("my-combo-items", ManagedComboItemViewSet, basename="managed-combo-item")
router.register("my-combo-listings", ManagedStoreComboListingViewSet, basename="managed-combo-listing")
router.register("franchise-listings", FranchiseListingViewSet, basename="franchise-listing")
router.register("franchise-combo-listings", FranchiseComboListingViewSet, basename="franchise-combo-listing")
router.register("", ProductViewSet, basename="product")

urlpatterns = [
    path("stores/", StoreListCreateView.as_view(), name="store-list"),
    path("stores/<int:pk>/", StoreDetailView.as_view(), name="store-detail"),
    path("store-listings/", StoreListingListView.as_view(), name="store-listing-list"),
    path("combo-store-listings/", StoreComboListingListView.as_view(), name="combo-store-listing-list"),
    path("product-brands/", ProductBrandListCreateView.as_view(), name="product-brand-list"),
    path(
        "product-brands/<int:pk>/",
        ProductBrandDetailView.as_view(),
        name="product-brand-detail",
    ),
] + router.urls
