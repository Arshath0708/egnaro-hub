//vendor dashboard 
import { useState, memo } from "react";
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
  Percent,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Building2,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { ViewProductModal } from "@/modals/ViewProductModal";
import { UpdateProductModal } from "@/modals/UpdateProductModal";
import { DeleteProductModal } from "@/modals/DeleteProductModal";
import { AddProductModal } from "@/modals/AddProductModal";
import { ViewVendorModal } from "@/modals/ViewVendorModal";
import { useAuth, selectIsVendor } from "@/context/auth-store";
import { addProduct, getVendorProducts, getVendorStats, getVendorOrders } from "@/services/api";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = {
  id: number;
  created_by_type: string;
  created_by_id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  original_price: number;
  discount: number;
  description: string;
  approved: number;
  stock_quantity: number;
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
  const isVendor = useAuth(selectIsVendor);
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
  const [showProfile, setShowProfile] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [updateProduct, setUpdateProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const [activeTab, setActiveTab] = useState("products");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [orderPage, setOrderPage] = useState(1);

  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productStatus, setProductStatus] = useState("all");
  const [productCategory, setProductCategory] = useState("all");

  // Unpaginated full list for static statistics metrics
  const {
    data: allProducts = [],
  } = useQuery<Product[]>({
    queryKey: ["vendor-products-all", vendorId],
    queryFn: () => getVendorProducts(vendorId),
  });

  // Paginated query for the listing grid
  const {
    data: productsRes,
    isLoading,
  } = useQuery({
    queryKey: ["vendor-products-paginated", vendorId, productPage, productSearch, productStatus, productCategory],
    queryFn: () => getVendorProducts(vendorId, {
      page: productPage,
      limit: 9,
      search: productSearch,
      status: productStatus === "all" ? "" : productStatus,
      category: productCategory === "all" ? "" : productCategory
    }),
  });

  const products = (productsRes?.products || []) as Product[];
  const productTotalPages = productsRes?.total_pages || 1;
  const productTotalRows = productsRes?.total_rows || 0;

  const { data: stats } = useQuery({
    queryKey: ["vendor-stats", vendorId],
    queryFn: () => getVendorStats(vendorId),
  });

  const { data: ordersRes, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["vendor-orders", vendorId, orderPage, orderStatus, orderSearch],
    queryFn: () => getVendorOrders(vendorId, orderPage, orderStatus === "all" ? "" : orderStatus, 10, orderSearch),
  });

  const ordersData = (ordersRes?.orders || []) as any[];
  const totalPages = ordersRes?.total_pages || 1;
  const totalRows = ordersRes?.total_rows || 0;

  const filteredOrders = ordersData;

  const approvedCount = allProducts.filter(
    (p) => Number(p.approved) === 1
  ).length;

  const pendingCount = allProducts.filter(
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
                Welcome Back
              </h1>

              <p className="mt-4 text-gray-400">
                Manage your products and marketplace inventory.
              </p>

              <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-200">
                <Percent className="h-4 w-4 shrink-0 text-cyan-400" />
                <span>
                  A <strong>2% commission</strong> will be applied to all products of vendor by Egnaro Mart.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">

              {/* ADD PRODUCT BUTTON */}
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-semibold text-white transition hover:scale-105 cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                Add Product
              </button>

              {/* VENDOR PROFILE BUTTON */}
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10 cursor-pointer"
              >
                <Building2 className="h-5 w-5 text-cyan-400" />
                Vendor Profile
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </motion.div>

          {/* STATS */}
          <div className="mb-10 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* CARD 1: PRODUCTS */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <Package className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm block">Total Products</span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      {allProducts.length}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1 block">Active catalog items</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Approved</span>
                      <span className="font-bold text-green-400">{approvedCount}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block mb-0.5">Pending</span>
                      <span className="font-semibold text-yellow-400">{pendingCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: APPROVAL RATIO */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <BadgeCheck className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm block">Approval Status</span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      {products.length > 0 ? `${Math.round((approvedCount / products.length) * 100)}%` : "0%"}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1 block">Verification ratio</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Approved</span>
                      <span className="font-bold text-gray-200">{approvedCount}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block mb-0.5">Total Listed</span>
                      <span className="font-semibold text-cyan-400/90">{products.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: TOTAL ORDERS */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <Clock3 className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm block">Total Orders</span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      {stats?.total_orders || 0}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1 block">Attributed order volume</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Avg Order Val</span>
                      <span className="font-bold text-gray-200">
                        {stats?.total_orders ? inr(Math.round((stats.gross_revenue || 0) / stats.total_orders)) : inr(0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block mb-0.5">Sales Count</span>
                      <span className="font-semibold text-cyan-400/90">{stats?.total_orders || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: REVENUE */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <IndianRupee className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm block">Actual Revenue</span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      {inr(stats?.net_revenue || 0)}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1 block">Earnings apart from commission</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Total Revenue</span>
                      <span className="font-bold text-gray-200">{inr(stats?.gross_revenue || 0)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block mb-0.5">Platform Fee</span>
                      <span className="font-semibold text-cyan-400/90">{inr(stats?.commission || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS CONTAINER */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 grid grid-cols-2 h-auto w-full gap-2 rounded-[24px] bg-white/5 p-2 border border-white/10 max-w-md mx-auto">
              <TabsTrigger
                value="products"
                className="w-full rounded-[16px] py-3.5 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-white cursor-pointer"
              >
                Products ({allProducts.length})
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="w-full rounded-[16px] py-3.5 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-white cursor-pointer"
              >
                Orders ({totalRows})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: PRODUCTS INVENTORY */}
            <TabsContent value="products" className="animate-fadeIn focus:outline-none">
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

                {/* PRODUCT FILTERS BAR */}
                <div className="mb-8 grid gap-4 md:grid-cols-4">
                  {/* Search */}
                  <div className="md:col-span-2 relative flex items-center rounded-2xl border border-white/10 bg-white/5 px-4">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(1);
                      }}
                      className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500 pl-3"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative flex items-center rounded-2xl border border-white/10 bg-[#0c1322] px-4">
                    <select
                      value={productStatus}
                      onChange={(e) => {
                        setProductStatus(e.target.value);
                        setProductPage(1);
                      }}
                      className="h-12 w-full bg-[#0c1322] text-sm text-white outline-none border-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="relative flex items-center rounded-2xl border border-white/10 bg-[#0c1322] px-4">
                    <select
                      value={productCategory}
                      onChange={(e) => {
                        setProductCategory(e.target.value);
                        setProductPage(1);
                      }}
                      className="h-12 w-full bg-[#0c1322] text-sm text-white outline-none border-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean))).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
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
                  <>
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
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                              {product.category}
                            </div>
                            <div>
                              {product.stock_quantity === 0 ? (
                                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-black text-red-400 border border-red-500/20">
                                  Out of Stock
                                </span>
                              ) : product.stock_quantity < 20 ? (
                                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-400 border border-amber-500/20">
                                  {product.stock_quantity} Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/20">
                                  {product.stock_quantity} In Stock
                                </span>
                              )}
                            </div>
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

                  {/* Pagination Controls */}
                  {productTotalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <button
                        onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                        disabled={productPage === 1}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <span className="text-sm font-semibold text-gray-400">
                        Page <strong className="text-white">{productPage}</strong> of <strong className="text-white">{productTotalPages}</strong>
                      </span>
                      
                      <button
                        onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                        disabled={productPage === productTotalPages}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: ORDER HISTORY */}
            <TabsContent value="orders" className="animate-fadeIn focus:outline-none">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                
                {/* Search & Filter Row */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders by ID, customer name, phone, or product name..."
                      value={orderSearch}
                      onChange={(e) => {
                        setOrderSearch(e.target.value);
                        setOrderPage(1); // reset to page 1 on search
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-cyan-400 placeholder:text-gray-500 transition"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status:</span>
                    <Select
                      value={orderStatus}
                      onValueChange={(val) => {
                        setOrderStatus(val);
                        setOrderPage(1); // reset to page 1 on status change
                      }}
                    >
                      <SelectTrigger className="w-[160px] h-11 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-cyan-400">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="border border-white/10 bg-[#0f172a] text-white rounded-2xl">
                        <SelectItem value="all" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">All Statuses</SelectItem>
                        <SelectItem value="Processing" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Processing</SelectItem>
                        <SelectItem value="Confirmed" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Confirmed</SelectItem>
                        <SelectItem value="Packed" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Packed</SelectItem>
                        <SelectItem value="Shipped" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Shipped</SelectItem>
                        <SelectItem value="Out for Delivery" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Out for Delivery</SelectItem>
                        <SelectItem value="Delivered" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Delivered</SelectItem>
                        <SelectItem value="Cancelled" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isOrdersLoading ? (
                  <div className="py-20 text-center text-gray-400">
                    Loading orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                    <h3 className="text-xl font-bold">No orders found</h3>
                    <p className="text-sm text-gray-400 mt-2">No customer orders match your selection criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredOrders.map((o: any) => (
                      <VendorOrderRow
                        key={o.id}
                        order={o}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      disabled={orderPage === 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    <span className="text-sm font-semibold text-gray-400">
                      Page <strong className="text-white">{orderPage}</strong> of <strong className="text-white">{totalPages}</strong>
                    </span>
                    
                    <button
                      onClick={() => setOrderPage((p) => Math.min(totalPages, p + 1))}
                      disabled={orderPage === totalPages}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showAdd && (
        <AddProductModal
          vendorId={vendorId}
          onClose={() => {
            setShowAdd(false);

            queryClient.invalidateQueries({
              queryKey: ["vendor-products-all", vendorId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendor-products-paginated", vendorId],
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

      {showProfile && (
        <ViewVendorModal
          vendor={{ id: Number(vendorId) }}
          hidePerformanceOverview={true}
          onClose={() => setShowProfile(false)}
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

const VendorOrderRow = memo(({ order }: { order: any }) => {
  const parsedItems = Array.isArray(order.items)
    ? order.items
    : typeof order.items === "string"
    ? JSON.parse(order.items)
    : [];

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "shipped":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "processing":
      default:
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-white/20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Order ID</span>
              <h3 className="font-black text-xl text-white mt-1">
                #{order.order_id}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Placed: {order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : 'N/A'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${getStatusStyle(order.status || "Processing")}`}>
                {order.status || "Processing"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Customer Info */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Customer info</span>
              <p className="text-sm font-bold text-white">{order.customer_name}</p>
              <p className="text-xs text-gray-300">📞 {order.phone}</p>
              {order.email && <p className="text-xs text-gray-400 break-all">✉️ {order.email}</p>}
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Shipping Address</span>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs">{order.address}</p>
              </div>
            </div>

            {/* Products list */}
            <div className="md:col-span-2 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Ordered Items</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {parsedItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/5">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/20 border border-white/10">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-full w-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.quantity} × {inr(item.price)}</p>
                    </div>
                  </div>
                ))}
                {parsedItems.length === 0 && (
                  <p className="text-xs text-gray-600 italic">No product details available</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Frame */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-gray-500 block">Payment Method</span>
                <span className="font-semibold text-gray-300 uppercase mt-0.5 block">{order.payment_method || "COD"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Estimated Delivery</span>
                <span className="font-semibold text-cyan-400 mt-0.5 block">{order.estimated_days || "Pending confirmation"}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Grand Total</span>
              <span className="text-xl font-black text-[#FF6600] mt-0.5 block">
                {inr(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

