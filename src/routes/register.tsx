import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Shield, User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { registerCustomer } from "@/services/api";

export default function Register() {   
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => registerCustomer(form),
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setErrorMsg(data.message ?? "Registration failed.");
      }
    },
    onError: () => setErrorMsg("Something went wrong."),
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrorMsg(null);
  };

  const getPasswordStrength = () => {
    const pw = form.password;
    if (!pw) return { score: 0, label: "Empty", color: "bg-white/10" };
    if (pw.length < 6) return { score: 1, label: "Weak Security", color: "bg-red-500/20 text-red-400 border-red-500/10" };
    
    const hasLetters = /[a-zA-Z]/.test(pw);
    const hasNumbers = /[0-9]/.test(pw);
    if (hasLetters && hasNumbers && pw.length >= 8) {
      return { score: 3, label: "Strong Passcode", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/10" };
    }
    return { score: 2, label: "Medium Security", color: "bg-amber-500/20 text-amber-400 border-amber-500/10" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="relative min-h-screen w-full bg-[#080c14] overflow-hidden flex items-center justify-center p-4">
      
      {/* Soft, extremely muted ambient light behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[160px] opacity-[0.03] bg-gradient-to-tr from-primary to-violet-500 pointer-events-none" />
      
      {/* Subtle tech background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg my-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="relative rounded-[24px] border border-white/5 bg-[#0e1422]/90 p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden w-full"
        >
          <div className="relative z-10 space-y-6">
            
            {/* Header Title */}
            <div className="text-center space-y-2 pb-1">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-inner">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold text-white tracking-tight leading-none font-display">
                  Create Premium Account
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Join India's premier digital commerce ecosystem
                </p>
              </div>
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
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
                  <span>Registration successful! Redirecting to sign in interface...</span>
                </div>
              )}
              
              {errorMsg && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-500/10 bg-red-500/5 p-3.5 text-xs font-medium text-red-400">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Ravi Kumar"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={set("fullName")}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/30 hover:border-white/15 font-medium"
                />
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/30 hover:border-white/15 font-medium"
                />
              </div>

              {/* Grid: Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                    autoComplete="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/30 hover:border-white/15 font-medium"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Access Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set("password")}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/30 hover:border-white/15 font-medium pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password complexity indicator */}
              {form.password && (
                <div className="rounded-xl border border-white/5 bg-black/30 p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Password Strength</span>
                    <span className="font-semibold" style={{ color: strength.score === 3 ? "#10b981" : strength.score === 2 ? "#f59e0b" : "#ef4444" }}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-all duration-500 ${strength.score >= 1 ? "bg-red-500" : "bg-white/5"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-500 ${strength.score >= 2 ? "bg-amber-500" : "bg-white/5"}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-500 ${strength.score >= 3 ? "bg-emerald-500" : "bg-white/5"}`} />
                  </div>
                </div>
              )}

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={mutation.isPending || success}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
              >
                {success ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Synchronizing...</span>
                  </>
                ) : mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 font-semibold mt-4">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-primary hover:text-primary-hover ml-1">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
