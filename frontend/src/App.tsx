import { Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { FavoritesPage } from "./pages/Favorites";
import { LoginPage } from "./pages/Login";
import { ManagementDashboardPage } from "./pages/ManagementDashboard";
import { OrdersPage } from "./pages/Orders";
import { ProductDetailPage } from "./pages/ProductDetail";
import { ProductsPage } from "./pages/Products";
import { RegisterPage } from "./pages/Register";
import { StoreDashboardPage } from "./pages/StoreDashboard";
import { StoreOwnerManagementPage } from "./pages/StoreOwnerManagement";
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
          <Route element={<RoleRoute roles={["store_owner"]} />}>
            <Route path="/store" element={<StoreDashboardPage />} />
            <Route path="/store/products" element={<StoreProductsPage />} />
          </Route>
          <Route
            element={<RoleRoute roles={["store_owner", "franchise_master", "brand_owner"]} />}
          >
            <Route path="/management" element={<ManagementDashboardPage />} />
          </Route>
          <Route element={<RoleRoute roles={["franchise_master"]} />}>
            <Route path="/franchise/store-owners" element={<StoreOwnerManagementPage />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default App;
