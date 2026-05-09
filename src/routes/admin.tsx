import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Check,
  X,
  Package,
  LogOut,
  Users,
  Truck,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Product = {
  id: number;
  name: string;
  category: string;
  image: string;
  price: number;
  original_price: number;
  discount: number;
  description: string;
  approved: number;
};

type Vendor = {
  id: number;
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
};

type Order = {
  id: number;
  order_id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  total: number;
  status: string;
};

function AdminPage() {
  const { isAdmin, logoutAdmin } = useAuth();
  if (!isAdmin) return <AdminLogin />;
  return <AdminPanel onLogout={logoutAdmin} />;
}

/* -------------------------------------------------- */
/*  LOGIN                                              */
/* -------------------------------------------------- */

function AdminLogin() {
  const loginAdmin = useAuth((s) => s.loginAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("https://egnaromart.com/api/admin-login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        loginAdmin(data.admin);
        toast.success(`Welcome ${data.admin.name} 🚀`);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      {/* ✅ FIXED: removed overflow-hidden so page can scroll */}
      <div className="relative flex min-h-[80vh] items-center justify-center px-4 py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,255,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.2),transparent_35%)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#071028]/90 p-10 shadow-[0_0_80px_rgba(0,255,255,0.08)] backdrop-blur-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-yellow-400" />

          <div className="mb-8 flex justify-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-black text-white">Admin Portal</h1>
            <p className="mt-3 text-gray-400">
              Secure access to Egnaro Mart Control Center
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-10 space-y-5">
            <input
              type="email"
              required
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
            />
            <button
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-yellow-300 py-4 text-lg font-bold text-black shadow-[0_10px_40px_rgba(0,255,255,0.25)] transition hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-center text-sm text-cyan-200">
            Protected Enterprise Admin System
          </div>
        </motion.div>
      </div>
    </Shell>
  );
}

/* -------------------------------------------------- */
/*  ADMIN PANEL                                        */
/* -------------------------------------------------- */

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    loadPendingProducts();
    loadPendingVendors();
    loadOrders();
  }, []);

  async function loadPendingProducts() {
    try {
      setLoadingProducts(true);
      const res = await fetch("https://egnaromart.com/api/get-pending.php");
      const data = await res.json();
      setPendingProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadPendingVendors() {
    try {
      setLoadingVendors(true);
      const res = await fetch("https://egnaromart.com/api/get-vendors.php");
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vendors");
    } finally {
      setLoadingVendors(false);
    }
  }

  async function loadOrders() {
    try {
      setLoadingOrders(true);
      const res = await fetch("https://egnaromart.com/api/get-orders.php");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function approveProduct(id: number) {
    try {
      const res = await fetch("https://egnaromart.com/api/admin-approve.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Product approved"); loadPendingProducts(); }
      else toast.error(data.message || "Approval failed");
    } catch { toast.error("Server error"); }
  }

  async function rejectProduct(id: number) {
    try {
      const res = await fetch("https://egnaromart.com/api/admin-reject.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Product rejected"); loadPendingProducts(); }
      else toast.error(data.message || "Reject failed");
    } catch { toast.error("Server error"); }
  }

  async function approveVendor(id: number) {
    try {
      const res = await fetch("https://egnaromart.com/api/approve-vendor.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Vendor approved"); loadPendingVendors(); }
      else toast.error(data.message || "Approval failed");
    } catch { toast.error("Server error"); }
  }

  async function rejectVendor(id: number) {
    try {
      const res = await fetch("https://egnaromart.com/api/reject-vendor.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Vendor rejected"); loadPendingVendors(); }
      else toast.error(data.message || "Reject failed");
    } catch { toast.error("Server error"); }
  }

  async function updateOrderStatus(order_id: string, newStatus: string) {
    try {
      const res = await fetch("https://egnaromart.com/api/update-order-status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`Order #${order_id} → ${newStatus}`); loadOrders(); }
      else toast.error(data.message || "Update failed");
    } catch { toast.error("Server error"); }
  }

  return (
    // ✅ FIXED: Added Shell wrapper + removed overflow-hidden
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* HEADER */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Admin Dashboard
            </div>
            <h1 className="font-display text-4xl font-bold">
              Egnaro Mart Control Center
            </h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* STATS */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatBox icon={<Package className="h-6 w-6 text-primary" />} count={pendingProducts.length} label="Pending Products" />
          <StatBox icon={<Users className="h-6 w-6 text-primary" />} count={vendors.length} label="Vendor Requests" />
          <StatBox icon={<Truck className="h-6 w-6 text-primary" />} count={orders.length} label="Total Orders" />
        </div>

        {/* VENDORS */}
        <div className="glass-strong mb-8 rounded-3xl p-6">
          <h2 className="mb-6 font-display text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Vendor Approval Requests
          </h2>
          {loadingVendors ? (
            <p className="py-10 text-center text-muted-foreground">Loading vendors...</p>
          ) : vendors.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No pending vendor requests</p>
          ) : (
            <div className="space-y-4">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{vendor.company_name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{vendor.vendor_name}</p>
                    <p className="text-sm text-muted-foreground">{vendor.email}</p>
                    <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{vendor.address}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => approveVendor(vendor.id)} className="flex items-center gap-2 rounded-xl bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-400 transition hover:bg-green-500/30">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button onClick={() => rejectVendor(vendor.id)} className="flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/30">
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCTS */}
        <div className="glass-strong mb-8 rounded-3xl p-6">
          <h2 className="mb-6 font-display text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Pending Products
          </h2>
          {loadingProducts ? (
            <p className="py-10 text-center text-muted-foreground">Loading products...</p>
          ) : pendingProducts.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No pending products found</p>
          ) : (
            <div className="space-y-4">
              {pendingProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center"
                >
                  <img
                    src={product.image || "/placeholder.png"}
                    alt={product.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
                    <p className="mt-2 font-bold text-primary">₹{Number(product.price || 0).toLocaleString()}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => approveProduct(product.id)} className="flex items-center gap-2 rounded-xl bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-400 transition hover:bg-green-500/30">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button onClick={() => rejectProduct(product.id)} className="flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/30">
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ORDERS */}
        <div className="glass-strong rounded-3xl p-6">
          <h2 className="mb-6 font-display text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Orders Management
          </h2>
          {loadingOrders ? (
            <p className="py-10 text-center text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No orders found</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Order #{order.order_id}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{order.customer_name} — {order.phone}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{order.address}</p>
                    <p className="mt-2 font-bold text-primary">₹{Number(order.total || 0).toLocaleString()}</p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Shell>
  );
}

function StatBox({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      {icon}
      <div className="mt-3 text-3xl font-bold">{count}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}