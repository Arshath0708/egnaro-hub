import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Inbox,
  Copy,
  Check,
  Calendar,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { inr } from "@/lib/format";
import { useDocumentMetadata } from "@/hooks/useDocumentMetadata";
import { toast } from "sonner";

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

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId") || "";

  useDocumentMetadata("Order Confirmed", "Thank you for shopping on Egnaro Mart. Your order is registered successfully.");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error("Access denied: Order ID is required.");
      navigate("/products");
      return;
    }
    fetch(`https://egnaromart.com/api/get-order.php?order_id=${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        data.success && data.order ? setOrder(data.order) : setFetchError(true);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  const handleCopyOrderId = async (idText: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(idText);
        toast.success("Order ID copied to clipboard!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err) {
        console.warn("navigator.clipboard failed, falling back", err);
      }
    }

    // Fallback
    try {
      const textArea = document.createElement("textarea");
      textArea.value = idText;
      textArea.style.position = "fixed"; // prevent scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        toast.success("Order ID copied to clipboard!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Failed to copy Order ID");
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
      toast.error("Failed to copy Order ID");
    }
  };

  const getEstimatedDeliveryDate = () => {
    const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const paymentBadges: Record<string, string> = {
    cod: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    upi: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    card: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  };

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
        {/* Confetti Particle Burst */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full pointer-events-none z-50"
            style={{
              background: i % 3 === 0 ? "#FF6B00" : i % 3 === 1 ? "#FFB347" : "#fff",
              left: "50%",
              top: "20%",
              willChange: "transform",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
              y: Math.sin((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
              opacity: 0,
              scale: 0.3,
            }}
            transition={{
              duration: 1.0,
              delay: 0.3 + i * 0.04,
              ease: "easeOut",
            }}
          />
        ))}

        {/* 1. ANIMATED SUCCESS HERO */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-8 sm:p-12 text-center mb-8 overflow-hidden shadow-2xl backdrop-blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 70%)",
          }}
        >
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#FF6B00]/5 border border-[#FF6B00]/10"
               style={{
                 boxShadow: "0 0 0 12px rgba(255,107,0,0.04), 0 0 0 24px rgba(255,107,0,0.02)",
               }}
          >
            {/* SVG Checkmark circle draws itself */}
            <svg viewBox="0 0 80 80" className="w-20 h-20">
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#FF6B00"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ willChange: "stroke-dashoffset" }}
              />
              <motion.path
                d="M24 40 L35 51 L56 29"
                fill="none"
                stroke="#FF6B00"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                style={{ willChange: "stroke-dashoffset" }}
              />
            </svg>
          </div>

          <h1 className="font-display font-extrabold tracking-tight text-white mb-3 text-2xl sm:text-3xl md:text-4xl uppercase">
            Order Placed Successfully!
          </h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base mb-6">
            We've received your order and will confirm it shortly.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/25 bg-[#FF6B00]/10 px-5 py-2 font-mono text-sm font-bold text-[#FF6B00] select-all">
            Order Ref: #{orderId}
          </div>
          {order && (
            <p className="mt-4 text-xs font-semibold text-slate-300">
              Thank you, {order.customer_name}! 🎉
            </p>
          )}
        </motion.div>

        {/* 2. ORDER ID DISPLAY CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-3xl border border-[#FF6B00]/20 bg-[#FF6B00]/5 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span className="text-3xl">📦</span>
            <div>
              <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Your Order ID</span>
              <h2 className="font-mono text-xl sm:text-2xl font-black text-[#FF6B00] tracking-tight">
                #{orderId}
              </h2>
              <span className="text-xs text-slate-400">Save this order ID to track status live.</span>
            </div>
          </div>
          <button
            onClick={() => handleCopyOrderId(orderId)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF6B00]/40 px-5 py-3 text-sm font-bold text-slate-200 transition duration-150 cursor-pointer select-none"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#FF6B00]" />
                Copy to Clipboard
              </>
            )}
          </button>
        </motion.div>

        {/* 3. ORDER TIMELINE STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass rounded-3xl p-6 sm:p-8 border border-white/5 bg-slate-950/20 mb-8"
        >
          {/* Desktop Timeline */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between relative px-8">
              {/* Connecting Background Line */}
              <div className="absolute top-[18px] left-[60px] right-[60px] h-0.5 bg-white/10 z-0" />
              {/* Active Line (only goes to step 1 here since order is Placed) */}
              <div className="absolute top-[18px] left-[60px] w-0 h-0.5 bg-[#FF6B00] z-10" />

              {/* Step 1: Placed */}
              <div className="flex flex-col items-center z-20">
                <div className="h-10 w-10 rounded-full bg-[#FF6B00] border-4 border-slate-950 flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <span className="mt-2 text-xs font-bold text-[#FF6B00] tracking-wider uppercase">Placed</span>
              </div>

              {/* Step 2: Confirmed */}
              <div className="flex flex-col items-center z-20">
                <div className="h-10 w-10 rounded-full bg-slate-900 border-2 border-white/15 flex items-center justify-center">
                  <span className="h-3.5 w-3.5 rounded-full bg-white/10" />
                </div>
                <span className="mt-2 text-xs font-semibold text-[#475569] tracking-wider uppercase">Confirmed</span>
              </div>

              {/* Step 3: Packed */}
              <div className="flex flex-col items-center z-20">
                <div className="h-10 w-10 rounded-full bg-slate-900 border-2 border-white/15 flex items-center justify-center">
                  <span className="h-3.5 w-3.5 rounded-full bg-white/10" />
                </div>
                <span className="mt-2 text-xs font-semibold text-[#475569] tracking-wider uppercase">Packed</span>
              </div>

              {/* Step 4: Delivered */}
              <div className="flex flex-col items-center z-20">
                <div className="h-10 w-10 rounded-full bg-slate-900 border-2 border-white/15 flex items-center justify-center">
                  <span className="h-3.5 w-3.5 rounded-full bg-white/10" />
                </div>
                <span className="mt-2 text-xs font-semibold text-[#475569] tracking-wider uppercase">Delivered</span>
              </div>
            </div>
          </div>

          {/* Mobile Vertical Timeline */}
          <div className="md:hidden space-y-6">
            <div className="relative pl-6 border-l-2 border-white/10 space-y-6">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0.5 h-6 w-6 rounded-full bg-[#FF6B00] flex items-center justify-center shadow-md shadow-[#FF6B00]/20">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#FF6B00] uppercase tracking-wider">Order Placed</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Order registered and awaiting merchant confirmation.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative opacity-60">
                <div className="absolute -left-[35px] top-0.5 h-6 w-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Confirmed</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Seller accepts and allocates stock.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative opacity-60">
                <div className="absolute -left-[35px] top-0.5 h-6 w-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Packed & Dispatched</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Carefully wrapped and handed over to delivery partners.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative opacity-60">
                <div className="absolute -left-[35px] top-0.5 h-6 w-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Delivered</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Handed over to the buyer.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. DETAILS SECTION */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
            <span className="text-xs font-bold tracking-wider uppercase">Loading Invoice Details...</span>
          </div>
        )}

        {!loading && fetchError && (
          <div className="rounded-3xl border border-[#FF6B00]/25 bg-[#FF6B00]/5 p-6 text-center text-[#FF6B00] mb-8 font-semibold flex items-center justify-center gap-3">
            <ShieldAlert className="h-6 w-6" />
            <span>Could not fetch live invoice details, but your order is safe! Use the details below.</span>
          </div>
        )}

        {!loading && order && (
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 mb-8">
            {/* LEFT PANEL: Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-3xl p-6 border border-white/5 bg-white/2 space-y-6 shadow-sm"
            >
              <h3 className="font-display text-lg font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2.5 pb-3 border-b border-white/5">
                <Inbox className="h-5 w-5 text-[#FF6B00]" /> Order Items
              </h3>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl object-cover border border-white/5 flex-shrink-0"
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
                  <p className="text-sm text-slate-500">No items in this order.</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-white/5 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{inr(Number(order.total) - (Number(order.total) >= 5000 ? 0 : 99))}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Number(order.total) >= 5000 ? "FREE" : inr(99)}
                  </span>
                </div>
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                  <span className="text-base font-extrabold text-slate-200">Total Amount Paid</span>
                  <span className="font-mono text-xl font-black text-[#FF6B00]">{inr(Number(order.total))}</span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT PANEL: Delivery Details */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-3xl p-6 border border-white/5 bg-white/2 space-y-5 shadow-sm"
            >
              <h3 className="font-display text-lg font-extrabold text-slate-200 uppercase tracking-wider pb-3 border-b border-white/5">
                Delivery Details
              </h3>

              <div className="space-y-4">
                {/* Customer name */}
                <div className="flex items-start gap-3.5">
                  <span className="text-lg mt-0.5">👤</span>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Customer Name</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{order.customer_name}</p>
                  </div>
                </div>

                {/* Contact phone */}
                <div className="flex items-start gap-3.5">
                  <span className="text-lg mt-0.5">📞</span>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Phone Number</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{order.phone}</p>
                  </div>
                </div>

                {/* Shipping address */}
                <div className="flex items-start gap-3.5">
                  <span className="text-lg mt-0.5">📍</span>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Delivery Address</span>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium mt-0.5">{order.address}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-start gap-3.5">
                  <span className="text-lg mt-0.5">💳</span>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Payment Method</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${paymentBadges[order.payment_method?.toLowerCase()] || "bg-slate-800 text-slate-400"}`}>
                        {order.payment_method || "COD"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estimated Delivery */}
                <div className="flex items-start gap-3.5">
                  <span className="text-lg mt-0.5">🚚</span>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Estimated Delivery</span>
                    <p className="text-sm font-bold text-[#FF6B00] mt-0.5">{getEstimatedDeliveryDate()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. WHAT HAPPENS NEXT SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10"
        >
          <h3 className="text-center font-display text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
            What Happens Next
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "✉️",
                title: "Confirmation Email",
                desc: "We'll send you an email with details and receipt.",
              },
              {
                icon: "📦",
                title: "Order Packed",
                desc: "Your items are carefully packed and safety checked.",
              },
              {
                icon: "🚚",
                title: "Out for Delivery",
                desc: "Track in real-time with your order ID.",
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/5 bg-white/2 p-5 text-center transition-all hover:border-[#FF6B00]/30"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00]/10 text-lg">
                  {card.icon}
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">{card.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 6. ACTION BUTTONS - pinned above footer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6 pt-6 border-t border-white/5"
        >
          <Link
            to={`/track-order?id=${orderId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF6B00] to-[#CC5500] hover:shadow-glow text-white font-display font-bold text-sm tracking-wider uppercase h-[52px] px-8 rounded-xl transition-all cursor-pointer select-none"
          >
            <Truck className="h-4.5 w-4.5" />
            Track My Order
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border border-white/10 hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/5 text-slate-200 font-display font-bold text-sm tracking-wider uppercase h-[52px] px-8 rounded-xl transition-all cursor-pointer select-none"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    </Shell>
  );
}
