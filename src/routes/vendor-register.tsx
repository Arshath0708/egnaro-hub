import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, LogIn, ShieldCheck, Lock, Mail, KeyRound, Loader2, ArrowLeft, Clock, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { addVendor, getLocations, addLocation } from "@/services/api";
import { useAuth, selectIsVendor } from "@/context/auth-store";
import { useDocumentMetadata } from "@/hooks/useDocumentMetadata";
import { toast } from "sonner";
import { LocationSelect } from "@/components/LocationSelect";
import { validateName, validateEmail, validatePhone, validatePassword, sanitizeInput } from "@/lib/validation";

const API = import.meta.env.VITE_API_URL || "/api";

type RegisterForm = {
  vendor_name: string;
  company_name: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  state: string;
  city: string;
  town: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
};
type LoginForm = { email: string; password: string };

const EMPTY_REGISTER: RegisterForm = {
  vendor_name: "", company_name: "", phone: "", email: "",
  password: "", address: "", state: "", city: "", town: "", bank_name: "", account_number: "", ifsc_code: "",
};
const EMPTY_LOGIN: LoginForm = { email: "", password: "" };

const inp =
  "w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary";

type ResetStep =
  | "idle"
  | "waiting_admin_approval"
  | "show_reset_form"
  | "waiting_admin_reactivation";

