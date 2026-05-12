import { X, Sparkles, ImagePlus, Eye, Star } from "lucide-react";
import { inr } from "@/lib/format";

export function ViewProductModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-8">
        <div className="relative w-full max-w-5xl rounded-[36px] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="p-8 lg:p-10">
            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  View Product
                </div>
                <h1 className="text-4xl font-black text-white">
                  {product.name}
                </h1>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6 text-gray-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="mb-1 text-sm text-gray-500">Category</p>
                  <p className="font-semibold text-white uppercase">{product.category}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Description & Ratings</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400">
                        <Star className="h-3 w-3 fill-current" />
                        {product.rating || "4.8"}
                      </div>
                      <div className="text-xs text-gray-400">
                        ({product.reviews || "120"} reviews)
                      </div>
                    </div>
                  </div>
                  <p className="text-white whitespace-pre-wrap">{product.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="mb-1 text-sm text-gray-500">Price</p>
                    <p className="text-2xl font-black text-cyan-400">{inr(product.price)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="mb-1 text-sm text-gray-500">Original Price</p>
                    <p className="text-xl font-bold text-gray-400 line-through">{inr(product.original_price)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="mb-1 text-sm text-gray-500">Discount</p>
                    <p className="text-xl font-bold text-white">{product.discount}% OFF</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="mb-1 text-sm text-gray-500">Stock Quantity</p>
                    <p className="text-xl font-bold text-white">{product.stock_quantity}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="sticky top-10 overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt="preview"
                      className="h-96 w-full object-cover"
                    />
                    <div className="absolute right-4 top-4 rounded-full bg-cyan-500 px-4 py-2 text-xs font-bold text-white">
                      {product.discount}% OFF
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
