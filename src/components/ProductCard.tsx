import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { inr } from "@/lib/format";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      className="group relative rounded-2xl overflow-hidden gradient-card border border-glass-border hover-lift"
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img src={product.image} alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          {product.discount > 0 && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold gradient-primary text-primary-foreground shadow-glow">
              {product.discount}% OFF
            </div>
          )}
          {!product.approved && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-semibold bg-warning/20 text-warning border border-warning/40">
              Pending
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="font-medium">{product.rating || "—"}</span>
            <span className="text-muted-foreground">({product.reviews})</span>
          </div>
          <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">{product.name}</h3>
          <div className="flex items-end gap-2">
            <span className="font-display font-bold text-lg">{inr(product.price)}</span>
            {product.original > product.price && (
              <span className="text-xs text-muted-foreground line-through pb-0.5">{inr(product.original)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          onClick={() => { add(product.id); toast.success("Added to cart", { description: product.name }); }}
          className="w-full shimmer flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-lg glass hover:gradient-primary hover:text-primary-foreground transition-all"
        >
          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden gradient-card border border-glass-border animate-pulse">
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
