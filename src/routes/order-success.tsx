import { Link, useLocation } from "react-router-dom";   // ✅ switched to react-router-dom
import { useEffect, useState } from "react";
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

const STATUS_COLORS: Record<string, string> = {
  Processing: "bg-yellow-100 text-yellow-800",
  Packed: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  "Out for Delivery": "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
};

export default function OrderSuccessPage() {   // ✅ default export
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
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Success header */}
        <div className="rounded-xl border border-border bg-card p-8 text-center mb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-black">Order Placed! 🎉</h1>
          <p className="mt-2 text-muted-foreground">
            Your order has been placed successfully.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-semibold">
            <PackageCheck className="h-4 w-4" />
            Order ID: {orderId || "—"}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading order details...
          </div>
        )}

        {/* Order details */}
        {!loading && order && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="font-semibold text-lg mb-5">Order Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <PackageCheck className="h-4 w-4" /> Customer
                </div>
                <div className="font-semibold">{order.customer_name}</div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Phone className="h-4 w-4" /> Phone
                </div>
                <div className="font-semibold">{order.phone}</div>
              </div>

              <div className="rounded-lg border border-border p-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" /> Delivery Address
                </div>
                <div className="font-semibold">{order.address}</div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CreditCard className="h-4 w-4" /> Payment
                </div>
                <div className="font-semibold">
                  {order.payment_method?.toUpperCase()}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Truck className="h-4 w-4" /> Total Amount
                </div>
                <div className="text-2xl font-black text-green-600">
                  {inr(Number(order.total || 0))}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Order Status
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                    STATUS_COLORS[order.status] ??
                    "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Estimated Delivery
                </div>
                <div className="font-semibold">
                  {order.estimated_days || "3–5 Business Days"}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 sm:col-span-2">
                <div className="text-sm text-muted-foreground mb-2">
                  Order Placed On
                </div>
                <div className="font-semibold">
                  {new Date(order.created_at).toLocaleString("en-IN", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-red-700 mb-6">
            Could not load order details. Please use Track Order below.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/products"
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 text-center font-semibold hover:bg-primary/90 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/track-order"
            className="rounded-lg border border-border px-6 py-3 text-center font-semibold hover:bg-accent transition-colors"
          >
            Track Order
          </Link>
        </div>
      </div>
    </Shell>
  );
}
