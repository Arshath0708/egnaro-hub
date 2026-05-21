import { useState } from "react";
import { Shield, Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-store";
import { Shell } from "@/components/layout/Shell";

const API = "https://egnaromart.com/api";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none backdrop-blur-xl transition-all focus:border-[#FF6600]";

type Step = "login" | "forgot-email" | "forgot-otp" | "forgot-newpw";

export default function AdminLogin() {
  const [step, setStep] = useState<Step>("login");

  return (
    <Shell>
      <div className="flex min-h-screen items-center justify-center px-4 py-20">
        {step === "login" && <LoginForm onForgot={() => setStep("forgot-email")} />}
        {step === "forgot-email" && <EmailStep onNext={() => setStep("forgot-otp")} onBack={() => setStep("login")} />}
        {step === "forgot-otp" && <OtpStep onNext={() => setStep("forgot-newpw")} onBack={() => setStep("forgot-email")} />}
        {step === "forgot-newpw" && <NewPwStep onDone={() => setStep("login")} />}
      </div>
    </Shell>
  );
}

// ─── Shared state passed between steps via sessionStorage ─
function saveReset(key: string, value: string) {
  sessionStorage.setItem("admin_reset_" + key, value);
}
function loadReset(key: string) {
  return sessionStorage.getItem("admin_reset_" + key) || "";
}

/* ═══════════════════════════════════════════════════════════
   STEP 0 — LOGIN
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
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0B3D2E] to-[#14532d] shadow-xl">
          <Shield className="h-10 w-10 text-white" />
        </div>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-white">Admin Portal</h1>
        <p className="mt-2 text-sm text-gray-400">Egnaro Mart Control Center</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <Field label="Email">
          <input type="email" required placeholder="admin@egnaromart.com"
            value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <button type="button" onClick={onForgot}
            className="text-xs text-[#FF6600] hover:underline">
            Forgot Password?
          </button>
        </div>
        <PrimaryButton loading={loading} label="Access Dashboard" loadingLabel="Authenticating..." />
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
      <StepHeader icon={<Mail className="h-7 w-7 text-[#FF6600]" />}
        title="Admin Reset Password" subtitle="Enter your registered admin email to receive a 6-digit OTP." />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleSend} className="space-y-4">
        <Field label="Email Address">
          <input type="email" placeholder="admin@egnaromart.com" value={email} required
            onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <PrimaryButton loading={loading} label="Send OTP" loadingLabel="Sending..." />
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
      <StepHeader icon={<KeyRound className="h-7 w-7 text-[#FF6600]" />}
        title="Enter OTP" subtitle={`We sent a 6-digit code to ${email}`} />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleVerify} className="space-y-4">
        <Field label="6-Digit OTP">
          <input
            type="text" inputMode="numeric" maxLength={6} placeholder="123456"
            value={otp} required
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
          />
        </Field>
        <PrimaryButton loading={loading} label="Verify OTP" loadingLabel="Verifying..." />
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
        Didn't receive it?{" "}
        <button onClick={handleResend} className="text-[#FF6600] hover:underline font-semibold">
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
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white">All Done!</h2>
          <p className="mt-2 text-sm text-gray-400">Your admin password has been reset successfully.</p>
          <button onClick={onDone}
            className="mt-6 w-full rounded-2xl bg-[#FF6600] py-3 font-semibold text-white transition-all hover:bg-[#e65c00]">
            Back to Sign In
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <StepHeader icon={<Lock className="h-7 w-7 text-[#FF6600]" />}
        title="New Password" subtitle="Choose a strong password for your admin account." />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleReset} className="space-y-4">
        <Field label="New Password">
          <div className="relative">
            <input type={showNewPw ? "text" : "password"} placeholder="••••••••" value={pw} required minLength={6}
              onChange={(e) => { setPw(e.target.value); setError(null); }} className={`${inputClass} pr-10`} />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
            >
              {showNewPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password">
          <div className="relative">
            <input type={showConfirmPw ? "text" : "password"} placeholder="••••••••" value={confirm} required
              onChange={(e) => { setConfirm(e.target.value); setError(null); }} className={`${inputClass} pr-10`} />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
            >
              {showConfirmPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {confirm && pw !== confirm && (
            <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
          )}
        </Field>
        <PrimaryButton loading={loading} label="Reset Password" loadingLabel="Resetting..." />
      </form>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
═══════════════════════════════════════════════════════════ */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-2xl">
      {children}
    </div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6600]/10">
        {icon}
      </div>
      <h1 className="text-2xl font-black text-white">{title}</h1>
      <p className="mt-1.5 text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-gray-300">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {msg}
    </div>
  );
}

function PrimaryButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full rounded-2xl bg-[#FF6600] py-3 font-semibold text-white transition-all hover:bg-[#e65c00] disabled:opacity-60 flex items-center justify-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? loadingLabel : label}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="mb-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}
