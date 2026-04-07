import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';

const AdminApp = lazy(() => import('../admin/AdminApp'));
const Landing = lazy(() => import('../pages/Landing'));
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const ProductPage = lazy(() => import('../pages/ProductPage'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Orders = lazy(() => import('../pages/Orders'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const SellProduct = lazy(() => import('../pages/SellProduct'));
const HelpCenter = lazy(() => import('../pages/HelpCenter'));
const TermsAndConditions = lazy(() => import('../pages/TermsAndConditions'));
const NotFound = lazy(() => import('../pages/NotFound'));
const AboutUs = lazy(() => import('../pages/AboutUs'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading...</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/about" element={<AboutUs />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:orderId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <SellProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel - separate sub-application */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
