import { Routes, Route } from "react-router-dom";

import Home from "./routes/index";
import About from "./routes/about";
import Products from "./routes/products";
import ProductDetail from "./routes/product.$id";
import Cart from "./routes/cart";
import Checkout from "./routes/checkout";
import OrderSuccess from "./routes/order-success";
import Contact from "./routes/contact";
import Terms from "./routes/terms";
import RefundPolicy from "./routes/refund-policy";
import Register from "./routes/register";
import Login from "./routes/login";
import TrackOrder from "./routes/track-order";
import Admin from "./routes/admin";
import VendorDashboard from "./routes/vendor-dashboard";
import VendorRegister from "./routes/vendor-register";

export default function App() {
  return (
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
    </Routes>
  );
}