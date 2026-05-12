import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, LogIn, ShieldCheck, Lock } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { addVendor } from "@/services/api";
import { useAuth } from "@/context/auth-store";
import { toast } from "sonner";

type RegisterForm = {
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
};
type LoginForm = { email: string; password: string };

const EMPTY_REGISTER: RegisterForm = {
  vendor_name: "",
  company_name: "",
  phone: "",
  email: "",
  password: "",
  address: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
};
const EMPTY_LOGIN: LoginForm = { email: "", password: "" };

const inp =
  "w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export default function VendorRegister() {   // ✅ default export
  const navigate = useNavigate();
  const loginVendor = useAuth((s) => s.loginVendor);
  const isVendor = useAuth((s) => s.isVendor);

  useEffect(() => {
    if (isVendor) {
      navigate("/vendor-dashboard");
    }
  }, [isVendor, navigate]);

  const [mode, setMode] = useState<"register" | "login">("register");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<RegisterForm>(EMPTY_REGISTER);
  const [loginData, setLoginData] = useState<LoginForm>(EMPTY_LOGIN);

  const setRegField = useCallback(
    <K extends keyof RegisterForm>(k: K, v: RegisterForm[K]) =>
      setForm((p) => ({ ...p, [k]: v })),
    []
  );
  const setLoginField = useCallback(
    <K extends keyof LoginForm>(k: K, v: LoginForm[K]) =>
      setLoginData((p) => ({ ...p, [k]: v })),
    []
  );

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await addVendor(form);
      if (res.success) {
        setSubmitted(true);
        toast.success("Application submitted");
      } else toast.error(res.message || "Registration failed");
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://egnaromart.com/api/vendor-login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (data.success) {
        loginVendor(String(data.vendor.id));
        toast.success(`Welcome ${data.vendor.vendor_name}`);
        navigate("/vendor-dashboard");
      } else toast.error(data.message || "Login failed");
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Shell>
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-400" />
            <h1 className="text-2xl font-bold text-white">
              Application Submitted
            </h1>
            <p className="mt-2 text-gray-400">
              Your account is awaiting admin approval.
            </p>
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-300">
              You can login after admin approves your account.
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setMode("login");
              }}
              className="mt-6 rounded-lg gradient-primary px-6 py-2.5 font-semibold text-white"
            >
              Go to Login
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">
            {mode === "register" ? "Become a Vendor" : "Vendor Login"}
          </h1>
          <p className="mt-2 text-gray-400">
            Join India's marketplace for electronics & industrial goods.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
          {/* Tabs */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                mode === "register"
                  ? "gradient-primary text-white"
                  : "bg-slate-800 text-gray-300"
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                mode === "login"
                  ? "gradient-primary text-white"
                  : "bg-slate-800 text-gray-300"
              }`}
            >
              Login
            </button>
          </div>

          {mode === "register" ? (
            <form
              onSubmit={handleRegister}
              autoComplete="on"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Vendor Name (as per in bank a/c)
                  </label>
                  <input
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    className={inp}
                    value={form.vendor_name}
                    onChange={(e) =>
                      setRegField("vendor_name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Company Name
                  </label>
                  <input
                    required
                    autoComplete="organization"
                    placeholder="Company / Shop name"
                    className={inp}
                    value={form.company_name}
                    onChange={(e) =>
                      setRegField("company_name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Phone
                  </label>
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    className={inp}
                    value={form.phone}
                    onChange={(e) => setRegField("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className={inp}
                    value={form.email}
                    onChange={(e) => setRegField("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Bank Name
                  </label>
                  <input
                    required
                    placeholder="e.g. HDFC Bank"
                    className={inp}
                    value={form.bank_name}
                    onChange={(e) => setRegField("bank_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Account Number
                  </label>
                  <input
                    required
                    placeholder="e.g. 1234567890"
                    className={inp}
                    value={form.account_number}
                    onChange={(e) => setRegField("account_number", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    IFSC Code
                  </label>
                  <input
                    required
                    placeholder="e.g. HDFC0001234"
                    className={inp}
                    value={form.ifsc_code}
                    onChange={(e) => setRegField("ifsc_code", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min 6 characters"
                    className={`${inp} pl-10`}
                    value={form.password}
                    onChange={(e) => setRegField("password", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Business Address
                </label>
                <textarea
                  required
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Full business address"
                  className={`${inp} resize-none`}
                  value={form.address}
                  onChange={(e) => setRegField("address", e.target.value)}
                />
              </div>
                            <button
                disabled={loading}
                className="w-full rounded-lg gradient-primary py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleLogin}
              autoComplete="on"
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Email
                </label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={inp}
                  value={loginData.email}
                  onChange={(e) => setLoginField("email", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Password
                </label>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inp}
                  value={loginData.password}
                  onChange={(e) => setLoginField("password", e.target.value)}
                />
              </div>
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary py-3 font-semibold text-white disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Authenticating..." : "Login to Dashboard"}
              </button>
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" /> Approved
                vendors only.
              </div>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}
