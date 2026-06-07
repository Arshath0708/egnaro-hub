import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Sparkles, X, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/Section";
import { useCart } from "@/context/cart-store";
import { getProducts } from "@/services/api";
import { inr } from "@/lib/format";
import { sanitizeInput } from "@/lib/validation";
import { queryKeys } from "@/lib/query-keys";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const { data: products = [] } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => getProducts(),
    staleTime: 1000 * 60 * 5,
  });

  // Coupon state synced with localStorage for checkout flow coherence
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(
    () => localStorage.getItem("egnaro_coupon") || null
  );
  const [couponError, setCouponError] = useState("");

  const detailed = items
    .map((i) => {
      const p = products.find((x: any) => x.id === i.productId);
      return p ? { ...i, product: p } : null;
    })
    .filter(Boolean) as Array<{
      productId: string;
      quantity: number;
      product: any;
    }>;

  const subtotal = detailed.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0
  );

  // Dynamic Coupon Discount (10% off for EGNARO10)
  const discountAmount = appliedCoupon === "EGNARO10" ? subtotal * 0.10 : 0;

  // Free shipping over ₹5000
  const shipping = subtotal > 0 ? (subtotal >= 5000 ? 0 : 99) : 0;
  const total = subtotal - discountAmount + shipping;

  const progressPercent = Math.min((subtotal / 5000) * 100, 100);
  const neededForFreeShipping = 5000 - subtotal;

  const handleRemove = (productId: string, qty: number, name: string) => {
    remove(productId);
    toast.success(`Removed ${name} from cart`, {
      action: {
        label: "Undo",
        onClick: () => {
          setQty(productId, qty);
          toast.success(`Restored ${name} to cart`);
        },
      },
    });
  };

  const handleSetQty = (productId: string, currentQty: number, newQty: number, name: string) => {
    if (newQty <= 0) {
      handleRemove(productId, currentQty, name);
    } else {
      setQty(productId, newQty);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCoupon = sanitizeInput(couponCode).toUpperCase();
    if (cleanCoupon === "EGNARO10") {
      setAppliedCoupon("EGNARO10");
      localStorage.setItem("egnaro_coupon", "EGNARO10");
      setCouponError("");
      toast.success("Coupon EGNARO10 applied successfully! 10% discount added.");
    } else {
      setCouponError("Invalid coupon code");
      toast.error("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem("egnaro_coupon");
    setCouponCode("");
    toast.success("Coupon code removed.");
  };

  // Cross-selling recommendations (exclude items already in the cart and unapproved products)
  const crossSellProducts = products
    .filter((p: any) => 
      !items.some((i) => i.productId === p.id) &&
      p.status !== "rejected" &&
      p.status !== "deleted" &&
      (p.approved === true || Number(p.approved) === 1 || p.status === "approved")
    )
    .slice(0, 4);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pb-28 sm:pb-24 lg:pb-10">
        <h1 className="font-display text-4xl font-bold mb-8">Your Cart</h1>
        {detailed.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Discover premium products and add your favorites."
            action={
              <Link
                to="/products"
                className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold"
              >
                <ShoppingBag className="h-4 w-4" /> Start Shopping
              </Link>
            }
          />
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-4">
              {/* Free Shipping Tracker */}
              <div className="glass rounded-2xl p-5 border border-white/5 bg-slate-900/40">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-300">
                    {subtotal >= 5000 ? (
                      <span className="text-green-400 font-extrabold flex items-center gap-1.5">
                        🎉 Your order qualifies for FREE shipping!
                      </span>
                    ) : (
                      <span>
                        Add <span className="text-primary font-black">{inr(neededForFreeShipping)}</span> more for <span className="font-extrabold text-white">FREE Shipping</span>
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Goal: {inr(5000)}
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {detailed.map((i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -15 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      key={i.productId}
                      className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center border border-white/5 bg-slate-950/20"
                    >
                      <div className="flex gap-4 w-full min-w-0">
                        <img
                          src={i.product.image}
                          alt={i.product.name}
                          className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover flex-shrink-0 border border-white/5"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${i.product.id}`}
                            className="font-display font-bold hover:text-primary line-clamp-1 text-sm sm:text-base transition-colors text-slate-200"
                          >
                            {i.product.name}
                          </Link>
                          <div className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400 mt-0.5">
                            {i.product.category.replace("-", " ")}
                          </div>
                          <div className="font-mono text-base sm:text-lg font-extrabold mt-2 text-primary">
                            {inr(i.product.price)}
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4 border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                        <div className="flex items-center glass rounded-lg h-9">
                          <button
                            onClick={() => handleSetQty(i.productId, i.quantity, i.quantity - 1, i.product.name)}
                            className="p-2 hover:text-primary cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <div className="w-8 text-center font-mono text-xs font-bold text-slate-200">
                            {i.quantity}
                          </div>
                          <button
                            onClick={() => handleSetQty(i.productId, i.quantity, i.quantity + 1, i.product.name)}
                            className="p-2 hover:text-primary cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(i.productId, i.quantity, i.product.name)}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Cross-selling related products section */}
              {crossSellProducts.length > 0 && (
                <div className="mt-12 bg-white/[0.01] border border-white/5 rounded-3xl p-6">
                  <h3 className="font-display text-lg font-black mb-5 text-slate-100 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" /> Frequently Bought Together
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {crossSellProducts.map((p: any) => (
                      <div key={p.id} className="glass rounded-2xl p-3 flex flex-col justify-between hover:border-slate-800 transition-colors bg-slate-950/30">
                        <div>
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-24 w-full object-cover rounded-xl border border-white/5 mb-3"
                          />
                          <h4 className="font-bold text-xs text-slate-200 line-clamp-1 hover:text-primary transition-colors">
                            <Link to={`/product/${p.id}`}>{p.name}</Link>
                          </h4>
                          <p className="font-mono text-xs text-primary font-black mt-1">{inr(p.price)}</p>
                        </div>
                        <button
                          onClick={() => {
                            useCart.getState().add(p.id, 1);
                            toast.success(`${p.name} added to cart!`);
                          }}
                          className="mt-3.5 w-full py-2 bg-white/5 hover:bg-primary text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              {/* Order Summary card */}
              <div className="glass-strong rounded-2xl p-6 shadow-elegant sticky top-24 border border-white/5 bg-slate-900/60">
                <h3 className="font-display text-xl font-bold mb-4 text-slate-100">
                  Order Summary
                </h3>
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Subtotal</span>
                    <span className="font-mono text-slate-200 font-bold">{inr(subtotal)}</span>
                  </div>

                  {/* Applied Coupon Display */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-400">
                      <span className="font-sans flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" /> Coupon Discount (10%)
                      </span>
                      <span className="font-mono font-bold">-{inr(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Shipping</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {shipping === 0 ? "FREE" : inr(shipping)}
                    </span>
                  </div>
                  <div className="border-t border-white/5 my-3" />
                  <div className="flex justify-between text-lg">
                    <span className="font-sans font-bold text-slate-200">Total</span>
                    <span className="font-mono text-xl font-black text-primary">
                      {inr(total)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-glow shimmer cursor-pointer select-none"
                >
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Free shipping on orders over ₹5,000
                </p>
              </div>

              {/* Coupon Codes card */}
              <div className="glass rounded-2xl p-5 border border-white/5 bg-slate-900/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-primary" /> Promotion / Coupon Code
                </h4>
                {appliedCoupon ? (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-green-400">{appliedCoupon}</span>
                      <span className="block text-[10px] text-slate-500">10% discount applied</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <fieldset disabled={false} className="flex gap-2 w-full border-none p-0 m-0 min-w-0">
                    <input
                      type="text"
                      placeholder="e.g. EGNARO10"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""));
                        setCouponError("");
                      }}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white uppercase outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-white/5 hover:bg-primary text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                  </fieldset>
                </form>
              )}
              {couponError && <p className="text-[10px] text-red-400 mt-2 font-bold">{couponError}</p>}
              {!appliedCoupon && (
                <div className="mt-3.5 p-2.5 rounded-xl border border-primary/10 bg-primary/5 text-[10px] text-slate-400 leading-relaxed">
                  💡 Try using <span className="font-extrabold text-primary">EGNARO10</span> for a 10% flat discount on subtotal!
                </div>
              )}
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {detailed.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#070b19]/90 border-t border-white/10 backdrop-blur-lg px-6 py-4 flex items-center justify-between z-40 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Amount</span>
            <span className="text-lg font-black text-primary font-mono">{inr(total)}</span>
          </div>
          <Link
            to="/checkout"
            className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-glow flex items-center gap-1.5"
          >
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Shell>
  );
}
