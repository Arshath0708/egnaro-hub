import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Package,
  LogOut,
  Users,
  Truck,
  ClipboardList,
  Plus,
  Search,
  Edit2,
  Trash2,
  IndianRupee,
  LayoutTemplate,
  Menu,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import AdminLogin from "@/components/AdminLogin";
import { CategoriesModal } from "@/modals/CategoriesModal";
import { LocationsModal } from "@/modals/LocationsModal";
import { VendorRequestsModal } from "@/modals/VendorRequestsModal";
import { ProductRequestsModal } from "@/modals/ProductRequestsModal";
import { AddProductModal } from "@/modals/AddProductModal";
import { UpdateProductModal } from "@/modals/UpdateProductModal";
import { UpdateVendorProductModal } from "@/modals/UpdateVendorProductModal";
import { DeleteProductModal } from "@/modals/DeleteProductModal";
import { ViewProductModal } from "@/modals/ViewProductModal";
import { ViewVendorModal } from "@/modals/ViewVendorModal";
import { HomeContentModal } from "@/modals/HomeContentModal";
import { ViewUserModal } from "@/modals/ViewUserModal";

import { useAuth, selectIsAdmin } from "@/context/auth-store";
import { toast } from "sonner";

import { 
  adminDeleteProduct,
  getProducts,
  getOrders,
  getVendors,
  getAdminStats,
  getLocations,
  addLocation,
  deleteLocation,
  getCategories,
  getUsers
} from "@/services/api";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Order = {
  id: number;
  order_id: string;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  items?: string | any[];
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none backdrop-blur-xl transition-all focus:border-[#FF6600]";

export default function AdminPage() {
  const isAdmin = useAuth(selectIsAdmin);
  const logoutAdmin = useAuth((s) => s.logoutAdmin);

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return <AdminPanel onLogout={logoutAdmin} />;
}

/* ================= LAYERED ICON CONTAINER ================= */

function LayeredIconContainer({
  icon,
  glowColor,
  baseColor,
}: {
  icon: React.ReactNode;
  glowColor: string;
  baseColor: string;
}) {
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] group-hover:border-white/20 transition-all duration-300">
      {/* Blurred glow orb behind the icon */}
      <div
        className="absolute inset-0 opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-80"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
        }}
      />
      {/* Inner highlight ring */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      {/* GPU acceleration layers */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* The Icon */}
      <div className="relative text-white z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>
    </div>
  );
}

/* ================= ADMIN PANEL ================= */

