import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Trash2, LogOut, TrendingUp, IndianRupee, ShoppingBag, Pencil, X } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/auth-store";
import { api } from "@/services/api";
import { CATEGORIES } from "@/data/seed";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import type { Product } from "@/types";

export const Route = createFileRoute("/vendor-dashboard")({ component: VendorDashboard });

function VendorDashboard() {
  const vendorId = useAuth((s) => s.vendorId);
  const logout = useAuth((s) => s.logoutVendor);

  if (!vendorId) {
    return (
      <Shell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="glass-strong rounded-3xl p-10 shadow-elegant">
            <h1 className="font-display text-3xl font-bold">Vendor Login</h1>
            <p className="text-muted-foreground mt-2 mb-6">Register as a vendor to access your dashboard.</p>
            <Link to="/vendor-register" className="inline-block gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold shadow-glow">Become a Vendor</Link>
          </div>
        </div>
      </Shell>
    );
  }

  return <DashboardContent vendorId={vendorId} onLogout={logout} />;
}

function DashboardContent({ vendorId, onLogout }: { vendorId: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["vendor-products", vendorId], queryFn: () => api.getProducts({ vendorId }) });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => api.getOrders() });
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const myOrders = orders.filter((o) => o.items.some((i) => products.some((p) => p.id === i.productId)));
  const revenue = myOrders.reduce((s, o) => s + o.items.filter((i) => products.some((p) => p.id === i.productId)).reduce((a, b) => a + b.price * b.quantity, 0), 0);
  const approved = products.filter((p) => p.approved).length;
  const pending = products.length - approved;

  const del = useMutation({ mutationFn: (id: string) => api.deleteProduct(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["vendor-products"] }); toast.success("Product deleted"); } });

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Vendor Dashboard</div>
            <h1 className="font-display text-4xl font-bold">Welcome back</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold shadow-glow"><Plus className="h-4 w-4" /> Add Product</button>
            <button onClick={onLogout} className="inline-flex items-center gap-2 glass px-4 py-2.5 rounded-xl font-semibold hover:bg-white/10"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={Package} label="Total Products" value={String(products.length)} />
          <Stat icon={TrendingUp} label="Approved" value={String(approved)} accent="success" />
          <Stat icon={ShoppingBag} label="Pending Approval" value={String(pending)} accent="warning" />
          <Stat icon={IndianRupee} label="Revenue" value={inr(revenue)} />
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-elegant">
          <h2 className="font-display text-2xl font-bold mb-5">My Products</h2>
          {isLoading ? <div className="text-muted-foreground text-sm">Loading...</div> : products.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No products yet. Click "Add Product" to begin.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wider">
                  <tr><th className="text-left py-3">Product</th><th className="text-left">Category</th><th className="text-right">Price</th><th className="text-right">Stock</th><th className="text-center">Status</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="py-3 flex items-center gap-3"><img src={p.image} className="h-10 w-10 rounded-lg object-cover" alt="" /><span className="font-medium line-clamp-1 max-w-xs">{p.name}</span></td>
                      <td className="capitalize text-muted-foreground">{p.category.replace("-", " ")}</td>
                      <td className="text-right font-semibold">{inr(p.price)}</td>
                      <td className="text-right">{p.stock}</td>
                      <td className="text-center"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${p.approved ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{p.approved ? "Approved" : "Pending"}</span></td>
                      <td className="text-right">
                        <button onClick={() => setEditing(p)} className="p-1.5 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => del.mutate(p.id)} className="p-1.5 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(showAdd || editing) && <ProductForm vendorId={vendorId} product={editing} onClose={() => { setShowAdd(false); setEditing(null); qc.invalidateQueries({ queryKey: ["vendor-products"] }); }} />}
    </Shell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: "success" | "warning" }) {
  const tone = accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-gradient";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 hover-lift">
      <Icon className="h-5 w-5 text-primary mb-3" />
      <div className={`font-display text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

function ProductForm({ vendorId, product, onClose }: { vendorId: string; product: Product | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    price: product?.price ?? 0,
    original: product?.original ?? 0,
    discount: product?.discount ?? 0,
    category: product?.category ?? "electronics",
    image: product?.image ?? "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    description: product?.description ?? "",
    stock: product?.stock ?? 10,
    specs: product ? Object.entries(product.specifications).map(([k, v]) => ({ k, v })) : [{ k: "Brand", v: "" }],
  });

  const m = useMutation({
    mutationFn: async () => {
      const specifications = Object.fromEntries(form.specs.filter((s) => s.k && s.v).map((s) => [s.k, s.v]));
      if (product) {
        await api.updateProduct(product.id, { ...form, specifications, category: form.category as any });
      } else {
        await api.submitVendorProduct({
          name: form.name, price: Number(form.price), original: Number(form.original), discount: Number(form.discount),
          category: form.category as any, image: form.image, description: form.description, specifications,
          stock: Number(form.stock), vendorId,
        });
      }
    },
    onSuccess: () => { toast.success(product ? "Product updated" : "Product submitted for approval"); onClose(); },
  });

  const inp = "w-full bg-secondary/60 border border-glass-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4 overflow-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-2xl shadow-elegant my-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-bold">{product ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2 block"><span className="text-xs text-muted-foreground mb-1 block">Product Name</span><input required className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Price (₹)</span><input required type="number" min="0" className={inp} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Original Price (₹)</span><input required type="number" min="0" className={inp} value={form.original} onChange={(e) => setForm({ ...form, original: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Discount %</span><input type="number" min="0" max="100" className={inp} value={form.discount} onChange={(e) => setForm({ ...form, discount: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Stock Quantity</span><input required type="number" min="0" className={inp} value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Category</span>
            <select className={inp} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">Image URL</span><input required className={inp} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
          <label className="sm:col-span-2 block"><span className="text-xs text-muted-foreground mb-1 block">Description</span><textarea required rows={3} className={inp} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground mb-2">Specifications</div>
            <div className="space-y-2">
              {form.specs.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input placeholder="Key" className={inp} value={s.k} onChange={(e) => { const a = [...form.specs]; a[i].k = e.target.value; setForm({ ...form, specs: a }); }} />
                  <input placeholder="Value" className={inp} value={s.v} onChange={(e) => { const a = [...form.specs]; a[i].v = e.target.value; setForm({ ...form, specs: a }); }} />
                  <button type="button" onClick={() => setForm({ ...form, specs: form.specs.filter((_, j) => j !== i) })} className="px-2 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, specs: [...form.specs, { k: "", v: "" }] })} className="text-xs text-primary hover:underline">+ Add specification</button>
            </div>
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl glass font-semibold">Cancel</button>
            <button disabled={m.isPending} className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow">{m.isPending ? "Saving..." : "Save Product"}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
