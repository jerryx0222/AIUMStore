from rest_framework import generics, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from accounts.permissions import IsStoreOwnerRole

from .models import Brand, Category, Product, StoreProductListing
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    ManagedStoreProductListingSerializer,
    ProductSerializer,
    StoreProductListingSerializer,
)


def _owned_franchise_brands(request):
    """目前使用者名下的加盟品牌門市(superuser 可看全部)"""
    if request.user.is_superuser:
        return Brand.objects.filter(brand_type=Brand.BrandType.FRANCHISE_BRAND)
    return Brand.objects.filter(brand_type=Brand.BrandType.FRANCHISE_BRAND, owner=request.user)


def _resolve_franchise_brand(request):
    """依 ?store_id= 解析出目前操作的門市；未指定且名下只有一間時自動帶入"""
    stores = _owned_franchise_brands(request)
    store_id = request.query_params.get("store_id")
    if store_id:
        store = stores.filter(id=store_id).first()
        if not store:
            raise PermissionDenied("無權操作此門市")
        return store
    if stores.count() == 1:
        return stores.first()
    return None


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    """品牌列表(含產品品牌與加盟品牌)"""

    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """產品種類列表"""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """HQ 產品主檔列表(唯讀)，可用 ?category=<slug> 篩選"""

    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = Product.objects.select_related("category", "product_brand").prefetch_related(
            "images"
        )
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        product_brand_id = self.request.query_params.get("product_brand")
        if product_brand_id:
            queryset = queryset.filter(product_brand_id=product_brand_id)
        return queryset


class StoreListingListView(generics.ListAPIView):
    """瀏覽門市上架中的商品(供顧客下單)：?store_id=<加盟品牌id> 或 ?product_id=<產品id>"""

    serializer_class = StoreProductListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = StoreProductListing.objects.filter(is_active=True).select_related(
            "product", "product__category", "franchise_brand"
        )
        store_id = self.request.query_params.get("store_id")
        if store_id:
            queryset = queryset.filter(franchise_brand_id=store_id)
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset


class StoreListCreateView(generics.ListCreateAPIView):
    """列出 / 新增目前使用者名下的門市(加盟品牌)：一個店主可有多間門市"""

    serializer_class = BrandSerializer
    permission_classes = [IsStoreOwnerRole]

    def get_queryset(self):
        return _owned_franchise_brands(self.request)

    def perform_create(self, serializer):
        serializer.save(brand_type=Brand.BrandType.FRANCHISE_BRAND, owner=self.request.user)


class StoreDetailView(generics.RetrieveUpdateAPIView):
    """查詢 / 修改名下的某一間門市(加盟品牌)"""

    serializer_class = BrandSerializer
    permission_classes = [IsStoreOwnerRole]

    def get_queryset(self):
        return _owned_franchise_brands(self.request)


class ManagedStoreListingViewSet(viewsets.ModelViewSet):
    """店主管理自己門市的商品上架(庫存/是否上架)。可用 ?store_id=<id> 指定名下哪一間門市"""

    serializer_class = ManagedStoreProductListingSerializer
    permission_classes = [IsStoreOwnerRole]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return StoreProductListing.objects.all()
        store_id = self.request.query_params.get("store_id")
        if store_id:
            store = _owned_franchise_brands(self.request).filter(id=store_id).first()
            if not store:
                return StoreProductListing.objects.none()
            return StoreProductListing.objects.filter(franchise_brand=store)
        store_ids = _owned_franchise_brands(self.request).values_list("id", flat=True)
        return StoreProductListing.objects.filter(franchise_brand_id__in=store_ids)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["franchise_brand"] = _resolve_franchise_brand(self.request)
        return context

    def perform_create(self, serializer):
        store = _resolve_franchise_brand(self.request)
        if not store:
            raise PermissionDenied("名下有多間門市時，請用 ?store_id= 指定要管理的門市")
        serializer.save(franchise_brand=store)
