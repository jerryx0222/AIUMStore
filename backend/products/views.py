from django.contrib.auth import get_user_model
from django.db.models.deletion import ProtectedError
from django.utils.text import slugify
from rest_framework import generics, mixins, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from accounts.permissions import (
    IsBrandOwnerRole,
    IsFranchiseMasterRole,
    IsStoreOwnerRole,
    IsSuperUser,
)

from .models import (
    Brand,
    Category,
    Combo,
    ComboItem,
    Product,
    ProductImage,
    StoreComboListing,
    StoreProductListing,
)
from .serializers import (
    BrandAdminSerializer,
    BrandSerializer,
    CategorySerializer,
    ComboSerializer,
    FranchiseComboListingSerializer,
    FranchiseListingSerializer,
    ManagedComboItemSerializer,
    ManagedComboSerializer,
    ManagedProductSerializer,
    ManagedStoreComboListingSerializer,
    ManagedStoreProductListingSerializer,
    ProductImageSerializer,
    ProductSerializer,
    StoreComboListingSerializer,
    StoreProductListingSerializer,
)

Person = get_user_model()


def _owned_franchise_brands(request):
    """目前使用者可操作的加盟品牌門市：店主看自己名下的門市，
    加盟主看其管理的所有店主的門市，superuser 可看全部"""
    if request.user.is_superuser:
        return Brand.objects.filter(brand_type=Brand.BrandType.FRANCHISE_BRAND)
    if request.user.level == Person.Level.FRANCHISE_MASTER:
        return Brand.objects.filter(
            brand_type=Brand.BrandType.FRANCHISE_BRAND,
            owner__in=request.user.managed_store_owners.all(),
        )
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


def _owned_categories(request):
    """目前使用者(品牌主)名下產品品牌底下的所有種類(superuser 可看全部，需搭配 ?brand_id=)"""
    if request.user.is_superuser:
        brand_id = request.query_params.get("brand_id")
        queryset = Category.objects.all()
        return queryset.filter(product_brand_id=brand_id) if brand_id else queryset
    brand = _owned_product_brand(request)
    if not brand:
        return Category.objects.none()
    return Category.objects.filter(product_brand=brand)


def _owned_combos(request):
    """目前使用者(品牌主)名下產品品牌底下的所有套餐(superuser 可看全部，需搭配 ?brand_id=)"""
    if request.user.is_superuser:
        brand_id = request.query_params.get("brand_id")
        queryset = Combo.objects.all()
        return queryset.filter(product_brand_id=brand_id) if brand_id else queryset
    brand = _owned_product_brand(request)
    if not brand:
        return Combo.objects.none()
    return Combo.objects.filter(product_brand=brand)


def _managed_franchise_brands(request):
    """加盟主管理的所有店主，其唯一經營的門市(加盟品牌)集合(superuser 可看全部)"""
    if request.user.is_superuser:
        return Brand.objects.filter(brand_type=Brand.BrandType.FRANCHISE_BRAND)
    store_owner_ids = request.user.managed_store_owners.values_list("id", flat=True)
    return Brand.objects.filter(
        brand_type=Brand.BrandType.FRANCHISE_BRAND, owner_id__in=store_owner_ids
    )


def _franchised_product_brands(request):
    """加盟主可加盟的產品品牌範圍：由 superuser 指定(見 Person.franchised_brands)，
    加盟主本人只能從自己已加盟的品牌中，決定其管理的門市各自要掛載哪些"""
    if request.user.is_superuser:
        return Brand.objects.filter(brand_type=Brand.BrandType.PRODUCT_BRAND)
    if request.user.level == Person.Level.FRANCHISE_MASTER:
        return request.user.franchised_brands.all()
    return Brand.objects.none()


