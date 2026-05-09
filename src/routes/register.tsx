import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Lock, ArrowRight,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { registerCustomer } from "@/services/api";

export const Route = createFileRoute("/register")({
  component: Register,
});

const PERKS = [
  "Pan India tracked delivery",
  "Authentic manufacturer products",
  "Exclusive member deals",
];

function Register() {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => registerCustomer(form),
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate({ to: "/login" }), 1500);
      } else {
        setErrorMsg(data.message ?? "Registration failed. Please try again.");
      }
    },
    onError: () => setErrorMsg("Something went wrong. Please try again."),
  });

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrorMsg(null);
    };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="relative rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-2xl p-9 shadow-2xl shadow-black/40">
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.06]" />

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30">
              <span className="font-display text-lg font-black text-white">E</span>
              <span className="absolute -inset-0.5 rounded-[14px] border border-primary/40" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Egnaro Mart</div>
              <div className="font-display text-xl font-bold leading-none">Create account</div>
            </div>
          </div>

          <p className="mb-5 text-sm text-muted-foreground">
            Join India's premium marketplace for electronics, hardware &amp; industrial products.
          </p>

          <div className="mb-7 space-y-1.5">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                {perk}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setErrorMsg(null); mutation.mutate(); }}
            className="space-y-4"
          >
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Registration successful! Redirecting to login…
              </motion.div>
            )}

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
              </motion.div>
            )}

            <FieldWrapper label="Full Name">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text" placeholder="Ravi Kumar" value={form.fullName} required
                  onChange={set("fullName")}
                  className="w-full rounded-xl border border-glass-border bg-white/[0.04] py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </FieldWrapper>

            <FieldWrapper label="Email Address">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="email" placeholder="you@example.com" value={form.email} required
                  onChange={set("email")}
                  className="w-full rounded-xl border border-glass-border bg-white/[0.04] py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Phone">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="tel" placeholder="+91 98765…" value={form.phone} required
                    onChange={set("phone")}
                    className="w-full rounded-xl border border-glass-border bg-white/[0.04] py-3 pl-10 pr-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </FieldWrapper>

              <FieldWrapper label="Password">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="password" placeholder="••••••••" value={form.password} required
                    onChange={set("password")}
                    className="w-full rounded-xl border border-glass-border bg-white/[0.04] py-3 pl-10 pr-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </FieldWrapper>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending || success}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl gradient-primary py-3.5 font-display text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              {success ? (
                <><CheckCircle2 className="h-4 w-4" /> Redirecting…</>
              ) : mutation.isPending ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating Account...</>
              ) : (
                <> Create Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-[11px] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

function FieldWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

// ✅ FIXED: Removed repeat:Infinity animation that caused CPU choke
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/8 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/6 blur-3xl" />
      </div>
      {children}
    </div>
  );
}