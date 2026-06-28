from django.urls import path

from .views import (
    CheckoutView,
    FirmDashboardView,
    GuestCheckoutView,
    OrderDetailView,
    OrderListView,
    PaymentConfirmView,
    StorePickupConfirmView,
)

urlpatterns = [
    path("", OrderListView.as_view(), name="order-list"),
    path("<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("guest-checkout/", GuestCheckoutView.as_view(), name="guest-checkout"),
    path(
        "<int:order_id>/payment/confirm/",
        PaymentConfirmView.as_view(),
        name="payment-confirm",
    ),
    path(
        "<int:order_id>/pickup/confirm/",
        StorePickupConfirmView.as_view(),
        name="pickup-confirm",
    ),
    path("firm/dashboard/", FirmDashboardView.as_view(), name="firm-dashboard"),
]