def _enforce_carried_product_brands(request, serializer):
    """門市掛載的產品品牌是加盟主的權限，不開放店主自行設定：
    店主操作時一律忽略此欄位；加盟主/superuser 操作時檢查是否都在加盟主已加盟的範圍內"""
    if "carried_product_brands" not in serializer.validated_data:
        return
    if not request.user.is_superuser and request.user.level == Person.Level.STORE_OWNER:
        serializer.validated_data.pop("carried_product_brands")
        return
    carried = serializer.validated_data["carried_product_brands"]
    allowed_ids = set(_franchised_product_brands(request).values_list("id", flat=True))
    if any(brand.id not in allowed_ids for brand in carried):
        raise PermissionDenied("僅能掛載加盟主已加盟(由系統管理員指定)的產品品牌")


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    """品牌列表(含產品品牌與加盟品牌)"""

    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class CategoryViewSet(viewsets.ModelViewSet):
    """產品種類：查詢公開，新增/編輯僅限品牌主與 superuser。
    網址代稱(slug)由名稱自動產生，不開放前端指定"""

    serializer_class = CategorySerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticatedOrReadOnly()]
        return [IsBrandOwnerRole()]

    def get_queryset(self):
        if self.action in ("list", "retrieve"):
            queryset = Category.objects.all()
            product_brand_id = self.request.query_params.get("product_brand")
            if product_brand_id:
                queryset = queryset.filter(product_brand_id=product_brand_id)
            return queryset
        return _owned_categories(self.request)

    def _unique_slug(self, name, instance=None):
        base = slugify(name, allow_unicode=True) or "category"
        slug = base
        suffix = 2
        queryset = Category.objects.all()
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        while queryset.filter(slug=slug).exists():
            slug = f"{base}-{suffix}"
            suffix += 1
        return slug

    def perform_create(self, serializer):
        brand = _resolve_product_brand(self.request)
        if not brand:
            raise PermissionDenied("尚未擁有產品品牌，或 superuser 需用 ?brand_id= 指定產品品牌")
        serializer.save(
            product_brand=brand, slug=self._unique_slug(serializer.validated_data["name"])
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        name = serializer.validated_data.get("name", instance.name)
        if name != instance.name:
            serializer.save(slug=self._unique_slug(name, instance))
        else:
            serializer.save()

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError("此種類底下仍有產品，請先刪除或搬移產品後再刪除種類")


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
    """列出 / 新增門市(加盟品牌)：店主只能唯一經營一間門市；
    加盟主可用 ?owner_id= 為其管理的店主新增門市(該店主需尚未擁有門市)"""

    serializer_class = BrandSerializer
    permission_classes = [IsStoreOwnerRole | IsFranchiseMasterRole]

    def get_queryset(self):
        return _owned_franchise_brands(self.request)

    def perform_create(self, serializer):
        user = self.request.user
        _enforce_carried_product_brands(self.request, serializer)
        if user.is_superuser:
            serializer.save(brand_type=Brand.BrandType.FRANCHISE_BRAND, owner=user)
            return
        if user.level == Person.Level.FRANCHISE_MASTER:
            owner_id = self.request.query_params.get("owner_id")
            owner = user.managed_store_owners.filter(
                id=owner_id, owned_brand__isnull=True
            ).first()
            if not owner:
                raise PermissionDenied("需用 ?owner_id= 指定一位尚未擁有門市、且由你管理的店主")
            serializer.save(brand_type=Brand.BrandType.FRANCHISE_BRAND, owner=owner)
            return
        if _owned_franchise_brands(self.request).exists():
            raise PermissionDenied("店主僅能唯一經營一間門市，已有門市則不可再新增")
        serializer.save(brand_type=Brand.BrandType.FRANCHISE_BRAND, owner=user)


class StoreDetailView(generics.RetrieveUpdateAPIView):
    """查詢 / 修改門市(加盟品牌)：店主管理自己名下的門市，加盟主可管理其管理的店主的門市"""

    serializer_class = BrandSerializer
    permission_classes = [IsStoreOwnerRole | IsFranchiseMasterRole]

    def get_queryset(self):
        return _owned_franchise_brands(self.request)

    def perform_update(self, serializer):
        _enforce_carried_product_brands(self.request, serializer)
        serializer.save()


class FranchisableBrandListView(generics.ListAPIView):
    """列出加盟主自己已加盟的產品品牌(由 superuser 指定，見 franchised_brands)：
    加盟主決定其管理的門市要掛載哪些，此範圍不開放店主查詢/選擇"""

    serializer_class = BrandSerializer
    permission_classes = [IsFranchiseMasterRole]

    def get_queryset(self):
        return _franchised_product_brands(self.request)


class ProductBrandListCreateView(generics.ListCreateAPIView):
    """superuser 新增/列出產品品牌(連鎖總部)。可用 ?owner_id= 指定要交給哪個尚未擁有品牌的品牌主"""

    serializer_class = BrandSerializer
    permission_classes = [IsSuperUser]

    def get_queryset(self):
        return Brand.objects.filter(brand_type=Brand.BrandType.PRODUCT_BRAND)

    def perform_create(self, serializer):
        owner = None
        owner_id = self.request.query_params.get("owner_id")
        if owner_id:
            owner = Person.objects.filter(
                id=owner_id, level=Person.Level.BRAND_OWNER, owned_brand__isnull=True
            ).first()
            if not owner:
                raise PermissionDenied("找不到可指派的品牌主，或該品牌主已擁有品牌")
        serializer.save(brand_type=Brand.BrandType.PRODUCT_BRAND, owner=owner)


class ProductBrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    """superuser 維護單一產品品牌：可編輯所有欄位，含指派/更換品牌主；可刪除(底下仍有種類/產品時不可刪除)"""

    serializer_class = BrandAdminSerializer
    permission_classes = [IsSuperUser]

    def get_queryset(self):
        return Brand.objects.filter(brand_type=Brand.BrandType.PRODUCT_BRAND)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError("此品牌底下仍有種類或產品，請先刪除或搬移後再刪除品牌")


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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["product_brand"] = _resolve_product_brand(self.request)
        return context

    def perform_create(self, serializer):
        brand = _resolve_product_brand(self.request)
        if not brand:
            raise PermissionDenied("尚未擁有產品品牌，或 superuser 需用 ?brand_id= 指定產品品牌")
        serializer.save(product_brand=brand)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError("此產品仍被套餐使用，請先從套餐中移除後再刪除產品")


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


class ComboViewSet(viewsets.ReadOnlyModelViewSet):
    """HQ 套餐主檔列表(唯讀)，可用 ?product_brand=<id> 篩選"""

    serializer_class = ComboSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = Combo.objects.select_related("product_brand").prefetch_related(
            "items__product__category", "items__product__images"
        )
        product_brand_id = self.request.query_params.get("product_brand")
        if product_brand_id:
            queryset = queryset.filter(product_brand_id=product_brand_id)
        return queryset


class StoreComboListingListView(generics.ListAPIView):
    """瀏覽門市上架中的套餐(供顧客下單)：?store_id=<加盟品牌id> 或 ?combo_id=<套餐id>"""

    serializer_class = StoreComboListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = StoreComboListing.objects.filter(is_active=True).select_related(
            "combo", "franchise_brand"
        )
        store_id = self.request.query_params.get("store_id")
        if store_id:
            queryset = queryset.filter(franchise_brand_id=store_id)
        combo_id = self.request.query_params.get("combo_id")
        if combo_id:
            queryset = queryset.filter(combo_id=combo_id)
        return queryset


class ManagedComboViewSet(viewsets.ModelViewSet):
    """品牌主管理自己產品品牌底下的套餐：新增/編輯/刪除，含建議價格。
    superuser 需用 ?brand_id= 指定要操作的產品品牌"""

    serializer_class = ManagedComboSerializer
    permission_classes = [IsBrandOwnerRole]

    def get_queryset(self):
        return _owned_combos(self.request)

    def perform_create(self, serializer):
        brand = _resolve_product_brand(self.request)
        if not brand:
            raise PermissionDenied("尚未擁有產品品牌，或 superuser 需用 ?brand_id= 指定產品品牌")
        serializer.save(product_brand=brand)


class ManagedComboItemViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """品牌主管理自己套餐的內容：新增(產品+數量)/移除，需用 ?combo_id= 指定套餐，
    新增時 POST body 需帶 combo 欄位(套餐id)與 product 欄位(產品id)"""

    serializer_class = ManagedComboItemSerializer
    permission_classes = [IsBrandOwnerRole]

    def get_queryset(self):
        queryset = ComboItem.objects.filter(combo__in=_owned_combos(self.request))
        combo_id = self.request.query_params.get("combo_id")
        if combo_id:
            queryset = queryset.filter(combo_id=combo_id)
        return queryset

    def perform_create(self, serializer):
        combo = _owned_combos(self.request).filter(id=self.request.data.get("combo")).first()
        if not combo:
            raise PermissionDenied("無權為此套餐新增內容")
        serializer.save(combo=combo)


class ManagedStoreComboListingViewSet(viewsets.ModelViewSet):
    """店主管理自己門市的套餐上架(庫存/是否上架)。可用 ?store_id=<id> 指定名下哪一間門市"""

    serializer_class = ManagedStoreComboListingSerializer
    permission_classes = [IsStoreOwnerRole]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return StoreComboListing.objects.all()
        store_id = self.request.query_params.get("store_id")
        if store_id:
            store = _owned_franchise_brands(self.request).filter(id=store_id).first()
            if not store:
                return StoreComboListing.objects.none()
            return StoreComboListing.objects.filter(franchise_brand=store)
        store_ids = _owned_franchise_brands(self.request).values_list("id", flat=True)
        return StoreComboListing.objects.filter(franchise_brand_id__in=store_ids)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["franchise_brand"] = _resolve_franchise_brand(self.request)
        return context

    def perform_create(self, serializer):
        store = _resolve_franchise_brand(self.request)
        if not store:
            raise PermissionDenied("名下有多間門市時，請用 ?store_id= 指定要管理的門市")
        serializer.save(franchise_brand=store)


class FranchiseComboListingViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """加盟主管理其下所有店主門市的套餐：只能調整實際價格與是否上下架，
    不可新增/刪除上架項目或調整庫存(庫存由店主自行維護)"""

    serializer_class = FranchiseComboListingSerializer
    permission_classes = [IsFranchiseMasterRole]

    def get_queryset(self):
        brands = _managed_franchise_brands(self.request)
        return StoreComboListing.objects.filter(franchise_brand__in=brands).select_related(
            "franchise_brand", "combo"
        )
