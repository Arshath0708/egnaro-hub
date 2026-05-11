import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import type { LucideIcon } from "lucide-react";

import {
  Package,
  Plus,
  LogOut,
  IndianRupee,
  ShoppingBag,
  X,
  Sparkles,
  BadgeCheck,
  Clock3,
  ImagePlus,
  Eye,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/auth-store";
import { addProduct } from "@/services/api";
import { CATEGORIES } from "@/data/seed";
import { inr } from "@/lib/format";
import { toast } from "sonner";

type Product = {
  id: number;
  vendorId: string;
  name: string;
  category: string;
  image: string;
  price: number;
  original_price: number;
  discount: number;
  description: string;
  approved: number;
};

type ProductForm = {
  vendorId: string;
  name: string;
  category: string;
  image: string;
  price: string;
  original_price: string;
  discount: string;
  description: string;
};

export default function VendorDashboard() {
  const vendorId = useAuth((s) => s.vendorId);
  const logout = useAuth((s) => s.logoutVendor);

  if (!vendorId) {
    return (
      <Shell>
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1220]/80 p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              <ShoppingBag className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-4xl font-black text-white">
              Vendor Portal
            </h1>

            <p className="mt-4 text-gray-400">
              Login to manage products and approvals.
            </p>

            <Link
              to="/vendor-register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-semibold text-white transition-all hover:scale-105"
            >
              Open Vendor Access
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <DashboardContent
      vendorId={vendorId}
      onLogout={logout}
    />
  );
}

function DashboardContent({
  vendorId,
  onLogout,
}: {
  vendorId: string;
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);

  const {
    data: products = [],
    isLoading,
  } = useQuery<Product[]>({
    queryKey: ["vendor-products", vendorId],

    queryFn: async () => {
      const res = await fetch(
        `https://egnaromart.com/api/get-products.php?vendorId=${vendorId}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      return res.json();
    },
  });

  const approvedCount = products.filter(
    (p) => Number(p.approved) === 1
  ).length;

  const pendingCount = products.filter(
    (p) => Number(p.approved) === 0
  ).length;

  return (
    <Shell>
      <div className="relative min-h-screen bg-[#030712] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.15),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">

          {/* HERO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                Vendor Workspace
              </div>

              <h1 className="text-5xl font-black">
                Welcome Back 👋
              </h1>

              <p className="mt-4 text-gray-400">
                Manage your products and marketplace inventory.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">

              {/* ADD PRODUCT BUTTON */}
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-semibold text-white transition hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Add Product
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </motion.div>

          {/* STATS */}
          <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Package}
              title="Products"
              value={products.length}
            />

            <StatCard
              icon={BadgeCheck}
              title="Approved"
              value={approvedCount}
            />

            <StatCard
              icon={Clock3}
              title="Pending"
              value={pendingCount}
            />

            <StatCard
              icon={IndianRupee}
              title="Revenue"
              value={0}
              currency
            />
          </div>

          {/* PRODUCTS */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">
                  Product Inventory
                </h2>

                <p className="mt-2 text-gray-400">
                  Manage all your listed products.
                </p>
              </div>

              <button
                onClick={() => setShowAdd(true)}
                className="hidden rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white md:block"
              >
                + Add Product
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-gray-400">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-gray-600" />

                <h3 className="text-2xl font-bold">
                  No products yet
                </h3>

                <p className="mt-2 text-gray-400">
                  Start adding products to your store.
                </p>

                <button
                  onClick={() => setShowAdd(true)}
                  className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-semibold text-white transition hover:scale-105"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]/90"
                  >
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-52 w-full object-cover"
                      />

                      <div className="absolute right-4 top-4">
                        {Number(product.approved) === 1 ? (
                          <span className="rounded-full bg-green-500/20 px-4 py-2 text-xs font-bold text-green-400">
                            Approved
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-xs font-bold text-yellow-300">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
                        {product.category}
                      </div>

                      <h3 className="line-clamp-1 text-xl font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-3 line-clamp-2 text-sm text-gray-400">
                        {product.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-black text-cyan-400">
                            {inr(product.price)}
                          </div>

                          <div className="text-sm text-gray-500 line-through">
                            {inr(product.original_price)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
                          {product.discount}% OFF
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddProductModal
          vendorId={vendorId}
          onClose={() => {
            setShowAdd(false);

            queryClient.invalidateQueries({
              queryKey: ["vendor-products", vendorId],
            });
          }}
        />
      )}
    </Shell>
  );
}

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: number;
  currency?: boolean;
};

function StatCard({
  icon: Icon,
  title,
  value,
  currency = false,
}: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
        <Icon className="h-7 w-7 text-cyan-400" />
      </div>

      <div className="text-4xl font-black text-white">
        {currency ? inr(value) : value}
      </div>

      <div className="mt-2 text-gray-400">
        {title}
      </div>
    </div>
  );
}

function AddProductModal({
  vendorId,
  onClose,
}: {
  vendorId: string;
  onClose: () => void;
}) {
  const [previewImage, setPreviewImage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<ProductForm>({
    vendorId,
    name: "",
    category: CATEGORIES[0]?.id || "electronics",
    image: "",
    price: "",
    original_price: "",
    discount: "",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return addProduct(form);
    },

    onSuccess: () => {
      toast.success("Product submitted for approval 🚀");
      onClose();
    },

    onError: () => {
      toast.error("Failed to submit product");
    },
  });

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    // LOCAL PREVIEW
    const localPreview = URL.createObjectURL(file);
    setPreviewImage(localPreview);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        "https://egnaromart.com/api/upload-image.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success && data.url) {
        setForm((prev) => ({
          ...prev,
          image: data.url,
        }));

        toast.success("Image uploaded");
      } else {
        toast.error("Image upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-cyan-400";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.name ||
      !form.price ||
      !form.original_price ||
      !form.discount ||
      !form.description
    ) {
      toast.error("Please fill all fields");
      return;
    }

    if (!form.image) {
      toast.error("Please upload image");
      return;
    }

    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-8">

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-5xl rounded-[36px] border border-white/10 bg-[#050816]"
        >
          <div className="p-8 lg:p-10">

            {/* HEADER */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Add Product
                </div>

                <h1 className="text-4xl font-black text-white">
                  New Product
                </h1>

                <p className="mt-3 text-gray-400">
                  Submit product for admin approval.
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="grid gap-8 lg:grid-cols-2"
            >

              {/* LEFT */}
              <div className="space-y-5">

                <InputField
                  label="Product Name"
                  value={form.name}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, name: v }))
                  }
                  placeholder="Enter product name"
                  className={inputClass}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Category
                  </label>

                  <select
                    value={form.category}
                    className={inputClass}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        category: e.target.value,
                      }))
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option
                        key={cat.id}
                        value={cat.id}
                        className="bg-[#0f172a]"
                      >
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Selling Price"
                  type="number"
                  value={form.price}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, price: v }))
                  }
                  placeholder="₹ 0"
                  className={inputClass}
                />

                <InputField
                  label="Original Price"
                  type="number"
                  value={form.original_price}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      original_price: v,
                    }))
                  }
                  placeholder="₹ 0"
                  className={inputClass}
                />

                <InputField
                  label="Discount %"
                  type="number"
                  value={form.discount}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      discount: v,
                    }))
                  }
                  placeholder="10"
                  className={inputClass}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Product Description
                  </label>

                  <textarea
                    rows={5}
                    className={`${inputClass} resize-none`}
                    placeholder="Write product description..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* IMAGE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Upload Product Image
                  </label>

                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-5 py-6 transition hover:bg-cyan-400/10">

                    <div className="flex flex-col items-center">

                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="preview"
                          className="mb-3 h-28 w-28 rounded-2xl object-cover"
                        />
                      ) : (
                        <ImagePlus className="mb-3 h-10 w-10 text-cyan-300" />
                      )}

                      <span className="font-semibold text-cyan-300">
                        {uploading
                          ? "Uploading..."
                          : previewImage
                          ? "Change Image"
                          : "Choose Image"}
                      </span>

                      <span className="mt-1 text-xs text-gray-500">
                        JPG / PNG / WEBP
                      </span>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              {/* RIGHT PREVIEW */}
              <div>

                <div className="sticky top-10 rounded-3xl border border-white/10 bg-[#0b1220] p-6">

                  <div className="mb-5 flex items-center gap-2 text-cyan-300">
                    <Eye className="h-5 w-5" />
                    <span className="font-semibold">
                      Live Product Preview
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">

                    <div className="relative">

                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="preview"
                          className="h-64 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-[#1f2937] text-gray-500">
                          No Image Selected
                        </div>
                      )}

                      {form.discount && (
                        <div className="absolute right-4 top-4 rounded-full bg-cyan-500 px-4 py-2 text-xs font-bold text-white">
                          {form.discount}% OFF
                        </div>
                      )}
                    </div>

                    <div className="p-6">

                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
                        {form.category}
                      </div>

                      <h2 className="text-2xl font-black text-white">
                        {form.name || "Product Name"}
                      </h2>

                      <p className="mt-3 text-sm text-gray-400">
                        {form.description ||
                          "Your product description preview will appear here."}
                      </p>

                      <div className="mt-5 flex items-center justify-between">

                        <div>
                          <div className="text-3xl font-black text-cyan-400">
                            ₹{form.price || "0"}
                          </div>

                          <div className="text-sm text-gray-500 line-through">
                            ₹{form.original_price || "0"}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={mutation.isPending || uploading}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-300 to-cyan-400 px-8 py-4 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {mutation.isPending
                      ? "Submitting..."
                      : "Submit For Approval"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
  type?: string;
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  className,
  type = "text",
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}