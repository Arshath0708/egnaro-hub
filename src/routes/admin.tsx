import { memo, useCallback, useEffect, useState } from "react";
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
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import AdminLogin from "@/components/AdminLogin";
import { CategoriesModal } from "@/modals/CategoriesModal";
import { VendorRequestsModal } from "@/modals/VendorRequestsModal";
import { ProductRequestsModal } from "@/modals/ProductRequestsModal";
import { AddProductModal } from "@/modals/AddProductModal";
import { UpdateProductModal } from "@/modals/UpdateProductModal";
import { UpdateVendorProductModal } from "@/modals/UpdateVendorProductModal";
import { DeleteProductModal } from "@/modals/DeleteProductModal";
import { ViewProductModal } from "@/modals/ViewProductModal";
import { ViewVendorModal } from "@/modals/ViewVendorModal";
import { HomeContentModal } from "@/modals/HomeContentModal";

import { useAuth, selectIsAdmin } from "@/context/auth-store";

import { toast } from "sonner";

import { 
  adminDeleteProduct,
  getProducts,
  getOrders,
  getVendors,
  getAdminStats
} from "@/services/api";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

/* ================= ADMIN PANEL ================= */

function AdminPanel({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();

  // Queries
  const { data: productsData = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getProducts,
  });

  const { data: ordersData = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getOrders,
  });

  const { data: vendorsData = [] } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: getVendors,
  });

  const { data: statsRes } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const allProducts = Array.isArray(productsData) ? productsData : [];
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const allVendors = Array.isArray(vendorsData) ? vendorsData : [];
  const pendingVendors = allVendors.filter((v: any) => Number(v.approved) === 0).length;
  const dashboardStats = statsRes || null;

  const [vendorModalOpen, setVendorModalOpen] =
    useState(false);

  const [productModalOpen, setProductModalOpen] =
    useState(false);

  const [categoriesModalOpen, setCategoriesModalOpen] =
    useState(false);

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [viewingProduct, setViewingProduct] =
    useState<any>(null);

  const [editingProduct, setEditingProduct] =
    useState<any>(null);

  const [viewingVendor, setViewingVendor] =
    useState<any>(null);

  const admin = useAuth((s) => s.admin);

  const [deletingProduct, setDeletingProduct] =
    useState<any>(null);

  const [contentModalOpen, setContentModalOpen] =
    useState(false);

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showVendorsBreakdownModal, setShowVendorsBreakdownModal] = useState(false);
  const [showProductsBreakdownModal, setShowProductsBreakdownModal] = useState(false);

  const loadStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }, [queryClient]);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Manage vendors, products &
              orders
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() =>
                setShowAddProduct(true)
              }
              className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-white transition-all hover:bg-cyan-600"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white transition-all hover:bg-red-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <StatCard
            icon={<Package />}
            count={dashboardStats?.products?.total || 0}
            label="Total Products"
            action={
              <button
                onClick={() => setShowProductsBreakdownModal(true)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white transition-all hover:bg-white/20"
              >
                View Split
              </button>
            }
          />

          <StatCard
            icon={<Truck />}
            count={dashboardStats?.orders?.total || 0}
            label="Total Orders"
          />

          <StatCard
            icon={<IndianRupee />}
            count={
              dashboardStats?.orders?.revenue?.overall !== undefined
                ? `₹${dashboardStats.orders.revenue.overall.toLocaleString('en-IN')}`
                : "₹0"
            }
            label="Total Revenue"
            action={
              <button
                onClick={() => setShowRevenueModal(true)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white transition-all hover:bg-white/20"
              >
                View Split
              </button>
            }
          />

          <StatCard
            icon={<Users />}
            count={dashboardStats?.vendors?.total || 0}
            label="Total Vendors"
            action={
              <button
                onClick={() => setShowVendorsBreakdownModal(true)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white transition-all hover:bg-white/20"
              >
                View Details
              </button>
            }
          />
        </div>

        {/* ACTION BUTTONS */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionButton
            icon={
              <Users className="h-5 w-5" />
            }
            label={`Vendor Requests (${pendingVendors})`}
            description="Review and approve / reject vendor registrations"
            accent="from-[#0B3D2E] to-[#14532d]"
            onClick={() =>
              setVendorModalOpen(true)
            }
          />

          <ActionButton
            icon={
              <Package className="h-5 w-5" />
            }
            label="Manage Categories"
            description="Create, update and delete categories"
            accent="from-cyan-700 to-cyan-500"
            onClick={() =>
              setCategoriesModalOpen(true)
            }
          />

          <ActionButton
            icon={
              <Package className="h-5 w-5" />
            }
            label="Product Requests"
            description="Review vendor submitted products"
            accent="from-[#1a0a00] to-[#3d1800]"
            onClick={() =>
              setProductModalOpen(true)
            }
          />

          <ActionButton
            icon={
              <LayoutTemplate className="h-5 w-5" />
            }
            label="Content Management"
            description="Edit hero section slides and banners"
            accent="from-violet-900 to-violet-700"
            onClick={() =>
              setContentModalOpen(true)
            }
          />
        </div>

        {/* TABS */}

        <Tabs
          defaultValue="orders"
          className="w-full"
        >
          <TabsList className="mb-6 flex flex-col sm:grid sm:grid-cols-3 h-auto w-full gap-2 rounded-[24px] bg-white/5 p-2 border border-white/10">
            <TabsTrigger
              value="orders"
              className="w-full rounded-[16px] py-3.5 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-[#FF6600] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FF6600]/20 hover:text-white"
            >
              Orders
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className="w-full rounded-[16px] py-3.5 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-[#FF6600] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FF6600]/20 hover:text-white"
            >
              Product Management
            </TabsTrigger>

            <TabsTrigger
              value="vendors"
              className="w-full rounded-[16px] py-3.5 font-bold transition-all duration-300 text-gray-400 data-[state=active]:bg-[#FF6600] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#FF6600]/20 hover:text-white"
            >
              Vendor Management
            </TabsTrigger>
          </TabsList>

          {/* ORDERS */}

          <TabsContent value="orders">
            <Section title="Orders">
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No orders yet
                  </p>
                ) : (
                  orders.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                    />
                  ))
                )}
              </div>
            </Section>
          </TabsContent>

          {/* PRODUCTS */}

          <TabsContent value="products">
            <Section title="Product Management">
              <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/5 scrollbar-thin">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-gray-400">
                        Product
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Category
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Reviews
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Created By
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Selling Price
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Stock
                      </TableHead>

                      <TableHead className="text-right text-gray-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {allProducts.length ===
                    0 ? (
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-gray-500"
                        >
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      allProducts.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-white/10 hover:bg-white/[0.02]"
                        >
                          <TableCell className="font-medium text-white">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-10 w-10 rounded-lg bg-white/10 object-cover"
                              />

                              <span>
                                {p.name}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="capitalize text-gray-300">
                            {p.category}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-yellow-500">
                                ⭐ {p.average_rating || 0}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({p.total_reviews || 0} reviews)
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium capitalize text-white">
                                {p.created_by_type || "Vendor"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {p.creator_name || "Unknown"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-white">
                            <span className="font-bold text-[#FF6600]">
                              ₹{p.price}
                            </span>
                          </TableCell>

                          <TableCell className="font-medium text-gray-300">
                            {p.stock_quantity !== undefined ? p.stock_quantity : 0}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  setViewingProduct(
                                    p
                                  )
                                }
                                className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 transition-colors hover:bg-cyan-500/20"
                              >
                                <Search className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() =>
                                  setEditingProduct(
                                    p
                                  )
                                }
                                className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() =>
                                  setDeletingProduct(
                                    p
                                  )
                                }
                                className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </TabsContent>

          {/* VENDORS */}

          <TabsContent value="vendors">
            <Section title="Vendor Management">
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
                  <p className="text-sm text-yellow-300">
                    Pending Requests
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-white">
                    {
                      allVendors.filter(
                        (v) =>
                          Number(
                            v.approved
                          ) === 0
                      ).length
                    }
                  </h2>
                </div>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
                  <p className="text-sm text-green-300">
                    Approved Vendors
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-white">
                    {
                      allVendors.filter(
                        (v) =>
                          Number(
                            v.approved
                          ) === 1
                      ).length
                    }
                  </h2>
                </div>
              </div>

              {/* APPROVED VENDORS */}

              <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/5 scrollbar-thin">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-gray-400">
                        Vendor
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Company
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Contact
                      </TableHead>

                      <TableHead className="text-gray-400">
                        Status
                      </TableHead>

                      <TableHead className="text-right text-gray-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {allVendors.filter(
                      (v) =>
                        Number(
                          v.approved
                        ) === 1
                    ).length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-gray-500"
                        >
                          No approved vendors
                        </TableCell>
                      </TableRow>
                    ) : (
                      allVendors
                        .filter(
                          (v) =>
                            Number(
                              v.approved
                            ) === 1
                        )
                        .map((vendor) => (
                          <TableRow
                            key={vendor.id}
                            className="border-white/10 hover:bg-white/[0.03]"
                          >
                            <TableCell className="font-medium text-white">
                              {
                                vendor.vendor_name
                              }
                            </TableCell>

                            <TableCell className="text-gray-300">
                              {
                                vendor.company_name
                              }
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-300">
                                  {
                                    vendor.email
                                  }
                                </span>

                                <span className="text-xs text-gray-500">
                                  {
                                    vendor.phone
                                  }
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                                Approved
                              </span>
                            </TableCell>

                            <TableCell className="text-right">
                              <button
                                onClick={() =>
                                  setViewingVendor(
                                    vendor
                                  )
                                }
                                className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 transition hover:bg-cyan-500/20"
                              >
                                <Search className="h-4 w-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Section>
          </TabsContent>
        </Tabs>

        {/* MODALS */}

        {vendorModalOpen && (
          <VendorRequestsModal
            onClose={() =>
              setVendorModalOpen(false)
            }
            onVendorActioned={() => {
              loadStats();
            }}
          />
        )}

        {categoriesModalOpen && (
          <CategoriesModal
            onClose={() =>
              setCategoriesModalOpen(false)
            }
          />
        )}

        {productModalOpen && (
          <ProductRequestsModal
            onClose={() =>
              setProductModalOpen(false)
            }
            onProductActioned={() => {
              loadStats();
            }}
          />
        )}

        {showAddProduct && admin && (
          <AddProductModal
            vendorId="0"
            createdByType="admin"
            createdById={admin.id}
            onClose={() => {
              setShowAddProduct(false);
              loadStats();
            }}
          />
        )}

        {viewingProduct && (
          <ViewProductModal
            product={viewingProduct}
            onClose={() =>
              setViewingProduct(null)
            }
          />
        )}

        {editingProduct && (
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
          )
        )}

        {viewingVendor && (
          <ViewVendorModal
            vendor={viewingVendor}
            onClose={() =>
              setViewingVendor(null)
            }
          />
        )}

        {deletingProduct && (
          <DeleteProductModal
            product={deletingProduct}
            vendorId={deletingProduct.created_by_id || "0"}
            isAdmin={true}
            onClose={() => {
              setDeletingProduct(null);
              loadStats();
            }}
          />
        )}

        {contentModalOpen && (
          <HomeContentModal
            onClose={() => setContentModalOpen(false)}
          />
        )}

        {showRevenueModal && dashboardStats && (
          <RevenueBreakdownModal
            stats={dashboardStats.orders?.revenue}
            onClose={() => setShowRevenueModal(false)}
          />
        )}

        {showVendorsBreakdownModal && dashboardStats && (
          <VendorsBreakdownModal
            stats={dashboardStats.vendors}
            onClose={() => setShowVendorsBreakdownModal(false)}
          />
        )}

        {showProductsBreakdownModal && dashboardStats && (
          <ProductsBreakdownModal
            stats={dashboardStats.products}
            onClose={() => setShowProductsBreakdownModal(false)}
          />
        )}
      </div>
    </Shell>
  );
}

