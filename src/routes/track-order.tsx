import { memo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search,
  Package,
  MapPin,
  Calendar,
  Phone,
  CheckCircle2,
  Truck,
  Box,
  ShieldCheck,
  Home,
  AlertTriangle,
  Clock3,
  Lock,
  LogIn,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { trackOrder, getUserOrders, getUser, updateProfile, manageAddress } from "@/services/api";
import { inr, dateTime, dateShort } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";
import { useAuth, selectIsLoggedIn } from "@/context/auth-store";

const STEPS: {
  id: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: "processing",
    label: "Processing",
    icon: Package,
  },
  {
    id: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
  },
  {
    id: "packed",
    label: "Packed",
    icon: Box,
  },
  {
    id: "shipped",
    label: "Shipped",
    icon: Truck,
  },
  {
    id: "out-for-delivery",
    label: "Out for Delivery",
    icon: ShieldCheck,
  },
  {
    id: "delivered",
    label: "Delivered",
    icon: Home,
  },
];

const VALID: OrderStatus[] = [
  "processing",
  "confirmed",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
];

function normalizeStatus(s?: string): OrderStatus {
  const v = s?.toLowerCase().trim();

  if (v === "out for delivery") {
    return "out-for-delivery";
  }

  if (VALID.includes(v as OrderStatus)) {
    return v as OrderStatus;
  }

  return "processing";
}

function buildOrder(raw: any): Order {
  return {
    id: raw.id,
    order_id: raw.order_id ?? String(raw.id ?? ""),
    status: normalizeStatus(raw.status),
    total: Number(raw.total ?? 0),

    createdAt:
      raw.created_at ?? new Date().toISOString(),

    estimatedDelivery:
      raw.estimated_days ??
      raw.estimated_delivery ??
      raw.created_at ??
      new Date().toISOString(),

    items: Array.isArray(raw.items)
      ? raw.items
      : typeof raw.items === "string"
      ? JSON.parse(raw.items)
      : [],

    history: Array.isArray(raw.history)
      ? raw.history
      : typeof raw.history === "string"
      ? JSON.parse(raw.history)
      : [
          {
            status: normalizeStatus(raw.status),
            at:
              raw.created_at ??
              new Date().toISOString(),
          },
        ],

    customer: {
      fullName: raw.customer_name ?? "Customer",
      phone: raw.phone ?? "",
      address: raw.address ?? "",
      city: "",
      state: "",
      pincode: "",
      email: "",
    },

    address: "",
    payment: "cod",
  };
}

