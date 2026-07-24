import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, useEffect } from "react";

import {
  CreditCard,
  Wallet,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  User,
  AlertCircle
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { useCart } from "@/context/cart-store";
import { useAuth, selectIsLoggedIn } from "@/context/auth-store";
import { getProducts, getUser, manageAddress } from "@/services/api";
import { validateName, validateEmail, validatePhone, validatePincode, sanitizeInput } from "@/lib/validation";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { clearUserSession } from "@/lib/session";
import { queryKeys, QUERY_KEYS } from "@/lib/query-keys";
import { useDocumentMetadata } from "@/hooks/useDocumentMetadata";
import { handleImageError } from "@/lib/utils";
import { PAYMENT_CONFIG } from "@/config/payment";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);

  const [payment, setPayment] = useState<
    "cod" | "razorpay"
  >("razorpay");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useDocumentMetadata("Secure Checkout", "Provide your shipping address and choose your payment method to complete the checkout process on Egnaro Mart.");

  // AUTH & CART PROTECTION
  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Please login to place your order");
      nav(`/login?redirect=${location.pathname}`);
      return;
    }
    if (orderPlaced) {
      return;
    }
    if (items.length === 0 && !submitting) {
      toast.error("Your cart is empty");
      nav("/cart");
      return;
    }
    if (user) {
      // PRE-FILL FORM
      setForm(prev => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      }));
    }
  }, [isLoggedIn, items.length, nav, location.pathname, user, submitting, orderPlaced]);

  const { data: products = [] } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userData } = useQuery({
    queryKey: queryKeys.userProfile(token!),
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

  if (items.length === 0 && !orderPlaced) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="rounded-3xl border border-border bg-card p-10">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
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

      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(
        `${apiBase}/create-order.php`,
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
            city: cleanCity,
            state: cleanState,
            pincode: form.pincode,
            total,
            payment_method: payment,
            payment_reference: null,
            order_items: orderItems,
            items: orderItems,
            notes: cleanNotes,
            gst: form.gst,
            user_id: user?.id,
            vendor_id: Number(vendorId),
            buyer_gst: userProfile?.gst_number || user?.gst_number || null
          }),
        }
      );

      const data = await res.json();

      if (data.success && data.order_id) {
        if (payment === "razorpay") {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            toast.error("Failed to load Razorpay payment script. Please check your internet connection.");
            setSubmitting(false);
            return;
          }

          const options = {
            key: data.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.amount,
            currency: data.currency || "INR",
            name: "Egnaro Mart",
            description: `Payment for Order ${data.order_id}`,
            order_id: data.razorpay_order_id,
            handler: async function (response: any) {
              try {
                setSubmitting(true);
                const verifyRes = await fetch(`${apiBase}/verify-payment.php`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    order_id: data.order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });

                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  toast.success("Payment verified successfully! 🎉");
                  setOrderPlaced(true);

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

                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_ORDERS] });
                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_ORDERS] });
                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_STATS] });
                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_ORDERS] });
                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });

                  localStorage.removeItem("egnaro_coupon");
                  await nav(`/order-success?orderId=${data.order_id}`);
                  clear();
                } else {
                  toast.error(verifyData.message || "Payment verification failed.");
                }
              } catch (verifyErr) {
                console.error("Verification error:", verifyErr);
                toast.error("Network error during payment verification. Please contact support.");
              } finally {
                setSubmitting(false);
              }
            },
            prefill: {
              name: cleanName,
              email: cleanEmail,
              contact: form.phone,
            },
            theme: {
              color: "#F59E0B",
            },
            modal: {
              ondismiss: function () {
                toast.error("Payment cancelled by user.");
                setSubmitting(false);
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on("payment.failed", function (response: any) {
            toast.error(response.error.description || "Payment failed");
            setSubmitting(false);
          });
          rzp.open();
          return;
        }

        // ✅ STEP 1: Mark order as placed FIRST (disables cart-empty guard)
        setOrderPlaced(true);
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

        // Invalidate queries so that the statistics and order list fetch fresh and show loading state
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_ORDERS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_ORDERS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_STATS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_ORDERS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });

        localStorage.removeItem("egnaro_coupon");

        // ✅ STEP 2: Navigate BEFORE clearing cart
        await nav(`/order-success?orderId=${data.order_id}`);

        // ✅ STEP 3: Clear cart AFTER navigation
        clear();
      } else {
        toast.error(data.message || "Order failed. Please try again.");
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-8">
        {/* Header with secure checkout badge */}
        <div className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Checkout
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Verify your details and choose your payment method to complete the transaction.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80 bg-secondary/30 px-3.5 py-2 rounded-full border border-border w-fit">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>256-bit Secure Checkout</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <fieldset disabled={submitting} className="lg:col-span-8 space-y-8 border-none p-0 m-0 min-w-0">
            {/* 1. Customer Details */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">1. Contact Information</h2>
                  <p className="text-xs text-muted-foreground">We'll send order updates to these contact details</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name *">
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    className={inputCls}
                    placeholder="E.g., John Doe"
                  />
                </Field>

                <Field label="Phone Number *">
                  <input
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputCls}
                    placeholder="10-digit mobile number"
                  />
                </Field>

                <Field label="Email Address *" full>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={inputCls}
                    placeholder="john@example.com"
                  />
                </Field>
              </div>
            </section>

            {/* 2. Shipping Address */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">2. Shipping Address</h2>
                  <p className="text-xs text-muted-foreground">Select a saved address or enter a new one</p>
                </div>
              </div>

              {addresses.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Saved Addresses</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((addr: any, idx: number) => {
                      const isSelected = form.address === addr.street && form.pincode === addr.pincode;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectAddress(addr)}
                          className={`text-left cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50 bg-secondary/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-foreground">{addr.label}</span>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Street Address *" full>
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    className={inputCls}
                    placeholder="Flat / House No. / Building Name / Street"
                  />
                </Field>

                <Field label="Pincode *">
                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={inputCls}
                    placeholder="6-digit pincode"
                  />
                </Field>

                <Field label="City *">
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className={inputCls}
                    placeholder="City"
                  />
                </Field>

                <Field label="State *">
                  <input
                    required
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    className={inputCls}
                    placeholder="State"
                  />
                </Field>

                <Field label="GST Number (Optional)">
                  <input
                    value={form.gst}
                    onChange={(e) => setField("gst", e.target.value)}
                    className={inputCls}
                    placeholder="Business GST (If applicable)"
                  />
                </Field>

                <Field label="Order Notes (Optional)" full>
                  <input
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    className={inputCls}
                    placeholder="Eg., Leave with guard, ring bell, etc."
                  />
                </Field>

                {isLoggedIn && (
                  <div className="sm:col-span-2 mt-2 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <label htmlFor="saveAddress" className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                      Save this address to my account for future orders
                    </label>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Delivery Summary (Review Items) */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">3. Review Items</h2>
                  <p className="text-xs text-muted-foreground">Verify items in your cart before purchasing</p>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {detailed.map((i) => (
                  <div key={i.productId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-16 w-16 rounded-xl overflow-hidden border border-border/40 bg-secondary/5 shrink-0">
                        <img
                          src={i.product.image}
                          alt={i.product.name}
                          className="h-full w-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground line-clamp-1 leading-snug">{i.product.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Quantity: <span className="font-semibold text-foreground">{i.quantity}</span></p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-sm text-foreground">{inr(i.product.price * i.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Payment Method */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">4. Payment Method</h2>
                  <p className="text-xs text-muted-foreground">Choose your payment mode</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Razorpay Option */}
                <button
                  type="button"
                  onClick={() => setPayment("razorpay")}
                  className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200 focus:outline-none ${
                    payment === "razorpay"
                      ? "border-primary bg-primary/5 shadow-inner"
                      : "border-border hover:border-primary/30 hover:bg-secondary/5"
                  }`}
                >
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/50 text-primary shrink-0">
                    {payment === "razorpay" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      Online Payment <span className="text-[10px] bg-primary/20 text-primary font-black px-1.5 py-0.5 rounded uppercase">Recommended</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Credit/Debit Card, Netbanking, UPI, and wallets powered securely by Razorpay.
                    </p>
                  </div>
                </button>

                {/* COD Option */}
                <button
                  type="button"
                  onClick={() => setPayment("cod")}
                  className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200 focus:outline-none ${
                    payment === "cod"
                      ? "border-primary bg-primary/5 shadow-inner"
                      : "border-border hover:border-primary/30 hover:bg-secondary/5"
                  }`}
                >
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/50 text-primary shrink-0">
                    {payment === "cod" && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Cash on Delivery</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Pay with cash directly to the courier agent when your order gets delivered.
                    </p>
                  </div>
                </button>
              </div>
            </section>
          </fieldset>

          {/* Right Column: Sticky Order Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 font-display">Order Summary</h2>

              <div className="space-y-3.5 text-sm pb-4 border-b border-border/80">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{inr(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-500 font-medium">
                    <span>Coupon (10% Off)</span>
                    <span>-{inr(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-foreground">
                    {shipping === 0 ? <span className="text-green-500 font-semibold uppercase text-xs tracking-wider">Free</span> : inr(shipping)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4 text-base font-bold">
                <span className="text-foreground">Total Amount</span>
                <span className="text-lg text-primary tracking-wide">{inr(total)}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground text-sm tracking-wide shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full inline-block" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-primary-foreground/90" />
                    <span>{payment === "razorpay" ? "Proceed to Payment" : "Place Order (COD)"}</span>
                  </>
                )}
              </button>

              {/* Secure Trust badging */}
              <div className="mt-6 pt-5 border-t border-border/80 space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                  <span>Secure checkout process verified by industry standards</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary shrink-0" />
                  <span>Encrypted SSL certificate secures credentials</span>
                </div>
              </div>
            </div>
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