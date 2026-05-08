import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { api } from "@/services/api";
import { inr } from "@/lib/format";

type Search = { orderId?: string };

export const Route = createFileRoute("/order-success")({
  validateSearch: (s: Record<string, unknown>): Search => ({ orderId: typeof s.orderId === "string" ? s.orderId : undefined }),
  component: SuccessPage,
});

function SuccessPage() {
  const { orderId } = Route.useSearch();
  const { data: order } = useQuery({ queryKey: ["order-track", orderId], queryFn: () => orderId ? api.trackOrder(orderId) : null, enabled: !!orderId });

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-20">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong rounded-3xl p-10 text-center shadow-elegant">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="h-20 w-20 mx-auto mb-6 rounded-full gradient-primary grid place-items-center shadow-glow">
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <h1 className="font-display text-4xl font-bold">Order Placed!</h1>
          <p className="mt-3 text-muted-foreground">Thank you. We've received your order and will confirm shortly.</p>
          {orderId && <div className="mt-6 inline-flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm"><Package className="h-4 w-4 text-primary" /> Order ID: <span className="font-mono font-bold text-gradient">{orderId}</span></div>}
          {order && <div className="mt-6 text-sm text-muted-foreground">Total paid: <span className="font-display font-bold text-foreground">{inr(order.total)}</span></div>}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/track-order" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold shadow-glow">Track Order <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/products" className="inline-flex items-center glass px-5 py-3 rounded-xl font-semibold hover:bg-white/10">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    </Shell>
  );
}
