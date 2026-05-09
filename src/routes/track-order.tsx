import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";

import {
  Search,
  Package,
  MapPin,
  Calendar,
  Phone,
  CheckCircle2,
  Truck,
  Box,
  ShieldCheck,
  Home,
  AlertTriangle,
  Sparkles,
  Clock3,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { trackOrder } from "@/services/api";
import { inr, dateTime, dateShort } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [{ title: "Track Order — Egnaro Mart" }],
  }),
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

function normalizeStatus(
  status?: string
): OrderStatus {
  const value = status
    ?.toLowerCase()
    .trim();

  if (
    value === "out for delivery"
  ) {
    return "out-for-delivery";
  }

  const validStatuses: OrderStatus[] = [
    "processing",
    "confirmed",
    "packed",
    "shipped",
    "out-for-delivery",
    "delivered",
  ];

  if (
    validStatuses.includes(
      value as OrderStatus
    )
  ) {
    return value as OrderStatus;
  }

  return "processing";
}

function TrackOrder() {
  const [q, setQ] = useState("");
  const [order, setOrder] = useState<Order | null | "none">(null);

  const mutation = useMutation({
    mutationFn: async () => {
      return await trackOrder(q.trim());
    },

    onSuccess: (data: any) => {
  console.log("TRACK ORDER RESPONSE:", data);

  setOrder(null);

  // HANDLE ARRAY RESPONSE
  const response = Array.isArray(data) ? data[0] : data;

  if (!response || response.success === false) {
    setOrder("none");
    return;
  }

  const rawOrder = response.order;

  if (!rawOrder) {
    setOrder("none");
    return;
  }

  const normalizedOrder: Order = {
    id: rawOrder.id,

    order_id: rawOrder.order_id ??
      String(rawOrder.id ?? ""),

    status: normalizeStatus(rawOrder.status),

    total: Number(rawOrder.total ?? 0),

    createdAt: rawOrder.created_at ??
      new Date().toISOString(),

    estimatedDelivery: rawOrder.created_at ??
      new Date().toISOString(),

    items: rawOrder.items ?? [],

    history: rawOrder.history ?? [
      {
        status: normalizeStatus(rawOrder.status),
        at: rawOrder.created_at ??
          new Date().toISOString(),
      },
    ],

    customer: {
      fullName: rawOrder.customer_name ?? "Customer",

      phone: rawOrder.phone ?? "",

      address: rawOrder.address ?? "",

      city: "",

      state: "",

      pincode: "",
      email: ""
    },
    address: "",
    payment: "cod"
  };

  console.log(
    "NORMALIZED ORDER:",
    normalizedOrder
  );

  setOrder(normalizedOrder);
},

    onError: (error) => {
      console.error("TRACK ORDER ERROR:", error);
      setOrder("none");
    },
  });

  return (
    <Shell>
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,255,255,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="mx-auto max-w-6xl px-4 py-12">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles className="h-4 w-4" />
              Egnaro Smart Tracking
            </div>

            <h1 className="font-display text-5xl font-black leading-tight">
              Track Your Order 📦
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Real-time delivery tracking for all Egnaro Mart orders.
              Enter your order ID or registered phone number.
            </p>

            {/* Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                mutation.mutate();
              }}
              className="mt-8 flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/20 p-3 backdrop-blur-xl md:flex-row"
            >
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white/5 px-4">
                <Search className="h-5 w-5 text-cyan-300" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Enter Order ID or Phone Number"
                  className="h-14 w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                />
              </div>

              <button
                disabled={mutation.isPending}
                className="h-14 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-8 font-bold text-white shadow-[0_10px_40px_rgba(0,255,255,0.25)] transition hover:scale-[1.02] disabled:opacity-60"
              >
                {mutation.isPending ? "Tracking..." : "Track Order"}
              </button>
            </form>
          </motion.div>

          {/* Order Not Found */}
          {order === "none" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-red-500/20 bg-red-500/5 p-10 text-center backdrop-blur-xl"
            >
              <AlertTriangle className="mx-auto mb-5 h-16 w-16 text-red-400" />
              <h2 className="text-3xl font-bold">Order Not Found</h2>
              <p className="mt-3 text-muted-foreground">
                Please check your order ID or phone number and try again.
              </p>
            </motion.div>
          )}

          {/* Order Details */}
          {order && order !== "none" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Top Card */}
              <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl">
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/10 p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                        Order ID
                      </div>
                      <h2 className="text-4xl font-black">
                        {order.order_id}
                      </h2>

                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                        <Clock3 className="h-4 w-4" />
                        Estimated Delivery:{" "}
                        {dateShort(order.estimatedDelivery)}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
                      <div className="text-sm text-muted-foreground">
                        Total Amount
                      </div>
                      <div className="mt-2 text-5xl font-black text-cyan-300">
                        {inr(order.total || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <Timeline
                    current={order.status}
                    history={order.history || []}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Ordered Items */}
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
                  <div className="mb-6 flex items-center gap-3">
                    <Package className="h-6 w-6 text-cyan-300" />
                    <h3 className="text-2xl font-bold">Ordered Items</h3>
                  </div>

                  {!order.items || order.items.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 p-8 text-center text-muted-foreground">
                      No items available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {order.items.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center gap-4 rounded-3xl border border-white/10 bg-black/20 p-4"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          )}

                          <div className="flex-1">
                            <h4 className="line-clamp-1 text-lg font-bold">
                              {item.name}
                            </h4>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </div>
                            <div className="mt-3 text-2xl font-black text-cyan-300">
                              {inr(
                                Number(item.price || 0) *
                                  Number(item.quantity || 1)
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shipping Details */}
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
                  <div className="mb-6 flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-cyan-300" />
                    <h3 className="text-2xl font-bold">
                      Shipping Details
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <InfoCard
                      icon={Phone}
                      title="Customer"
                      value={order.customer?.fullName || "N/A"}
                      sub={order.customer?.phone}
                    />

                    <InfoCard
                      icon={MapPin}
                      title="Address"
                      value={order.customer?.address || "N/A"}
                    />

                    <InfoCard
                      icon={Calendar}
                      title="Placed On"
                      value={dateTime(order.createdAt)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* Timeline */
function Timeline({
  current,
  history,
}: {
  current: OrderStatus;
  history: { status: OrderStatus; at: string }[];
}) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <div>
      {/* Desktop */}
      <div className="hidden grid-cols-6 gap-4 md:grid">
        {STEPS.map((step, index) => {
          const done = index <= currentIdx;

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center"
            >
              {index < STEPS.length - 1 && (
                <div className="absolute left-[55%] top-5 h-1 w-full bg-white/10">
                  <div
                    className={`h-full ${
                      done
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                        : "bg-white/10"
                    }`}
                  />
                </div>
              )}

              <div
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border ${
                  done
                    ? "border-cyan-400 bg-gradient-to-br from-cyan-400 to-blue-500 text-white"
                    : "border-white/10 bg-black/30 text-gray-500"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>

              <div
                className={`mt-3 text-center text-xs font-bold uppercase tracking-wider ${
                  done ? "text-white" : "text-gray-500"
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="space-y-4 md:hidden">
        {STEPS.map((step, index) => {
          const done = index <= currentIdx;
          const h = history.find((x) => x.status === step.id);

          return (
            <div key={step.id} className="flex gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  done
                    ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white"
                    : "bg-white/5 text-gray-500"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>

              <div>
                <div
                  className={`font-bold ${
                    done ? "text-white" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </div>

                {h && (
                  <div className="text-sm text-muted-foreground">
                    {dateTime(h.at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Info Card */
function InfoCard({
  icon: Icon,
  title,
  value,
  sub,
}: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>

        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="mt-1 text-lg font-bold">{value}</div>
          {sub && (
            <div className="mt-1 text-sm text-muted-foreground">
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}