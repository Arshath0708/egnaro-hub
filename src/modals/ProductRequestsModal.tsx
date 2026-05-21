import { memo, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check, Loader2, Package } from "lucide-react";
import { getPendingProducts, approveProduct, rejectProduct } from "@/services/api";
import { toast } from "sonner";

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

export function ProductRequestsModal({ onClose, onProductActioned }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    getPendingProducts()
      .then((d) => {
  console.log("PENDING PRODUCTS:", d);

  setProducts(Array.isArray(d) ? d : []);
})
      .finally(() => setFetching(false));
  }, []);

  function removeProduct(id: number) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    queryClient.invalidateQueries({ queryKey: ["products"] });
    onProductActioned();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[28px] border border-white/10 bg-[#0a0f0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B3D2E] text-[#FF6600]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Product Requests</h2>
              <p className="text-xs text-gray-500">
                {products.length} pending request{products.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Package className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">No pending product requests</p>
            </div>
          ) : (
            products.map((p) => (
              <ProductCard key={p.id} product={p} onAction={removeProduct} />
            ))
          )}
        </div>
      </div>
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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex gap-4">
          <img
            src={product.image}
            alt={product.name}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-white">
                  {product.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">{product.category}</p>
                <p className="mt-1 text-sm font-bold text-[#FF6600]">
                  ₹{product.price}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                  {product.description}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <button
                  disabled={busy}
                  onClick={() => handleAction("approve")}
                  className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-60 hover:bg-green-500"
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
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-60 hover:bg-red-500"
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
      </div>
    );
  }
);
