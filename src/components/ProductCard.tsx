import { memo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
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

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    add(product.id.toString(), 1);

    toast.success("Added to cart", {
      description: product.name,
      icon: <ShoppingCart className="h-4 w-4" />,
    });
  }

  const rating = Number(product.average_rating || 0);
  const reviews = Number(product.total_reviews || 0);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] border border-white/10 bg-white/[0.03] transform-gpu transition-[transform,border-color,background-color] duration-300 will-change-transform hover:-translate-y-1.5 hover:border-primary/40 hover:bg-white/[0.08] hover:shadow-glow">
      
      <Link to={`/product/${product.id}`} className="flex flex-1 flex-col">
        
        {/* IMAGE SECTION */}
        <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transform-gpu transition-transform duration-700 will-change-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.png";
            }}
          />

          {/* BADGES */}
          <div className="absolute inset-x-2 top-2 sm:inset-x-3 sm:top-3 flex justify-between items-start">
            {Number(product.discount) > 0 ? (
              <div className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 sm:px-3.5 sm:py-1 font-mono text-[9px] sm:text-[0.68rem] font-black uppercase tracking-[0.1em] text-primary shadow-lg backdrop-blur-md">
                {product.discount}% OFF
              </div>
            ) : <div />}

            {product.is_new && (
              <div className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 sm:px-3.5 sm:py-1 font-mono text-[9px] sm:text-[0.68rem] font-black uppercase tracking-[0.1em] text-emerald-400 shadow-lg backdrop-blur-md">
                NEW
              </div>
            )}
          </div>

          {/* QUICK VIEW OVERLAY */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black shadow-xl transform translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
              View Product
            </span>
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="flex flex-1 flex-col p-2.5 sm:p-5">
          
          {/* RATING & CATEGORY */}
          <div className="mb-2 sm:mb-3 flex items-center justify-between">
             <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 sm:px-2 sm:py-0.5">
                <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-500 text-yellow-500 drop-shadow-[0_2px_4px_rgba(234,179,8,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-mono text-[9px] sm:text-[0.68rem] font-bold text-yellow-500">
                  {rating.toFixed(1)}
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[0.65rem] font-bold text-slate-500">
                ({reviews})
              </span>
            </div>
            <span className="font-mono text-[9px] sm:text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-400 bg-white/5 border border-white/5 rounded-md px-1 sm:px-1.5 py-0.5">
              {product.category || "General"}
            </span>
          </div>

          {/* INFO */}
          <div className="space-y-1 sm:space-y-2">
            {product.vendor_company && (
              <p className="font-mono text-[9px] sm:text-[0.68rem] font-bold text-[#10b981] tracking-wide truncate" title={product.vendor_company}>
                By {product.vendor_company}
              </p>
            )}
            <h3 className="line-clamp-1 font-display text-xs sm:text-[1.05rem] font-bold tracking-[-0.01em] text-slate-100 transition-colors group-hover:text-primary">
              {product.name}
            </h3>

            {/* DESCRIPTION PREVIEW - HIDDEN ON MOBILE */}
            <div className="hidden sm:block relative">
              <p className="line-clamp-2 font-sans text-[0.875rem] leading-[1.65] text-slate-400">
                {product.description || "Premium high-quality product from Egnaro Mart, designed for excellence and durability."}
              </p>
              <span className="mt-1 inline-block font-mono text-[0.68rem] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                See More →
              </span>
            </div>
          </div>

          {/* PRICE SECTION */}
          <div className="mt-auto pt-2 sm:pt-4 flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-1 sm:gap-x-1.5 gap-y-0.5 font-mono">
                <span className="price-hover text-sm font-extrabold tracking-tight text-primary sm:text-xl">
                  {inr(Number(product.price))}
                </span>
                {Number(product.original_price) > Number(product.price) && (
                  <span className="text-[9px] text-slate-500 line-through sm:text-xs">
                    {inr(Number(product.original_price))}
                  </span>
                )}
              </div>
              <p className="font-mono text-[9px] sm:text-[0.65rem] font-medium text-emerald-400">Free Delivery</p>
            </div>

            {/* ADD TO CART ICON BUTTON */}
            <button
              onClick={handleAdd}
              className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-primary text-white shadow-lg transition-[transform,background-color,color] active:scale-95 hover:bg-white hover:text-primary cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
});


export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] border border-white/10 bg-white/[0.04] animate-pulse">
      <div className="aspect-[4/5] bg-white/10" />

      <div className="flex flex-1 flex-col p-2.5 sm:p-5 space-y-2.5 sm:space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-3.5 w-12 rounded-full bg-white/10" />
          <div className="h-3.5 w-8 rounded-full bg-white/10" />
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="hidden sm:block h-4 w-2/3 rounded bg-white/10" />
          <div className="hidden sm:block h-4 w-1/2 rounded bg-white/10" />
        </div>

        <div className="mt-auto pt-2 sm:pt-4 flex justify-between items-center gap-2">
          <div className="space-y-1 min-w-0">
            <div className="h-4 w-12 sm:h-6 sm:w-24 rounded bg-white/10" />
            <div className="h-2.5 w-8 sm:w-16 rounded bg-white/10" />
          </div>
          <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg sm:rounded-2xl bg-white/10 shrink-0" />
        </div>
      </div>
    </div>
  );
}