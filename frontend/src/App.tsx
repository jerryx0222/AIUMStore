import { Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { FavoritesPage } from "./pages/Favorites";
import { LoginPage } from "./pages/Login";
import { OrdersPage } from "./pages/Orders";
import { ProductDetailPage } from "./pages/ProductDetail";
import { ProductsPage } from "./pages/Products";
import { RegisterPage } from "./pages/Register";
import { StoreDashboardPage } from "./pages/StoreDashboard";
import { StoreProductsPage } from "./pages/StoreProducts";

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
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>
          <Route element={<RoleRoute roles={["member"]} />}>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Route>
          <Route element={<RoleRoute roles={["brand_owner", "store_owner", "superuser"]} />}>
            <Route path="/store" element={<StoreDashboardPage />} />
            <Route path="/store/products" element={<StoreProductsPage />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default App;
