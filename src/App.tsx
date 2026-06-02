import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

// Lazy-loaded route components
const Home = lazy(() => import("./routes/index"));
const About = lazy(() => import("./routes/about"));
const Products = lazy(() => import("./routes/products"));
const ProductDetail = lazy(() => import("./routes/product.$id"));
const Cart = lazy(() => import("./routes/cart"));
const Checkout = lazy(() => import("./routes/checkout"));
const OrderSuccess = lazy(() => import("./routes/order-success"));
const Contact = lazy(() => import("./routes/contact"));
const Terms = lazy(() => import("./routes/terms"));
const RefundPolicy = lazy(() => import("./routes/refund-policy"));
const Register = lazy(() => import("./routes/register"));
const Login = lazy(() => import("./routes/login"));
const TrackOrder = lazy(() => import("./routes/track-order"));
const Admin = lazy(() => import("./routes/admin"));
const VendorDashboard = lazy(() => import("./routes/vendor-dashboard"));
const VendorRegister = lazy(() => import("./routes/vendor-register"));
const MyAccount = lazy(() => import("./routes/my-account"));

import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { BackToTop } from "@/components/layout/BackToTop";
import { SplashScreen } from "@/components/layout/SplashScreen";

function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        {/* Animated glowing orbit */}
        <div className="h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-[#ffd700] shadow-[0_0_20px_rgba(255,102,0,0.3)]" />
        <div className="absolute h-10 w-10 animate-ping rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 opacity-20" />
      </div>
      <p className="mt-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary animate-pulse">
        Loading...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <SplashScreen />
      <ScrollToTop />
      <BackToTop />
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/vendor-dashboard" element={<VendorDashboard />} />
          <Route path="/vendor-register" element={<VendorRegister />} />
          <Route path="/my-account" element={<MyAccount />} />
        </Routes>
      </Suspense>
    </>
  );
}