export default function TrackOrder() {
  const inputRef = useRef<HTMLInputElement>(null);
  const token = useAuth((s) => s.token);
  const isLoggedIn = useAuth(selectIsLoggedIn);

  const [activeTab, setActiveTab] = useState<"orders" | "account">("orders");

  const [order, setOrder] = useState<
    Order | null | "none" | "login"
  >(null);

  const { data: userOrdersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["userOrders", token],
    queryFn: () => getUserOrders(token!),
    enabled: !!isLoggedIn && !!token,
  });

  const userOrders: Order[] = Array.isArray(userOrdersData?.orders)
    ? userOrdersData.orders.map(buildOrder)
    : [];

  const mutation = useMutation({
    mutationFn: () =>
      trackOrder(
        inputRef.current?.value.trim() ?? "",
        token ?? undefined
      ),

    onSuccess: (data: any) => {
      if (data?.message === "Missing token" || data?.message === "Invalid or expired token") {
        setOrder("login");
        return;
      }

      if (!data || data.success === false) {
        setOrder("none");
        return;
      }

      if (data.order) {
        setOrder(buildOrder(data.order));
      } else if (data.orders && data.orders.length > 0) {
        setOrder(buildOrder(data.orders[0]));
      } else {
        setOrder("none");
      }
    },

    onError: () => {
      setOrder("none");
    },
  });

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-4 py-10">
        
        {isLoggedIn && (
          <div className="mb-8 flex gap-6 border-b border-border">
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-3 text-base font-bold transition-colors ${activeTab === "orders" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              My Orders
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`pb-3 text-base font-bold transition-colors ${activeTab === "account" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              My Account
            </button>
          </div>
        )}

        <div className={activeTab === "orders" ? "block space-y-8" : "hidden"}>
          {/* Search */}
          <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="mb-1 font-display text-3xl font-black">
            Track Your Order 📦
          </h1>

          <p className="mb-6 text-sm text-muted-foreground">
            Enter your order ID or registered
            phone number.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (!inputRef.current?.value.trim()) return;

              if (!isLoggedIn) {
                setOrder("login");
                return;
              }

              mutation.mutate();
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

              <input
                ref={inputRef}
                defaultValue=""
                placeholder="Order ID or Phone Number"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="whitespace-nowrap rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {mutation.isPending
                ? "Tracking…"
                : "Track Order"}
            </button>
          </form>
        </div>

        {/* Login Required */}
        {order === "login" && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <Lock className="mx-auto mb-3 h-12 w-12 text-primary" />

            <h2 className="text-xl font-bold">
              Login Required
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Please login to your account to track your order details.
            </p>

            <Link
              to="/login?redirect=/track-order"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Login to Account
            </Link>
          </div>
        )}

        {/* Not found */}
        {order === "none" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-red-400" />

            <h2 className="text-xl font-bold text-red-800">
              Order Not Found
            </h2>

            <p className="mt-1 text-sm text-red-600">
              Please check your order ID or
              phone number.
            </p>
          </div>
        )}

        {/* User Orders List */}
        {!order && isLoggedIn && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your Orders</h2>
            {isLoadingOrders ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Loading orders…
              </div>
            ) : userOrders.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                You have no previous orders.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userOrders.map((uo: Order) => (
                  <div
                    key={uo.order_id}
                    onClick={() => setOrder(uo)}
                    className="cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Order ID</div>
                        <div className="font-bold">{uo.order_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Date</div>
                        <div className="text-sm font-semibold">{dateShort(uo.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className="mb-4 text-sm text-muted-foreground line-clamp-1">
                      {uo.items.length} {uo.items.length === 1 ? "item" : "items"}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary capitalize tracking-wide">
                        {uo.status.replace(/-/g, " ")}
                      </div>
                      <div className="font-black text-primary">{inr(uo.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order details */}
        {order && order !== "none" && order !== "login" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {isLoggedIn && (
              <button
                onClick={() => {
                  setOrder(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Back to Orders
              </button>
            )}
            <OrderDetails order={order as Order} />
          </div>
        )}
        </div>

        {activeTab === "account" && <AccountTab />}
      </div>
    </Shell>
  );
}

const AccountTab = memo(function AccountTab() {
  const token = useAuth((s) => s.token);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => getUser(token!),
    enabled: !!token,
  });

  const user = data?.user;

  const [editProfile, setEditProfile] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "Home", street: "", city: "", state: "", pincode: "" });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading account...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Profile Details */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Personal Information</h2>
          {!editProfile && (
            <div className="flex items-center gap-4">
              <Link 
                to="/login?step=forgot-email" 
                className="text-sm font-semibold text-muted-foreground hover:text-white transition-colors"
              >
                Reset Password
              </Link>
              <button
                onClick={() => {
                  setName(user.fullName);
                  setPhone(user.phone || "");
                  setEditProfile(true);
                }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {editProfile ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none bg-background" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none bg-background" />
            </div>
            <div className="col-span-full mt-2 flex justify-end gap-2">
              <button onClick={() => setEditProfile(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent">Cancel</button>
              <button onClick={async () => { await updateProfile(token!, name, phone); setEditProfile(false); refetch(); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">Save Changes</button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Full Name</div>
              <div className="font-semibold">{user.fullName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email Address</div>
              <div className="font-semibold">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Phone Number</div>
              <div className="font-semibold">{user.phone || "Not provided"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Addresses */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Saved Addresses</h2>
          <button onClick={() => setShowAddAddress(true)} className="text-sm font-semibold text-primary hover:underline">
            + Add New
          </button>
        </div>

        {showAddAddress && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            await manageAddress(token!, "add", newAddr);
            setShowAddAddress(false);
            setNewAddr({ label: "Home", street: "", city: "", state: "", pincode: "" });
            refetch();
          }} className="mb-8 rounded-lg border border-border bg-accent/50 p-4">
            <h3 className="mb-4 text-sm font-bold">Add New Address</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="col-span-full">
                <input required placeholder="Street Address" value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none bg-background" />
              </div>
              <input required placeholder="City" value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none bg-background" />
              <input required placeholder="State" value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none bg-background" />
              <input required placeholder="Pincode" value={newAddr.pincode} onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none bg-background" />
              <select value={newAddr.label} onChange={e => setNewAddr({...newAddr, label: e.target.value})} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none bg-background">
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddAddress(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-background">Cancel</button>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">Save Address</button>
            </div>
          </form>
        )}

        {user.addresses?.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">No addresses saved yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {user.addresses?.map((addr: any, i: number) => {
              const isDefault = i === user.default_address_index;
              return (
                <div key={i} className={`relative rounded-lg border p-4 ${isDefault ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                  {isDefault && <span className="absolute right-4 top-4 text-xs font-bold text-primary">Default</span>}
                  <div className="mb-2 font-bold">{addr.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {addr.street}<br/>
                    {addr.city}, {addr.state} {addr.pincode}
                  </div>
                  <div className="mt-4 flex gap-3 text-xs font-semibold">
                    {!isDefault && (
                      <button onClick={async () => { await manageAddress(token!, "set_default", { index: i }); refetch(); }} className="text-primary hover:underline">Set Default</button>
                    )}
                    <button onClick={async () => { await manageAddress(token!, "delete", { index: i }); refetch(); }} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

const OrderDetails = memo(function OrderDetails({
  order,
}: {
  order: Order;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Order ID
            </div>

            <h2 className="text-2xl font-black">
              {order.order_id}
            </h2>

            <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Est. Delivery:{" "}
              {["Cancelled", "Pending"].includes(order.estimatedDelivery) || isNaN(new Date(order.estimatedDelivery).getTime())
                ? order.estimatedDelivery
                : dateShort(order.estimatedDelivery)}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-xs text-muted-foreground">
              Total Amount
            </div>

            <div className="text-3xl font-black text-primary">
              {inr(order.total || 0)}
            </div>
          </div>
        </div>

        <div className="p-6">
          <Timeline
            current={order.status}
            history={order.history || []}
          />
        </div>
      </div>

      {/* Items + Shipping */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ItemsCard items={order.items} />

        <ShippingCard order={order} />
      </div>
    </div>
  );
});

const ItemsCard = memo(function ItemsCard({
  items,
}: {
  items: any[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />

        <h3 className="text-lg font-semibold">
          Ordered Items
        </h3>
      </div>

      {!items || items.length === 0 ? (
        <div className="rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">
          No items available
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <ItemRow key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
});

const ItemRow = memo(function ItemRow({
  item,
}: {
  item: any;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
          onError={(e) => {
            (
              e.target as HTMLImageElement
            ).style.display = "none";
          }}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-semibold">
          {item.name}
        </div>

        <div className="text-xs text-muted-foreground">
          Qty: {item.quantity}
        </div>

        <div className="font-bold text-primary">
          {inr(
            Number(item.price || 0) *
              Number(item.quantity || 1)
          )}
        </div>
      </div>
    </div>
  );
});

const ShippingCard = memo(
  function ShippingCard({
    order,
  }: {
    order: Order;
  }) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />

          <h3 className="text-lg font-semibold">
            Shipping Details
          </h3>
        </div>

        <div className="space-y-3">
          <InfoRow
            icon={Phone}
            label="Customer"
            value={
              order.customer?.fullName ||
              "N/A"
            }
            sub={order.customer?.phone}
          />

          <InfoRow
            icon={MapPin}
            label="Address"
            value={
              order.customer?.address ||
              "N/A"
            }
          />

          <InfoRow
            icon={Calendar}
            label="Placed"
            value={dateTime(order.createdAt)}
          />
        </div>
      </div>
    );
  }
);

const InfoRow = memo(function InfoRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border p-4">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">
          {label}
        </div>

        <div className="break-words text-sm font-semibold">
          {value}
        </div>

        {sub && (
          <div className="text-xs text-muted-foreground">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
});

const Timeline = memo(function Timeline({
  current,
  history,
}: {
  current: OrderStatus;
  history: {
    status: OrderStatus;
    at: string;
  }[];
}) {
  const idx = STEPS.findIndex(
    (s) => s.id === current
  );

  return (
    <div>
      {/* Desktop */}
      <div className="hidden grid-cols-6 gap-2 md:grid">
        {STEPS.map((step, i) => {
          const done = i <= idx;

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center"
            >
              {i < STEPS.length - 1 && (
                <div className="absolute left-[55%] top-4 h-0.5 w-full bg-border">
                  <div
                    className={`h-full ${
                      done
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  />
                </div>
              )}

              <div
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <step.icon className="h-4 w-4" />
              </div>

              <div
                className={`mt-2 text-center text-[10px] font-bold uppercase tracking-wide ${
                  done
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {STEPS.map((step, i) => {
          const done = i <= idx;

          const h = history.find(
            (x) => x.status === step.id
          );

          return (
            <div
              key={step.id}
              className="flex items-center gap-3"
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="h-4 w-4" />
              </div>

              <div>
                <div
                  className={`text-sm font-semibold ${
                    done
                      ? ""
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </div>

                {h && (
                  <div className="text-xs text-muted-foreground">
                    {dateTime(h.at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});