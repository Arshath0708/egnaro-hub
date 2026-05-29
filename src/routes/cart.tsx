import { Link } from "react-router-dom";   // ✅ switched to react-router-dom
import { useQuery } from "@tanstack/react-query";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/Section";
import { useCart } from "@/context/cart-store";
import { getProducts } from "@/services/api";
import { inr } from "@/lib/format";

export default function CartPage() {   
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
    staleTime: 1000 * 60 * 5,
  });

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
  const shipping = subtotal > 0 ? (subtotal >= 5000 ? 0 : 99) : 0;
  const total = subtotal + shipping;

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
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
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-3">
              {detailed.map((i) => (
                <div
                  key={i.productId}
                  className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center animate-fadeUp"
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
                        className="font-display font-bold hover:text-[#FF6600] line-clamp-1 text-sm sm:text-base transition-colors text-slate-200"
                      >
                        {i.product.name}
                      </Link>
                      <div className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400 mt-0.5">
                        {i.product.category.replace("-", " ")}
                      </div>
                      <div className="font-mono text-base sm:text-lg font-extrabold mt-2 text-[#FF6600]">
                        {inr(i.product.price)}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4 border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                    <div className="flex items-center glass rounded-lg h-9">
                      <button
                        onClick={() => setQty(i.productId, i.quantity - 1)}
                        className="p-2 hover:text-[#FF6600] cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <div className="w-8 text-center font-mono text-xs font-bold text-slate-200">
                        {i.quantity}
                      </div>
                      <button
                        onClick={() => setQty(i.productId, i.quantity + 1)}
                        className="p-2 hover:text-[#FF6600] cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => remove(i.productId)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="glass-strong rounded-2xl p-6 h-fit shadow-elegant sticky top-24">
              <h3 className="font-display text-xl font-bold mb-4 text-slate-100">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Subtotal</span>
                  <span className="font-mono text-slate-200 font-bold">{inr(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Shipping</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {shipping === 0 ? "FREE" : inr(shipping)}
                  </span>
                </div>
                <div className="border-t border-glass-border my-3" />
                <div className="flex justify-between text-lg">
                  <span className="font-sans font-bold text-slate-200">Total</span>
                  <span className="font-mono text-xl font-black text-gradient">
                    {inr(total)}
                  </span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-glow shimmer"
              >
                Checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Free shipping on orders over ₹5,000
              </p>
            </aside>
          </div>
        )}
      </div>
    </Shell>
  );
}
