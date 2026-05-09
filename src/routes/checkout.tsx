import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CreditCard, Smartphone, Wallet, MessageCircle } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useCart } from "@/context/cart-store";
import { getProducts } from "@/services/api";
import { inr } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

const QR =
  "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=egnaromart@okaxis%26pn=EgnaroMart";

function CheckoutPage() {
  const nav = useNavigate();
  const { items, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => getProducts(),
  });

  const [payment, setPayment] = useState<"cod" | "upi" | "card">("cod");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst: "",
    notes: "",
  });

  const detailed = items
    .map((i) => ({
      ...i,
      product: products.find((p: any) => p.id === i.productId)!,
    }))
    .filter((x) => x.product);

  const subtotal = detailed.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0
  );
  const shipping = subtotal >= 5000 ? 0 : 99;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Cart is empty</h1>
        </div>
      </Shell>
    );
  }

  const inputCls =
    "w-full bg-secondary/60 border border-glass-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring transition";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(
        "https://egnaromart.com/api/create-order.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: form.fullName,
            phone: form.phone,
            email: form.email,
            address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
            total,
            payment_method: payment,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        clear();
        // ✅ FIXED: data.order_id is returned at root level from create-order.php
        nav({
          to: "/order-success",
          search: { orderId: data.order_id },
        });
      } else {
        toast.error(data.message || "Order failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-4xl font-bold mb-8">Checkout</h1>
        <form
          onSubmit={handleSubmit}
          className="grid lg:grid-cols-[1fr_400px] gap-8"
        >
          {/* Shipping Details */}
          <div className="space-y-6">
            <section className="glass-strong rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold mb-5">
                Shipping Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <input
                    required
                    className={inputCls}
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                </Field>
                <Field label="Phone Number *">
                  <input
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email Address *" full>
                  <input
                    required
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Street Address *" full>
                  <input
                    required
                    className={inputCls}
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </Field>
                <Field label="City *">
                  <input
                    required
                    className={inputCls}
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                </Field>
                <Field label="State *">
                  <input
                    required
                    className={inputCls}
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                  />
                </Field>
                <Field label="Pincode *">
                  <input
                    required
                    pattern="[0-9]{6}"
                    className={inputCls}
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({ ...form, pincode: e.target.value })
                    }
                  />
                </Field>
                <Field label="GST Number (Optional)">
                  <input
                    className={inputCls}
                    value={form.gst}
                    onChange={(e) =>
                      setForm({ ...form, gst: e.target.value })
                    }
                  />
                </Field>
                <Field label="Order Notes (Optional)" full>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </Field>
              </div>
            </section>

            {/* Payment Method */}
            <section className="glass-strong rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold mb-5">
                Payment Method
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { id: "cod", label: "Cash on Delivery", icon: Wallet },
                  { id: "upi", label: "UPI Payment", icon: Smartphone },
                  { id: "card", label: "Card", icon: CreditCard },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayment(p.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      payment === p.id
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-glass-border glass hover:border-primary/40"
                    }`}
                  >
                    <p.icon className="h-5 w-5 mb-2 text-primary" />
                    <div className="text-sm font-semibold">{p.label}</div>
                  </button>
                ))}
              </div>

              {payment === "upi" && (
                <div className="glass rounded-xl p-5 grid sm:grid-cols-[200px_1fr] gap-5 items-center">
                  <img
                    src={QR}
                    alt="UPI QR"
                    className="rounded-lg bg-white p-2 mx-auto"
                  />
                  <div className="space-y-2 text-sm">
                    <div className="text-muted-foreground">
                      Pay via any UPI app
                    </div>
                    <div>
                      <span className="text-muted-foreground">UPI ID:</span>{" "}
                      <span className="font-mono font-semibold">
                        egnaromart@okaxis
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount:</span>{" "}
                      <span className="font-display font-bold text-lg text-gradient">
                        {inr(total)}
                      </span>
                    </div>
                    <a
                      href="https://wa.me/919442581506"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-success hover:underline text-sm"
                    >
                      <MessageCircle className="h-4 w-4" /> Send payment
                      screenshot via WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {payment === "card" && (
                <div className="glass rounded-xl p-5 space-y-3">
                  <Field label="Card Number">
                    <input
                      placeholder="0000 0000 0000 0000"
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry">
                      <input placeholder="MM/YY" className={inputCls} />
                    </Field>
                    <Field label="CVV">
                      <input placeholder="123" className={inputCls} />
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Demo gateway — no real charge.
                  </p>
                </div>
              )}

              {payment === "cod" && (
                <p className="text-sm text-muted-foreground">
                  Pay in cash when your order arrives. A small COD fee may
                  apply at delivery.
                </p>
              )}
            </section>
          </div>

          {/* Order Summary */}
          <aside className="glass-strong rounded-2xl p-6 h-fit shadow-elegant sticky top-24">
            <h3 className="font-display text-xl font-bold mb-4">
              Order Summary
            </h3>
            <div className="space-y-3 max-h-64 overflow-auto pr-1 mb-4 scrollbar-hide">
              {detailed.map((i) => (
                <div
                  key={i.productId}
                  className="flex gap-3 items-center text-sm"
                >
                  <img
                    src={i.product.image}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1 font-medium">
                      {i.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty {i.quantity}
                    </div>
                  </div>
                  <div className="font-semibold">
                    {inr(i.product.price * i.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-glass-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "FREE" : inr(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-glass-border">
                <span className="font-semibold">Total</span>
                <span className="font-display font-bold text-gradient">
                  {inr(total)}
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-glow shimmer disabled:opacity-60"
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </aside>
        </form>
      </div>
    </Shell>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}