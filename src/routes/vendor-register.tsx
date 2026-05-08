import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Store, CheckCircle2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { api } from "@/services/api";
import { useAuth } from "@/context/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor-register")({
  head: () => ({ meta: [{ title: "Become a Vendor — Egnaro Mart" }] }),
  component: VendorRegister,
});

function VendorRegister() {
  const nav = useNavigate();
  const loginVendor = useAuth((s) => s.loginVendor);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ vendorName: "", companyName: "", phone: "", email: "", address: "", gst: "", password: "" });

  const m = useMutation({
    mutationFn: () => api.submitVendorApplication({
      vendorName: form.vendorName, companyName: form.companyName, phone: form.phone,
      email: form.email, address: form.address, gst: form.gst,
    }),
    onSuccess: (vendor) => {
      // Auto-approve for demo so vendor can access dashboard immediately
      api.setVendorStatus(vendor.id, "approved");
      loginVendor(vendor.id);
      setSubmitted(true);
    },
    onError: () => toast.error("Submission failed"),
  });

  const inp = "w-full bg-secondary/60 border border-glass-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring transition";

  if (submitted) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-4 py-20">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong rounded-3xl p-10 text-center shadow-elegant">
            <div className="h-20 w-20 mx-auto mb-6 rounded-full gradient-primary grid place-items-center shadow-glow"><CheckCircle2 className="h-10 w-10 text-primary-foreground" /></div>
            <h1 className="font-display text-3xl font-bold">Application Submitted</h1>
            <p className="mt-3 text-muted-foreground">Your vendor application is <span className="text-warning font-semibold">awaiting admin approval</span>. For this demo, you've been auto-approved and can access your dashboard now.</p>
            <div className="mt-7 flex gap-3 justify-center">
              <button onClick={() => nav({ to: "/vendor-dashboard" })} className="gradient-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold shadow-glow">Go to Dashboard</button>
            </div>
          </motion.div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-medium mb-4"><Store className="h-3 w-3 text-primary" /> Vendor Onboarding</div>
          <h1 className="font-display text-5xl font-bold">Sell on <span className="text-gradient">Egnaro Mart</span></h1>
          <p className="text-muted-foreground mt-3">Join 100+ verified vendors. Reach customers across India.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="glass-strong rounded-2xl p-8 shadow-elegant grid sm:grid-cols-2 gap-4">
          {[
            ["vendorName", "Vendor Name", "text"],
            ["companyName", "Company Name", "text"],
            ["phone", "Phone Number", "tel"],
            ["email", "Email", "email"],
            ["gst", "GST Number", "text"],
            ["password", "Password", "password"],
          ].map(([k, l, t]) => (
            <label key={k} className="block"><span className="text-xs font-medium text-muted-foreground mb-1.5 block">{l}</span>
              <input required type={t} className={inp} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}
          <label className="block sm:col-span-2"><span className="text-xs font-medium text-muted-foreground mb-1.5 block">Address</span><textarea required rows={3} className={inp} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <button disabled={m.isPending} className="sm:col-span-2 gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-glow shimmer disabled:opacity-60">
            {m.isPending ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
