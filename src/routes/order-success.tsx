import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  Phone,
  MapPin,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: String(search.orderId ?? ""),
  }),
  component: OrderSuccessPage,
});

type Order = {
  id: number;
  order_id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  total: string;
  payment_method: string;
  status: string;
  estimated_days: string | null;
  created_at: string;
};

function OrderSuccessPage() {
  const { orderId } = useSearch({ from: "/order-success" });

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // ✅ Direct fetch — bypasses the broken request() wrapper in api.ts
    fetch(`https://egnaromart.com/api/get-order.php?order_id=${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setFetchError(true);
        }
      })
      .catch((err) => {
        console.error("Order fetch error:", err);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Shell>
      <div className="relative overflow-hidden">
        {/* BACKGROUND */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_35%)]" />

        <div className="mx-auto max-w-4xl px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-[36px] border border-white/10 bg-[#071028]/90 shadow-[0_0_80px_rgba(0,255,255,0.08)] backdrop-blur-2xl"
          >
            {/* TOP GRADIENT BAR */}
            <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-yellow-300" />

            <div className="p-8 md:p-12">

              {/* SUCCESS ICON */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8 flex justify-center"
              >
                <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.45)]">
                  <CheckCircle2 className="h-14 w-14 text-white" />
                </div>
              </motion.div>

              {/* TITLE */}
              <div className="text-center">
                <h1 className="text-4xl font-black text-white md:text-5xl">
                  Order Placed 🎉
                </h1>
                <p className="mt-4 text-lg text-gray-400">
                  Your order has been placed successfully.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-300">
                  <PackageCheck className="h-4 w-4" />
                  Order ID: {orderId || "—"}
                </div>
              </div>

              {/* LOADING */}
              {loading && (
                <div className="mt-10 flex items-center justify-center gap-3 py-10 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading order details...
                </div>
              )}

              {/* ORDER DETAILS */}
              {!loading && order && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-10 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
                >
                  <h2 className="mb-8 text-2xl font-bold text-white">
                    Order Details
                  </h2>

                  <div className="grid gap-5 md:grid-cols-2">

                    {/* CUSTOMER */}
                    <InfoCard
                      icon={<PackageCheck className="h-5 w-5" />}
                      label="Customer"
                      value={order.customer_name}
                    />

                    {/* PHONE */}
                    <InfoCard
                      icon={<Phone className="h-5 w-5" />}
                      label="Phone"
                      value={order.phone}
                    />

                    {/* ADDRESS */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-2">
                      <div className="mb-3 flex items-center gap-2 text-cyan-300">
                        <MapPin className="h-5 w-5" />
                        Delivery Address
                      </div>
                      <div className="leading-relaxed text-white">
                        {order.address}
                      </div>
                    </div>

                    {/* PAYMENT */}
                    <InfoCard
                      icon={<CreditCard className="h-5 w-5" />}
                      label="Payment Method"
                      value={order.payment_method?.toUpperCase()}
                    />

                    {/* TOTAL */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="mb-3 flex items-center gap-2 text-cyan-300">
                        <Truck className="h-5 w-5" />
                        Total Amount
                      </div>
                      <div className="text-3xl font-black text-green-400">
                        {inr(Number(order.total || 0))}
                      </div>
                    </div>

                    {/* STATUS */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="mb-3 text-cyan-300">Order Status</div>
                      <StatusBadge status={order.status || "Processing"} />
                    </div>

                    {/* ESTIMATED DELIVERY */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="mb-3 text-cyan-300">
                        Estimated Delivery
                      </div>
                      <div className="font-semibold text-white">
                        {order.estimated_days || "3–5 Business Days"}
                      </div>
                    </div>

                    {/* ORDER DATE */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-2">
                      <div className="mb-3 text-cyan-300">Order Placed On</div>
                      <div className="font-semibold text-white">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* ERROR — only show if no orderId OR fetch genuinely failed */}
              {!loading && fetchError && (
                <div className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
                  Could not load order details. Please use Track Order below.
                </div>
              )}

              {/* BUTTONS */}
              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link
                  to="/products"
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-yellow-300 px-8 py-4 text-center font-bold text-black shadow-[0_10px_40px_rgba(0,255,255,0.25)] transition hover:scale-[1.02]"
                >
                  Continue Shopping
                </Link>
                <Link
                  to="/track-order"
                  className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-center font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
                >
                  Track Order
                </Link>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}

/* ---- Helper Components ---- */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-3 flex items-center gap-2 text-cyan-300">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Processing: "bg-yellow-500/20 text-yellow-300",
    Packed: "bg-blue-500/20 text-blue-300",
    Shipped: "bg-purple-500/20 text-purple-300",
    "Out for Delivery": "bg-orange-500/20 text-orange-300",
    Delivered: "bg-green-500/20 text-green-300",
  };

  return (
    <div
      className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${
        colors[status] ?? "bg-yellow-500/20 text-yellow-300"
      }`}
    >
      {status}
    </div>
  );
}