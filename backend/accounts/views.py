from django.contrib.auth import get_user_model
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from products.models import Brand, Combo, Product
from products.serializers import BrandSerializer, ComboSerializer, ProductSerializer

from .permissions import IsFranchiseMasterRole, IsStoreOwnerRole, IsSuperUser
from .serializers import (
    AccountAdminSerializer,
    BrandWithProductsSerializer,
    PersonBriefSerializer,
    PersonSerializer,
    RegisterSerializer,
)

Person = get_user_model()


class RegisterView(generics.CreateAPIView):
    """會員註冊"""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    """取得 / 更新目前登入人員資料"""

    serializer_class = PersonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """登出：將 refresh token 加入黑名單"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "缺少 refresh token"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "無效的 refresh token"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


def _require_member(request):
    if not request.user.is_superuser and request.user.level != Person.Level.MEMBER:
        raise PermissionDenied("僅會員可使用此功能")


class FavoriteListView(APIView):
    """會員的喜好產品列表"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        _require_member(request)
        products = request.user.favorite_products.all()
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request):
        _require_member(request)
        product = get_object_or_404(Product, pk=request.data.get("product_id"))
        request.user.favorite_products.add(product)
        return Response(status=status.HTTP_201_CREATED)


class FavoriteDetailView(APIView):
    """移除單一喜好產品"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        _require_member(request)
        request.user.favorite_products.remove(product_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ManagementDashboardView(APIView):
    """依登入者角色顯示對應的管理維護頁資料：
    店主看底下的店員；加盟主看代理的品牌(含產品)及管理的店主；
    品牌主看該品牌的所有產品；superuser 看以上所有角色的資料"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        manageable_levels = {
            Person.Level.STORE_OWNER,
            Person.Level.FRANCHISE_MASTER,
            Person.Level.BRAND_OWNER,
        }
        if not user.is_superuser and user.level not in manageable_levels:
            raise PermissionDenied("僅店主/加盟主/品牌主/系統管理員可檢視此頁")

        show_store_owner = user.is_superuser or user.level == Person.Level.STORE_OWNER
        show_franchise_master = user.is_superuser or user.level == Person.Level.FRANCHISE_MASTER
        show_brand_owner = user.is_superuser or user.level == Person.Level.BRAND_OWNER

        store_clerks = []
        if show_store_owner:
            store_owners = (
                Person.objects.filter(level=Person.Level.STORE_OWNER)
                if user.is_superuser
                else [user]
            )
            for store_owner in store_owners:
                store = getattr(store_owner, "owned_brand", None)
                clerks = (
                    Person.objects.filter(level=Person.Level.STORE_CLERK, employer_brand=store)
                    if store
                    else Person.objects.none()
                )
                store_clerks.append(
                    {
                        "store_owner": PersonBriefSerializer(store_owner).data,
                        "store_name": store.name_zh if store else None,
                        "clerks": PersonBriefSerializer(clerks, many=True).data,
                    }
                )

        franchise_masters = []
        if show_franchise_master:
            masters = (
                Person.objects.filter(level=Person.Level.FRANCHISE_MASTER)
                if user.is_superuser
                else [user]
            )
            for master in masters:
                brands = master.franchised_brands.prefetch_related("products")
                store_owners = master.managed_store_owners.all()
                franchise_masters.append(
                    {
                        "franchise_master": PersonBriefSerializer(master).data,
                        "franchised_brands": BrandWithProductsSerializer(brands, many=True).data,
                        "managed_store_owners": PersonBriefSerializer(store_owners, many=True).data,
                    }
                )

        brand_owners = []
        if show_brand_owner:
            owners = (
                Person.objects.filter(level=Person.Level.BRAND_OWNER)
                if user.is_superuser
                else [user]
            )
            for owner in owners:
                brand = getattr(owner, "owned_brand", None)
                products = brand.products.all() if brand else Product.objects.none()
                combos = brand.combos.all() if brand else Combo.objects.none()
                brand_owners.append(
                    {
                        "brand_owner": PersonBriefSerializer(owner).data,
                        "brand": BrandSerializer(brand).data if brand else None,
                        "products": ProductSerializer(products, many=True).data,
                        "combos": ComboSerializer(combos, many=True).data,
                    }
                )

        return Response(
            {
                "store_clerks": store_clerks,
                "franchise_masters": franchise_masters,
                "brand_owners": brand_owners,
            }
        )


class _ProtectedAccountDestroyMixin:
    """刪除帳號時，若該帳號仍有訂單紀錄(Order.user 為 PROTECT)則拒絕刪除並提示原因"""

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError("此帳號已有訂單紀錄，無法刪除")


