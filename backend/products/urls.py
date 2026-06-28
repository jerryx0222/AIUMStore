from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BrandViewSet,
    CategoryViewSet,
    FirmDetailView,
    FirmListCreateView,
    ManagedProductVariantViewSet,
    ManagedProductViewSet,
    ProductViewSet,
)

router = DefaultRouter()
router.register("brands", BrandViewSet, basename="brand")
router.register("categories", CategoryViewSet, basename="category")
router.register("my-products", ManagedProductViewSet, basename="managed-product")
router.register("my-variants", ManagedProductVariantViewSet, basename="managed-variant")
router.register("", ProductViewSet, basename="product")

urlpatterns = [
    path("firms/", FirmListCreateView.as_view(), name="firm-list"),
    path("firms/<int:pk>/", FirmDetailView.as_view(), name="firm-detail"),
] + router.urls
