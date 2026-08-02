// App.jsx — route map with code-splitting (React.lazy) for fast first load.
// Pages are grouped under layouts: MainLayout (storefront), AccountLayout
// (logged-in dashboard) and AdminLayout (admin-only).
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ScrollToTop from './components/common/ScrollToTop.jsx';
import PageLoader from './components/common/PageLoader.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// Layouts (eager — tiny + always needed)
import MainLayout from './layouts/MainLayout.jsx';
import AccountLayout from './layouts/AccountLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// ── Lazy pages ───────────────────────────────────────────────
const Home = lazy(() => import('./pages/Home.jsx'));
const Shop = lazy(() => import('./pages/Shop.jsx'));
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const TrackOrder = lazy(() => import('./pages/TrackOrder.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));          // phone + OTP (customers)
const StaffLogin = lazy(() => import('./pages/StaffLogin.jsx')); // email + password (staff)
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

// Account
const Profile = lazy(() => import('./pages/account/Profile.jsx'));
const Orders = lazy(() => import('./pages/account/Orders.jsx'));
const Addresses = lazy(() => import('./pages/account/Addresses.jsx'));

// Admin
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers.jsx'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons.jsx'));
const SalesReport = lazy(() => import('./pages/admin/SalesReport.jsx'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Storefront ─────────────────────────────── */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/category/:slug" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/about" element={<About />} />

            {/* Auth — customers sign in/up with phone + OTP on a single page. */}
            <Route path="/login" element={<Login />} />
            {/* Legacy links (and old bookmarks) land on the same OTP page. */}
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            {/* Staff/admin email sign-in + password recovery (not linked in nav). */}
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Checkout + success (must be logged in) */}
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />

            {/* Account dashboard */}
            <Route
              path="/account"
              element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}
            >
              <Route index element={<Profile />} />
              <Route path="profile" element={<Profile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="addresses" element={<Addresses />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* ── Admin ──────────────────────────────────── */}
          <Route
            path="/admin"
            element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="sales-report" element={<SalesReport />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
