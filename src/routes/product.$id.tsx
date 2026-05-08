import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingCart, ShieldCheck, Truck, ChevronLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import { api } from "@/services/api";
import { inr } from "@/lib/format";
import { useCart } from "@/context/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => api.getProductById(id) });

  if (isLoading) {
    return <Shell><div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-2 gap-10">
      <div className="aspect-square rounded-3xl bg-muted animate-pulse" />
      <div className="space-y-4"><div className="h-8 w-2/3 bg-muted animate-pulse rounded" /><div className="h-4 w-1/3 bg-muted animate-pulse rounded" /><div className="h-32 bg-muted animate-pulse rounded" /></div>
    </div></Shell>;
  }
  if (!product) {
    return <Shell><div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="font-display text-3xl font-bold">Product not found</h1><Link to="/products" className="mt-6 inline-block text-primary">← Back to shop</Link></div></Shell>;
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => nav({ to: "/products" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="grid md:grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square rounded-3xl overflow-hidden gradient-card border border-glass-border shadow-elegant">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            {product.discount > 0 && <div className="absolute top-4 left-4 px-3 py-1.5 rounded-md text-xs font-bold gradient-primary text-primary-foreground shadow-glow">{product.discount}% OFF</div>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">{product.category.replace("-", " ")}</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" /><span className="font-semibold">{product.rating || "—"}</span></div>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
              <span className="text-muted-foreground">·</span>
              <span className={product.stock > 0 ? "text-success" : "text-destructive"}>{product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}</span>
            </div>
            <div className="mt-6 flex items-end gap-3">
              <div className="font-display text-4xl font-bold text-gradient">{inr(product.price)}</div>
              {product.original > product.price && <>
                <div className="text-lg text-muted-foreground line-through pb-1">{inr(product.original)}</div>
                <div className="text-sm font-semibold text-success pb-1.5">Save {inr(product.original - product.price)}</div>
              </>}
            </div>
            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center glass rounded-xl">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-primary"><Minus className="h-4 w-4" /></button>
                <div className="w-10 text-center font-semibold">{qty}</div>
                <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:text-primary"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                disabled={product.stock <= 0}
                onClick={() => { add(product.id, qty); toast.success("Added to cart", { description: product.name }); }}
                className="flex-1 shimmer inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-glow disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="glass rounded-xl p-4 flex items-center gap-3"><Truck className="h-5 w-5 text-primary" /><div><div className="text-xs font-semibold">Free Shipping</div><div className="text-[11px] text-muted-foreground">Pan-India</div></div></div>
              <div className="glass rounded-xl p-4 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-success" /><div><div className="text-xs font-semibold">Verified Vendor</div><div className="text-[11px] text-muted-foreground">100% authentic</div></div></div>
            </div>

            <div className="mt-8 glass rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Specifications</h3>
              <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}
