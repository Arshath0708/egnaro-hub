import { motion } from "framer-motion";
import { X, Sparkles, Star, Tag, ShoppingBag, Layers, AlertCircle } from "lucide-react";
import { inr } from "@/lib/format";

/* ================= LAYERED ICON CONTAINER ================= */
function LayeredIconContainer({
  icon,
  glowColor,
}: {
  icon: React.ReactNode;
  glowColor: string;
}) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
      <div
        className="absolute inset-0 opacity-40 blur-md"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
        }}
      />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative text-white z-10">{icon}</div>
    </div>
  );
}

export function ViewProductModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative z-10 w-full max-w-5xl rounded-[32px] border border-white/5 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow orbs */}
        <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full blur-3xl opacity-15 pointer-events-none bg-primary" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-500" />

        <div className="p-8 lg:p-10 relative z-10">
          {/* HEADER */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex gap-4">
              <LayeredIconContainer
                icon={<ShoppingBag className="h-5 w-5 text-cyan-400" />}
                glowColor="rgba(6, 182, 212, 0.4)"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-300">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  Product Profile Spec Sheet
                </div>
                <h1 className="text-3xl font-black text-white tracking-wide mt-1.5 leading-none">
                  {product.name}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5 text-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Scope Category</p>
                  <p className="font-extrabold text-white uppercase mt-1 tracking-wide text-sm">{product.category}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Rating Breakdown</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 text-xs font-black text-yellow-500">
                      <Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
                      {Number(product.average_rating || 0).toFixed(1)}
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">
                      ({product.total_reviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Catalog Description</p>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap italic">
                  {product.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/5 bg-primary/5 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Active Selling Price</p>
                  <p className="text-2xl font-black text-primary mt-1">{inr(product.price)}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Original / MRP Price</p>
                  <p className="text-xl font-bold text-gray-500 line-through mt-1.5">{inr(product.original_price)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/5 bg-emerald-500/5 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Calculated Discount</p>
                  <p className="text-lg font-black text-emerald-400 mt-1 flex items-center gap-1">
                    <Tag className="h-4 w-4 text-emerald-400" />
                    {product.discount}% OFF Saved
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Calculated Stock Balance</p>
                  {product.stock_quantity === 0 ? (
                    <span className="inline-flex items-center rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-black text-red-400 mt-2">
                      Out of Stock
                    </span>
                  ) : product.stock_quantity < 20 ? (
                    <span className="inline-flex items-center rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-400 mt-2">
                      {product.stock_quantity} units (Low Stock)
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-400 mt-2">
                      {product.stock_quantity} units (Healthy)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="sticky top-10 overflow-hidden rounded-3xl border border-white/5 bg-[#070b16] p-2">
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-80 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                  {product.discount > 0 && (
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-primary to-primary-hover px-4 py-1.5 text-[10px] font-black uppercase text-white shadow-lg shadow-primary/20">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
