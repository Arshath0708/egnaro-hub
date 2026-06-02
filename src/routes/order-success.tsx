import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  Phone,
  MapPin,
  CreditCard,
  Loader2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Inbox
} from "lucide-react";
import { motion } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { inr } from "@/lib/format";

type OrderItem = {
  id: number;
  name: string;
  image: string;
  quantity: number;
  price: number | string;
};

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
  items: OrderItem[];
};

const STATUS_COLORS: Record<string, string> = {
  Processing: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  Packed: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  Shipped: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  "Out for Delivery": "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  Delivered: "bg-green-500/10 text-green-400 border border-green-500/20",
};

export default function OrderSuccessPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId") || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`https://egnaromart.com/api/get-order.php?order_id=${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        data.success && data.order ? setOrder(data.order) : setFetchError(true);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Success header banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-8 text-center mb-10 overflow-hidden shadow-2xl backdrop-blur-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 via-transparent to-white/5 pointer-events-none" />
          
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 -inset-1 rounded-full bg-green-500 blur-md opacity-20 h-20 w-20 animate-pulse" />
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white uppercase">
            Order Confirmed! 🎉
          </h1>
          <p className="mt-2 text-slate-400 max-w-md mx-auto text-sm">
            Thank you for shopping with Egnaro Mart. Your order has been registered and is currently being processed.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300">
            <PackageCheck className="h-4 w-4 text-primary" />
            Order Reference: <span className="font-mono text-primary font-black">{orderId || "—"}</span>
          </div>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-bold tracking-wider uppercase">Fetching Invoice Data...</span>
          </div>
        )}

        {!loading && fetchError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400 font-semibold mb-6">
            We could not fetch your invoice details automatically, but your order is safe! You can track it manually below.
          </div>
        )}

        {!loading && order && (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* LEFT COLUMN: Receipt and Items Breakdown */}
            <div className="space-y-6">
              <div className="glass rounded-3xl p-6 border border-white/5 bg-slate-950/20">
                <h3 className="font-display text-lg font-black mb-5 text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-primary" /> Shipment Summary
                </h3>

                <div className="space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 rounded-xl object-cover border border-white/5 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.png";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-200 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 font-mono">
                            Qty: <span className="text-slate-200 font-bold">{item.quantity}</span> • Price: {inr(Number(item.price))}
                          </p>
                        </div>
                        <div className="font-mono text-sm font-extrabold text-slate-200">
                          {inr(Number(item.price) * item.quantity)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No items registered under this order ID.</p>
                  )}
                </div>
              </div>

              {/* Delivery ETA banner */}
              <div className="glass rounded-3xl p-5 border border-white/5 bg-gradient-to-r from-blue-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Truck className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">Estimated Delivery Arrival</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Your package is on its way to your destination.</p>
                  </div>
                </div>
                <div className="text-right sm:text-right">
                  <span className="inline-block text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    {order.estimated_days || "3–5 Business Days"}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Coordinates and Actions */}
            <aside className="space-y-6">
              <div className="glass-strong rounded-3xl p-6 border border-white/5 bg-slate-900/40">
                <h3 className="font-display text-base font-black mb-5 text-slate-200 uppercase tracking-wider">Invoice Overview</h3>
                
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-bold tracking-wider block mb-1">Customer Name</span>
                    <span className="text-sm font-bold text-slate-200">{order.customer_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase font-bold tracking-wider block mb-1">Contact Phone</span>
                    <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> {order.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase font-bold tracking-wider block mb-1">Shipping Destination</span>
                    <span className="text-slate-200 leading-relaxed font-semibold flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" /> {order.address}
                    </span>
                  </div>

                  <div className="border-t border-white/5 pt-4 my-2" />

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-slate-500 uppercase font-bold tracking-wider block">Payment Mode</span>
                      <span className="text-slate-200 font-bold mt-0.5 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" /> {order.payment_method?.toUpperCase()}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[order.status] ?? "bg-slate-500/10 text-slate-400 border border-white/5"}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="border-t border-white/5 pt-4 my-2" />

                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Total Paid</span>
                      <span className="font-mono text-2xl font-black text-green-400">{inr(Number(order.total || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Box */}
              <div className="space-y-3">
                <Link
                  to={`/track-order?id=${order.order_id}`}
                  className="w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3.5 rounded-2xl font-bold tracking-wider text-xs uppercase shadow-glow cursor-pointer hover:scale-[1.01] transition-transform select-none"
                >
                  <Truck className="h-4 w-4" /> Live Tracking Status
                </Link>
                <Link
                  to="/products"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 py-3.5 rounded-2xl font-bold tracking-wider text-xs uppercase cursor-pointer transition-colors select-none"
                >
                  <ShoppingBag className="h-4 w-4" /> Shop More Products
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* Action fallback when order is null */}
        {!order && !loading && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/products"
              className="gradient-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold tracking-wider text-xs uppercase shadow-glow text-center"
            >
              Continue Shopping
            </Link>
            <Link
              to="/track-order"
              className="bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 px-8 py-3.5 rounded-2xl font-bold tracking-wider text-xs uppercase text-center"
            >
              Track Order
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}