function AdminPanel({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();

  // Advanced Search, Filtering & Pagination States
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userSortBy, setUserSortBy] = useState("id");
  const [userSortOrder, setUserSortOrder] = useState("DESC");

  const [activeTab, setActiveTab] = useState("orders");
  const [menuOpen, setMenuOpen] = useState(false);

  // Queries
  const { data: productsData } = useQuery({
    queryKey: ["admin-products", productPage, productCategory, productSearch],
    queryFn: () => getProducts({
      page: productPage,
      limit: 10,
      category: productCategory === "all" ? "" : productCategory,
      search: productSearch,
    }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders", orderPage, orderStatus, orderSearch, orderDateFrom, orderDateTo],
    queryFn: () => getOrders({
      page: orderPage,
      limit: 10,
      status: orderStatus === "all" ? "" : orderStatus,
      search: orderSearch,
      date_from: orderDateFrom,
      date_to: orderDateTo,
    }),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ["admin-vendors", vendorPage, vendorSearch],
    queryFn: () => getVendors({
      page: vendorPage,
      limit: 10,
      search: vendorSearch,
    }),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", userPage, userSearch, userStatusFilter, userSortBy, userSortOrder],
    queryFn: () => getUsers({
      page: userPage,
      limit: 10,
      search: userSearch,
      status: userStatusFilter === "all" ? "" : userStatusFilter,
      sortBy: userSortBy,
      sortOrder: userSortOrder,
    }),
  });

  const { data: statsRes } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const { data: apiCategories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategories,
  });

  const allProducts = (productsData?.products || []) as any[];
  const orders = (ordersData?.orders || []) as any[];
  const allVendors = (vendorsData?.vendors || []) as any[];
  const allUsers = (usersData?.users || []) as any[];
  
  const dashboardStats = statsRes || null;
  const pendingVendors = dashboardStats?.vendors?.pending || 0;
  const pendingProducts = dashboardStats?.products?.pending_approval || 0;

  const productsTotalPages = productsData?.total_pages || 1;
  const ordersTotalPages = ordersData?.total_pages || 1;
  const vendorsTotalPages = vendorsData?.total_pages || 1;
  const usersTotalPages = usersData ? Math.ceil(usersData.total_rows / 10) : 1;

  const [vendorModalOpen, setVendorModalOpen] =
    useState(false);

  const [productModalOpen, setProductModalOpen] =
    useState(false);

  const [categoriesModalOpen, setCategoriesModalOpen] =
    useState(false);

  const [locationsModalOpen, setLocationsModalOpen] =
    useState(false);

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [viewingProduct, setViewingProduct] =
    useState<any>(null);

  const [editingProduct, setEditingProduct] =
    useState<any>(null);

  const [viewingVendor, setViewingVendor] =
    useState<any>(null);

  const [viewingUser, setViewingUser] =
    useState<any>(null);

  const admin = useAuth((s) => s.admin);

  const [deletingProduct, setDeletingProduct] =
    useState<any>(null);

  const [contentModalOpen, setContentModalOpen] =
    useState(false);

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showVendorsBreakdownModal, setShowVendorsBreakdownModal] = useState(false);
  const [showProductsBreakdownModal, setShowProductsBreakdownModal] = useState(false);

  const filteredProducts = allProducts;
  const filteredOrders = orders;
  const filteredVendors = allVendors;

  const uniqueCategories = apiCategories.map((cat: any) => cat.name);

  // Helper wrappers to reset pages on filter/search change
  const handleProductSearchChange = (val: string) => {
    setProductSearch(val);
    setProductPage(1);
  };
  const handleProductCategoryChange = (val: string) => {
    setProductCategory(val);
    setProductPage(1);
  };
  const handleOrderSearchChange = (val: string) => {
    setOrderSearch(val);
    setOrderPage(1);
  };
  const handleOrderStatusChange = (val: string) => {
    setOrderStatus(val);
    setOrderPage(1);
  };
  const handleOrderDateFromChange = (val: string) => {
    setOrderDateFrom(val);
    setOrderPage(1);
  };
  const handleOrderDateToChange = (val: string) => {
    setOrderDateTo(val);
    setOrderPage(1);
  };
  const handleVendorSearchChange = (val: string) => {
    setVendorSearch(val);
    setVendorPage(1);
  };

  const loadStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }, [queryClient]);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10 animate-fadeUp">
        {/* HEADER */}
        <div className="mb-10 flex flex-row items-center justify-between gap-5 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6600]">
                Control Console
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
              Admin Panel
            </h1>
            <p className="mt-2 text-xs md:text-sm font-semibold text-gray-400">
              Real-time operational dashboard & marketplace configuration
            </p>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6600] to-[#FF8000] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#FF6600]/15 hover:shadow-glow cursor-pointer transition-all duration-300"
            >
              <Plus className="h-4.5 w-4.5" />
              Add Product
            </motion.button>

            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-3.5 font-bold text-red-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 cursor-pointer transition-all duration-300"
            >
              <LogOut className="h-4.5 w-4.5" />
              Logout
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex md:hidden items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 cursor-pointer"
          >
            <Menu className="h-4 w-4 text-[#FF6600]" />
            Menu
            {(pendingVendors + pendingProducts) > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6600] text-[9px] font-bold text-white animate-pulse">
                {pendingVendors + pendingProducts}
              </span>
            )}
          </button>
        </div>

        {/* MOBILE CONTROL DRAWER */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-80 max-w-[85vw] h-full bg-[#0a0a0a] border-l border-white/10 p-6 flex flex-col justify-between backdrop-blur-2xl shadow-2xl animate-fadeUp">
              <div className="space-y-8 overflow-y-auto max-h-[85vh] pr-1 scrollbar-thin">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#FF6600]" />
                    <span className="font-display text-base font-black text-white uppercase tracking-wider">
                      Controls
                    </span>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg p-1.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs / Navigation */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Dashboard Views
                  </div>
                  {[
                    { id: "orders", label: "Orders", count: orders.length },
                    { id: "products", label: "Products", count: allProducts.length },
                    { id: "vendors", label: "Vendors", count: allVendors.length },
                    { id: "users", label: "Users", count: usersData?.total_rows || 0 },
                  ].map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                          active
                            ? "bg-[#FF6600] text-white shadow-lg shadow-[#FF6600]/10"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-white/5 text-gray-500"}`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Modals / Action Shortcuts */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Quick Operations
                  </div>
                  <button
                    onClick={() => {
                      setShowAddProduct(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-cyan-400" />
                    Add Product
                  </button>

                  <button
                    onClick={() => {
                      setVendorModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="h-3.5 w-3.5 text-green-400" />
                      Vendor Requests
                    </span>
                    {pendingVendors > 0 && (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-black text-green-400">
                        {pendingVendors}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setProductModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Package className="h-3.5 w-3.5 text-orange-400" />
                      Product Requests
                    </span>
                    {pendingProducts > 0 && (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-black text-orange-400">
                        {pendingProducts}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCategoriesModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 cursor-pointer"
                  >
                    <ClipboardList className="h-3.5 w-3.5 text-cyan-400" />
                    Manage Categories
                  </button>

                  <button
                    onClick={() => {
                      setLocationsModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-amber-400" />
                    Manage Locations
                  </button>

                  <button
                    onClick={() => {
                      setContentModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/5 cursor-pointer"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 text-violet-400" />
                    Content Manager
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <button
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-3 text-sm font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="mb-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={<Package className="h-6 w-6 text-orange-400" />}
            count={dashboardStats?.products?.total || 0}
            label="Total Products"
            glowColor="rgba(249, 115, 22, 0.3)"
            accent="from-orange-500/10 to-transparent"
            action={
              <button
                onClick={() => setShowProductsBreakdownModal(true)}
                className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 cursor-pointer"
              >
                Split View
              </button>
            }
          />

          <StatCard
            icon={<Truck className="h-6 w-6 text-cyan-400" />}
            count={dashboardStats?.orders?.total || 0}
            label="Total Orders"
            glowColor="rgba(6, 182, 212, 0.3)"
            accent="from-cyan-500/10 to-transparent"
          />

          <StatCard
            icon={<IndianRupee className="h-6 w-6 text-emerald-400" />}
            count={
              dashboardStats?.orders?.revenue?.overall !== undefined
                ? `₹${dashboardStats.orders.revenue.overall.toLocaleString('en-IN')}`
                : "₹0"
            }
            label="Total Revenue"
            glowColor="rgba(16, 185, 129, 0.3)"
            accent="from-emerald-500/10 to-transparent"
            action={
              <button
                onClick={() => setShowRevenueModal(true)}
                className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 cursor-pointer"
              >
                Split View
              </button>
            }
          />

          <StatCard
            icon={<Users className="h-6 w-6 text-violet-400" />}
            count={dashboardStats?.vendors?.total || 0}
            label="Total Vendors"
            glowColor="rgba(139, 92, 246, 0.3)"
            accent="from-violet-500/10 to-transparent"
            action={
              <button
                onClick={() => setShowVendorsBreakdownModal(true)}
                className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 cursor-pointer"
              >
                Split View
              </button>
            }
          />

          <StatCard
            icon={<Users className="h-6 w-6 text-indigo-400" />}
            count={usersData?.total_rows || 0}
            label="Total Users"
            glowColor="rgba(99, 102, 241, 0.3)"
            accent="from-indigo-500/10 to-transparent"
          />
        </div>

        {/* ACTION BUTTONS / CONFIG CARDS */}
        <div className="mb-10 hidden md:grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <ActionButton
            icon={<Users className="h-5.5 w-5.5 text-emerald-400" />}
            label={`Vendor Requests (${pendingVendors})`}
            description="Review, verify and onboard pending seller applications."
            glowColor="rgba(16, 185, 129, 0.3)"
            onClick={() => setVendorModalOpen(true)}
          />

          <ActionButton
            icon={<ClipboardList className="h-5.5 w-5.5 text-cyan-400" />}
            label="Manage Categories"
            description="Configure catalog layout, tags, and product filters."
            glowColor="rgba(6, 182, 212, 0.3)"
            onClick={() => setCategoriesModalOpen(true)}
          />

          <ActionButton
            icon={<MapPin className="h-5.5 w-5.5 text-amber-400" />}
            label="Manage Locations"
            description="Organize cascading logistics trees for shipping."
            glowColor="rgba(245, 158, 11, 0.3)"
            onClick={() => setLocationsModalOpen(true)}
          />

          <ActionButton
            icon={<Package className="h-5.5 w-5.5 text-orange-400" />}
            label={`Product Requests (${pendingProducts})`}
            description="Approve new items before they reach customer search."
            glowColor="rgba(249, 115, 22, 0.3)"
            onClick={() => setProductModalOpen(true)}
          />

          <ActionButton
            icon={<LayoutTemplate className="h-5.5 w-5.5 text-violet-400" />}
            label="Content Management"
            description="Design hero promo sliders, highlights and active banners."
            glowColor="rgba(139, 92, 246, 0.3)"
            onClick={() => setContentModalOpen(true)}
          />
        </div>

        {/* TABS */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-10 hidden md:grid md:grid-cols-4 h-auto w-full gap-3 rounded-[28px] bg-white/[0.02] p-2 border border-white/5">
            <TabsTrigger
              value="orders"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-[#FF6600] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FF6600]/25 hover:text-white cursor-pointer"
            >
              Orders ({filteredOrders.length})
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-[#FF6600] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FF6600]/25 hover:text-white cursor-pointer"
            >
              Product Management ({filteredProducts.length})
            </TabsTrigger>

            <TabsTrigger
              value="vendors"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-[#FF6600] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FF6600]/25 hover:text-white cursor-pointer"
            >
              Vendor Management ({filteredVendors.length})
            </TabsTrigger>

            <TabsTrigger
              value="users"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-[#FF6600] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FF6600]/25 hover:text-white cursor-pointer"
            >
              User Management ({usersData?.total_rows || 0})
            </TabsTrigger>
          </TabsList>

          {/* ORDERS */}
          {activeTab === "orders" && (
            <TabsContent value="orders" className="animate-fadeIn">
              <Section title="Orders">
                {/* Search & Filter Row */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders by ID, customer name, phone, or vendor attribution..."
                      value={orderSearch}
                      onChange={(e) => handleOrderSearchChange(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-[#FF6600] transition-colors"
                    />
                  </div>
                  
                  {/* Filter Fields */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Status Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status:</span>
                      <Select
                        value={orderStatus}
                        onValueChange={handleOrderStatusChange}
                      >
                        <SelectTrigger className="w-[150px] h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF6600]">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="border border-white/10 bg-[#0a0a0a] text-white rounded-2xl">
                          <SelectItem value="all" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">All Statuses</SelectItem>
                          <SelectItem value="processing" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Processing</SelectItem>
                          <SelectItem value="shipped" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Shipped</SelectItem>
                          <SelectItem value="delivered" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Delivered</SelectItem>
                          <SelectItem value="cancelled" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date From */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From:</span>
                      <input
                        type="date"
                        value={orderDateFrom}
                        onChange={(e) => handleOrderDateFromChange(e.target.value)}
                        className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-[#FF6600] [color-scheme:dark] cursor-pointer"
                      />
                    </div>

                    {/* Date To */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To:</span>
                      <input
                        type="date"
                        value={orderDateTo}
                        onChange={(e) => handleOrderDateToChange(e.target.value)}
                        className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-[#FF6600] [color-scheme:dark] cursor-pointer"
                      />
                    </div>

                    {/* Reset Dates Button */}
                    {(orderDateFrom || orderDateTo) && (
                      <button
                        onClick={() => {
                          setOrderDateFrom("");
                          setOrderDateTo("");
                          setOrderPage(1);
                        }}
                        className="h-12 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 active:scale-95 cursor-pointer"
                      >
                        Reset Dates
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                      <ClipboardList className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                      <p className="text-sm text-gray-400 font-semibold">No orders found matching your criteria</p>
                    </div>
                  ) : (
                    filteredOrders.map((o) => (
                      <OrderRow
                        key={o.id}
                        order={o}
                      />
                    ))
                  )}
                </div>

                {ordersTotalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      disabled={orderPage === 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-400">
                      Page <strong className="text-white">{orderPage}</strong> of <strong className="text-white">{ordersTotalPages}</strong>
                    </span>
                    <button
                      onClick={() => setOrderPage((p) => Math.min(ordersTotalPages, p + 1))}
                      disabled={orderPage === ordersTotalPages}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </Section>
            </TabsContent>
          )}

          {/* PRODUCTS */}
          {activeTab === "products" && (
            <TabsContent value="products" className="animate-fadeIn">
              <Section title="Product Management">
                {/* Search & Filter Row */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products by name, category, or creator/vendor..."
                      value={productSearch}
                      onChange={(e) => handleProductSearchChange(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-[#FF6600]"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category:</span>
                    <Select
                      value={productCategory}
                      onValueChange={handleProductCategoryChange}
                    >
                      <SelectTrigger className="w-[180px] h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF6600] capitalize">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="border border-white/10 bg-[#0a0a0a] text-white rounded-2xl capitalize">
                        <SelectItem value="all" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">All Categories</SelectItem>
                        {uniqueCategories.map((cat: any) => (
                          <SelectItem key={cat} value={cat} className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg capitalize">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="w-full overflow-x-auto rounded-[2rem] border border-white/5 bg-[#0a0f1d]/40 backdrop-blur-md scrollbar-thin">
                  <Table>
                    <TableHeader className="bg-white/[0.02] border-b border-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 py-4.5 pl-6 font-bold tracking-wider">
                          Product
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Category
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Reviews
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Created By
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Selling Price
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Stock
                        </TableHead>

                        <TableHead className="text-right text-gray-400 py-4.5 pr-6 font-bold tracking-wider">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell
                            colSpan={7}
                            className="py-16 text-center text-gray-500 font-semibold"
                          >
                            No products found matching your search
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((p) => (
                          <TableRow
                            key={p.id}
                            className="border-white/5 hover:bg-white/[0.01] transition-colors"
                          >
                            <TableCell className="font-medium text-white py-4.5 pl-6">
                              <div className="flex items-center gap-3.5">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/10 shadow-inner">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/placeholder.png";
                                    }}
                                  />
                                </div>
                                <span className="font-extrabold tracking-wide text-white">
                                  {p.name}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="capitalize text-gray-300 font-semibold">
                              <span className="inline-flex items-center rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-300 border border-white/5">
                                {p.category}
                              </span>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1 font-bold text-yellow-500">
                                  <span className="text-sm">⭐</span>
                                  <span>{Number(p.average_rating || 0).toFixed(1)}</span>
                                </div>
                                <span className="text-[10px] font-medium text-gray-500">
                                  ({p.total_reviews || 0} reviews)
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-white tracking-wide uppercase">
                                  {p.created_by_type || "Vendor"}
                                </span>
                                <span className="text-[10px] font-semibold text-[#FF6600]/85">
                                  {p.creator_name || "Unknown"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-white">
                              <span className="text-base font-extrabold text-[#FF6600]">
                                ₹{p.price.toLocaleString('en-IN')}
                              </span>
                            </TableCell>

                            <TableCell className="font-medium text-gray-300">
                              {p.stock_quantity === 0 ? (
                                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-black text-red-400 border border-red-500/20">
                                  Out of Stock
                                </span>
                              ) : p.stock_quantity < 20 ? (
                                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-black text-amber-400 border border-amber-500/20">
                                  {p.stock_quantity} Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/20">
                                  {p.stock_quantity} In Stock
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-right py-4.5 pr-6">
                              <div className="flex justify-end gap-2.5">
                                <button
                                  onClick={() => setViewingProduct(p)}
                                  className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 transition hover:bg-cyan-500/20 cursor-pointer"
                                  title="View Details"
                                >
                                  <Search className="h-4.5 w-4.5" />
                                </button>

                                <button
                                  onClick={() => setEditingProduct(p)}
                                  className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>

                                <button
                                  onClick={() => setDeletingProduct(p)}
                                  className="rounded-xl bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20 cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {productsTotalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                      disabled={productPage === 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-400">
                      Page <strong className="text-white">{productPage}</strong> of <strong className="text-white">{productsTotalPages}</strong>
                    </span>
                    <button
                      onClick={() => setProductPage((p) => Math.min(productsTotalPages, p + 1))}
                      disabled={productPage === productsTotalPages}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </Section>
            </TabsContent>
          )}

          {/* VENDORS */}
          {activeTab === "vendors" && (
            <TabsContent value="vendors" className="animate-fadeIn">
              <Section title="Vendor Management">
                <div className="mb-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-[2.5rem] border border-yellow-500/10 bg-gradient-to-b from-yellow-500/5 to-transparent p-7 backdrop-blur-md">
                    <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">
                      Pending Requests
                    </p>
                    <h2 className="mt-2 text-4xl font-black text-white">
                      {dashboardStats?.vendors?.pending || 0}
                    </h2>
                  </div>

                  <div className="rounded-[2.5rem] border border-green-500/10 bg-gradient-to-b from-green-500/5 to-transparent p-7 backdrop-blur-md">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-widest">
                      Approved Vendors
                    </p>
                    <h2 className="mt-2 text-4xl font-black text-white">
                      {dashboardStats?.vendors?.active || 0}
                    </h2>
                  </div>
                </div>

                {/* Search Row */}
                <div className="mb-6 flex rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search active onboarded vendors by owner name, company name, or contact email..."
                      value={vendorSearch}
                      onChange={(e) => handleVendorSearchChange(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-[#FF6600]"
                    />
                  </div>
                </div>

                {/* APPROVED VENDORS */}
                <div className="w-full overflow-x-auto rounded-[2rem] border border-white/5 bg-[#0a0f1d]/40 backdrop-blur-md scrollbar-thin">
                  <Table>
                    <TableHeader className="bg-white/[0.02] border-b border-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 py-4.5 pl-6 font-bold tracking-wider">
                          Vendor
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Company
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Contact
                        </TableHead>

                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Status
                        </TableHead>

                        <TableHead className="text-right text-gray-400 py-4.5 pr-6 font-bold tracking-wider">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredVendors.filter((v) => Number(v.approved) === 1).length === 0 ? (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell
                            colSpan={5}
                            className="py-16 text-center text-gray-500 font-semibold"
                          >
                            No approved vendors found matching search criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVendors
                          .filter((v) => Number(v.approved) === 1)
                          .map((vendor) => (
                            <TableRow
                              key={vendor.id}
                              className="border-white/5 hover:bg-white/[0.01] transition-colors"
                            >
                              <TableCell className="font-extrabold text-white py-4.5 pl-6">
                                {vendor.vendor_name}
                              </TableCell>

                              <TableCell className="text-gray-300 font-semibold">
                                <div className="flex flex-col gap-0.5">
                                  <span>{vendor.company_name}</span>
                                  {vendor.city && vendor.state && (
                                    <span className="inline-flex items-center text-[10px] text-[#FF6600] font-bold">
                                      📍 {vendor.city}, {vendor.state}
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm text-gray-300 font-medium">
                                    {vendor.email}
                                  </span>
                                  <span className="text-xs text-gray-500 font-semibold">
                                    📞 {vendor.phone}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/20">
                                  Approved
                                </span>
                              </TableCell>

                              <TableCell className="text-right py-4.5 pr-6">
                                <button
                                  onClick={() => setViewingVendor(vendor)}
                                  className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 transition hover:bg-cyan-500/20 cursor-pointer"
                                  title="View Vendor Details"
                                >
                                  <Search className="h-4.5 w-4.5" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {vendorsTotalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setVendorPage((p) => Math.max(1, p - 1))}
                      disabled={vendorPage === 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-400">
                      Page <strong className="text-white">{vendorPage}</strong> of <strong className="text-white">{vendorsTotalPages}</strong>
                    </span>
                    <button
                      onClick={() => setVendorPage((p) => Math.min(vendorsTotalPages, p + 1))}
                      disabled={vendorPage === vendorsTotalPages}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </Section>
            </TabsContent>
          )}

          {/* USER MANAGEMENT */}
          {activeTab === "users" && (
            <TabsContent value="users" className="animate-fadeIn">
              <Section title="User Management">
                {/* Search & Filter Row */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search registered customers by name, email, phone, or user ID..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-[#FF6600]"
                    />
                  </div>

                  {/* Filter Field */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Classification:</span>
                    <Select
                      value={userStatusFilter}
                      onValueChange={(val) => {
                        setUserStatusFilter(val);
                        setUserPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-[#FF6600]">
                        <SelectValue placeholder="All Customers" />
                      </SelectTrigger>
                      <SelectContent className="border border-white/10 bg-[#0a0a0a] text-white rounded-2xl">
                        <SelectItem value="all" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">All Customers</SelectItem>
                        <SelectItem value="Premium Customer" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Premium Customers</SelectItem>
                        <SelectItem value="Frequent Buyer" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Frequent Buyers</SelectItem>
                        <SelectItem value="New Customer" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">New Customers</SelectItem>
                        <SelectItem value="Inactive User" className="cursor-pointer focus:bg-white/10 focus:text-white rounded-lg">Inactive Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* USERS TABLE */}
                <div className="w-full overflow-x-auto rounded-[2rem] border border-white/5 bg-[#0a0f1d]/40 backdrop-blur-md scrollbar-thin">
                  <Table>
                    <TableHeader className="bg-white/[0.02] border-b border-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 py-4.5 pl-6 font-bold tracking-wider">
                          Avatar
                        </TableHead>
                        <TableHead 
                          className="text-gray-400 py-4.5 font-bold tracking-wider cursor-pointer hover:text-white transition-colors"
                          onClick={() => {
                            setUserSortBy("id");
                            setUserSortOrder(p => p === "ASC" ? "DESC" : "ASC");
                          }}
                        >
                          User ID {userSortBy === "id" && (userSortOrder === "ASC" ? "▲" : "▼")}
                        </TableHead>
                        <TableHead 
                          className="text-gray-400 py-4.5 font-bold tracking-wider cursor-pointer hover:text-white transition-colors"
                          onClick={() => {
                            setUserSortBy("fullName");
                            setUserSortOrder(p => p === "ASC" ? "DESC" : "ASC");
                          }}
                        >
                          Full Name {userSortBy === "fullName" && (userSortOrder === "ASC" ? "▲" : "▼")}
                        </TableHead>
                        <TableHead 
                          className="text-gray-400 py-4.5 font-bold tracking-wider cursor-pointer hover:text-white transition-colors"
                          onClick={() => {
                            setUserSortBy("email");
                            setUserSortOrder(p => p === "ASC" ? "DESC" : "ASC");
                          }}
                        >
                          Email {userSortBy === "email" && (userSortOrder === "ASC" ? "▲" : "▼")}
                        </TableHead>
                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Phone
                        </TableHead>
                        <TableHead 
                          className="text-gray-400 py-4.5 font-bold tracking-wider cursor-pointer hover:text-white transition-colors"
                          onClick={() => {
                            setUserSortBy("total_orders");
                            setUserSortOrder(p => p === "ASC" ? "DESC" : "ASC");
                          }}
                        >
                          Orders {userSortBy === "total_orders" && (userSortOrder === "ASC" ? "▲" : "▼")}
                        </TableHead>
                        <TableHead 
                          className="text-gray-400 py-4.5 font-bold tracking-wider cursor-pointer hover:text-white transition-colors text-right"
                          onClick={() => {
                            setUserSortBy("total_spent");
                            setUserSortOrder(p => p === "ASC" ? "DESC" : "ASC");
                          }}
                        >
                          Total Spent {userSortBy === "total_spent" && (userSortOrder === "ASC" ? "▲" : "▼")}
                        </TableHead>
                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider text-center">
                          Addresses
                        </TableHead>
                        <TableHead 
                          className="text-gray-400 py-4.5 font-bold tracking-wider cursor-pointer hover:text-white transition-colors"
                          onClick={() => {
                            setUserSortBy("joined_date");
                            setUserSortOrder(p => p === "ASC" ? "DESC" : "ASC");
                          }}
                        >
                          Joined Date {userSortBy === "joined_date" && (userSortOrder === "ASC" ? "▲" : "▼")}
                        </TableHead>
                        <TableHead className="text-gray-400 py-4.5 font-bold tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="text-right text-gray-400 py-4.5 pr-6 font-bold tracking-wider">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {usersLoading ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                          <TableRow key={idx} className="border-white/5">
                            <TableCell colSpan={11} className="py-5 pl-6">
                              <div className="h-6 w-full animate-pulse rounded bg-white/5" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : allUsers.length === 0 ? (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell colSpan={11} className="py-16 text-center text-gray-500 font-semibold">
                            No registered users found matching filter criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        allUsers.map((user) => (
                          <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                            <TableCell className="py-4 pl-6">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-black text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]">
                                {user.fullName.charAt(0).toUpperCase()}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-500 font-bold">
                              #{user.id}
                            </TableCell>
                            <TableCell className="font-extrabold text-white">
                              {user.fullName}
                            </TableCell>
                            <TableCell className="text-gray-300 font-semibold">
                              {user.email}
                            </TableCell>
                            <TableCell className="text-gray-400 font-medium">
                              {user.phone || "N/A"}
                            </TableCell>
                            <TableCell className="font-extrabold text-white text-center">
                              {user.total_orders}
                            </TableCell>
                            <TableCell className="font-extrabold text-[#FF6600] text-right">
                              ₹{user.total_spent.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-gray-400 font-bold text-center">
                              {user.address_count}
                            </TableCell>
                            <TableCell className="text-gray-400 text-xs font-medium">
                              {user.joined_date ? new Date(user.joined_date).toLocaleDateString('en-IN') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <TableStatusBadge status={user.status} />
                            </TableCell>
                            <TableCell className="text-right py-4 pr-6">
                              <button
                                onClick={() => setViewingUser(user)}
                                className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 transition hover:bg-cyan-500/20 cursor-pointer"
                                title="View Customer Details"
                              >
                                <Search className="h-4.5 w-4.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {usersTotalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-400">
                      Page <strong className="text-white">{userPage}</strong> of <strong className="text-white">{usersTotalPages}</strong>
                    </span>
                    <button
                      onClick={() => setUserPage((p) => Math.min(usersTotalPages, p + 1))}
                      disabled={userPage === usersTotalPages}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </Section>
            </TabsContent>
          )}
        </Tabs>

        {/* MODALS */}
        {vendorModalOpen && createPortal(
          <VendorRequestsModal
            onClose={() =>
              setVendorModalOpen(false)
            }
            onVendorActioned={() => {
              loadStats();
            }}
          />,
          document.body
        )}

        {categoriesModalOpen && createPortal(
          <CategoriesModal
            onClose={() =>
              setCategoriesModalOpen(false)
            }
          />,
          document.body
        )}

        {locationsModalOpen && createPortal(
          <LocationsModal
            onClose={() =>
              setLocationsModalOpen(false)
            }
          />,
          document.body
        )}

        {productModalOpen && createPortal(
          <ProductRequestsModal
            onClose={() =>
              setProductModalOpen(false)
            }
            onProductActioned={() => {
              loadStats();
            }}
          />,
          document.body
        )}

        {showAddProduct && admin && createPortal(
          <AddProductModal
            vendorId="0"
            createdByType="admin"
            createdById={admin.id}
            onClose={() => {
              setShowAddProduct(false);
              loadStats();
            }}
          />,
          document.body
        )}

        {viewingProduct && createPortal(
          <ViewProductModal
            product={viewingProduct}
            onClose={() =>
              setViewingProduct(null)
            }
          />,
          document.body
        )}

        {editingProduct && createPortal(
          editingProduct.created_by_type === 'vendor' ? (
            <UpdateVendorProductModal
              product={editingProduct}
              onClose={() => {
                setEditingProduct(null);
                loadStats();
              }}
            />
          ) : (
            <UpdateProductModal
              product={editingProduct}
              vendorId="0"
              isAdmin={true}
              onClose={() => {
                setEditingProduct(null);
                loadStats();
              }}
            />
          ),
          document.body
        )}

        {viewingVendor && createPortal(
          <ViewVendorModal
            vendor={viewingVendor}
            onClose={() =>
              setViewingVendor(null)
            }
          />,
          document.body
        )}

        {viewingUser && createPortal(
          <ViewUserModal
            user={viewingUser}
            onClose={() => setViewingUser(null)}
          />,
          document.body
        )}

        {deletingProduct && createPortal(
          <DeleteProductModal
            product={deletingProduct}
            vendorId={deletingProduct.created_by_id || "0"}
            isAdmin={true}
            onClose={() => {
              setDeletingProduct(null);
              loadStats();
            }}
          />,
          document.body
        )}

        {contentModalOpen && createPortal(
          <HomeContentModal
            onClose={() => setContentModalOpen(false)}
          />,
          document.body
        )}

        {showRevenueModal && createPortal(
          <RevenueBreakdownModal
            stats={dashboardStats?.orders?.revenue || {}}
            onClose={() => setShowRevenueModal(false)}
          />,
          document.body
        )}

        {showVendorsBreakdownModal && createPortal(
          <VendorsBreakdownModal
            stats={dashboardStats?.vendors || {}}
            onClose={() => setShowVendorsBreakdownModal(false)}
          />,
          document.body
        )}

        {showProductsBreakdownModal && createPortal(
          <ProductsBreakdownModal
            stats={dashboardStats?.products || {}}
            onClose={() => setShowProductsBreakdownModal(false)}
          />,
          document.body
        )}
      </div>
    </Shell>
  );
}

/* ================= UI COMPONENTS ================= */

function ActionButton({
  icon,
  label,
  description,
  glowColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  glowColor: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 350, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      className="group flex flex-col justify-between items-start rounded-[32px] border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 text-left backdrop-blur-3xl transition-all duration-300 hover:border-white/15 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] h-full min-h-[190px] relative overflow-hidden"
    >
      {/* Corner glow orb */}
      <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-10 transition-all duration-500 group-hover:opacity-25 pointer-events-none"
        style={{ background: glowColor }}
      />
      
      {/* Layered icon container */}
      <div className="mb-4">
        <LayeredIconContainer
          icon={icon}
          glowColor={glowColor}
          baseColor="from-white/10 to-transparent"
        />
      </div>

      {/* Title & Description */}
      <div className="w-full">
        <div className="flex items-center gap-1.5 justify-between w-full">
          <span className="text-sm font-extrabold text-white tracking-wide leading-tight group-hover:text-[#FF6600] transition-colors duration-300">
            {label}
          </span>
          <Plus className="h-4 w-4 text-gray-500 transition-all duration-300 group-hover:text-[#FF6600] group-hover:rotate-90 group-hover:scale-110" />
        </div>

        <p className="mt-1 text-[11px] font-medium leading-normal text-gray-400">
          {description}
        </p>
      </div>
    </motion.button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10 rounded-[36px] border border-white/5 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 md:p-8 backdrop-blur-3xl shadow-2xl">
      <h2 className="mb-6 font-display text-2xl font-black text-white tracking-tight">
        {title}
      </h2>

      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  count,
  action,
  glowColor = "rgba(255, 102, 0, 0.3)",
  accent = "from-[#FF6600]/10 to-transparent",
}: {
  icon: React.ReactNode;
  label: string;
  count: number | string;
  action?: React.ReactNode;
  glowColor?: string;
  accent?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 350, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      className="relative rounded-[32px] border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/15 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] group"
    >
      {/* Visual background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      
      {/* Dynamic corner light flare */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full blur-2xl opacity-10 transition-all duration-500 group-hover:opacity-25 pointer-events-none"
        style={{ background: glowColor }}
      />
      
      <div className="mb-6 flex items-center justify-between">
        <LayeredIconContainer
          icon={icon}
          glowColor={glowColor}
          baseColor={accent}
        />
        {action && (
          <div className="scale-95 origin-right">
            {action}
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </div>
        <div className="font-display text-3xl md:text-4xl font-black tracking-tight text-white bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent drop-shadow-sm leading-none pt-1">
          {count}
        </div>
      </div>
    </motion.div>
  );
}

function TableStatusBadge({ status }: { status: string }) {
  if (status === "Premium Customer") {
    return (
      <span className="inline-flex items-center rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-violet-400 tracking-wider">
        Premium
      </span>
    );
  }
  if (status === "Frequent Buyer") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400 tracking-wider">
        Frequent
      </span>
    );
  }
  if (status === "Inactive User") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-red-400 tracking-wider">
        Inactive
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-cyan-400 tracking-wider">
      New
    </span>
  );
}

const ORDER_STATUSES = [
  "Processing",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const OrderRow = memo(
  ({ order }: { order: Order }) => {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState(
      order.status || "Processing"
    );

    const [estimatedDays, setEstimatedDays] = useState(
      (order as any).estimated_days || ""
    );

    const [updating, setUpdating] =
      useState(false);

    async function updateStatus(
      newStatus: string,
      newEstimatedDays?: string
    ) {
      try {
        setUpdating(true);

        const res = await fetch(
          "https://egnaromart.com/api/update-order-status.php",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              order_id: order.order_id,
              status: newStatus,
              estimated_days: newEstimatedDays,
            }),
          }
        );

        const data = await res.json();

        if (data.success) {
          setStatus(data.status || newStatus);
          if (data.estimated_days) setEstimatedDays(data.estimated_days);
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] });

          toast.success(
            "Order updated successfully"
          );
        } else {
          toast.error(
            data.message || "Failed"
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Server error");
      } finally {
        setUpdating(false);
      }
    }
    const parsedItems = Array.isArray(order.items)
      ? order.items
      : typeof order.items === "string"
      ? JSON.parse(order.items)
      : [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 hover:border-white/10 transition-all duration-300"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4.5 pb-4.5 border-b border-white/5">
              <div>
                <h3 className="font-display text-xl font-black text-white tracking-wide">
                  #{order.order_id}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Placed: {(order as any).created_at ? new Date((order as any).created_at).toLocaleDateString('en-IN') : 'N/A'} 
                  <span className="mx-2 text-gray-600">•</span> 
                  Estimated Delivery: <strong className="text-gray-300">{estimatedDays || 'Pending'}</strong>
                </p>
              </div>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400">
                {status}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* CUSTOMER INFO */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6600]">Customer</p>
                <p className="text-sm font-extrabold text-white">{order.customer_name}</p>
                <p className="text-xs text-gray-400">📞 {order.phone}</p>
                {(order as any).email && <p className="text-xs text-gray-400 break-all">✉️ {(order as any).email}</p>}
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mt-1.5 italic">📍 {order.address}</p>
              </div>

              {/* VENDOR ATTR */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6600]">Attributed Vendor</p>
                {(order as any).vendor_name ? (
                  <>
                    <p className="text-sm font-extrabold text-cyan-400">
                      {(order as any).vendor_name}
                    </p>
                    {(order as any).vendor_company && (
                      <p className="text-xs text-gray-300 font-medium">
                        🏢 {(order as any).vendor_company}
                      </p>
                    )}
                    {(order as any).vendor_phone && (
                      <p className="text-xs text-gray-400 mt-1.5">📞 {(order as any).vendor_phone}</p>
                    )}
                    {(order as any).vendor_email && (
                      <p className="text-xs text-gray-400 break-all">✉️ {(order as any).vendor_email}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500 italic">Egnaro Mart (Direct / Admin)</p>
                )}
              </div>

              {/* ORDER ITEMS */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6600]">Products Ordered</p>
                <div className="space-y-2">
                  {parsedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2 hover:bg-white/5 transition-colors">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-10 w-10 rounded-lg bg-black/20 object-cover border border-white/5" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-extrabold text-white">{item.name}</p>
                        <p className="text-[10px] text-gray-500">Qty: {item.quantity} × <span className="text-[#FF6600] font-bold">₹{item.price}</span></p>
                      </div>
                    </div>
                  ))}
                  {parsedItems.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No item data available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4.5 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Grand Total:</span>
                <span className="text-xl font-black text-[#FF6600]">₹{Number(order.total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="min-w-[250px] rounded-[2rem] bg-white/[0.02] p-5 border border-white/5">
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Update Order Status
            </label>

            <select
              value={status}
              disabled={updating}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatus(newStatus);
                updateStatus(newStatus);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all cursor-pointer mb-4"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Change Delivery Date
            </label>
            <input
              type="text"
              value={estimatedDays}
              disabled={updating}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="e.g. 21 May 2026"
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#FF6600] transition-all mb-3.5"
            />
            <button
              disabled={updating}
              onClick={() => updateStatus(status, estimatedDays)}
              className="w-full rounded-xl bg-cyan-500/20 py-2.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/30 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              Save Date
            </button>

            <p className="mt-3 text-[10px] text-gray-500 italic text-center">
              Reflected instantly in user portal.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
);

/* ================= MODAL COMPONENTS ================= */

function RevenueBreakdownModal({ stats = {}, onClose }: { stats?: any; onClose: () => void }) {
  const details = stats?.details;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
        >
          ✕
        </button>
        <h2 className="mb-6 text-2xl font-black text-white tracking-tight">Marketplace Revenue Split</h2>
        
        {details ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between rounded-2xl bg-white/5 p-4 border border-white/5">
              <span className="text-gray-400 font-semibold">Marketplace GMV</span>
              <span className="font-black text-white text-lg">₹{details.marketplace_gmv?.toLocaleString('en-IN') || 0}</span>
            </div>
            
            <div className="h-px bg-white/10 my-4" />
            
            <div className="flex justify-between rounded-2xl bg-cyan-500/10 p-4 border border-cyan-500/10">
              <span className="text-cyan-400 font-semibold">Platform Net Revenue (Admin)</span>
              <span className="font-black text-cyan-400 text-lg">₹{details.platform_revenue?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="pl-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>└ Admin Product Sales (100%)</span>
                <span>₹{details.admin_owned_sales?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>└ Vendor Commissions (10%)</span>
                <span>₹{details.vendors_commission?.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>

            <div className="flex justify-between rounded-2xl bg-[#0e2118] p-4 border border-[#16a34a]/20 mt-2">
              <span className="text-emerald-400 font-semibold">Vendor Earnings (90%)</span>
              <span className="font-black text-emerald-400 text-lg">₹{details.vendors_earning?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between rounded-xl bg-white/5 p-4 border border-white/5">
              <span className="text-gray-400">Total Revenue</span>
              <span className="font-bold text-white">₹{stats?.overall?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-cyan-500/10 p-4 border border-cyan-500/10">
              <span className="text-cyan-400">Egnaro Mart (Admin)</span>
              <span className="font-bold text-cyan-400">₹{stats?.admin?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/10">
              <span className="text-emerald-400">Vendors</span>
              <span className="font-bold text-emerald-400">₹{stats?.vendor?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function VendorsBreakdownModal({ stats = {}, onClose }: { stats?: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-sm rounded-[36px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>
        <h2 className="mb-6 text-2xl font-black text-white tracking-tight">Vendors Detail</h2>
        <div className="space-y-4">
          <div className="flex justify-between rounded-xl bg-white/5 p-4 border border-white/5">
            <span className="text-gray-400 font-semibold">Total Vendors</span>
            <span className="font-bold text-white text-lg">{stats?.total || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-green-500/10 p-4 border border-green-500/10">
            <span className="text-green-400 font-semibold">Active</span>
            <span className="font-bold text-green-400 text-lg">{stats?.active || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-orange-500/10 p-4 border border-orange-500/10">
            <span className="text-orange-400 font-semibold">Pending</span>
            <span className="font-bold text-orange-400 text-lg">{stats?.pending || 0}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProductsBreakdownModal({ stats = {}, onClose }: { stats?: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-sm rounded-[36px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>
        <h2 className="mb-6 text-2xl font-black text-white tracking-tight">Products Split</h2>
        <div className="space-y-4">
          <div className="flex justify-between rounded-xl bg-white/5 p-4 border border-white/5">
            <span className="text-gray-400 font-semibold">Total Products</span>
            <span className="font-bold text-white text-lg">{stats?.total || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-orange-500/10 p-4 border border-orange-500/10">
            <span className="text-orange-400 font-semibold">By Vendors</span>
            <span className="font-bold text-orange-400 text-lg">{stats?.by_vendor || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-cyan-500/10 p-4 border border-cyan-500/10">
            <span className="text-cyan-400 font-semibold">By Admin</span>
            <span className="font-bold text-cyan-400 text-lg">{stats?.by_admin || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-green-500/10 p-4 border border-green-500/10">
            <span className="text-green-400 font-semibold">Approved</span>
            <span className="font-bold text-green-400 text-lg">{stats?.approved || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-amber-500/10 p-4 border border-amber-500/10">
            <span className="text-amber-400 font-semibold">Pending Approval</span>
            <span className="font-bold text-amber-400 text-lg">{stats?.pending_approval || 0}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}