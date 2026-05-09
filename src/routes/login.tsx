// src/routes/login.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { loginCustomer } from "@/services/api";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => loginCustomer({ email, password }),
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate({ to: "/track-order" });
      } else {
        setErrorMsg(data.message ?? "Login failed. Please try again.");
      }
    },
    onError: () => {
      setErrorMsg("Something went wrong. Please try again.");
    },
  });

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="relative rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-sm p-9 shadow-2xl shadow-black/40">
          {/* Inner glow ring */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.06]" />

          {/* Logo mark */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30">
              <span className="font-display text-lg font-black text-white">E</span>
              <span className="absolute -inset-0.5 rounded-[14px] border border-primary/40" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Egnaro Mart
              </div>
              <div className="font-display text-xl font-bold leading-none">
                Welcome back
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Trusted by 300+ customers
          </div>

          <p className="mb-8 text-sm text-muted-foreground">
            Sign in to track orders, manage your account and access exclusive deals.
          </p>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErrorMsg(null);
              mutation.mutate();
            }}
            className="space-y-4"
          >
            {/* Inline error banner */}
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

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  required
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                  className="w-full rounded-xl border border-glass-border bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-primary/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Password
                </label>
                
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  required
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                  className="w-full rounded-xl border border-glass-border bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-primary/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl gradient-primary py-3.5 font-display text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {/* Shimmer */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              {mutation.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-[11px] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

export default Login;

/* ─── Shared layout wrapper ───────────────────────────────────────────────── */
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/8 blur-xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/6 blur-xl" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating sparkle */}
      <div className="pointer-events-none absolute right-12 top-16 text-primary/20">
        <Sparkles className="h-8 w-8" />
      </div>

      {children}
    </div>
  );
}