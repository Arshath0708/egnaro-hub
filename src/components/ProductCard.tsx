import { memo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { inr } from "@/lib/format";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";
import { handleImageError } from "@/lib/utils";

export const ProductCard = memo(function ProductCard({
  product,
}: {
  product: any;
  index?: number;
}) {
  const add = useCart((s) => s.add);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const added = add(product.id.toString(), 1, Number(product.vendor_id || 0), product.name);

    if (added) {
      toast.success("Added to cart", {
        description: product.name,
        icon: <ShoppingCart className="h-4 w-4" />,
      });
    }
  }

  const rating = Number(product.average_rating || 0);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transform-gpu transition-all duration-300 will-change-transform hover:-translate-y-1 hover:border-primary/45 hover:bg-white/[0.07] hover:shadow-glow">
      
      <Link to={`/product/${product.id}`} className="flex flex-1 flex-col">
        
        {/* IMAGE SECTION */}
        <div className="relative aspect-square overflow-hidden bg-black/40 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transform-gpu transition-transform duration-500 will-change-transform group-hover:scale-103"
            onError={handleImageError}
          />

          {/* BADGES */}
          <div className="absolute inset-2 flex justify-between items-start pointer-events-none">
            {Number(product.discount) > 0 ? (
              <div className="rounded bg-primary/90 border border-primary/20 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.05em] text-primary-foreground shadow backdrop-blur-sm">
                {product.discount}% OFF
              </div>
            ) : <div />}

            {product.is_new && (
              <div className="rounded bg-emerald-600/90 border border-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.05em] text-white shadow backdrop-blur-sm">
                NEW
              </div>
            )}
          </div>

          {/* RATING OVERLAY ON IMAGE BOTTOM-LEFT */}
          {rating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm pointer-events-none border border-white/5">
              <svg className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-mono text-[9px] font-bold text-yellow-500">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* CONTENT SECTION */}
        <div className="flex flex-1 flex-col p-3">
          
          {/* COMPACT METADATA STRIP */}
          <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {product.vendor_company && (
              <span className="text-emerald-400 truncate max-w-[80px]" title={product.vendor_company}>
                {product.vendor_company}
              </span>
            )}
            {product.vendor_company && <span>•</span>}
            <span className="truncate" title={product.subcategory || product.category}>
              {product.subcategory || product.category || "General"}
            </span>
          </div>

          {/* PRODUCT NAME (2-LINE CLAMPED WITH FIXED MIN HEIGHT FOR ALIGNMENT) */}
          <h3 className="line-clamp-2 font-display text-xs font-bold leading-snug text-slate-200 transition-colors group-hover:text-primary min-h-[2rem]">
            {product.name}
          </h3>

          {/* PRICE SECTION */}
          <div className="mt-2 mb-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-mono">
            <span className="price-hover text-sm font-extrabold tracking-tight text-primary">
              {inr(Number(product.price))}
            </span>
            {Number(product.original_price) > Number(product.price) && (
              <span className="text-[10px] text-slate-500 line-through">
                {inr(Number(product.original_price))}
              </span>
            )}
          </div>

          {/* ADD TO CART ACTION BUTTON (FULL-WIDTH MARKETPLACE STYLE) */}
          <div className="mt-auto pt-1">
            <button
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground shadow transition-all duration-200 active:scale-[0.98] hover:bg-primary-hover cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
});

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse">
      <div className="aspect-square bg-white/5" />

      <div className="flex flex-1 flex-col p-3 space-y-2.5">
        <div className="h-3 w-16 rounded bg-white/5" />
        
        <div className="space-y-1">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-3/4 rounded bg-white/5" />
        </div>

        <div className="mt-auto pt-2 flex flex-col gap-2">
          <div className="h-5 w-16 rounded bg-white/5" />
          <div className="h-8 w-full rounded-lg bg-white/5 shrink-0" />
        </div>
      </div>
    </div>
  );
}