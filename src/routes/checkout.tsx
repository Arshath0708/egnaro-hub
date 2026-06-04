import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, useEffect } from "react";

import {
  CreditCard,
  Smartphone,
  Wallet,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { useCart } from "@/context/cart-store";
import { useAuth, selectIsLoggedIn } from "@/context/auth-store";
import { getProducts, getUser, manageAddress } from "@/services/api";
import { validateName, validateEmail, validatePhone, validatePincode, sanitizeInput } from "@/lib/validation";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { clearUserSession } from "@/lib/session";

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
  const location = useLocation();
  const queryClient = useQueryClient();

  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const isLoggedIn = useAuth(selectIsLoggedIn);
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);

  const [submitting, setSubmitting] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);

  const [payment, setPayment] = useState<
    "cod" | "upi" | "card"
  >("upi");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // AUTH PROTECTION
  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Please login to place your order");
      nav(`/login?redirect=${location.pathname}`);
    } else if (user) {
      // PRE-FILL FORM
      setForm(prev => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      }));
    }
  }, [isLoggedIn, nav, location.pathname, user]);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userData } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => getUser(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const userProfile = userData?.user;
  const addresses = userProfile?.addresses || [];

  // Expiration check
  useEffect(() => {
    if (userData?.message === "Invalid or expired token") {
      clearUserSession(queryClient);
      toast.error("Your session has expired. Please log in again.");
    }
  }, [userData, queryClient]);

  const [addressPrefilled, setAddressPrefilled] = useState(false);

  useEffect(() => {
    if (userProfile && !addressPrefilled) {
      setForm(prev => {
        const next = {
          ...prev,
          fullName: userProfile.fullName || prev.fullName,
          phone: userProfile.phone || prev.phone,
          email: userProfile.email || prev.email,
        };

        if (addresses.length > 0) {
          const defaultAddr = addresses[userProfile.default_address_index || 0];
          if (defaultAddr) {
            next.address = defaultAddr.street || "";
            next.city = defaultAddr.city || "";
            next.state = defaultAddr.state || "";
            next.pincode = defaultAddr.pincode || "";
          }
        }

        return next;
      });
      setAddressPrefilled(true);
    }
  }, [userProfile, addressPrefilled, addresses]);

  const handleSelectAddress = (addr: any) => {
    setForm(prev => ({
      ...prev,
      address: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
    }));
  };

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

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(
    () => localStorage.getItem("egnaro_coupon") || null
  );

  const subtotal = detailed.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0
  );

  const discountAmount = appliedCoupon === "EGNARO10" ? subtotal * 0.10 : 0;

  const shipping = subtotal >= 5000 ? 0 : 99;

  const total = subtotal - discountAmount + shipping;

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

    if (!isLoggedIn || !token) {
      toast.error("Session expired. Please login again.");
      nav(`/login?redirect=${location.pathname}`);
      return;
    }

    const cleanName = sanitizeInput(form.fullName);
    const cleanEmail = sanitizeInput(form.email);
    const cleanAddress = sanitizeInput(form.address);
    const cleanCity = sanitizeInput(form.city);
    const cleanState = sanitizeInput(form.state);
    const cleanNotes = sanitizeInput(form.notes);

    if (!validateName(cleanName)) { toast.error("Valid full name required"); return; }
    if (!validateEmail(cleanEmail)) { toast.error("Valid email required"); return; }
    if (!validatePhone(form.phone)) { toast.error("Valid 10-digit phone number required"); return; }
    if (!validatePincode(form.pincode)) { toast.error("Valid 6-digit pincode required"); return; }

    if (submitting) return;

    setSubmitting(true);

    try {
      const firstProduct = detailed[0]?.product;
      const vendorId = firstProduct?.vendor_id || firstProduct?.created_by_id || 0;

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
            customer_name: cleanName,
            phone: form.phone,
            email: cleanEmail,
            address: `${cleanAddress}, ${cleanCity}, ${cleanState} - ${form.pincode}`,
            total,
            payment_method: payment,
            order_items: orderItems,
            items: orderItems,
            notes: cleanNotes,
            gst: form.gst,
            user_id: user?.id,
            vendor_id: Number(vendorId)
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Order placed successfully 🎉");

        if (saveAddress && isLoggedIn && token) {
          try {
            await manageAddress(token, "add", {
              label: "Saved from Checkout",
              street: cleanAddress,
              city: cleanCity,
              state: cleanState,
              pincode: form.pincode
            });
          } catch (e) {
            console.error("Failed to save address", e);
          }
        }

        // Remove queries so that the statistics and order list fetch fresh and show loading state
        queryClient.removeQueries({ queryKey: ["user-orders-list"] });
        queryClient.removeQueries({ queryKey: ["userOrders"] });
        queryClient.removeQueries({ queryKey: ["user-profile"] });
        queryClient.removeQueries({ queryKey: ["userProfile"] });

        localStorage.removeItem("egnaro_coupon");
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
          className="grid gap-12 lg:grid-cols-[1fr_400px]"
        >
          <fieldset disabled={submitting} className="space-y-12 border-none p-0 m-0 min-w-0">
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

              {addresses.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-bold text-muted-foreground">Saved Addresses</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((addr: any, idx: number) => {
                      const isSelected = form.address === addr.street && form.pincode === addr.pincode;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectAddress(addr)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                        >
                          <div className="mb-1 font-bold">{addr.label}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
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
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) =>
                      setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
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

                {isLoggedIn && (
                  <div className="sm:col-span-2 mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="saveAddress" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                      Save this address to my account for future orders
                    </label>
                  </div>
                )}
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
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${payment === p.id
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
                        One Click UPI Payment
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

                      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                        <a
                          href={upiLink}
                          className="w-full sm:w-auto text-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover hover:shadow-glow cursor-pointer"
                        >
                          Pay with Any UPI App
                        </a>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 cursor-pointer"
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
          </fieldset>

          {/* RIGHT COL: SUMMARY */}

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

              {appliedCoupon && (
                <div className="flex justify-between text-green-400">
                  <span className="text-muted-foreground text-green-400">
                    Coupon Discount (10%)
                  </span>

                  <span className="font-bold">-{inr(discountAmount)}</span>
                </div>
              )}

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