import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import {
  CreditCard,
  Smartphone,
  Wallet,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { useCart } from "@/context/cart-store";
import { getProducts } from "@/services/api";
import { inr } from "@/lib/format";
import { toast } from "sonner";

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

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

export default function CheckoutPage() {
  const nav = useNavigate();

  const { items, clear } = useCart();

  const [submitting, setSubmitting] = useState(false);

  const [payment, setPayment] = useState<
    "cod" | "upi" | "card"
  >("upi");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000,
  });

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: string) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const detailed = useMemo(() => {
    return items
      .map((i) => ({
        ...i,
        product: products.find((p: any) => p.id === i.productId)!,
      }))
      .filter((x) => x.product);
  }, [items, products]);

  const subtotal = detailed.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0
  );

  const shipping = subtotal >= 5000 ? 0 : 99;

  const total = subtotal + shipping;

  const upiLink = `upi://pay?pa=samsonelectronics50@oksbi&pn=EgnaroMart&am=${total}&cu=INR`;

  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    upiLink
  )}`;

  const whatsappMessage = encodeURIComponent(`
🛒 Egnaro Mart Payment Receipt

Name: ${form.fullName}
Phone: ${form.phone}
Amount Paid: ₹${total}

Please find my payment screenshot attached.
  `);

  const whatsappUrl = `https://wa.me/919442581506?text=${whatsappMessage}`;

  if (items.length === 0) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="rounded-3xl border border-border bg-card p-10">
            <h1 className="font-display text-4xl font-bold">
              Your Cart is Empty
            </h1>

            <p className="mt-3 text-muted-foreground">
              Add some products before proceeding to checkout.
            </p>

            <button
              onClick={() => nav("/products")}
              className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const orderItems = detailed.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        image: i.product.image,
        quantity: i.quantity,
        price: i.product.price,
      }));

      const res = await fetch(
        "https://egnaromart.com/api/create-order.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            customer_name: form.fullName,
            phone: form.phone,
            email: form.email,

            address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,

            total,

            payment_method: payment,

            order_items: JSON.stringify(orderItems),

            notes: form.notes,

            gst: form.gst,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Order placed successfully 🎉");

        clear();

        nav(`/order-success?orderId=${data.order_id}`);
      } else {
        toast.error(data.message || "Order failed");
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
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* HEADER */}

        <div className="mb-10">
          <h1 className="font-display text-4xl font-black">
            Checkout
          </h1>

          <p className="mt-2 text-muted-foreground">
            Securely complete your order with Egnaro Mart
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[1fr_400px]"
        >
          {/* LEFT */}

          <div className="space-y-8">
            {/* SHIPPING */}

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Shipping Details
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Enter your delivery information
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name *">
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      setField("fullName", e.target.value)
                    }
                    className={inputCls}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Phone Number *">
                  <input
                    required
                    pattern="[0-9]{10}"
                    value={form.phone}
                    onChange={(e) =>
                      setField("phone", e.target.value)
                    }
                    className={inputCls}
                    placeholder="10 digit mobile number"
                  />
                </Field>

                <Field label="Email Address *" full>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setField("email", e.target.value)
                    }
                    className={inputCls}
                    placeholder="you@example.com"
                  />
                </Field>

                <Field label="Street Address *" full>
                  <input
                    required
                    value={form.address}
                    onChange={(e) =>
                      setField("address", e.target.value)
                    }
                    className={inputCls}
                    placeholder="House no, street, area"
                  />
                </Field>

                <Field label="City *">
                  <input
                    required
                    value={form.city}
                    onChange={(e) =>
                      setField("city", e.target.value)
                    }
                    className={inputCls}
                    placeholder="City"
                  />
                </Field>

                <Field label="State *">
                  <input
                    required
                    value={form.state}
                    onChange={(e) =>
                      setField("state", e.target.value)
                    }
                    className={inputCls}
                    placeholder="State"
                  />
                </Field>

                <Field label="Pincode *">
                  <input
                    required
                    pattern="[0-9]{6}"
                    value={form.pincode}
                    onChange={(e) =>
                      setField("pincode", e.target.value)
                    }
                    className={inputCls}
                    placeholder="6 digit pincode"
                  />
                </Field>

                <Field label="GST Number">
                  <input
                    value={form.gst}
                    onChange={(e) =>
                      setField("gst", e.target.value)
                    }
                    className={inputCls}
                    placeholder="Optional"
                  />
                </Field>

                <Field label="Order Notes" full>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) =>
                      setField("notes", e.target.value)
                    }
                    className={inputCls}
                    placeholder="Any special instructions..."
                  />
                </Field>
              </div>
            </section>

            {/* PAYMENT */}

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">
                Payment Method
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    id: "upi",
                    label: "UPI Payment",
                    icon: Smartphone,
                  },

                  {
                    id: "cod",
                    label: "Cash on Delivery",
                    icon: Wallet,
                  },

                  {
                    id: "card",
                    label: "Card",
                    icon: CreditCard,
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayment(p.id as any)}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${
                      payment === p.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p.icon className="mb-3 h-6 w-6 text-primary" />

                    <div className="font-semibold">
                      {p.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* UPI */}

              {payment === "upi" && (
                <div className="mt-6 rounded-3xl border border-border bg-background/50 p-6">
                  <div className="grid items-center gap-6 md:grid-cols-[260px_1fr]">
                    <div className="text-center">
                      <img
                        src={upiQrUrl}
                        alt="UPI QR"
                        className="mx-auto rounded-2xl border bg-white p-3"
                      />

                      <p className="mt-3 text-xs text-muted-foreground">
                        Scan using GPay / PhonePe / Paytm
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">
                        One Click UPI Payment 🚀
                      </h3>

                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            UPI ID:
                          </span>{" "}
                          <span className="font-semibold">
                            samsonelectronics50@oksbi
                          </span>
                        </div>

                        <div>
                          <span className="text-muted-foreground">
                            Amount:
                          </span>{" "}
                          <span className="text-xl font-black text-primary">
                            {inr(total)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <a
                          href={upiLink}
                          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                          Pay with Any UPI App
                        </a>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Send Receipt
                        </a>
                      </div>

                      <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-700 dark:text-yellow-400">
                        After payment, click{" "}
                        <strong>Send Receipt</strong> and share
                        your payment screenshot on WhatsApp.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD */}

              {payment === "card" && (
                <div className="mt-6 rounded-2xl border border-border p-5">
                  <div className="space-y-4">
                    <Field label="Card Number">
                      <input
                        className={inputCls}
                        placeholder="0000 0000 0000 0000"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Expiry">
                        <input
                          className={inputCls}
                          placeholder="MM/YY"
                        />
                      </Field>

                      <Field label="CVV">
                        <input
                          className={inputCls}
                          placeholder="123"
                        />
                      </Field>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">
                    Demo payment gateway only.
                  </p>
                </div>
              )}

              {/* COD */}

              {payment === "cod" && (
                <div className="mt-6 rounded-2xl border border-border bg-background/40 p-5 text-sm text-muted-foreground">
                  You can pay with cash at the time of
                  delivery.
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}

          <aside className="sticky top-24 h-fit rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold">
              Order Summary
            </h2>

            <div className="mb-5 max-h-80 space-y-4 overflow-y-auto pr-1">
              {detailed.map((i) => (
                <div
                  key={i.productId}
                  className="flex items-center gap-4"
                >
                  <img
                    src={i.product.image}
                    alt={i.product.name}
                    className="h-16 w-16 rounded-2xl object-cover border"
                    onError={(e) => {
                      (
                        e.target as HTMLImageElement
                      ).src = "/placeholder.png";
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-semibold">
                      {i.product.name}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Qty: {i.quantity}
                    </div>
                  </div>

                  <div className="font-bold">
                    {inr(i.product.price * i.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal
                </span>

                <span>{inr(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Shipping
                </span>

                <span>
                  {shipping === 0
                    ? "FREE"
                    : inr(shipping)}
                </span>
              </div>

              <div className="flex justify-between border-t border-border pt-4 text-lg font-black">
                <span>Total</span>

                <span>{inr(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting
                ? "Placing Order..."
                : "Place Order"}
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
      <span className="mb-2 block text-sm font-medium text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}