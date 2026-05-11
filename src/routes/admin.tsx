import { memo, useCallback, useEffect, useState } from "react";
import {
  Shield,
  Package,
  LogOut,
  Users,
  Truck,
  Check,
  X,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/auth-store";
import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  category: string;
  image: string;
  price: number;
  description: string;
};

type Vendor = {
  id: number;
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
};

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

      const res = await fetch(
        "https://egnaromart.com/api/admin-login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

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
            <h1 className="text-3xl font-black text-white">
              Admin Portal
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Egnaro Mart Control Center
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Email
              </label>

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
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadPendingProducts = useCallback(async () => {
    const d = await fetch(
      "https://egnaromart.com/api/get-pending.php"
    ).then((r) => r.json());

    setPendingProducts(Array.isArray(d) ? d : []);
  }, []);

  const loadPendingVendors = useCallback(async () => {
    const d = await fetch(
      "https://egnaromart.com/api/get-vendors.php"
    ).then((r) => r.json());

    setVendors(Array.isArray(d) ? d : []);
  }, []);

  const loadOrders = useCallback(async () => {
    const d = await fetch(
      "https://egnaromart.com/api/get-orders.php"
    ).then((r) => r.json());

    setOrders(Array.isArray(d) ? d : []);
  }, []);

  useEffect(() => {
    loadPendingProducts();
    loadPendingVendors();
    loadOrders();
  }, []);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Manage vendors, products & orders
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

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <StatCard
            icon={<Package />}
            count={pendingProducts.length}
            label="Pending Products"
          />

          <StatCard
            icon={<Users />}
            count={vendors.length}
            label="Vendor Requests"
          />

          <StatCard
            icon={<Truck />}
            count={orders.length}
            label="Orders"
          />
        </div>

        <Section title="Vendor Requests">
          <div className="space-y-4">
            {vendors.map((v) => (
              <VendorRow key={v.id} vendor={v} />
            ))}
          </div>
        </Section>

        <Section title="Pending Products">
          <div className="space-y-4">
            {pendingProducts.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        </Section>

        <Section title="Orders">
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
        </Section>
      </div>
    </Shell>
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
      <h2 className="mb-5 text-2xl font-bold text-white">
        {title}
      </h2>

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

      <div className="text-4xl font-black text-white">
        {count}
      </div>

      <div className="mt-2 text-gray-400">
        {label}
      </div>
    </div>
  );
}

const VendorRow = memo(({ vendor }: { vendor: Vendor }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-semibold text-white">
        {vendor.company_name}
      </h3>

      <p className="mt-2 text-sm text-gray-400">
        {vendor.vendor_name}
      </p>

      <p className="text-sm text-gray-500">
        {vendor.email} • {vendor.phone}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        {vendor.address}
      </p>

      <div className="mt-4 flex gap-3">
        <button className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white">
          <Check className="h-4 w-4" />
          Approve
        </button>

        <button className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white">
          <X className="h-4 w-4" />
          Reject
        </button>
      </div>
    </div>
  );
});

const ProductRow = memo(({ product }: { product: Product }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex gap-4">
        <img
          src={product.image}
          alt={product.name}
          className="h-20 w-20 rounded-2xl object-cover"
        />

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            {product.category}
          </p>

          <p className="mt-2 text-[#FF6600] font-bold">
            ₹{product.price}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
});

const OrderRow = memo(({ order }: { order: Order }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-semibold text-white">
        #{order.order_id}
      </h3>

      <p className="mt-2 text-sm text-gray-400">
        {order.customer_name}
      </p>

      <p className="text-sm text-gray-500">
        {order.phone}
      </p>

      <p className="mt-2 text-[#FF6600] font-bold">
        ₹{order.total}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        {order.address}
      </p>
    </div>
  );
});