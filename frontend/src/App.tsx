import { Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { FavoritesPage } from "./pages/Favorites";
import { FirmDashboardPage } from "./pages/FirmDashboard";
import { FirmProductsPage } from "./pages/FirmProducts";
import { GuestCheckoutPage } from "./pages/GuestCheckout";
import { LoginPage } from "./pages/Login";
import { OrdersPage } from "./pages/Orders";
import { ProductDetailPage } from "./pages/ProductDetail";
import { ProductsPage } from "./pages/Products";
import { RegisterPage } from "./pages/Register";

function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/guest-checkout" element={<GuestCheckoutPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>
          <Route element={<RoleRoute roles={["member"]} />}>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Route>
          <Route element={<RoleRoute roles={["firm", "superuser"]} />}>
            <Route path="/firm" element={<FirmDashboardPage />} />
            <Route path="/firm/products" element={<FirmProductsPage />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default App;
