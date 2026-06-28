from rest_framework import generics, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from accounts.permissions import IsFirmRole

from .models import Brand, Category, Firm, Product, ProductVariant
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    FirmSerializer,
    ManagedProductSerializer,
    ManagedProductVariantSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


def _owned_firms(request):
    """目前使用者名下的店家(superuser 可看全部)"""
    if request.user.is_superuser:
        return Firm.objects.all()
    return Firm.objects.filter(owner=request.user)


def _resolve_firm(request):
    """依 ?firm_id= 解析出目前操作的店家；未指定且名下只有一間時自動帶入"""
    firms = _owned_firms(request)
    firm_id = request.query_params.get("firm_id")
    if firm_id:
        firm = firms.filter(id=firm_id).first()
        if not firm:
            raise PermissionDenied("無權操作此店家")
        return firm
    if firms.count() == 1:
        return firms.first()
    return None


def _owned_brand_ids(request):
    return list(
        _owned_firms(request).filter(brand__isnull=False).values_list("brand_id", flat=True).distinct()
    )


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    """商店分類(品牌)列表"""

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
    """商品列表與細項(含價格)，可用 ?category=<slug> 篩選(每個種類紀錄已是唯一的種類/子種類路徑)"""

    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = (
            Product.objects.filter(is_active=True)
            .select_related("category", "brand")
            .prefetch_related("variants")
        )
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer


class FirmListCreateView(generics.ListCreateAPIView):
    """列出 / 新增目前使用者名下的店家(分店)：同一 owner 可擁有多間分店"""

    serializer_class = FirmSerializer
    permission_classes = [IsFirmRole]

    def get_queryset(self):
        return _owned_firms(self.request)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class FirmDetailView(generics.RetrieveUpdateAPIView):
    """查詢 / 修改名下的某一間店家(分店)"""

    serializer_class = FirmSerializer
    permission_classes = [IsFirmRole]

    def get_queryset(self):
        return _owned_firms(self.request)


class ManagedProductViewSet(viewsets.ModelViewSet):
    """店家管理商品：同商店分類(brand)底下的所有店家共用同一份商品。
    可用 ?firm_id=<id> 指定要以哪一間名下的店家身分操作(未指定且僅有一間時自動帶入)"""

    serializer_class = ManagedProductSerializer
    permission_classes = [IsFirmRole]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Product.objects.all()
        firm_id = self.request.query_params.get("firm_id")
        if firm_id:
            firm = _owned_firms(self.request).filter(id=firm_id).first()
            if not firm or not firm.brand_id:
                return Product.objects.none()
            return Product.objects.filter(brand=firm.brand)
        brand_ids = _owned_brand_ids(self.request)
        return Product.objects.filter(brand_id__in=brand_ids)

    def perform_create(self, serializer):
        firm = _resolve_firm(self.request)
        if not firm:
            raise PermissionDenied("名下有多間店家時，請用 ?firm_id= 指定要管理的店家")
        if not firm.brand_id:
            raise PermissionDenied("該店家尚未設定商店分類")
        serializer.save(brand=firm.brand)


class ManagedProductVariantViewSet(viewsets.ModelViewSet):
    """店家管理同商店分類底下商品的細項與價格"""

    serializer_class = ManagedProductVariantSerializer
    permission_classes = [IsFirmRole]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ProductVariant.objects.all()
        firm_id = self.request.query_params.get("firm_id")
        if firm_id:
            firm = _owned_firms(self.request).filter(id=firm_id).first()
            if not firm or not firm.brand_id:
                return ProductVariant.objects.none()
            return ProductVariant.objects.filter(product__brand=firm.brand)
        brand_ids = _owned_brand_ids(self.request)
        return ProductVariant.objects.filter(product__brand_id__in=brand_ids)