/* ================= UI ================= */

function ActionButton({
  icon,
  label,
  description,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-2xl transition-all hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-[#FF6600] transition-transform group-hover:scale-110`}
      >
        {icon}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white">
            {label}
          </span>

          <ClipboardList className="h-4 w-4 text-[#FF6600] opacity-70" />
        </div>

        <p className="mt-0.5 text-xs text-gray-500">
          {description}
        </p>
      </div>
    </button>
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
    <div className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
      <h2 className="mb-5 text-2xl font-bold text-white">
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
}: {
  icon: React.ReactNode;
  label: string;
  count: number | string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B3D2E] text-[#FF6600]">
        {icon}
      </div>

      <div className="text-3xl font-black text-white">
        {count}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-gray-400">{label}</span>
        {action}
      </div>
    </div>
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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-black text-white">
                  #{order.order_id}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Placed: {(order as any).created_at ? new Date((order as any).created_at).toLocaleDateString('en-IN') : 'N/A'} 
                  <span className="mx-2">•</span> 
                  Estimated Delivery: {estimatedDays || 'Pending'}
                </p>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-400">
                {status}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* CUSTOMER INFO */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Customer</p>
                <p className="text-sm font-semibold text-white">{order.customer_name}</p>
                <p className="text-xs text-gray-400">{order.phone}</p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">{order.address}</p>
              </div>

              {/* ORDER ITEMS */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Products Ordered</p>
                <div className="space-y-2">
                  {parsedItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2 transition-colors hover:bg-white/5">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-10 w-10 rounded-lg bg-black/20 object-cover border border-white/5" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                  {parsedItems.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No item data available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Grand Total:</span>
                <span className="text-lg font-black text-primary">₹{Number(order.total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="min-w-[240px] rounded-2xl bg-white/[0.02] p-4 border border-white/5">
            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
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
              className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all cursor-pointer mb-4"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Change Delivery Date
            </label>
            <input
              type="text"
              value={estimatedDays}
              disabled={updating}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="e.g. 21 May 2026"
              className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary transition-all mb-2"
            />
            <button
              disabled={updating}
              onClick={() => updateStatus(status, estimatedDays)}
              className="w-full rounded-xl bg-cyan-500/20 py-2 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/30 disabled:opacity-50"
            >
              Save Date
            </button>

            <p className="mt-3 text-[10px] text-gray-600 italic">
              Changes reflect instantly in the user's tracking portal.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

function RevenueBreakdownModal({ stats, onClose }: { stats: any; onClose: () => void }) {
  if (!stats) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="mb-6 text-2xl font-bold text-white">Revenue Split</h2>
        <div className="space-y-4">
          <div className="flex justify-between rounded-xl bg-white/5 p-4">
            <span className="text-gray-400">Total Revenue</span>
            <span className="font-bold text-white">₹{stats.overall?.toLocaleString('en-IN') || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-cyan-500/10 p-4">
            <span className="text-cyan-400">Egnaro Mart (Admin)</span>
            <span className="font-bold text-cyan-400">₹{stats.admin?.toLocaleString('en-IN') || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-[#0B3D2E] p-4">
            <span className="text-[#FF6600]">Vendors</span>
            <span className="font-bold text-[#FF6600]">₹{stats.vendor?.toLocaleString('en-IN') || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorsBreakdownModal({ stats, onClose }: { stats: any; onClose: () => void }) {
  if (!stats) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="mb-6 text-2xl font-bold text-white">Vendors Detail</h2>
        <div className="space-y-4">
          <div className="flex justify-between rounded-xl bg-white/5 p-4">
            <span className="text-gray-400">Total Vendors</span>
            <span className="font-bold text-white">{stats.total || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-green-500/10 p-4">
            <span className="text-green-400">Active</span>
            <span className="font-bold text-green-400">{stats.active || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-orange-500/10 p-4">
            <span className="text-orange-400">Pending</span>
            <span className="font-bold text-orange-400">{stats.pending || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsBreakdownModal({ stats, onClose }: { stats: any; onClose: () => void }) {
  if (!stats) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="mb-6 text-2xl font-bold text-white">Products Split</h2>
        <div className="space-y-4">
          <div className="flex justify-between rounded-xl bg-white/5 p-4">
            <span className="text-gray-400">Total Products</span>
            <span className="font-bold text-white">{stats.total || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-[#0B3D2E] p-4">
            <span className="text-[#FF6600]">By Vendors</span>
            <span className="font-bold text-[#FF6600]">{stats.by_vendor || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-cyan-500/10 p-4">
            <span className="text-cyan-400">By Admin</span>
            <span className="font-bold text-cyan-400">{stats.by_admin || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-green-500/10 p-4">
            <span className="text-green-400">Approved</span>
            <span className="font-bold text-green-400">{stats.approved || 0}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-orange-500/10 p-4">
            <span className="text-orange-400">Pending</span>
            <span className="font-bold text-orange-400">{stats.pending_approval || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}