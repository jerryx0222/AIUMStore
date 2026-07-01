from rest_framework import generics, mixins, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from accounts.permissions import IsBrandOwnerRole, IsFranchiseMasterRole, IsStoreOwnerRole

from .models import Brand, Category, Product, ProductImage, StoreProductListing
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    FranchiseListingSerializer,
    ManagedProductSerializer,
    ManagedStoreProductListingSerializer,
    ProductImageSerializer,
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


def _owned_product_brand(request):
    """目前使用者(品牌主)唯一擁有的產品品牌，非品牌主或尚未設定擁有者則回傳 None"""
    brand = getattr(request.user, "owned_brand", None)
    if brand and brand.brand_type == Brand.BrandType.PRODUCT_BRAND:
        return brand
    return None


def _resolve_product_brand(request):
    """依 ?brand_id= 解析出目前操作的產品品牌；superuser 必須指定，品牌主則直接用自己擁有的品牌"""
    if request.user.is_superuser:
        brand_id = request.query_params.get("brand_id")
        if not brand_id:
            return None
        return Brand.objects.filter(id=brand_id, brand_type=Brand.BrandType.PRODUCT_BRAND).first()
    return _owned_product_brand(request)


def _owned_products(request):
    """目前使用者(品牌主)名下產品品牌底下的所有產品(superuser 可看全部，需搭配 ?brand_id=)"""
    if request.user.is_superuser:
        brand_id = request.query_params.get("brand_id")
        queryset = Product.objects.all()
        return queryset.filter(product_brand_id=brand_id) if brand_id else queryset
    brand = _owned_product_brand(request)
    if not brand:
        return Product.objects.none()
    return Product.objects.filter(product_brand=brand)


def _managed_franchise_brands(request):
    """加盟主管理的所有店主，其唯一經營的門市(加盟品牌)集合(superuser 可看全部)"""
    if request.user.is_superuser:
        return Brand.objects.filter(brand_type=Brand.BrandType.FRANCHISE_BRAND)
    store_owner_ids = request.user.managed_store_owners.values_list("id", flat=True)
    return Brand.objects.filter(
        brand_type=Brand.BrandType.FRANCHISE_BRAND, owner_id__in=store_owner_ids
    )


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
    """列出 / 新增目前使用者名下的門市(加盟品牌)：一個店主唯一經營一間門市"""

    serializer_class = BrandSerializer
    permission_classes = [IsStoreOwnerRole]

    def get_queryset(self):
        return _owned_franchise_brands(self.request)

    def perform_create(self, serializer):
        if not self.request.user.is_superuser and _owned_franchise_brands(self.request).exists():
            raise PermissionDenied("店主僅能唯一經營一間門市，已有門市則不可再新增")
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


class ManagedProductViewSet(viewsets.ModelViewSet):
    """品牌主管理自己產品品牌底下的產品：新增/編輯/刪除，含建議價格與相關內容。
    superuser 需用 ?brand_id= 指定要操作的產品品牌"""

    serializer_class = ManagedProductSerializer
    permission_classes = [IsBrandOwnerRole]

    def get_queryset(self):
        return _owned_products(self.request)

    def perform_create(self, serializer):
        brand = _resolve_product_brand(self.request)
        if not brand:
            raise PermissionDenied("尚未擁有產品品牌，或 superuser 需用 ?brand_id= 指定產品品牌")
        serializer.save(product_brand=brand)


class ManagedProductImageViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """品牌主管理自己產品的圖片：新增(可存多張)/移除，需用 ?product_id= 指定產品，
    新增時 POST body 需帶 product 欄位(產品id)"""

    serializer_class = ProductImageSerializer
    permission_classes = [IsBrandOwnerRole]

    def get_queryset(self):
        queryset = ProductImage.objects.filter(product__in=_owned_products(self.request))
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        product = _owned_products(self.request).filter(id=self.request.data.get("product")).first()
        if not product:
            raise PermissionDenied("無權為此產品新增圖片")
        serializer.save(product=product)


class FranchiseListingViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """加盟主管理其下所有店主門市的商品：只能調整實際價格與是否上下架，
    不可新增/刪除上架項目或調整庫存(庫存由店主自行維護)"""

    serializer_class = FranchiseListingSerializer
    permission_classes = [IsFranchiseMasterRole]

    def get_queryset(self):
        brands = _managed_franchise_brands(self.request)
        return StoreProductListing.objects.filter(franchise_brand__in=brands).select_related(
            "franchise_brand", "product"
        )
