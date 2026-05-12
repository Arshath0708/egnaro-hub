//vendor dashboard 
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
  Trash2,
  Edit3,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { ViewProductModal } from "@/modals/ViewProductModal";
import { UpdateProductModal } from "@/modals/UpdateProductModal";
import { DeleteProductModal } from "@/modals/DeleteProductModal";
import { AddProductModal } from "@/modals/AddProductModal";
import { useAuth } from "@/context/auth-store";
import { addProduct, getVendorProducts, getVendorStats } from "@/services/api";
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
  stock_quantity: string;
  created_by_type: string;
  created_by_id: string;
};

export default function VendorDashboard() {
  const vendorId = useAuth((s) => s.vendorId);
  const isVendor = useAuth((s) => s.isVendor);
  const logout = useAuth((s) => s.logoutVendor);

  if (!isVendor || !vendorId) {
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
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [updateProduct, setUpdateProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const {
    data: products = [],
    isLoading,
  } = useQuery<Product[]>({
    queryKey: ["vendor-products", vendorId],

    queryFn: () => getVendorProducts(vendorId),
  });

  const { data: stats } = useQuery({
    queryKey: ["vendor-stats", vendorId],
    queryFn: () => getVendorStats(vendorId),
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
              title="Approved / Pending"
              value={`${approvedCount} / ${pendingCount}`}
            />

            <StatCard
              icon={Clock3}
              title="Total Orders"
              value={stats?.total_orders || 0}
            />

            <StatCard
              icon={IndianRupee}
              title="Revenue"
              value={stats?.revenue || 0}
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

                      <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                        <button
                          onClick={() => setViewProduct(product)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setUpdateProduct(product)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 transition hover:bg-blue-500/20"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteProduct(product)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      {viewProduct && (
        <ViewProductModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}

      {updateProduct && (
        <UpdateProductModal
          product={updateProduct}
          vendorId={vendorId}
          onClose={() => setUpdateProduct(null)}
        />
      )}

      {deleteProduct && (
        <DeleteProductModal
          product={deleteProduct}
          vendorId={vendorId}
          onClose={() => setDeleteProduct(null)}
        />
      )}
    </Shell>
  );
}

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: number | string;
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
        {currency ? inr(Number(value)) : value}
      </div>

      <div className="mt-2 text-gray-400">
        {title}
      </div>
    </div>
  );
}
