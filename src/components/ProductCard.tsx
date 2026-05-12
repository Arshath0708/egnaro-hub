import { memo } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { inr } from "@/lib/format";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";

export const ProductCard = memo(function ProductCard({
  product,
}: {
  product: any;
  index?: number;
}) {
  const add = useCart((s) => s.add);

  function handleAdd() {
    add(product.id.toString(), 1);

    toast.success("Added to cart", {
      description: product.name,
    });
  }

  const rating = Number(product.average_rating || 0);
  const reviews = Number(product.total_reviews || 0);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.06]">
      
      <Link to={`/product/${product.id}`} className="block">
        
        {/* IMAGE */}
        <div className="relative aspect-square overflow-hidden bg-black/20">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.png";
            }}
          />

          {Number(product.discount) > 0 && (
            <div className="absolute left-3 top-3 rounded-xl bg-[#FF6600] px-3 py-1 text-xs font-bold text-white shadow-lg">
              {product.discount}% OFF
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="space-y-3 p-4">
          
          {/* RATING */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />

              <span className="text-xs font-semibold text-white">
                {rating.toFixed(1)}
              </span>
            </div>

            <span className="text-xs text-gray-400">
              ({reviews} reviews)
            </span>
          </div>

          {/* TITLE */}
          <h3 className="line-clamp-2 min-h-[48px] text-sm font-semibold text-white transition-colors group-hover:text-primary">
            {product.name}
          </h3>

          {/* PRICE */}
          <div className="flex items-end gap-2">
            <span className="text-xl font-black text-white">
              {inr(Number(product.price))}
            </span>

            {Number(product.original_price) >
              Number(product.price) && (
              <span className="pb-0.5 text-sm text-gray-500 line-through">
                {inr(Number(product.original_price))}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* BUTTON */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6600] py-3 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:bg-[#e65c00]"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
});

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] animate-pulse">
      <div className="aspect-square bg-white/10" />

      <div className="space-y-3 p-4">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-5 w-full rounded bg-white/10" />
        <div className="h-5 w-2/3 rounded bg-white/10" />
        <div className="h-8 w-32 rounded bg-white/10" />
      </div>
    </div>
  );
}