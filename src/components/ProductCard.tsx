import { memo } from "react";
import { Link } from "react-router-dom";   // ✅ switched to react-router-dom
import { Star, ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { inr } from "@/lib/format";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";

// memo: only re-renders if product prop or index changes
export const ProductCard = memo(function ProductCard({
  product,
}: {
  product: Product;
  index?: number; // kept for API compat, no longer used for animation delay
}) {
  // Stable selector — only subscribes to add action, never re-renders from cart count changes
  const add = useCart((s) => s.add);

  function handleAdd() {
    add(product.id);
    toast.success("Added to cart", { description: product.name });
  }

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/30 transition-colors">
      <Link to={`/product/${product.id}`} className="block">   {/* ✅ updated link syntax */}
        <div className="aspect-square overflow-hidden bg-muted relative">
          {/* No loading="lazy" — product images are primary content, not decorative */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.png";
            }}
          />
          {product.discount > 0 && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold bg-primary text-primary-foreground">
              {product.discount}% OFF
            </div>
          )}
          {!product.approved && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-semibold bg-yellow-500/20 text-yellow-600 border border-yellow-500/40">
              Pending
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="font-medium text-foreground">
              {product.rating || "—"}
            </span>
            <span>({product.reviews})</span>
          </div>
          <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-end gap-2">
            <span className="font-bold text-lg">{inr(product.price)}</span>
            {product.original > product.price && (
              <span className="text-xs text-muted-foreground line-through pb-0.5">
                {inr(product.original)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
        >
          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
        </button>
      </div>
    </div>
  );
});

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded mt-2" />
      </div>
    </div>
  );
}
