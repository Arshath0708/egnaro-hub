import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";   // ✅ switched to react-router-dom
import { CheckCircle2, AlertCircle } from "lucide-react";
import { registerCustomer } from "@/services/api";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

export default function Register() {   
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => registerCustomer(form),
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 1500);   // ✅ simplified navigation
      } else setErrorMsg(data.message ?? "Registration failed.");
    },
    onError: () => setErrorMsg("Something went wrong."),
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrorMsg(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Egnaro Mart
          </div>
          <h1 className="text-2xl font-black">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join India's premium marketplace.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            mutation.mutate();
          }}
          className="space-y-4"
        >
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> Registration
              successful! Redirecting…
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Ravi Kumar"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={set("fullName")}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765…"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={set("phone")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                className={inputCls}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || success}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {success
              ? "Redirecting…"
              : mutation.isPending
              ? "Creating Account…"
              : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
