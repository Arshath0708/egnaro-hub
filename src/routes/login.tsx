import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { loginCustomer } from "@/services/api";
import { toast } from "sonner";
import { useAuth, selectIsLoggedIn } from "@/context/auth-store";
import { validateEmail, validatePassword, sanitizeInput } from "@/lib/validation";
import { useDocumentMetadata } from "@/hooks/useDocumentMetadata";

const API = "https://egnaromart.com/api";

type Step = "login" | "forgot-email" | "forgot-otp" | "forgot-newpw";

export default function Login() {
  useDocumentMetadata("Customer Login", "Log in to your Egnaro Mart account to track your orders, view vendor profiles, and manage saved shipping addresses.");

  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(
    (searchParams.get("step") as Step) || "login"
  );

  return (
    <div className="relative min-h-screen w-full bg-[#080c14] overflow-hidden flex items-center justify-center p-3 sm:p-4">
      
      {/* Soft, extremely muted ambient light behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[160px] opacity-[0.03] bg-gradient-to-tr from-primary to-violet-500 pointer-events-none" />
      
      {/* Subtle tech background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md my-6 sm:my-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            {step === "login" && (
              <LoginForm onForgot={() => setStep("forgot-email")} />
            )}
            {step === "forgot-email" && (
              <EmailStep onNext={() => setStep("forgot-otp")} onBack={() => setStep("login")} />
            )}
            {step === "forgot-otp" && (
              <OtpStep onNext={() => setStep("forgot-newpw")} onBack={() => setStep("forgot-email")} />
            )}
            {step === "forgot-newpw" && (
              <NewPwStep onDone={() => setStep("login")} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Clean Security Footer */}
        <div className="mt-8 text-center space-y-1.5 pointer-events-none">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Encrypted Customer Authorization Registry
          </p>
          <p className="text-[10px] text-slate-600 font-semibold">
            © {new Date().getFullYear()} Egnaro Mart. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPACT & TRUSTED CARD
========================================================= */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[24px] border border-white/5 bg-[#0e1422]/90 p-5 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden w-full">
      <div className="relative z-10 space-y-6">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD STYLES
========================================================= */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
        {label}
      </label>
      <div className="relative w-full">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   CLEAN & CRISP INPUT BOXES
========================================================= */
const premiumInputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/30 hover:border-white/15 font-medium";

/* =========================================================
   COMPACT PLATFORM BUTTONS
========================================================= */
function PrimaryButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
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
    <div className="text-center space-y-2 pb-1">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-inner">
        <div className="text-primary">{icon}</div>
      </div>
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold text-white tracking-tight leading-none font-display">
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
    <div className="flex items-center gap-2.5 rounded-xl border border-red-500/10 bg-red-500/5 p-3.5 text-xs font-medium text-red-400">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
      <span>{msg}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP 0 — LOGIN FORM
═══════════════════════════════════════════════════════════ */
function saveReset(key: string, value: string) {
  sessionStorage.setItem("reset_" + key, value);
}
function loadReset(key: string) {
  return sessionStorage.getItem("reset_" + key) || "";
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuth((s) => s.login);
  const isLoggedIn = useAuth(selectIsLoggedIn);

  const redirectTo = searchParams.get("redirect") || "/my-account";

  useEffect(() => {
    if (isLoggedIn) {
      navigate(redirectTo);
    }
  }, [isLoggedIn, navigate, redirectTo]);

  const mutation = useMutation({
    mutationFn: () => loginCustomer({ email, password }),
    onSuccess: (data) => {
      if (data.success) {
        // Normalize user object: API may return `fullName` instead of `name`
        const rawUser = data.user ?? {};
        const normalizedUser = {
          ...rawUser,
          name: rawUser.name || rawUser.fullName || rawUser.full_name || rawUser.username || "",
        };
        login(data.token, normalizedUser);
        toast.success("Welcome back!");
        navigate(redirectTo);
      } else {
        setErrorMsg(data.message ?? "Login failed.");
      }
    },
    onError: () => setErrorMsg("Something went wrong."),
  });

  return (
    <Card>
      <div className="text-center space-y-2 pb-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-inner">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-white tracking-tight leading-none font-display">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sign in to your Egnaro Mart account
          </p>
        </div>
      </div>

      {errorMsg && <ErrorBanner msg={errorMsg} />}

      <form
        autoComplete="on"
        onSubmit={(e) => { 
          e.preventDefault(); 
          setErrorMsg(null); 
          const cleanEmail = sanitizeInput(email);
          if (!validateEmail(cleanEmail)) {
            setErrorMsg("Please enter a valid email address.");
            return;
          }
          mutation.mutate(); 
        }}
        className="space-y-4"
      >
        <fieldset disabled={mutation.isPending} className="space-y-4 border-none p-0 m-0 min-w-0">
        <Field label="Email Address">
          <input 
            type="email" 
            autoComplete="email" 
            placeholder="you@example.com"
            value={email} 
            required 
            onChange={(e) => { setEmail(e.target.value.trim()); setErrorMsg(null); }}
            className={premiumInputClass} 
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              autoComplete="current-password" 
              placeholder="••••••••"
              value={password} 
              required 
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
              className={`${premiumInputClass} pr-12`} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <button 
            type="button" 
            onClick={onForgot}
            className="text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <PrimaryButton loading={mutation.isPending} label="Sign In to Portal" loadingLabel="Authenticating..." />
        </fieldset>
      </form>

      <p className="text-center text-xs text-slate-400 font-semibold mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="font-bold text-primary hover:text-primary-hover ml-1">
          Create account
        </Link>
      </p>
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
      const res = await fetch(`${API}/send-otp.php`, {
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
        icon={<Mail className="h-4.5 w-4.5" />}
        title="Reset Password" 
        subtitle="Provide your registered email to receive a 6-digit verification code." 
      />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleSend} className="space-y-4">
        <fieldset disabled={loading} className="space-y-4 border-none p-0 m-0 min-w-0">
        <Field label="Email Address">
          <input 
            type="email" 
            placeholder="you@example.com" 
            value={email} 
            required
            onChange={(e) => setEmail(e.target.value.trim())} 
            className={premiumInputClass} 
          />
        </Field>

        <PrimaryButton loading={loading} label="Send OTP Key" loadingLabel="Sending..." />
        </fieldset>
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
      const res = await fetch(`${API}/verify-otp.php`, {
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
      await fetch(`${API}/send-otp.php`, {
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
        icon={<KeyRound className="h-4.5 w-4.5" />}
        title="Enter Verification Key" 
        subtitle={`Verify the 6-digit key sent to ${email}`} 
      />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleVerify} className="space-y-4">
        <fieldset disabled={loading} className="space-y-4 border-none p-0 m-0 min-w-0">
        <Field label="6-Digit Verification Token">
          <input
            type="text" 
            inputMode="numeric" 
            maxLength={6} 
            placeholder="••••••"
            value={otp} 
            required
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${premiumInputClass} text-center text-lg tracking-[0.3em] font-bold`}
          />
        </Field>

        <PrimaryButton loading={loading} label="Verify Token Code" loadingLabel="Verifying..." />
        </fieldset>
      </form>

      <p className="text-center text-xs text-slate-500 font-semibold mt-2">
        Didn't receive it?{" "}
        <button onClick={handleResend} className="text-primary hover:text-primary-hover font-bold cursor-pointer">
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
    const pwError = validatePassword(pw);
    if (pwError) { setError(pwError); return; }
    if (pw !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/reset-password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: pw }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.removeItem("reset_email");
        sessionStorage.removeItem("reset_otp");
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
            <h2 className="text-lg font-bold text-white tracking-tight">
              Password Restored
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              Your credentials have been successfully updated.
            </p>
          </div>
          
          <button 
            onClick={onDone}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
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
        icon={<Lock className="h-4.5 w-4.5" />}
        title="Establish Passcode" 
        subtitle="Choose a secure, strong passcode for your account onboarding." 
      />

      {error && <ErrorBanner msg={error} />}

      <form onSubmit={handleReset} className="space-y-4">
        <fieldset disabled={loading} className="space-y-4 border-none p-0 m-0 min-w-0">
        <Field label="New Secure Passcode">
          <div className="relative">
            <input 
              type={showNewPw ? "text" : "password"} 
              placeholder="••••••••" 
              value={pw} 
              required 
              onChange={(e) => { setPw(e.target.value); setError(null); }} 
              className={`${premiumInputClass} pr-12`} 
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirm Passcode Registry">
          <div className="relative">
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
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirm && pw !== confirm && (
            <p className="mt-1 text-xs text-red-400 font-semibold">Passcodes do not match</p>
          )}
        </Field>

        <PrimaryButton loading={loading} label="Reset Password" loadingLabel="Resetting..." />
        </fieldset>
      </form>
    </Card>
  );
}
