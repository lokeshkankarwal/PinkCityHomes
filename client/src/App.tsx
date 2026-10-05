import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./auth";

// Public pages
import HomePage from "./pages/public/HomePage";
import PropertiesPage from "./pages/public/PropertiesPage";
import PropertyDetailPage from "./pages/public/PropertyDetailPage";
import RentalsPage from "./pages/public/RentalsPage";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import SellerProfilePage from "./pages/public/SellerProfilePage";

// Customer pages
import FavouritesPage from "./pages/customer/FavouritesPage";
import CartPage from "./pages/customer/CartPage";
import OrdersPage from "./pages/customer/OrdersPage";
import ProfilePage from "./pages/customer/ProfilePage";

// Seller pages
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import SellerPropertiesPage from "./pages/seller/SellerPropertiesPage";
import SellerClientsPage from "./pages/seller/SellerClientsPage";

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminSellersPage from "./pages/admin/AdminSellersPage";
import AdminSellerDetailPage from "./pages/admin/AdminSellerDetailPage";
import AdminPropertiesPage from "./pages/admin/AdminPropertiesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminDisabledPage from "./pages/admin/AdminDisabledPage";
import AdminAuditPage from "./pages/admin/AdminAuditPage";

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === "SUPERADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "SELLER") return <Navigate to="/seller/dashboard" replace />;
    return <Navigate to="/properties" replace />;
  }
  return <HomePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeRoute />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="rentals" element={<RentalsPage />} />
        <Route path="rentals/:id" element={<PropertyDetailPage />} />
        <Route path="projects" element={<Navigate to="/properties" replace />} />
        <Route path="projects/:id" element={<Navigate to="/properties" replace />} />
        <Route path="insights" element={<Navigate to="/properties" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="sellers/:sellerId" element={<SellerProfilePage />} />

        <Route path="profile" element={<ProfilePage />} />

        {/* Customer area */}
        <Route path="customer/favourites" element={<FavouritesPage />} />
        <Route path="customer/cart" element={<CartPage />} />
        <Route path="customer/orders" element={<OrdersPage />} />
        <Route path="customer/profile" element={<ProfilePage />} />

        {/* Seller area */}
        <Route path="seller/dashboard" element={<SellerDashboardPage />} />
        <Route path="seller/properties" element={<SellerPropertiesPage />} />
        <Route path="seller/clients" element={<SellerClientsPage />} />
        <Route path="seller/profile" element={<ProfilePage />} />

        {/* Admin area */}
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="admin/sellers" element={<AdminSellersPage />} />
        <Route path="admin/sellers/:sellerId" element={<AdminSellerDetailPage />} />
        <Route path="admin/properties" element={<AdminPropertiesPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/disabled" element={<AdminDisabledPage />} />
        <Route path="admin/audit" element={<AdminAuditPage />} />
        <Route path="admin/orders" element={<OrdersPage />} />
        <Route path="admin/profile" element={<ProfilePage />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