class BrandOwnerListCreateView(generics.ListCreateAPIView):
    """superuser 新增/列出品牌主帳號"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsSuperUser]
    queryset = Person.objects.filter(level=Person.Level.BRAND_OWNER)

    def perform_create(self, serializer):
        serializer.save(level=Person.Level.BRAND_OWNER)


class BrandOwnerDetailView(_ProtectedAccountDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    """superuser 維護單一品牌主帳號(可重設密碼/刪除)"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsSuperUser]
    queryset = Person.objects.filter(level=Person.Level.BRAND_OWNER)


class FranchiseMasterListCreateView(generics.ListCreateAPIView):
    """superuser 新增/列出加盟主帳號"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsSuperUser]
    queryset = Person.objects.filter(level=Person.Level.FRANCHISE_MASTER)

    def perform_create(self, serializer):
        serializer.save(level=Person.Level.FRANCHISE_MASTER)


class FranchiseMasterDetailView(_ProtectedAccountDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    """superuser 維護單一加盟主帳號(可重設密碼/刪除)"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsSuperUser]
    queryset = Person.objects.filter(level=Person.Level.FRANCHISE_MASTER)


class FranchiseMasterBrandsView(APIView):
    """superuser 指定某加盟主最多可加盟(掛載)哪些產品品牌；加盟主本人再從此範圍決定其門市各自要掛載哪些"""

    permission_classes = [IsSuperUser]

    def put(self, request, pk):
        master = get_object_or_404(Person, pk=pk, level=Person.Level.FRANCHISE_MASTER)
        brand_ids = request.data.get("franchised_brands", [])
        brands = Brand.objects.filter(id__in=brand_ids, brand_type=Brand.BrandType.PRODUCT_BRAND)
        master.franchised_brands.set(brands)
        return Response({"franchised_brands": list(master.franchised_brands.values_list("id", flat=True))})


class StoreOwnerListCreateView(generics.ListCreateAPIView):
    """加盟主新增/列出自己管理的店主帳號(superuser 可看全部，
    新增時可用 ?manager_id= 指定要交給哪個加盟主管理)"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsFranchiseMasterRole]

    def get_queryset(self):
        if self.request.user.is_superuser:
            queryset = Person.objects.filter(level=Person.Level.STORE_OWNER)
            manager_id = self.request.query_params.get("manager_id")
            return queryset.filter(manager_id=manager_id) if manager_id else queryset
        return self.request.user.managed_store_owners.all()

    def perform_create(self, serializer):
        if self.request.user.is_superuser:
            manager = None
            manager_id = self.request.query_params.get("manager_id")
            if manager_id:
                manager = Person.objects.filter(
                    id=manager_id, level=Person.Level.FRANCHISE_MASTER
                ).first()
                if not manager:
                    raise PermissionDenied("找不到指定的加盟主")
            serializer.save(level=Person.Level.STORE_OWNER, manager=manager)
        else:
            serializer.save(level=Person.Level.STORE_OWNER, manager=self.request.user)


class StoreOwnerDetailView(_ProtectedAccountDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    """維護單一店主帳號(僅該店主的加盟主本人或 superuser，可重設密碼/刪除)"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsFranchiseMasterRole]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Person.objects.filter(level=Person.Level.STORE_OWNER)
        return self.request.user.managed_store_owners.all()


def _resolve_clerk_store(request):
    """依角色解析要操作的門市：店主一律用自己名下的門市，
    superuser 需用 ?owner_id= 指定要操作哪個店主的門市"""
    if request.user.is_superuser:
        owner_id = request.query_params.get("owner_id")
        owner = (
            Person.objects.filter(id=owner_id, level=Person.Level.STORE_OWNER).first()
            if owner_id
            else None
        )
        return getattr(owner, "owned_brand", None) if owner else None
    return getattr(request.user, "owned_brand", None)


class StoreClerkListCreateView(generics.ListCreateAPIView):
    """店主新增/列出自己門市的店員帳號(superuser 可用 ?owner_id= 指定要操作哪個店主的門市)"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsStoreOwnerRole]

    def get_queryset(self):
        store = _resolve_clerk_store(self.request)
        if not store:
            return Person.objects.none()
        return Person.objects.filter(level=Person.Level.STORE_CLERK, employer_brand=store)

    def perform_create(self, serializer):
        store = _resolve_clerk_store(self.request)
        if not store:
            raise PermissionDenied("尚未擁有門市，或 superuser 需用 ?owner_id= 指定店主")
        serializer.save(level=Person.Level.STORE_CLERK, employer_brand=store)


class StoreClerkDetailView(_ProtectedAccountDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    """維護單一店員帳號(僅該店員所屬門市的店主本人或 superuser，可重設密碼/刪除)"""

    serializer_class = AccountAdminSerializer
    permission_classes = [IsStoreOwnerRole]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Person.objects.filter(level=Person.Level.STORE_CLERK)
        store = getattr(self.request.user, "owned_brand", None)
        if not store:
            return Person.objects.none()
        return Person.objects.filter(level=Person.Level.STORE_CLERK, employer_brand=store)
