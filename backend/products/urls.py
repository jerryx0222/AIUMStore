from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BrandViewSet,
    CategoryViewSet,
    ManagedStoreListingViewSet,
    ProductViewSet,
    StoreDetailView,
    StoreListCreateView,
    StoreListingListView,
)

router = DefaultRouter()
router.register("brands", BrandViewSet, basename="brand")
router.register("categories", CategoryViewSet, basename="category")
router.register("my-listings", ManagedStoreListingViewSet, basename="managed-listing")
router.register("", ProductViewSet, basename="product")

urlpatterns = [
    path("stores/", StoreListCreateView.as_view(), name="store-list"),
    path("stores/<int:pk>/", StoreDetailView.as_view(), name="store-detail"),
    path("store-listings/", StoreListingListView.as_view(), name="store-listing-list"),
] + router.urls
