import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Mail, Lock, ArrowLeft, CheckCircle2, 
  Loader2, AlertCircle, Eye, EyeOff, ShieldCheck 
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-store";
import { Shell } from "@/components/layout/Shell";

const API = "https://egnaromart.com/api";

type Step = "login" | "forgot-email" | "forgot-otp" | "forgot-newpw";

function saveReset(key: string, value: string) {
  sessionStorage.setItem("admin_reset_" + key, value);
}
function loadReset(key: string) {
  return sessionStorage.getItem("admin_reset_" + key) || "";
}

export default function AdminLogin() {
  const [step, setStep] = useState<Step>("login");

  return (
    <Shell>
      <div className="relative min-h-screen w-full bg-[#080C14] text-slate-200 overflow-hidden flex flex-col md:flex-row font-sans">
        
        {/* Subtle executive mesh canvas */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:56px_56px] pointer-events-none" />
        
        {/* Minimal diffused glowing backing (highly blurred, low opacity, stable) */}
        <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[50%] rounded-full blur-[200px] opacity-10 pointer-events-none bg-slate-500/10" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[60%] w-[50%] rounded-full blur-[200px] opacity-10 pointer-events-none bg-primary/5" />

        {/* LEFT COLUMN: EXECUTIVE BRANDING & OPERATIONAL OVERVIEW (Desktop/Tablet Only) */}
        <div className="w-full md:w-[35%] lg:w-[45%] p-8 lg:p-16 flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 bg-slate-950/10 backdrop-blur-sm relative z-10 hidden md:flex">
          
          {/* Header crest */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0e1420]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Shield className="h-5.5 w-5.5 text-primary" />
            </div>
            <div>
              <span className="font-display font-black text-sm text-white tracking-widest uppercase">
                Egnaro Hub
              </span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Enterprise Portal
              </p>
            </div>
          </div>

          {/* Main Business Core Details */}
          <div className="my-auto space-y-8 max-w-lg py-12 lg:py-0">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                Administrative Operations Node
              </span>
              <h2 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight font-display">
                Marketplace Operations <br />
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Control Center
                </span>
              </h2>
              <p className="text-xs lg:text-sm text-slate-400 font-normal leading-relaxed">
                Log in to manage enterprise catalog pipelines, coordinate cascading logistics parameters, orchestrate merchant payouts, and monitor system diagnostics.
              </p>
            </div>

            {/* HIGH-TRUST BUSINESS METRIC WIDGETS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Metric Card 1 (Uptime) - Visible on tablet and desktop */}
              <div className="rounded-2xl border border-white/5 bg-[#0e1420]/40 p-5 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-display">
                  NETWORK STATUS
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs lg:text-sm font-semibold text-white">99.98% Gateway Uptime</span>
                </div>
                <p className="text-[10px] lg:text-xs text-slate-500 font-medium font-sans">Real-time status monitor active</p>
              </div>

              {/* Metric Card 2 (AES-256) - Simplified: Hidden on tablet, visible on large desktops */}
              <div className="rounded-2xl border border-white/5 bg-[#0e1420]/40 p-5 space-y-2 hidden lg:block">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-display">
                  SECURITY CIPHER
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>AES-256 Encrypted</span>
                </div>
                <p className="text-xs text-slate-500 font-medium font-sans">PCI-DSS Compliant Infrastructure</p>
              </div>
            </div>

            {/* SYSTEM LEDGER TABLE - Hidden on tablet, visible on large desktops */}
            <div className="rounded-2xl border border-white/5 bg-[#0e1420]/20 p-5 space-y-3 font-mono text-[11px] hidden lg:block">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">
                CORE SYSTEM REGISTRY
              </span>
              <div className="divide-y divide-white/5 space-y-2.5">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500">ENVIRONMENT</span>
                  <span className="text-slate-300 font-semibold uppercase">Production Node</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500">TLS DECODE PROTOCOL</span>
                  <span className="text-slate-300 font-semibold">TLS 1.3 / X25519</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500">API ROUTING LATENCY</span>
                  <span className="text-slate-300 font-semibold text-emerald-400">14ms average</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500">CLUSTER REGION</span>
                  <span className="text-slate-300 font-semibold">AWS-AP-SOUTH-1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer metrics / version */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <span>Platform Version: 3.4.2-Prod</span>
              <span>•</span>
              <span>Local Time: Active</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SECURE AUTH FORM & MOBILE BRANDING CONTAINER */}
        <div className="w-full md:w-[65%] lg:w-[55%] p-6 sm:p-12 lg:p-16 flex flex-col items-center justify-center relative z-10 bg-[#06090f]/30 min-h-screen">
          
          <div className="w-full max-w-md">
            
            {/* FLOATING TOP TRUST BADGE - Only visible on Mobile */}
            <div className="flex md:hidden items-center justify-center gap-2 mb-6 mx-auto w-fit rounded-full border border-white/5 bg-[#0e1420]/60 px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Secure Admin Gateway</span>
            </div>

            {/* MOBILE COMPACT BRANDING HEADER - Only visible on Mobile */}
            <div className="flex md:hidden flex-col items-center text-center mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0e1420]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] mb-4">
                <Shield className="h-6.5 w-6.5 text-primary" />
              </div>
              <h1 className="font-display font-black text-xl text-white tracking-widest uppercase leading-none">
                Egnaro Hub
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">
                Enterprise Admin Portal
              </p>
              <p className="text-xs text-slate-400 font-normal mt-3 leading-relaxed max-w-xs">
                Secure Marketplace Operations Control
              </p>
              
              {/* Tiny trust indicators */}
              <div className="flex items-center justify-center gap-2.5 mt-4">
                <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-[#0e1420]/40 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  <span>Secure Infrastructure</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-[#0e1420]/40 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>PCI-DSS Secured</span>
                </div>
              </div>
            </div>

            {/* Auth Cards Step Switcher */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full"
              >
                {step === "login" && <LoginForm onForgot={() => setStep("forgot-email")} />}
                {step === "forgot-email" && <EmailStep onNext={() => setStep("forgot-otp")} onBack={() => setStep("login")} />}
                {step === "forgot-otp" && <OtpStep onNext={() => setStep("forgot-newpw")} onBack={() => setStep("forgot-email")} />}
                {step === "forgot-newpw" && <NewPwStep onDone={() => setStep("login")} />}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>

      </div>
    </Shell>
  );
}

/* =========================================================
   STABLE COMPACT BUSINESS CARD
========================================================= */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-3xl border border-white/10 bg-[#0e1420]/80 p-6 sm:p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden w-full">
      {/* Subtle border top static reflection highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10 space-y-6">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD STRUCTURE
========================================================= */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">
        {label}
      </label>
      <div className="relative w-full">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   HIGH-TRUST INPUT TEXT BOXES
========================================================= */
const premiumInputClass =
  "w-full rounded-xl border border-white/10 bg-[#080C14]/60 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/10 hover:border-white/15 font-medium";

/* =========================================================
   TACTILE PLATFORM ACTION BUTTONS
========================================================= */
function PrimaryButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer mb-2"
    >
      <ArrowLeft className="h-3.5 w-3.5 text-primary" />
      Back to Sign In
    </button>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-3 pb-1">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#080C14]/80 shadow-inner relative overflow-hidden">
        <div className="text-primary">{icon}</div>
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white tracking-tight leading-none font-display">
          {title}
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-xs font-medium text-red-400 font-sans">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
      <span>{msg}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 0 — LOGIN FORM
═══════════════════════════════════════════════════════════ */
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const loginAdmin = useAuth((s) => s.loginAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API}/admin-login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        loginAdmin(data.admin);
        toast.success(`Welcome ${data.admin.name}`);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="text-center space-y-3 pb-1 hidden md:block">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#080C14]/80 shadow-inner relative overflow-hidden">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight leading-none font-display">
            Access Gateway
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Enterprise Administrative Portal
          </p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="System Identifier (Email)">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input 
              type="email" 
              required 
              placeholder="admin@egnaromart.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className={premiumInputClass} 
            />
          </div>
        </Field>
        
        <Field label="Security Passkey">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className={`${premiumInputClass} pr-12`} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <button 
            type="button" 
            onClick={onForgot}
            className="text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <PrimaryButton loading={loading} label="Access Operations Control" loadingLabel="Establishing Tunnel..." />
      </form>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 1 — ENTER EMAIL
═══════════════════════════════════════════════════════════ */
function EmailStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin-send-otp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        saveReset("email", email);
        toast.success("OTP sent! Check your inbox.");
        onNext();
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <BackButton onClick={onBack} />
      <StepHeader 
        icon={<Mail className="h-5 w-5" />}
        title="Reset Administrative Password" 
        subtitle="Provide your registered administrator email to receive a 6-digit verification code." 
      />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleSend} className="space-y-4">
        <Field label="Admin Email Account">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input 
              type="email" 
              placeholder="admin@egnaromart.com" 
              value={email} 
              required
              onChange={(e) => setEmail(e.target.value)} 
              className={premiumInputClass} 
            />
          </div>
        </Field>
        
        <PrimaryButton loading={loading} label="Send Verification Code" loadingLabel="Transmitting..." />
      </form>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 2 — VERIFY OTP
═══════════════════════════════════════════════════════════ */
function OtpStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = loadReset("email");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin-verify-otp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        saveReset("otp", otp);
        toast.success("OTP verified!");
        onNext();
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await fetch(`${API}/admin-send-otp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("OTP resent!");
    } catch {
      toast.error("Could not resend OTP.");
    }
  }

  return (
    <Card>
      <BackButton onClick={onBack} />
      <StepHeader 
        icon={<Lock className="h-5 w-5" />}
        title="Enter Verification Key" 
        subtitle={`Verify the 6-digit key sent to ${email}`} 
      />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleVerify} className="space-y-4">
        <Field label="6-Digit Verification Token">
          <input
            type="text" 
            inputMode="numeric" 
            maxLength={6} 
            placeholder="••••••"
            value={otp} 
            required
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-white/10 bg-[#080C14]/60 py-3.5 text-center text-xl tracking-[0.4em] font-extrabold focus:tracking-[0.4em] text-white placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/10 hover:border-white/15 font-mono"
          />
        </Field>
        
        <PrimaryButton loading={loading} label="Verify Code" loadingLabel="Verifying..." />
      </form>

      <p className="text-center text-xs text-slate-500 font-semibold">
        Didn't receive it?{" "}
        <button type="button" onClick={handleResend} className="text-primary hover:text-primary-hover font-bold cursor-pointer transition-colors">
          Resend OTP
        </button>
      </p>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 3 — NEW PASSWORD
═══════════════════════════════════════════════════════════ */
function NewPwStep({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const email = loadReset("email");
  const otp = loadReset("otp");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== confirm) { setError("Passwords do not match."); return; }
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin-reset-password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: pw }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.removeItem("admin_reset_email");
        sessionStorage.removeItem("admin_reset_otp");
        setSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <div className="py-4 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight leading-none font-display">
              Password Saved
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
              Your administrative credentials have been successfully updated.
            </p>
          </div>
          
          <button 
            onClick={onDone}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Return to Sign In
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <StepHeader 
        icon={<Lock className="h-5 w-5" />}
        title="Establish Passkey" 
        subtitle="Configure a secure administrative passkey for operations." 
      />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleReset} className="space-y-4">
        <Field label="New Administrative Passkey">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input 
              type={showNewPw ? "text" : "password"} 
              placeholder="••••••••" 
              value={pw} 
              required 
              minLength={6}
              onChange={(e) => { setPw(e.target.value); setError(null); }} 
              className={`${premiumInputClass} pr-12`} 
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showNewPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>
        
        <Field label="Confirm Passkey Registry">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input 
              type={showConfirmPw ? "text" : "password"} 
              placeholder="••••••••" 
              value={confirm} 
              required
              onChange={(e) => { setConfirm(e.target.value); setError(null); }} 
              className={`${premiumInputClass} pr-12`} 
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showConfirmPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {confirm && pw !== confirm && (
            <p className="mt-1 text-xs text-red-400 font-semibold font-sans">Passkeys do not match</p>
          )}
        </Field>
        
        <PrimaryButton loading={loading} label="Reset Password" loadingLabel="Resetting..." />
      </form>
    </Card>
  );
}