export default function VendorRegister() {
  useDocumentMetadata("Vendor Portal", "Register or log in as a vendor on Egnaro Mart to start selling your products online.");

  const navigate = useNavigate();
  const loginVendor = useAuth((s) => s.loginVendor);
  const isVendor = useAuth(selectIsVendor);

  useEffect(() => {
    if (isVendor) navigate("/vendor-dashboard");
  }, [isVendor, navigate]);

  const [mode, setMode] = useState<"register" | "login">("register");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<RegisterForm>(EMPTY_REGISTER);

  // Custom text input states when selecting "Other"
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customTown, setCustomTown] = useState("");

  const [locations, setLocations] = useState<any[]>([]);
  useEffect(() => {
    async function load() {
      try {
        const data = await getLocations();
        if (Array.isArray(data)) {
          setLocations(data);
        }
      } catch (err) {
        console.error("Failed to load locations", err);
      }
    }
    load();
  }, []);

  const availableStates = useMemo(() => {
    const states = new Set<string>();
    locations.forEach((loc) => {
      if (loc.state) states.add(loc.state);
    });
    return [...Array.from(states).sort(), "other"];
  }, [locations]);

  const availableCities = useMemo(() => {
    if (!form.state || form.state === "other") return [];
    const cities = new Set<string>();
    locations.forEach((loc) => {
      if (loc.state === form.state && loc.city) {
        cities.add(loc.city);
      }
    });
    return [...Array.from(cities).sort(), "other"];
  }, [locations, form.state]);

  const availableTowns = useMemo(() => {
    if (!form.city || form.city === "other") return [];
    const towns = new Set<string>();
    locations.forEach((loc) => {
      if (loc.state === form.state && loc.city === form.city && loc.town) {
        towns.add(loc.town);
      }
    });
    return [...Array.from(towns).sort(), "other"];
  }, [locations, form.state, form.city]);

  const setLocationState = useCallback((state: string) => {
    setForm((p) => ({ ...p, state, city: "", town: "" }));
    setCustomState("");
    setCustomCity("");
    setCustomTown("");
  }, []);

  const setLocationCity = useCallback((city: string) => {
    setForm((p) => ({ ...p, city, town: "" }));
    setCustomCity("");
    setCustomTown("");
  }, []);
  const [loginData, setLoginData] = useState<LoginForm>(EMPTY_LOGIN);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Forgot-password state — initialised from localStorage to survive page reload
  const storedEmail = localStorage.getItem("vendor_reset_email") || "";
  const [forgotMode, setForgotMode] = useState(!!storedEmail);
  const [resetEmail, setResetEmail] = useState(storedEmail);
  const [resetStep, setResetStep] = useState<ResetStep>("idle");
  const [resetLoading, setResetLoading] = useState(false);
  const [hasFetchedStatus, setHasFetchedStatus] = useState(false); // true after first server response
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkResetStatus(email: string) {
    try {
      const res = await fetch(`${API}/check-vendor-reset-status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setResetStep(data.step as ResetStep);
        setHasFetchedStatus(true); // mark that we have real data now
      }
    } catch { /* silent */ }
  }

  function startPolling(email: string) {
    stopPolling();
    pollRef.current = setInterval(() => checkResetStatus(email), 5000);
  }
  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }
  useEffect(() => () => stopPolling(), []);

  // On mount: if there is a stored reset email, restore step from server immediately
  useEffect(() => {
    if (storedEmail) {
      setMode("login");
      checkResetStatus(storedEmail).then(() => startPolling(storedEmail));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When status becomes "idle" while in forgot mode AND we already have a real
  // server response (hasFetchedStatus) => admin reactivated, all done
  useEffect(() => {
    if (resetStep === "idle" && forgotMode && hasFetchedStatus) {
      stopPolling();
      localStorage.removeItem("vendor_reset_email");
      toast.success("Account reactivated! You can now log in.");
      setForgotMode(false);
      setResetEmail("");
      setNewPw("");
      setConfirmPw("");
    }
  }, [resetStep, hasFetchedStatus]);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await fetch(`${API}/vendor-request-reset.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("vendor_reset_email", resetEmail); // persist across reloads
        toast.success("Reset request sent to admin");
        setResetStep("waiting_admin_approval");
        startPolling(resetEmail);
      } else {
        toast.error(data.message || "Request failed");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleVendorReset(e: React.FormEvent) {
    e.preventDefault();
    const pwError = validatePassword(newPw);
    if (pwError) { toast.error(pwError); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    setResetLoading(true);
    try {
      const res = await fetch(`${API}/vendor-reset-password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, new_password: newPw }),
      });
      const data = await res.json();
      if (data.success) {
        // Password saved — clear reset state and let vendor login immediately
        stopPolling();
        localStorage.removeItem("vendor_reset_email");
        toast.success("Password reset successfully! You can now log in with your new password.");
        setForgotMode(false);
        setResetStep("idle");
        setResetEmail("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error(data.message || "Reset failed");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setResetLoading(false);
    }
  }

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
    const pwError = validatePassword(form.password);
    if (pwError) { toast.error(pwError); return; }
    
    const cleanVendorName = sanitizeInput(form.vendor_name);
    const cleanCompanyName = sanitizeInput(form.company_name);
    const cleanEmail = sanitizeInput(form.email);
    const cleanAddress = sanitizeInput(form.address);
    
    if (!validateName(cleanVendorName)) { toast.error("Valid vendor name required (letters/spaces only)"); return; }
    if (!validateEmail(cleanEmail)) { toast.error("Valid email required"); return; }
    if (!validatePhone(form.phone)) { toast.error("Valid 10-digit phone number required"); return; }

    // Resolve final state, city, and town names, prioritizing typed custom values if "other" is selected
    const finalState = form.state === "other" ? customState.trim() : form.state;
    const finalCity = (form.state === "other" || form.city === "other") ? customCity.trim() : form.city;
    const finalTown = (form.state === "other" || form.city === "other" || form.town === "other") ? customTown.trim() : form.town;

    if (!finalState) {
      toast.error("Please enter a State name");
      return;
    }
    if (!finalCity) {
      toast.error("Please enter a City name");
      return;
    }
    if (!finalTown) {
      toast.error("Please enter a Town / Area name");
      return;
    }

    setLoading(true);
    try {
      // 1. If any custom fields were used, dynamically register the new State/City/Town combinator in locations index table
      const isCustomLocation = 
        form.state === "other" || 
        form.city === "other" || 
        form.town === "other";

      if (isCustomLocation) {
        // Prepare payload (this will check for duplicates case-insensitively on the backend)
        await addLocation(finalState, finalCity, finalTown);
      }

      // 2. Submit vendor registration payload with the resolved normalized parameters
      const res = await addVendor({
        ...form,
        vendor_name: cleanVendorName,
        company_name: cleanCompanyName,
        email: cleanEmail,
        address: cleanAddress,
        state: finalState,
        city: finalCity,
        town: finalTown,
      });

      if (res.success) {
        setSubmitted(true);
        toast.success("Application submitted successfully");
      } else {
        toast.error(res.message || "Registration failed");
      }
    } catch {
      toast.error("Server error during registration");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendor-login.php`, {
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

  function exitForgot() {
    setForgotMode(false);
    stopPolling();
    setResetStep("idle");
    setResetEmail("");
    setNewPw("");
    setConfirmPw("");
    setShowPassword(false);
    setShowLoginPassword(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    localStorage.removeItem("vendor_reset_email");
  }

  if (submitted) {
    return (
      <Shell>
        <div className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-400" />
            <h1 className="text-2xl font-bold text-white">Application Submitted</h1>
            <p className="mt-2 text-gray-400">Your account is awaiting admin approval.</p>
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-300">
              You can login after admin approves your account.
            </div>
            <button
              onClick={() => { setSubmitted(false); setMode("login"); }}
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            {mode === "register" ? "Become a Vendor" : forgotMode ? "Reset Password" : "Vendor Login"}
          </h1>
          <p className="mt-2 text-gray-400">Join India's marketplace for electronics &amp; industrial goods.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
          {/* Mode Tabs — hidden in forgot mode */}
          {!forgotMode && (
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${mode === "register" ? "gradient-primary text-white" : "bg-slate-800 text-gray-300"}`}
              >
                Register
              </button>
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${mode === "login" ? "gradient-primary text-white" : "bg-slate-800 text-gray-300"}`}
              >
                Login
              </button>
            </div>
          )}

          {/* ── REGISTER ── */}
          {mode === "register" && !forgotMode && (
            <form onSubmit={handleRegister} autoComplete="on" className="space-y-4">
              <fieldset disabled={loading} className="space-y-4 border-none p-0 m-0 min-w-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Vendor Name (as per in bank a/c)</label>
                  <input required autoComplete="name" placeholder="Your full name" className={inp}
                    value={form.vendor_name} onChange={(e) => setRegField("vendor_name", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Company Name</label>
                  <input required autoComplete="organization" placeholder="Company / Shop name" className={inp}
                    value={form.company_name} onChange={(e) => setRegField("company_name", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Phone</label>
                  <input required type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="9876543210" className={inp}
                    value={form.phone} onChange={(e) => setRegField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                  <input required type="email" autoComplete="email" placeholder="you@company.com" className={inp}
                    value={form.email} onChange={(e) => setRegField("email", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Bank Name</label>
                  <input required placeholder="e.g. HDFC Bank" className={inp}
                    value={form.bank_name} onChange={(e) => setRegField("bank_name", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">Account Number</label>
                  <input required placeholder="e.g. 1234567890" className={inp}
                    value={form.account_number} onChange={(e) => setRegField("account_number", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">IFSC Code</label>
                  <input required placeholder="e.g. HDFC0001234" className={inp}
                    value={form.ifsc_code} onChange={(e) => setRegField("ifsc_code", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input required type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Min 8 characters (1 num, 1 upper)"
                    className={`${inp} pl-10 pr-10`} value={form.password}
                    onChange={(e) => setRegField("password", e.target.value)} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Business Address</label>
                <textarea required rows={3} autoComplete="street-address" placeholder="Full business address"
                  className={`${inp} resize-none`} value={form.address}
                  onChange={(e) => setRegField("address", e.target.value)} />
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* State Select */}
                  <LocationSelect
                    label="State"
                    value={form.state}
                    onValueChange={setLocationState}
                    options={availableStates}
                    placeholder="Select State"
                    customValue={customState}
                    onCustomValueChange={setCustomState}
                    customPlaceholder="Enter custom State..."
                  />

                  {/* City Select */}
                  {form.state === "other" ? (
                    <div className="space-y-1.5 w-full">
                      <label className="block text-xs font-semibold text-gray-400 tracking-wide uppercase">
                        City
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter custom City..."
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        className="w-full h-11 rounded-xl border border-primary/30 bg-[#090d1a]/80 px-4 py-3 text-sm text-white placeholder:text-gray-600 shadow-inner outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                      />
                    </div>
                  ) : (
                    <LocationSelect
                      label="City"
                      value={form.city}
                      onValueChange={setLocationCity}
                      options={availableCities}
                      placeholder="Select City"
                      disabled={!form.state}
                      customValue={customCity}
                      onCustomValueChange={setCustomCity}
                      customPlaceholder="Enter custom City..."
                    />
                  )}

                  {/* Town Select */}
                  {form.state === "other" || form.city === "other" ? (
                    <div className="space-y-1.5 w-full">
                      <label className="block text-xs font-semibold text-gray-400 tracking-wide uppercase">
                        Town / Area
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter custom Town..."
                        value={customTown}
                        onChange={(e) => setCustomTown(e.target.value)}
                        className="w-full h-11 rounded-xl border border-primary/30 bg-[#090d1a]/80 px-4 py-3 text-sm text-white placeholder:text-gray-600 shadow-inner outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                      />
                    </div>
                  ) : (
                    <LocationSelect
                      label="Town / Area"
                      value={form.town}
                      onValueChange={(val) => setRegField("town", val)}
                      options={availableTowns}
                      placeholder="Select Town"
                      disabled={!form.city}
                      customValue={customTown}
                      onCustomValueChange={setCustomTown}
                      customPlaceholder="Enter custom Town..."
                    />
                  )}
                </div>
              </div>
              <button disabled={loading}
                className="w-full rounded-lg gradient-primary py-3 font-semibold text-white disabled:opacity-60">
                {loading ? "Submitting..." : "Submit Application"}
              </button>
              </fieldset>
            </form>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && !forgotMode && (
            <form onSubmit={handleLogin} autoComplete="on" className="space-y-4">
              <fieldset disabled={loading} className="space-y-4 border-none p-0 m-0 min-w-0">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Email</label>
                <input required type="email" autoComplete="email" placeholder="you@company.com" className={inp}
                  value={loginData.email} onChange={(e) => setLoginField("email", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Password</label>
                <div className="relative">
                  <input required type={showLoginPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className={`${inp} pr-10`}
                    value={loginData.password} onChange={(e) => setLoginField("password", e.target.value)} />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button"
                  onClick={() => { setForgotMode(true); setResetStep("idle"); }}
                  className="text-xs text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <button disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary py-3 font-semibold text-white disabled:opacity-60">
                <LogIn className="h-4 w-4" />
                {loading ? "Authenticating..." : "Login to Dashboard"}
              </button>
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" /> Approved vendors only.
              </div>
              </fieldset>
            </form>
          )}

          {/* ── FORGOT PASSWORD FLOW ── */}
          {forgotMode && (
            <div className="space-y-5">
              <button onClick={exitForgot}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>

              {/* Step: idle — email input */}
              {resetStep === "idle" && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <fieldset disabled={resetLoading} className="space-y-4 border-none p-0 m-0 min-w-0">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-gray-400">
                      Enter your vendor email to request a password reset. The admin will review and approve your request.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Vendor Email</label>
                    <input required type="email" placeholder="you@company.com" className={inp}
                      value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                  </div>
                  <button disabled={resetLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary py-3 font-semibold text-white disabled:opacity-60">
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    {resetLoading ? "Sending..." : "Request Password Reset"}
                  </button>
                  </fieldset>
                </form>
              )}

              {/* Step: waiting_admin_approval */}
              {resetStep === "waiting_admin_approval" && (
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10">
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Request Pending</h3>
                  <p className="text-sm text-gray-400">
                    Your password reset request has been sent to the admin. This page will update automatically once approved.
                  </p>
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-300 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for admin approval...
                  </div>
                </div>
              )}

              {/* Step: show_reset_form */}
              {resetStep === "show_reset_form" && (
                <form onSubmit={handleVendorReset} className="space-y-4">
                  <fieldset disabled={resetLoading} className="space-y-4 border-none p-0 m-0 min-w-0">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                      <KeyRound className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-2 text-sm text-green-300">
                      ✓ Admin approved your reset request
                    </div>
                    <p className="text-sm text-gray-400">Set your new password below.</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">New Password</label>
                    <div className="relative">
                      <input required type={showNewPw ? "text" : "password"} placeholder="Min 6 characters" className={`${inp} pr-10`}
                        value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
                      >
                        {showNewPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-400">Confirm Password</label>
                    <div className="relative">
                      <input required type={showConfirmPw ? "text" : "password"} placeholder="••••••••" className={`${inp} pr-10`}
                        value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {confirmPw && newPw !== confirmPw && (
                      <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                    )}
                  </div>
                  <button disabled={resetLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary py-3 font-semibold text-white disabled:opacity-60">
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {resetLoading ? "Saving..." : "Set New Password"}
                  </button>
                  </fieldset>
                </form>
              )}

              {/* Step: waiting_admin_reactivation */}
              {resetStep === "waiting_admin_reactivation" && (
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                    <RefreshCw className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Almost There!</h3>
                  <p className="text-sm text-gray-400">
                    Your new password has been saved. Waiting for the admin to reactivate your account. This page will refresh automatically.
                  </p>
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-300 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for account reactivation...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
