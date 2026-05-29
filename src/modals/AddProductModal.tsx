//AddProductModal.tsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Sparkles, ImagePlus, Eye } from "lucide-react";
import { toast } from "sonner";
import { addProduct, getCategories } from "@/services/api";
import type { ProductForm } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export function AddProductModal({
  vendorId,
  createdByType = "vendor",
  createdById,
  onClose,
}: {
  vendorId: string;
  createdByType?: string;
  createdById?: string;
  onClose: () => void;
}) {
  const [previewImage, setPreviewImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const [form, setForm] = useState<ProductForm>({
    vendorId,
    name: "",
    category: "",
    image: "",
    price: "",
    original_price: "",
    discount: "",
    description: "",
    stock_quantity: "",
    created_by_type: createdByType,
    created_by_id: createdById || vendorId || "",
    approved: createdByType === "admin" ? 1 : 0,
    status: createdByType === "admin" ? "approved" : "pending",
  });

  // Set default category when categories list finishes loading
  useEffect(() => {
    if (categories.length > 0 && !form.category) {
      setForm((p) => ({ ...p, category: categories[0].name }));
    }
  }, [categories, form.category]);



  const mutation = useMutation({
    mutationFn: async () => {
      console.log("Submitting form:", form);
      const response = await addProduct(form);
      console.log("Server response:", response);
      return response;
    },
    onSuccess: async () => {
      toast.success(
        createdByType === "admin"
          ? "Product added successfully "
          : "Product submitted for approval "
      );
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      if (vendorId) {
        await queryClient.invalidateQueries({
          queryKey: ["vendor-products-all", vendorId],
        });
        await queryClient.invalidateQueries({
          queryKey: ["vendor-products-paginated", vendorId],
        });
      }
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Failed to submit product");
    },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewImage(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("https://egnaromart.com/api/upload-image.php", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (data.success && (data.url || data.image)) {
        setForm((prev) => ({
          ...prev,
          image: data.url || data.image,
        }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.message || "Image upload failed");
        setPreviewImage("");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
      setPreviewImage("");
    } finally {
      setUploading(false);
    }
  }

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
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Add Product
                </div>
                <h1 className="text-4xl font-black text-white">New Product</h1>
                <p className="mt-3 text-gray-400">
                  {createdByType === "admin"
                    ? "Add a new product directly to the store."
                    : "Submit product for admin approval."}
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
                  label="Product Name"
                  value={form.name}
                  onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                  placeholder="Enter product name"
                  className={inputClass}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Category</label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => setForm((p) => ({ ...p, category: val }))}
                  >
                    <SelectTrigger className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:ring-1 focus:ring-[#FF6600] outline-none">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <InputField
                  label="Selling Price"
                  type="number"
                  value={form.price}
                  onChange={(v) => setForm((p) => ({ ...p, price: v }))}
                  placeholder="₹ 0"
                  className={inputClass}
                />

                <InputField
                  label="Original Price"
                  type="number"
                  value={form.original_price}
                  onChange={(v) => setForm((p) => ({ ...p, original_price: v }))}
                  placeholder="₹ 0"
                  className={inputClass}
                />

                <InputField
                  label="Discount %"
                  type="number"
                  value={form.discount}
                  onChange={(v) => setForm((p) => ({ ...p, discount: v }))}
                  placeholder="10"
                  className={inputClass}
                />

                <InputField
                  label="Stock Quantity"
                  type="number"
                  value={form.stock_quantity}
                  onChange={(v) => setForm((p) => ({ ...p, stock_quantity: v }))}
                  placeholder="100"
                  className={inputClass}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Product Description</label>
                  <textarea
                    rows={5}
                    className={`${inputClass} resize-none`}
                    placeholder="Write product description..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                {/* IMAGE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Upload Product Image</label>
                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-5 py-6 transition hover:bg-cyan-400/10">
                    <div className="flex flex-col items-center">
                      {previewImage ? (
                        <img src={previewImage} alt="preview" className="mb-3 h-28 w-28 rounded-2xl object-cover" />
                      ) : (
                        <ImagePlus className="mb-3 h-10 w-10 text-cyan-300" />
                      )}
                      <span className="font-semibold text-cyan-300">
                        {uploading ? "Uploading..." : previewImage ? "Change Image" : "Choose Image"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">JPG / PNG / WEBP</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* RIGHT PREVIEW */}
              <div>
                <div className="sticky top-10 rounded-3xl border border-white/10 bg-[#0b1220] p-6">
                  <div className="mb-5 flex items-center gap-2 text-cyan-300">
                    <Eye className="h-5 w-5" />
                    <span className="font-semibold">Live Product Preview</span>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">
                    <div className="relative">
                      {previewImage ? (
                        <img src={previewImage} alt="preview" className="h-64 w-full object-cover" />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-[#1f2937] text-gray-500">No Image Selected</div>
                      )}
                      {form.discount && (
                        <div className="absolute right-4 top-4 rounded-full bg-cyan-500 px-4 py-2 text-xs font-bold text-white">
                          {form.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">{form.category}</div>
                      <h2 className="text-2xl font-black text-white">{form.name || "Product Name"}</h2>
                      <p className="mt-3 text-sm text-gray-400">{form.description || "Your product description preview will appear here."}</p>
                      <div className="mt-5 flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-black text-cyan-400">₹{form.price || "0"}</div>
                          <div className="text-sm text-gray-500 line-through">₹{form.original_price || "0"}</div>
                        </div>
                        <button type="button" className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white">Add to Cart</button>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      if (uploading) return toast.error("Please wait until image upload is complete");
                      if (createdByType !== "admin" && !vendorId) return toast.error("Vendor ID missing");
                      if (!form.name.trim()) return toast.error("Enter product name");
                      if (!form.price) return toast.error("Enter selling price");
                      if (!form.original_price) return toast.error("Enter original price");
                      if (!form.discount) return toast.error("Enter discount");
                      if (!form.stock_quantity) return toast.error("Enter stock quantity");
                      if (!form.description.trim()) return toast.error("Enter description");
                      if (!form.image) return toast.error("Upload product image");
                      mutation.mutate();
                    }}
                    disabled={mutation.isPending || uploading}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-300 to-cyan-400 px-8 py-4 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? "Uploading Image..." : mutation.isPending ? "Submitting..." : createdByType === "admin" ? "Add Product" : "Submit For Approval"}
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
