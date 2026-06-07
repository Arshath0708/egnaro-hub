import { memo, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Package } from "lucide-react";
import { getPendingProducts, approveProduct, rejectProduct } from "@/services/api";
import { toast } from "sonner";
import { queryKeys, QUERY_KEYS } from "@/lib/query-keys";

type Product = {
  id: number;
  name: string;
  category: string;
  image: string;
  price: number;
  description: string;
};

interface Props {
  onClose: () => void;
  onProductActioned: () => void;
}

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

export function ProductRequestsModal({ onClose, onProductActioned }: Props) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: fetching } = useQuery<Product[]>({
    queryKey: queryKeys.pendingProducts(),
    queryFn: getPendingProducts,
  });

  function removeProduct(id: number) {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_PRODUCTS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_ALL] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_PAGINATED] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_STATS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PRODUCTS] });
    onProductActioned();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[32px] border border-white/5 bg-gradient-to-b from-[#0a0f1d] to-[#05070a] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow orbs */}
        <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-orange-500" />
        <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-500" />

        {/* header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 relative z-10">
          <div className="flex items-center gap-3">
            <LayeredIconContainer
              icon={<Package className="h-5 w-5 text-orange-400" />}
              glowColor="rgba(249, 115, 22, 0.4)"
            />
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Product Requests</h2>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                {products.length} Pending Approval Request{products.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin relative z-10 min-h-[250px]">
          <AnimatePresence mode="popLayout">
            {fetching ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold text-gray-500 tracking-wider">Syncing active catalog requests...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 blur-2xl pointer-events-none bg-gradient-to-r from-orange-500/20 to-transparent" />
                <div className="relative z-10 space-y-3.5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5">
                    <Package className="h-10 w-10 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white tracking-wide">No pending product requests</h4>
                    <p className="mt-1 text-[11px] font-medium text-gray-500 max-w-xs mx-auto leading-normal">
                      Every submission is checked. New vendor catalogs will pop up here for review.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              products.map((p) => (
                <ProductCard key={p.id} product={p} onAction={removeProduct} />
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const ProductCard = memo(
  ({
    product,
    onAction,
  }: {
    product: Product;
    onAction: (id: number) => void;
  }) => {
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
    const busy = loading !== null;

    async function handleAction(action: "approve" | "reject") {
      setLoading(action);
      try {
        const res =
          action === "approve"
            ? await approveProduct(product.id)
            : await rejectProduct(product.id);

        if (res && res.success === false) {
          toast.error(res.message || "Action failed");
        } else {
          toast.success(
            action === "approve"
              ? `"${product.name}" approved`
              : `"${product.name}" rejected`
          );
          onAction(product.id);
        }
      } catch {
        toast.error("Server error. Please try again.");
      } finally {
        setLoading(null);
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-5 hover:border-white/10 transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-inner">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.png";
              }}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="truncate text-base font-extrabold text-white tracking-wide">
                    {product.name}
                  </h3>
                  <span className="inline-flex items-center rounded-lg bg-white/5 border border-white/5 px-2.5 py-0.5 text-[10px] font-black uppercase text-gray-300">
                    {product.category}
                  </span>
                </div>
                <p className="mt-1 text-base font-black text-primary">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
                <p className="mt-1.5 text-xs text-gray-400 leading-relaxed line-clamp-2 italic">
                  {product.description}
                </p>
              </div>

              <div className="flex sm:flex-col shrink-0 gap-2.5 w-full sm:w-auto">
                <button
                  disabled={busy}
                  onClick={() => handleAction("approve")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition shadow-lg shadow-emerald-950/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading === "approve" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleAction("reject")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading === "reject" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);
