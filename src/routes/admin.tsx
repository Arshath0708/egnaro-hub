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
import { clearUserSession } from "@/lib/session";

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
  getUsers,
  updateOrderStatus,
  getPendingProducts,
  getPendingVendors,
  getSupportRequests,
  handleSupportRequest
} from "@/services/api";
import { queryKeys, QUERY_KEYS } from "@/lib/query-keys";
import { sanitizeInput } from "@/lib/validation";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

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
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none backdrop-blur-xl transition-all focus:border-primary";

export default function AdminPage() {
  const isAdmin = useAuth(selectIsAdmin);
  const queryClient = useQueryClient();

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return <AdminPanel onLogout={() => clearUserSession(queryClient)} />;
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

// Custom hook to debounce state values
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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

  // Debounced search queries to avoid frame drops and API request storms on typing
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedOrderSearch = useDebounce(orderSearch, 300);
  const debouncedVendorSearch = useDebounce(vendorSearch, 300);
  const debouncedUserSearch = useDebounce(userSearch, 300);

  const [activeTab, setActiveTab] = useState("orders");
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportStatusFilter, setSupportStatusFilter] = useState("all");
  const [supportTypeFilter, setSupportTypeFilter] = useState("all");

  // Standard active queries to ensure order, product, vendor, and user list counts are synchronized immediately on load
  const { data: productsData } = useQuery({
    queryKey: queryKeys.adminProducts(productPage, productCategory, debouncedProductSearch),
    queryFn: () => getProducts({
      page: productPage,
      limit: 10,
      category: productCategory === "all" ? "" : productCategory,
      search: debouncedProductSearch,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: ordersData } = useQuery({
    queryKey: queryKeys.adminOrders(orderPage, orderStatus, debouncedOrderSearch, orderDateFrom, orderDateTo),
    queryFn: () => getOrders({
      page: orderPage,
      limit: 10,
      status: orderStatus === "all" ? "" : orderStatus,
      search: debouncedOrderSearch,
      date_from: orderDateFrom,
      date_to: orderDateTo,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: vendorsData } = useQuery({
    queryKey: queryKeys.adminVendors(vendorPage, debouncedVendorSearch),
    queryFn: () => getVendors({
      page: vendorPage,
      limit: 10,
      search: debouncedVendorSearch,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.adminUsers(userPage, debouncedUserSearch, userStatusFilter, userSortBy, userSortOrder),
    queryFn: () => getUsers({
      page: userPage,
      limit: 10,
      search: debouncedUserSearch,
      status: userStatusFilter === "all" ? "" : userStatusFilter,
      sortBy: userSortBy,
      sortOrder: userSortOrder,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: statsRes } = useQuery({
    queryKey: queryKeys.adminStats(),
    queryFn: getAdminStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: apiCategories = [] } = useQuery({
    queryKey: queryKeys.adminCategories(),
    queryFn: getCategories,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const allProducts = (productsData?.products || []) as any[];
  const orders = (ordersData?.orders || []) as any[];
  const allVendors = (vendorsData?.vendors || []) as any[];
  const allUsers = (usersData?.users || []) as any[];

  const dashboardStats = statsRes || null;

  const { data: pendingVendorsData } = useQuery({
    queryKey: queryKeys.pendingVendors(),
    queryFn: getPendingVendors,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: pendingProductsData } = useQuery({
    queryKey: queryKeys.pendingProducts(),
    queryFn: getPendingProducts,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const pendingVendors = pendingVendorsData?.length || 0;
  const pendingProducts = pendingProductsData?.length || 0;

  const { data: supportRequestsRes } = useQuery({
    queryKey: queryKeys.adminSupportRequests(),
    queryFn: () => getSupportRequests(),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
  const supportRequests = supportRequestsRes?.requests || [];

  const [viewingSupportRequest, setViewingSupportRequest] = useState<any | null>(null);

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

  const filteredSupportRequests = supportRequests.filter((req: any) => {
    if (supportStatusFilter !== "all" && req.status !== supportStatusFilter) return false;
    if (supportTypeFilter !== "all" && req.request_type !== supportTypeFilter) return false;
    return true;
  });

  const uniqueCategories = apiCategories.map((cat: any) => cat.name);

  // Helper wrappers to reset pages on filter/search change
  const handleProductSearchChange = (val: string) => {
    setProductSearch(sanitizeInput(val));
    setProductPage(1);
  };
  const handleProductCategoryChange = (val: string) => {
    setProductCategory(val);
    setProductPage(1);
  };
  const handleOrderSearchChange = (val: string) => {
    setOrderSearch(sanitizeInput(val));
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
    setVendorSearch(sanitizeInput(val));
    setVendorPage(1);
  };

  const loadStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PRODUCTS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_ORDERS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_VENDORS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CATEGORIES] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_USERS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_PRODUCTS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_VENDORS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SUPPORT_REQUESTS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_ALL] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_PRODUCTS_PAGINATED] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_STATS] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
  }, [queryClient]);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10 animate-fadeUp">
        {/* HEADER */}
        <div className="mb-10 flex flex-row items-center justify-between gap-5 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
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
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-hover px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/15 hover:shadow-glow cursor-pointer transition-all duration-300"
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
            <Menu className="h-4 w-4 text-primary" />
            Menu
            {(pendingVendors + pendingProducts) > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white animate-pulse">
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
                    <Shield className="h-5 w-5 text-primary" />
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
                    { id: "support", label: "Support Requests", count: supportRequests.length },
                  ].map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${active
                          ? "bg-primary text-white shadow-lg shadow-primary/10"
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
          <TabsList className="mb-10 hidden md:grid md:grid-cols-3 lg:grid-cols-5 h-auto w-full gap-3 rounded-[28px] bg-white/[0.02] p-2 border border-white/5">
            <TabsTrigger
              value="orders"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 hover:text-white cursor-pointer"
            >
              Orders ({filteredOrders.length})
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 hover:text-white cursor-pointer"
            >
              Products ({filteredProducts.length})
            </TabsTrigger>

            <TabsTrigger
              value="vendors"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 hover:text-white cursor-pointer"
            >
              Vendors ({filteredVendors.length})
            </TabsTrigger>

            <TabsTrigger
              value="users"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 hover:text-white cursor-pointer"
            >
              Users ({usersData?.total_rows || 0})
            </TabsTrigger>

            <TabsTrigger
              value="support"
              className="w-full rounded-[20px] py-4 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 hover:text-white cursor-pointer"
            >
              Support ({supportRequests.length})
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
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-primary transition-colors"
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
                        <SelectTrigger className="w-[150px] h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-primary">
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
                        className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-primary [color-scheme:dark] cursor-pointer"
                      />
                    </div>

                    {/* Date To */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To:</span>
                      <input
                        type="date"
                        value={orderDateTo}
                        onChange={(e) => handleOrderDateToChange(e.target.value)}
                        className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-primary [color-scheme:dark] cursor-pointer"
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
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category:</span>
                    <Select
                      value={productCategory}
                      onValueChange={handleProductCategoryChange}
                    >
                      <SelectTrigger className="w-[180px] h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-primary capitalize">
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
                        <TableHead className="sticky left-0 bg-[#0b0e17] z-20 text-gray-400 py-4.5 pl-6 font-bold tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
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
                            <TableCell className="sticky left-0 bg-[#0b0e17] z-10 font-medium text-white py-4.5 pl-6 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
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
                                <span className="text-[10px] font-semibold text-primary/85">
                                  {p.creator_name || "Unknown"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-white">
                              <span className="text-base font-extrabold text-primary">
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
                      {dashboardStats?.vendors?.active || ((dashboardStats?.vendors?.total || 0) - (dashboardStats?.vendors?.pending || 0))}
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
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* APPROVED VENDORS */}
                <div className="w-full overflow-x-auto rounded-[2rem] border border-white/5 bg-[#0a0f1d]/40 backdrop-blur-md scrollbar-thin">
                  <Table>
                    <TableHeader className="bg-white/[0.02] border-b border-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="sticky left-0 bg-[#0b0e17] z-20 text-gray-400 py-4.5 pl-6 font-bold tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
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
                              <TableCell className="sticky left-0 bg-[#0b0e17] z-10 font-extrabold text-white py-4.5 pl-6 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                {vendor.vendor_name}
                              </TableCell>

                              <TableCell className="text-gray-300 font-semibold">
                                <div className="flex flex-col gap-0.5">
                                  <span>{vendor.company_name}</span>
                                  {vendor.city && vendor.state && (
                                    <span className="inline-flex items-center text-[10px] text-primary font-bold">
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
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-13 pr-4 text-sm text-white outline-none focus:border-primary"
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
                      <SelectTrigger className="w-[180px] h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-primary">
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
                        <TableHead className="sticky left-0 bg-[#0b0e17] z-20 text-gray-400 py-4.5 pl-6 font-bold tracking-wider shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
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
                            <TableCell className="sticky left-0 bg-[#0b0e17] z-10 py-4 pl-6 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
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
                            <TableCell className="font-extrabold text-primary text-right">
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

          {activeTab === "support" && (
            <TabsContent value="support" className="animate-fadeIn">
              <Section title="Vendor Support Center">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Filter Status</label>
                    <Select value={supportStatusFilter} onValueChange={setSupportStatusFilter}>
                      <SelectTrigger className="h-11 rounded-xl border-white/10 bg-slate-950/40 text-white">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Request Type</label>
                    <Select value={supportTypeFilter} onValueChange={setSupportTypeFilter}>
                      <SelectTrigger className="h-11 rounded-xl border-white/10 bg-slate-950/40 text-white">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Delivery Date Change">Delivery Date Change</SelectItem>
                        <SelectItem value="Order Issue">Order Issue</SelectItem>
                        <SelectItem value="Inventory Issue">Inventory Issue</SelectItem>
                        <SelectItem value="Courier Issue">Courier Issue</SelectItem>
                        <SelectItem value="General Message">General Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredSupportRequests.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">
                    <svg className="mx-auto mb-4 h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="font-semibold text-gray-400">No support requests match the filters</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40">
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-b border-white/5 hover:bg-transparent">
                          <TableHead className="sticky left-0 bg-[#0b0e17] z-20 py-4 pl-6 text-xs font-bold text-gray-400 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Vendor</TableHead>
                          <TableHead className="py-4 text-xs font-bold text-gray-400">Type</TableHead>
                          <TableHead className="py-4 text-xs font-bold text-gray-400">Context / Details</TableHead>
                          <TableHead className="py-4 text-xs font-bold text-gray-400">Submitted At</TableHead>
                          <TableHead className="py-4 text-xs font-bold text-gray-400">Status</TableHead>
                          <TableHead className="py-4 pr-6 text-right text-xs font-bold text-gray-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSupportRequests.map((req: any) => (
                          <TableRow key={req.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                            <TableCell className="sticky left-0 bg-[#0b0e17] z-10 py-4 pl-6 font-extrabold text-white shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                              {req.vendor_company_name || `ID: ${req.vendor_id}`}
                            </TableCell>
                            <TableCell className="font-semibold text-white">
                              {req.request_type}
                            </TableCell>
                            <TableCell className="text-gray-300 max-w-xs truncate">
                              {req.order_id && (
                                <span className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 mr-2 font-mono text-gray-400">
                                  Order #{req.order_id}
                                </span>
                              )}
                              {req.request_type === "Delivery Date Change"
                                ? `${req.current_delivery_date} → ${req.requested_delivery_date}`
                                : req.subject || req.message}
                            </TableCell>
                            <TableCell className="text-gray-400 text-xs font-medium">
                              {new Date(req.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                req.status === "Approved" 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : req.status === "Rejected"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              }`}>
                                {req.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-4 pr-6">
                              <button
                                onClick={() => setViewingSupportRequest(req)}
                                className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                                  req.status === "Pending"
                                    ? "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/10"
                                    : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                                }`}
                              >
                                {req.status === "Pending" ? "Review" : "View"}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

        {viewingSupportRequest && createPortal(
          <AdminSupportReviewModal
            request={viewingSupportRequest}
            onClose={() => setViewingSupportRequest(null)}
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
          <span className="text-sm font-extrabold text-white tracking-wide leading-tight group-hover:text-primary transition-colors duration-300">
            {label}
          </span>
          <Plus className="h-4 w-4 text-gray-500 transition-all duration-300 group-hover:text-primary group-hover:rotate-90 group-hover:scale-110" />
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
  accent = "from-primary/10 to-transparent",
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

        const data = await updateOrderStatus(
          order.order_id,
          newStatus,
          newEstimatedDays
        );

        if (data.success) {
          setStatus(data.status || newStatus);
          if (data.estimated_days) setEstimatedDays(data.estimated_days);
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] }),
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_ORDERS] }),
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRACK_ORDER] }),
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_ORDERS] }),
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] }),
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_ORDERS] }),
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_STATS] }),
          ]);

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
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Customer</p>
                <p className="text-sm font-extrabold text-white">{order.customer_name}</p>
                <p className="text-xs text-gray-400">📞 {order.phone}</p>
                {(order as any).email && <p className="text-xs text-gray-400 break-all">✉️ {(order as any).email}</p>}
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mt-1.5 italic">📍 {order.address}</p>
              </div>

              {/* VENDOR ATTR */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Attributed Vendor</p>
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Products Ordered</p>
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
                        <p className="text-[10px] text-gray-500">Qty: {item.quantity} × <span className="text-primary font-bold">₹{item.price}</span></p>
                      </div>
                    </div>
                  ))}
                  {parsedItems.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No item data available</p>
                  )}
                </div>
              </div>
            </div>

            {((order as any).courier_partner || (order as any).tracking_number) && (
              <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-wrap gap-6">
                {((order as any).courier_partner) && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Courier Partner</span>
                    <span className="text-xs text-white font-semibold mt-0.5 block">{(order as any).courier_partner}</span>
                  </div>
                )}
                {((order as any).tracking_number) && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Tracking Number</span>
                    <span className="text-xs text-white font-semibold mt-0.5 block">{(order as any).tracking_number}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-4.5 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Grand Total:</span>
                <span className="text-xl font-black text-primary">₹{Number(order.total).toLocaleString('en-IN')}</span>
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
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all mb-3.5"
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
            <span className="font-bold text-green-400 text-lg">{stats?.active || ((stats?.total || 0) - (stats?.pending || 0))}</span>
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

function AdminSupportReviewModal({
  request,
  onClose,
}: {
  request: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [adminNote, setAdminNote] = useState("");
  const isPending = request.status === "Pending";

  const actionMutation = useMutation({
    mutationFn: async (action: "approve" | "reject") => {
      const res = await handleSupportRequest({
        request_id: Number(request.id),
        action,
        admin_note: adminNote,
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to process request");
      }
      return res;
    },
    onSuccess: (data: any, action: "approve" | "reject") => {
      toast.success(`Request successfully ${action === "approve" ? "approved" : "rejected"}!`);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SUPPORT_REQUESTS] });
      if (request.request_type === "Delivery Date Change") {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_ORDERS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_STATS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VENDOR_ORDERS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRACK_ORDER] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_ORDERS] });
      }
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred.");
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-lg rounded-[36px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>

        <h2 className="mb-6 text-2xl font-black text-white tracking-tight">Review Support Request</h2>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Vendor</span>
            <span className="text-white font-bold">
              {request.vendor_company_name || `ID: ${request.vendor_id}`}
            </span>
          </div>

          <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Request Type</span>
            <span className="text-white font-bold">{request.request_type}</span>
          </div>

          {request.order_id && (
            <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Order ID</span>
              <span className="text-primary font-bold">#{request.order_id}</span>
            </div>
          )}

          {request.request_type === "Delivery Date Change" && (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Current delivery date on Order:</span>
                <span className="text-gray-300 font-bold">{request.current_delivery_date}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Requested new delivery date:</span>
                <span className="text-primary font-bold">{request.requested_delivery_date}</span>
              </div>
              <div className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 rounded-xl p-2.5 mt-2 border border-amber-500/10">
                ⚠ Note: Approving this will immediately update the Order's estimated delivery date to "{request.requested_delivery_date}" in the database.
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Details / Description</span>
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-xs text-gray-300 leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-line">
              {request.message || request.subject || "No details provided"}
            </div>
          </div>

          {isPending ? (
            <div className="space-y-3 pt-2">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block font-bold">Admin Note / Response</span>
              <textarea
                placeholder="Provide a reason for approval/rejection or instructions for the vendor..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white outline-none focus:border-primary placeholder:text-gray-600 transition resize-none"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => actionMutation.mutate("reject")}
                  disabled={actionMutation.isPending}
                  className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-5 py-3 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => actionMutation.mutate("approve")}
                  disabled={actionMutation.isPending}
                  className="rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:scale-[1.02] transition disabled:opacity-50 cursor-pointer"
                >
                  Approve & Update
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Status</span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  request.status === "Approved" 
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {request.status}
                </span>
              </div>
              {request.admin_note && (
                <div className="space-y-1">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Admin Response Note</span>
                  <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                    {request.admin_note}
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-300 hover:bg-white/10 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}