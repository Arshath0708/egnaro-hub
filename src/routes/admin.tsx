import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, Users, Package, ShoppingBag, IndianRupee, Check, X, Truck } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/auth-store";
import { api } from "@/services/api";
import { inr, dateShort } from "@/lib/format";
import { toast } from "sonner";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Egnaro Mart" }] }),
  component: Admin,
});

const STATUSES: OrderStatus[] = ["processing", "confirmed", "packed", "shipped", "out-for-delivery", "delivered"];

function Admin() {
  const { isAdmin, loginAdmin, logoutAdmin } = useAuth();
  if (!isAdmin) return <AdminLogin onLogin={loginAdmin} />;
  return <AdminPanel onLogout={logoutAdmin} />;
}

function AdminLogin({ onLogin }: { onLogin: (u: string, p: string) => boolean }) {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("");
  const inp = "w-full bg-secondary/60 border border-glass-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring";
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-20">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong rounded-3xl p-10 shadow-elegant">
          <div className="h-14 w-14 rounded-2xl gradient-accent grid place-items-center mb-5 shadow-glow-accent"><Shield className="h-7 w-7 text-accent-foreground" /></div>
          <h1 className="font-display text-3xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Enterprise control panel</p>
          <form onSubmit={(e) => { e.preventDefault(); if (!onLogin(u, p)) toast.error("Invalid credentials"); }} className="space-y-3">
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Username</span><input required className={inp} value={u} onChange={(e) => setU(e.target.value)} /></label>
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Password</span><input required type="password" className={inp} value={p} onChange={(e) => setP(e.target.value)} /></label>
            <button className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-glow shimmer">Sign In</button>
          </form>
          <div className="mt-5 text-xs text-muted-foreground text-center">Demo: <code className="text-primary">admin</code> / <code className="text-primary">egnaro@2025</code></div>
        </motion.div>
      </div>
    </Shell>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "vendors" | "products" | "orders">("overview");

  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: () => api.getVendors() });
  const { data: products = [] } = useQuery({ queryKey: ["all-products"], queryFn: () => api.getProducts() });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => api.getOrders() });

  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const pendingProducts = products.filter((p) => !p.approved);
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  const setVendor = useMutation({ mutationFn: ({ id, s }: { id: string; s: any }) => api.setVendorStatus(id, s), onSuccess: () => { qc.invalidateQueries({ queryKey: ["vendors"] }); toast.success("Vendor updated"); } });
  const setProd = useMutation({ mutationFn: ({ id, a }: { id: string; a: boolean }) => api.approveProduct(id, a), onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-products"] }); toast.success("Product updated"); } });
  const setOrder = useMutation({ mutationFn: ({ id, s }: { id: string; s: OrderStatus }) => api.setOrderStatus(id, s), onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); toast.success("Order updated"); } });

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-1"><Shield className="h-3 w-3" /> Admin Panel</div>
            <h1 className="font-display text-4xl font-bold">Control Center</h1>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 glass px-4 py-2.5 rounded-xl font-semibold hover:bg-white/10 self-start"><LogOut className="h-4 w-4" /> Logout</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={Users} label="Vendors" value={String(vendors.length)} sub={`${pendingVendors.length} pending`} />
          <Stat icon={Package} label="Products" value={String(products.length)} sub={`${pendingProducts.length} pending`} />
          <Stat icon={ShoppingBag} label="Orders" value={String(orders.length)} />
          <Stat icon={IndianRupee} label="Revenue" value={inr(revenue)} />
        </div>

        <div className="glass rounded-2xl p-1.5 inline-flex gap-1 mb-6 flex-wrap">
          {(["overview", "vendors", "products", "orders"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t ? "gradient-primary text-primary-foreground shadow-glow" : "hover:bg-white/5 text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Pending Vendor Approvals">
              {pendingVendors.length === 0 ? <Empty>No pending vendors</Empty> : pendingVendors.slice(0, 5).map((v) => (
                <Row key={v.id} title={v.companyName} sub={`${v.vendorName} · ${v.email}`}>
                  <button onClick={() => setVendor.mutate({ id: v.id, s: "approved" })} className="p-1.5 rounded-md bg-success/15 text-success hover:bg-success/25"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setVendor.mutate({ id: v.id, s: "rejected" })} className="p-1.5 rounded-md bg-destructive/15 text-destructive hover:bg-destructive/25"><X className="h-4 w-4" /></button>
                </Row>
              ))}
            </Card>
            <Card title="Pending Product Approvals">
              {pendingProducts.length === 0 ? <Empty>No pending products</Empty> : pendingProducts.slice(0, 5).map((p) => (
                <Row key={p.id} title={p.name} sub={`${inr(p.price)} · ${p.category}`}>
                  <button onClick={() => setProd.mutate({ id: p.id, a: true })} className="p-1.5 rounded-md bg-success/15 text-success hover:bg-success/25"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setProd.mutate({ id: p.id, a: false })} className="p-1.5 rounded-md bg-destructive/15 text-destructive hover:bg-destructive/25"><X className="h-4 w-4" /></button>
                </Row>
              ))}
            </Card>
          </div>
        )}

        {tab === "vendors" && (
          <Card title="All Vendors">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider"><tr><th className="text-left py-2">Company</th><th className="text-left">Contact</th><th className="text-left">GST</th><th className="text-center">Status</th><th className="text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-glass-border">
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 font-medium">{v.companyName}<div className="text-xs text-muted-foreground">{v.vendorName}</div></td>
                    <td className="text-muted-foreground">{v.phone}<div className="text-xs">{v.email}</div></td>
                    <td className="font-mono text-xs">{v.gst}</td>
                    <td className="text-center"><Badge status={v.status} /></td>
                    <td className="text-right space-x-1">
                      <button onClick={() => setVendor.mutate({ id: v.id, s: "approved" })} className="p-1.5 rounded-md bg-success/15 text-success hover:bg-success/25"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setVendor.mutate({ id: v.id, s: "rejected" })} className="p-1.5 rounded-md bg-destructive/15 text-destructive hover:bg-destructive/25"><X className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Card>
        )}

        {tab === "products" && (
          <Card title="All Products">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider"><tr><th className="text-left py-2">Product</th><th className="text-left">Category</th><th className="text-right">Price</th><th className="text-center">Status</th><th className="text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-glass-border">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 flex items-center gap-3"><img src={p.image} className="h-10 w-10 rounded-lg object-cover" alt="" /><span className="font-medium line-clamp-1 max-w-xs">{p.name}</span></td>
                    <td className="capitalize text-muted-foreground">{p.category.replace("-", " ")}</td>
                    <td className="text-right font-semibold">{inr(p.price)}</td>
                    <td className="text-center"><Badge status={p.approved ? "approved" : "pending"} /></td>
                    <td className="text-right space-x-1">
                      <button onClick={() => setProd.mutate({ id: p.id, a: true })} className="p-1.5 rounded-md bg-success/15 text-success hover:bg-success/25"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setProd.mutate({ id: p.id, a: false })} className="p-1.5 rounded-md bg-destructive/15 text-destructive hover:bg-destructive/25"><X className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Card>
        )}

        {tab === "orders" && (
          <Card title="Order Management">
            <div className="space-y-3">
              {orders.length === 0 ? <Empty>No orders yet</Empty> : orders.map((o) => (
                <div key={o.id} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><Truck className="h-4 w-4 text-primary" /><span className="font-mono font-bold">{o.id}</span><Badge status={o.status as any} /></div>
                    <div className="text-xs text-muted-foreground">{o.customer.fullName} · {o.customer.phone} · {dateShort(o.createdAt)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.items.length} items · <span className="text-foreground font-semibold">{inr(o.total)}</span></div>
                  </div>
                  <select defaultValue={o.status} onChange={(e) => setOrder.mutate({ id: o.id, s: e.target.value as OrderStatus })}
                    className="bg-secondary border border-glass-border rounded-lg px-3 py-2 text-sm capitalize">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 hover-lift">
      <Icon className="h-5 w-5 text-primary mb-3" />
      <div className="font-display text-2xl font-bold text-gradient">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}{sub && <span className="text-warning ml-1">· {sub}</span>}</div>
    </motion.div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-6 shadow-elegant">
      <h3 className="font-display text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 glass rounded-xl">
      <div className="flex-1 min-w-0"><div className="font-medium text-sm line-clamp-1">{title}</div><div className="text-xs text-muted-foreground">{sub}</div></div>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground text-center py-6">{children}</div>;
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning",
    rejected: "bg-destructive/15 text-destructive",
    processing: "bg-warning/15 text-warning",
    confirmed: "bg-accent/20 text-accent",
    packed: "bg-accent/20 text-accent",
    shipped: "bg-primary/15 text-primary",
    "out-for-delivery": "bg-primary/15 text-primary",
    delivered: "bg-success/15 text-success",
  };
  return <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status.replace(/-/g, " ")}</span>;
}
