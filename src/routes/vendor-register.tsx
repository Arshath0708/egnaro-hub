import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { useState } from "react";

import { motion } from "framer-motion";

import {
  Store,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  Lock,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { addVendor } from "@/services/api";
import { useAuth } from "@/context/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/vendor-register"
)({
  component: VendorRegister,
});

export default function VendorRegister() {
  const navigate = useNavigate();

  const loginVendor = useAuth(
    (s) => s.loginVendor
  );

  const [mode, setMode] = useState<
    "register" | "login"
  >("register");

  const [loading, setLoading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  /* REGISTER FORM */

  const [form, setForm] = useState({
    vendor_name: "",
    company_name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
  });

  /* LOGIN FORM */

  const [loginData, setLoginData] =
    useState({
      email: "",
      password: "",
    });

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

  /* REGISTER */

  async function handleRegister(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error(
        "Password must be at least 6 characters"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await addVendor(form);

      if (res.success) {
        setSubmitted(true);

        toast.success(
          "Vendor application submitted"
        );
      } else {
        toast.error(
          res.message ||
            "Registration failed"
        );
      }
    } catch (err) {
      console.error(err);

      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }

  /* LOGIN */

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch(
        "https://egnaromart.com/api/vendor-login.php",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: loginData.email,
            password:
              loginData.password,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        loginVendor(
          String(data.vendor.id)
        );

        localStorage.setItem(
          "vendorId",
          String(data.vendor.id)
        );

        toast.success(
          `Welcome ${data.vendor.vendor_name}`
        );

        navigate({
          to: "/vendor-dashboard",
        });
      } else {
        toast.error(
          data.message ||
            "Login failed"
        );
      }
    } catch (err) {
      console.error(err);

      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }

  /* SUCCESS SCREEN */

  if (submitted) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-4 py-24">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="glass-strong rounded-[32px] border border-white/10 p-10 text-center shadow-2xl"
          >
            <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full gradient-primary shadow-glow">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>

            <h1 className="font-display text-4xl font-bold">
              Application Submitted
            </h1>

            <p className="mt-4 text-muted-foreground">
              Your vendor account is now
              awaiting admin approval.
            </p>

            <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300">
              You can login after the admin
              approves your account.
            </div>

            <button
              onClick={() =>
                setMode("login")
              }
              className="mt-8 rounded-2xl gradient-primary px-6 py-3 font-semibold text-white shadow-glow"
            >
              Go to Login
            </button>
          </motion.div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/20 blur-lg" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-lg" />

        <div className="mx-auto max-w-4xl px-4 py-14">
          {/* HEADER */}

          <div className="mb-12 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold backdrop-blur-sm">
              <Store className="h-4 w-4 text-primary" />

              Egnaro Vendor Portal
            </div>

            <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
              {mode === "register"
                ? "Become a Vendor"
                : "Vendor Login"}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Join India's premium
              marketplace for electronics,
              industrial products &
              appliances.
            </p>
          </div>

          {/* CARD */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="glass-strong rounded-[32px] border border-white/10 p-8 shadow-2xl backdrop-blur-sm"
          >
            {/* TABS */}

            <div className="mb-8 flex gap-3">
              <button
                onClick={() =>
                  setMode("register")
                }
                className={`flex-1 rounded-2xl py-3 font-semibold transition-all ${
                  mode === "register"
                    ? "gradient-primary text-white shadow-glow"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                Register
              </button>

              <button
                onClick={() =>
                  setMode("login")
                }
                className={`flex-1 rounded-2xl py-3 font-semibold transition-all ${
                  mode === "login"
                    ? "gradient-primary text-white shadow-glow"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                Login
              </button>
            </div>

            {/* REGISTER */}

            {mode === "register" ? (
              <form
                onSubmit={handleRegister}
                className="grid gap-5 md:grid-cols-2"
              >
                <input
                  required
                  placeholder="Vendor Name"
                  className={inputClass}
                  value={form.vendor_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vendor_name:
                        e.target.value,
                    })
                  }
                />

                <input
                  required
                  placeholder="Company Name"
                  className={inputClass}
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      company_name:
                        e.target.value,
                    })
                  }
                />

                <input
                  required
                  placeholder="Phone Number"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target.value,
                    })
                  }
                />

                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email:
                        e.target.value,
                    })
                  }
                />

                <div className="relative md:col-span-2">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />

                  <input
                    required
                    type="password"
                    placeholder="Create Password"
                    className={`${inputClass} pl-12`}
                    value={form.password}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <textarea
                  required
                  rows={4}
                  placeholder="Business Address"
                  className={`${inputClass} md:col-span-2`}
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address:
                        e.target.value,
                    })
                  }
                />

                <button
                  disabled={loading}
                  className="md:col-span-2 rounded-2xl gradient-primary py-4 font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading
                    ? "Submitting..."
                    : "Submit Vendor Application"}
                </button>
              </form>
            ) : (
              /* LOGIN */

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <input
                  required
                  type="email"
                  placeholder="Vendor Email"
                  className={inputClass}
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      email:
                        e.target.value,
                    })
                  }
                />

                <input
                  required
                  type="password"
                  placeholder="Password"
                  className={inputClass}
                  value={
                    loginData.password
                  }
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      password:
                        e.target.value,
                    })
                  }
                />

                <button
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 font-semibold text-white shadow-glow"
                >
                  <LogIn className="h-4 w-4" />

                  {loading
                    ? "Authenticating..."
                    : "Login to Dashboard"}
                </button>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Approved Vendors Only
                  </div>

                  Your account must be
                  approved by admin before
                  dashboard access.
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}