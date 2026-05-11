import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { CartProvider } from "./context/CartContext";

// Store
import StoreNavbar from "./components/StoreNavbar";
import CartDrawer from "./components/CartDrawer";
import Chatbot from "./components/Chatbot";
import StorePage from "./pages/StorePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import OrdersPage from "./pages/OrdersPage";
import CheckoutPage from "./pages/CheckoutPage";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

// Store shell (customer-facing)
function StoreShell() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <>
      <StoreNavbar onCartClick={() => setCartOpen(true)} />
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      <Chatbot />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Admin routes – no store navbar */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="alerts" element={<AdminAlerts />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
          {/* Customer store – all other routes */}
          <Route path="/*" element={<StoreShell />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
