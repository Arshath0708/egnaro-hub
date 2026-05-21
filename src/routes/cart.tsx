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
                  className="glass rounded-2xl p-4 flex gap-4 items-center"
                >
                  <img
                    src={i.product.image}
                    alt={i.product.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${i.product.id}`}   // ✅ fixed link syntax
                      className="font-semibold hover:text-primary line-clamp-1"
                    >
                      {i.product.name}
                    </Link>
                    <div className="text-xs text-muted-foreground capitalize mt-0.5">
                      {i.product.category.replace("-", " ")}
                    </div>
                    <div className="font-display font-bold text-lg mt-2">
                      {inr(i.product.price)}
                    </div>
                  </div>
                  <div className="flex items-center glass rounded-lg">
                    <button
                      onClick={() => setQty(i.productId, i.quantity - 1)}
                      className="p-2 hover:text-primary"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-8 text-center text-sm font-semibold">
                      {i.quantity}
                    </div>
                    <button
                      onClick={() => setQty(i.productId, i.quantity + 1)}
                      className="p-2 hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(i.productId)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <aside className="glass-strong rounded-2xl p-6 h-fit shadow-elegant sticky top-24">
              <h3 className="font-display text-xl font-bold mb-4">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{inr(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "FREE" : inr(shipping)}
                  </span>
                </div>
                <div className="border-t border-glass-border my-3" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-display font-bold text-gradient">
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
