import { memo, useCallback, useEffect, useState } from "react";
import {
  Shield,
  Package,
  LogOut,
  Users,
  Truck,
  ClipboardList,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/auth-store";
import { toast } from "sonner";
import { VendorRequestsModal } from "@/modals/VendorRequestsModal";
import { ProductRequestsModal } from "@/modals/ProductRequestsModal";

type Order = {
  id: number;
  order_id: string;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  status: string;
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none backdrop-blur-xl transition-all focus:border-[#FF6600]";

export default function AdminPage() {
  const { isAdmin, logoutAdmin } = useAuth();

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return <AdminPanel onLogout={logoutAdmin} />;
}

function AdminLogin() {
  const loginAdmin = useAuth((s) => s.loginAdmin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
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
        toast.success(`Welcome ${data.admin.name}`);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0B3D2E] to-[#14532d] shadow-xl">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-white">Admin Portal</h1>
            <p className="mt-2 text-sm text-gray-400">
              Egnaro Mart Control Center
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Email</label>
              <input
                type="email"
                required
                placeholder="admin@egnaromart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-[#FF6600] py-3 font-semibold text-white transition-all hover:bg-[#e65c00]"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  // modal state
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const loadStats = useCallback(async () => {
    const safeJson = (res: Response) =>
      res.json().catch(() => []);

    const [vendorsData, productsData, ordersData] = await Promise.all([
      fetch("https://egnaromart.com/api/get-all-vendors.php").then(safeJson).catch(() => []),
      fetch("https://egnaromart.com/api/get-products.php").then(safeJson).catch(() => []),
      fetch("https://egnaromart.com/api/get-orders.php").then(safeJson).catch(() => []),
    ]);

    setTotalVendors(Array.isArray(vendorsData) ? vendorsData.length : 0);
    setTotalProducts(Array.isArray(productsData) ? productsData.length : 0);
    setOrders(Array.isArray(ordersData) ? ordersData : []);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">Admin Dashboard</h1>
            <p className="mt-2 text-gray-400">
              Manage vendors, products &amp; orders
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white transition-all hover:bg-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* stat cards */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <StatCard
            icon={<Package />}
            count={totalProducts}
            label="Total Products"
          />
          <StatCard
            icon={<Users />}
            count={totalVendors}
            label="Total Vendors"
          />
          <StatCard
            icon={<Truck />}
            count={orders.length}
            label="Orders"
          />
        </div>

        {/* approval action buttons */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <ActionButton
            icon={<Users className="h-5 w-5" />}
            label="Vendor Requests"
            description="Review and approve / reject pending vendor registrations"
            accent="from-[#0B3D2E] to-[#14532d]"
            onClick={() => setVendorModalOpen(true)}
          />
          <ActionButton
            icon={<Package className="h-5 w-5" />}
            label="Product Requests"
            description="Review and approve / reject products submitted by vendors"
            accent="from-[#1a0a00] to-[#3d1800]"
            onClick={() => setProductModalOpen(true)}
          />
        </div>

        {/* orders section */}
        <Section title="Orders">
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No orders yet
              </p>
            ) : (
              orders.map((o) => <OrderRow key={o.id} order={o} />)
            )}
          </div>
        </Section>
      </div>

      {/* modals */}
      {vendorModalOpen && (
        <VendorRequestsModal
          onClose={() => setVendorModalOpen(false)}
          onVendorActioned={() =>
            setTotalVendors((n) => Math.max(0, n))
          }
        />
      )}

      {productModalOpen && (
        <ProductRequestsModal
          onClose={() => setProductModalOpen(false)}
          onProductActioned={() =>
            setTotalProducts((n) => Math.max(0, n))
          }
        />
      )}
    </Shell>
  );
}

/* ─── Sub-components ─── */

function ActionButton({
  icon,
  label,
  description,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-2xl transition-all hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-[#FF6600] transition-transform group-hover:scale-110`}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white">{label}</span>
          <ClipboardList className="h-4 w-4 text-[#FF6600] opacity-70" />
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
      <h2 className="mb-5 text-2xl font-bold text-white">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B3D2E] text-[#FF6600]">
        {icon}
      </div>
      <div className="text-4xl font-black text-white">{count}</div>
      <div className="mt-2 text-gray-400">{label}</div>
    </div>
  );
}

const OrderRow = memo(({ order }: { order: Order }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-semibold text-white">#{order.order_id}</h3>
      <p className="mt-2 text-sm text-gray-400">{order.customer_name}</p>
      <p className="text-sm text-gray-500">{order.phone}</p>
      <p className="mt-2 font-bold text-[#FF6600]">₹{order.total}</p>
      <p className="mt-2 text-sm text-gray-500">{order.address}</p>
    </div>
  );
});