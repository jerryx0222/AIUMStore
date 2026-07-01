from django.urls import path

from .views import (
    CheckoutView,
    OrderDetailView,
    OrderListView,
    PaymentConfirmView,
    StoreDashboardView,
)

urlpatterns = [
    path("", OrderListView.as_view(), name="order-list"),
    path("<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path(
        "<int:order_id>/payment/confirm/",
        PaymentConfirmView.as_view(),
        name="payment-confirm",
    ),
    path("store/dashboard/", StoreDashboardView.as_view(), name="store-dashboard"),
]
