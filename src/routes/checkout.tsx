import { useNavigate } from "react-router-dom";   // ✅ switched to react-router-dom
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { CreditCard, Smartphone, Wallet, MessageCircle } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useCart } from "@/context/cart-store";
import { getProducts } from "@/services/api";
import { inr } from "@/lib/format";
import { toast } from "sonner";

const QR =
  "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=egnaromart@okaxis%26pn=EgnaroMart";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gst: "",
  notes: "",
};

export default function CheckoutPage() {   // ✅ default export
  const nav = useNavigate();
  const { items, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<"cod" | "upi" | "card">("cod");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000,
  });

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

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
          <p className="mt-2 text-muted-foreground">
            Add products before checking out.
          </p>
        </div>
      </Shell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("https://egnaromart.com/api/create-order.php", {
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
      });
      const data = await res.json();
      if (data.success) {
        clear();
        nav(`/order-success?orderId=${data.order_id}`);   // ✅ simplified navigation
      } else {
        toast.error(data.message || "Order failed. Try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

        <form
          onSubmit={handleSubmit}
          className="grid lg:grid-cols-[1fr_380px] gap-8"
        >
          {/* LEFT — Shipping + Payment */}
          <div className="space-y-6">
            {/* Shipping */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-5">Shipping Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <input
                    required
                    autoComplete="name"
                    className={inputCls}
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                  />
                </Field>
                <Field label="Phone Number *">
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    pattern="[0-9]{10}"
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </Field>
                <Field label="Email Address *" full>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </Field>
                <Field label="Street Address *" full>
                  <input
                    required
                    autoComplete="street-address"
                    className={inputCls}
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                  />
                </Field>
                <Field label="City *">
                  <input
                    required
                    autoComplete="address-level2"
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                </Field>
                <Field label="State *">
                  <input
                    required
                    autoComplete="address-level1"
                    className={inputCls}
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                  />
                </Field>
                <Field label="Pincode *">
                  <input
                    required
                    pattern="[0-9]{6}"
                    autoComplete="postal-code"
                    className={inputCls}
                    value={form.pincode}
                    onChange={(e) => setField("pincode", e.target.value)}
                  />
                </Field>
                <Field label="GST Number (Optional)">
                  <input
                    autoComplete="off"
                    className={inputCls}
                    value={form.gst}
                    onChange={(e) => setField("gst", e.target.value)}
                  />
                </Field>
                <Field label="Order Notes (Optional)" full>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
                </Field>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-lg mb-5">Payment Method</h2>
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
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      payment === p.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p.icon className="h-5 w-5 mb-2 text-primary" />
                    <div className="text-sm font-semibold">{p.label}</div>
                  </button>
                ))}
              </div>

              {payment === "upi" && (
                <div className="rounded-lg border border-border p-5 grid sm:grid-cols-[180px_1fr] gap-5 items-center">
                  <img
                    src={QR}
                    alt="UPI QR"
                    className="rounded-lg bg-white p-2 mx-auto"
                    width={180}
                    height={180}
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
                      <span className="font-bold text-lg">{inr(total)}</span>
                    </div>
                    <a
                      href="https://wa.me/919442581506"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-green-600 hover:underline text-sm"
                    >
                      <MessageCircle className="h-4 w-4" /> Send screenshot via
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {payment === "card" && (
                <div className="rounded-lg border border-border p-5 space-y-3">
                  <Field label="Card Number">
                    <input
                      placeholder="0000 0000 0000 0000"
                      autoComplete="cc-number"
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry">
                      <input
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="CVV">
                      <input
                        placeholder="123"
                        autoComplete="cc-csc"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Demo gateway — no real charge.
                  </p>
                </div>
              )}

              {payment === "cod" && (
                <p className="text-sm text-muted-foreground">
                  Pay in cash when your order arrives.
                </p>
              )}
            </section>
          </div>

          {/* RIGHT — Summary */}
          <aside className="rounded-xl border border-border bg-card p-6 h-fit sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
              {detailed.map((i) => (
                <div
                  key={i.productId}
                  className="flex gap-3 items-center text-sm"
                >
                  <img
                    src={i.product.image}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1 font-medium">
                      {i.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty {i.quantity}
                    </div>
                  </div>
                  <div className="font-semibold flex-shrink-0">
                    {inr(i.product.price * i.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "FREE" : inr(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span>{inr(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-lg bg-primary text-primary-foreground py-3.5 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
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
