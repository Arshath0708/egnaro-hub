import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Package, MapPin, Calendar, Phone, CheckCircle2, Truck, Box, ShieldCheck, Home } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { api } from "@/services/api";
import { inr, dateTime, dateShort } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

export const Route = createFileRoute("/track-order")({
  head: () => ({ meta: [{ title: "Track Order — Egnaro Mart" }] }),
  component: TrackOrder,
});

const STEPS: { id: OrderStatus; label: string; icon: any }[] = [
  { id: "processing", label: "Processing", icon: Package },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { id: "packed", label: "Packed", icon: Box },
  { id: "shipped", label: "Shipped", icon: Truck },
  { id: "out-for-delivery", label: "Out for Delivery", icon: ShieldCheck },
  { id: "delivered", label: "Delivered", icon: Home },
];

function TrackOrder() {
  const [q, setQ] = useState("EM240001");
  const [order, setOrder] = useState<Order | null | "none">(null);
  const m = useMutation({
    mutationFn: () => api.trackOrder(q),
    onSuccess: (o) => setOrder(o ?? "none"),
  });

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Order Tracking</div>
          <h1 className="font-display text-5xl font-bold">Track your order</h1>
          <p className="text-muted-foreground mt-3">Enter your Order ID or registered phone number.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="glass-strong rounded-2xl p-2 flex items-center gap-2 max-w-2xl mx-auto shadow-elegant">
          <Search className="h-5 w-5 ml-3 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="EM2400001 or 9442581506"
            className="flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground" />
          <button disabled={m.isPending} className="gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold shadow-glow disabled:opacity-60">
            {m.isPending ? "Searching..." : "Track"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">Try demo: <code className="text-primary">EM240001</code></p>

        {order === "none" && (
          <div className="mt-10 glass rounded-2xl p-10 text-center"><h3 className="font-display text-2xl font-bold">No order found</h3><p className="text-muted-foreground mt-2">Please double-check your Order ID or phone number.</p></div>
        )}

        {order && order !== "none" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-6">
            <div className="glass-strong rounded-2xl p-6 shadow-elegant">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Order ID</div>
                  <div className="font-display font-bold text-2xl text-gradient mt-1">{order.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Estimated delivery</div>
                  <div className="font-display font-bold text-xl mt-1">{dateShort(order.estimatedDelivery)}</div>
                </div>
              </div>

              <Timeline current={order.status} history={order.history} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold mb-4">Items</h3>
                <div className="space-y-3">
                  {order.items.map((i) => (
                    <div key={i.productId} className="flex items-center gap-3 text-sm">
                      <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0"><div className="line-clamp-1 font-medium">{i.name}</div><div className="text-xs text-muted-foreground">Qty {i.quantity}</div></div>
                      <div className="font-semibold">{inr(i.price * i.quantity)}</div>
                    </div>
                  ))}
                  <div className="border-t border-glass-border pt-3 flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-display font-bold text-gradient">{inr(order.total)}</span></div>
                </div>
              </div>
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold mb-4">Shipping</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3"><Phone className="h-4 w-4 mt-0.5 text-primary" /><div>{order.customer.fullName}<div className="text-muted-foreground">{order.customer.phone}</div></div></div>
                  <div className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-primary" /><div>{order.customer.address}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}</div></div>
                  <div className="flex items-start gap-3"><Calendar className="h-4 w-4 mt-0.5 text-primary" /><div>Placed on {dateTime(order.createdAt)}</div></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Shell>
  );
}

function Timeline({ current, history }: { current: OrderStatus; history: { status: OrderStatus; at: string }[] }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div>
      <div className="hidden md:grid grid-cols-6 gap-2 relative mb-2">
        <div className="absolute top-5 left-[8.33%] right-[8.33%] h-0.5 bg-glass-border" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${(currentIdx / (STEPS.length - 1)) * 83.33}%` }} transition={{ duration: 0.8 }}
          className="absolute top-5 left-[8.33%] h-0.5 gradient-primary rounded-full shadow-glow" />
        {STEPS.map((s, i) => {
          const done = i <= currentIdx;
          return (
            <div key={s.id} className="relative flex flex-col items-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }}
                className={`relative z-10 h-10 w-10 rounded-full grid place-items-center transition-colors ${done ? "gradient-primary shadow-glow text-primary-foreground" : "bg-secondary text-muted-foreground border border-glass-border"}`}>
                <s.icon className="h-4 w-4" />
              </motion.div>
              <div className={`text-[10px] mt-2 text-center font-semibold uppercase tracking-wider ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="md:hidden space-y-3">
        {STEPS.map((s, i) => {
          const done = i <= currentIdx;
          const h = history.find((x) => x.status === s.id);
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full grid place-items-center ${done ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-glass-border"}`}><s.icon className="h-4 w-4" /></div>
              <div className="flex-1"><div className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>{h && <div className="text-xs text-muted-foreground">{dateTime(h.at)}</div>}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
