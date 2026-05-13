import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";
import { adminUpdateProduct } from "@/services/api";

export function UpdateVendorProductModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    product_id: product.id,
    price: product.price || "",
    stock_quantity: product.stock_quantity || "",
    role: "admin", // Ensure role is passed as admin to use admin endpoints if needed
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return await adminUpdateProduct(form);
    },
    onSuccess: async () => {
      toast.success("Vendor product updated successfully 🚀");
      await queryClient.invalidateQueries({
        queryKey: ["vendor-products"], // Invalidates vendor products list if cached
      });
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to update product");
    },
  });

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-cyan-400";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-8">
        <div className="relative w-full max-w-5xl rounded-[36px] border border-white/10 bg-[#050816] shadow-2xl">
          <div className="p-8 lg:p-10">
            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
                  <Sparkles className="h-4 w-4" />
                  Edit Vendor Product
                </div>
                <h1 className="text-4xl font-black text-white">Update Stock & Price</h1>
                <p className="mt-3 text-gray-400">
                  You can only modify the stock and price for vendor-created products.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}
            <form className="grid gap-8 lg:grid-cols-2">
              {/* LEFT */}
              <div className="space-y-5">
                <InputField
                  label="Selling Price"
                  type="number"
                  value={form.price.toString()}
                  onChange={(v) => setForm((p) => ({ ...p, price: v }))}
                  placeholder="₹ 0"
                  className={inputClass}
                />

                <InputField
                  label="Stock Quantity"
                  type="number"
                  value={form.stock_quantity?.toString() || ""}
                  onChange={(v) => setForm((p) => ({ ...p, stock_quantity: v }))}
                  placeholder="100"
                  className={inputClass}
                />
              </div>
              
              {/* RIGHT PREVIEW */}
              <div>
                <div className="sticky top-10 rounded-3xl border border-white/10 bg-[#0b1220] p-6">
                  <div className="mb-5 flex items-center gap-2 text-yellow-300">
                    <Eye className="h-5 w-5" />
                    <span className="font-semibold">Live Product Preview</span>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">
                    <div className="relative">
                      {product.image ? (
                        <img src={product.image} alt="preview" className="h-64 w-full object-cover" />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-[#1f2937] text-gray-500">No Image Available</div>
                      )}
                      {product.discount > 0 && (
                        <div className="absolute right-4 top-4 rounded-full bg-cyan-500 px-4 py-2 text-xs font-bold text-white">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">{product.category}</div>
                      <h2 className="text-2xl font-black text-white">{product.name || "Product Name"}</h2>
                      <p className="mt-3 text-sm text-gray-400">{product.description}</p>
                      <div className="mt-5 flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-black text-cyan-400">₹{form.price || "0"}</div>
                          <div className="text-sm text-gray-500 line-through">₹{product.original_price || "0"}</div>
                        </div>
                        <button type="button" disabled className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white opacity-50">Add to Cart</button>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.price) return toast.error("Enter price");
                      mutation.mutate();
                    }}
                    disabled={mutation.isPending}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-300 to-cyan-400 px-8 py-4 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {mutation.isPending ? "Updating..." : "Update Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
};

function InputField({ label, value, onChange, placeholder, className, type = "text" }: InputFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      <input type={type} value={value} placeholder={placeholder} className={className} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
