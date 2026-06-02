import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ShoppingCart,
  Menu,
  X,
  Store,
  Shield,
  LogIn,
  User,
  LogOut,
  Search,
  Home,
  ShoppingBag,
  Info,
  Phone,
  Package,
} from "lucide-react";

import {
  useState,
  useEffect,
  useRef,
} from "react";

import { motion, AnimatePresence } from "framer-motion";

import {
  useCart,
  cartCount,
} from "@/context/cart-store";
import { useAuth, selectIsVendor } from "@/context/auth-store";

import logo from "@/assets/logo.jpeg";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/products", label: "Shop", icon: ShoppingBag },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Phone },
] as const;

export function Header() {
  const count = useCart(cartCount);
  const isVendor = useAuth(selectIsVendor);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Sync auth and close menus on route change
  useEffect(() => {
    setOpen(false);
    setUserMenuOpen(false);
  }, [path]);

  // Sync search input value with URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchVal(params.get("q") ?? "");
  }, [location.search]);

  // Scroll listener for sticky styling
  const ticking = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 8);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Outside click handler for desktop profile menu
  useEffect(() => {
    if (!userMenuOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    navigate("/login");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchVal.trim();
    if (q) {
      navigate(`/products?q=${encodeURIComponent(q)}`);
    } else {
      navigate(`/products`);
    }
  }

  // Safe name derivation — handles APIs that return fullName instead of name
  const displayName =
    user?.name ||
    (user as any)?.fullName ||
    (user as any)?.full_name ||
    (user as any)?.username ||
    "Account";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${
        scrolled
          ? "border-b border-white/5 bg-[#080C14]/90 backdrop-blur-xl shadow-lg py-3"
          : "bg-[#080C14]/30 backdrop-blur-sm py-4 border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* =========================================================
           1. DESKTOP HEADER LAYOUT (lg & above)
        ========================================================= */}
        <div className="hidden lg:flex h-16 items-center justify-between">
          
          {/* Brand Logo Only (Removed border and name text for clean visual look) */}
          <Link to="/" className="flex items-center active:scale-98 transition-transform shrink-0">
            <img
              src={logo}
              alt="Egnaro Mart Logo"
              className="h-11 w-auto object-contain rounded-xl"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="flex items-center gap-1.5">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 font-sans text-xs uppercase tracking-[0.06em] transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100 font-medium"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <NavLink
              to="/my-account"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 font-sans text-xs uppercase tracking-[0.06em] transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100 font-medium"
                }`
              }
            >
              My Account
            </NavLink>
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3">
            <Link
              to={isVendor ? "/vendor-dashboard" : "/vendor-register"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-[#0e1420]/60 px-4 py-2.5 text-xs font-semibold text-[#64748b] hover:text-white transition-all cursor-pointer hover:border-white/15"
            >
              <Store className="h-3.5 w-3.5" />
              <span>{isVendor ? "Vendor Dashboard" : "Sell on Egnaro"}</span>
            </Link>

            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-[#0e1420]/60 px-4 py-2.5 text-xs font-semibold text-[#64748b] hover:text-white transition-all cursor-pointer hover:border-white/15"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold transition-all hover:bg-white/5 text-white cursor-pointer"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {displayName[0].toUpperCase()}
                  </span>
                  <span>{displayName}</span>
                </button>

                <div
                  className={`absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0e1420]/95 backdrop-blur-2xl shadow-xl transition-all duration-150 ${
                    userMenuOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  }`}
                >
                  <Link
                    to="/my-account"
                    className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#64748b] transition-colors hover:bg-white/5 hover:text-white"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>My Account</span>
                  </Link>

                  <div className="border-t border-white/5" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-primary/10"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login</span>
              </Link>
            )}

            {/* Desktop Cart */}
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer hover:border-white/15"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-md shadow-primary/30 animate-pulse">
                  {count}
                </span>
              )}
            </Link>
          </div>

        </div>

        {/* =========================================================
           2. PREMIUM MOBILE HEADER BAR (below lg)
        ========================================================= */}
        <div className="lg:hidden flex flex-col gap-3 py-1 w-full">
          
          <div className="flex items-center justify-between w-full">
            
            {/* Logo only (No border, no name text) */}
            <Link to="/" className="flex items-center active:scale-98 transition-all shrink-0">
              <img
                src={logo}
                alt="Egnaro Mart Logo"
                className="h-10 w-auto object-contain rounded-xl"
              />
            </Link>

            {/* Compact Header Icons Panel */}
            <div className="flex items-center gap-2">
              
              {/* Shopping Cart */}
              <Link
                to="/cart"
                className="relative flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-md shadow-primary/30 animate-pulse">
                    {count}
                  </span>
                )}
              </Link>

              {/* Side menu trigger */}
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
              </button>

            </div>

          </div>

          {/* Commerce-grade App Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full group mt-1"
          >
            <div className="absolute left-4.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-primary" />
            </div>
            
            <input
              type="text"
              placeholder="Search premium electronics, hardware..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full h-11 pl-11 pr-24 rounded-2xl border border-white/10 bg-[#080C14]/60 text-xs text-white placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-primary/80 focus:ring-2 focus:ring-primary/10 hover:border-white/15 font-medium shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            />
            
            <button
              type="submit"
              className="absolute right-1.5 h-8 px-4 rounded-xl bg-primary text-[9px] font-bold text-primary-foreground uppercase tracking-widest hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

        </div>

      </div>

      {/* =========================================================
         3. PREMIUM E-COMMERCE MOBILE DRAWER OVERLAY (Slide-out menu)
      ========================================================= */}
      <AnimatePresence>
        {open && (
          <>
            {/* Flat dark overlay without heavy blur filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/75 lg:hidden"
            />

            {/* Slide-out Navigation Drawer Container (no backdrop-blur, solid color background) */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[340px] bg-gradient-to-b from-[#0d1117] to-[#0f1624] flex flex-col justify-between shadow-2xl lg:hidden h-[100dvh] overflow-hidden"
            >
              
              {/* Upper Section */}
              <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none">
                
                {/* 3.1 Header Bar (64px height, completely removed logo) */}
                <div className="h-[64px] bg-white/[0.03] border-b border-white/[0.07] px-5 flex items-center justify-between shrink-0">
                  <div className="text-[10px] font-bold tracking-widest text-primary uppercase font-display">
                    Menu Directory
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Cart in Header bar */}
                    <Link
                      to="/cart"
                      onClick={() => setOpen(false)}
                      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-white"
                    >
                      <ShoppingCart className="h-[22px] w-[22px]" />
                      {count > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-md">
                          {count}
                        </span>
                      )}
                    </Link>

                    {/* Close button */}
                    <button
                      onClick={() => setOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.12] transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </div>

                {/* 3.2 Dynamic Account Greeting Strip */}
                <div className="bg-white/[0.02] border-b border-white/[0.06] px-5 py-3.5 shrink-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {user && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-[11px] font-bold text-primary">
                        {displayName[0].toUpperCase()}
                      </span>
                    )}
                    <span className="font-display font-bold text-[0.9rem] text-slate-200">
                      {user ? `Hi, ${user.name}` : "Hi"}
                    </span>
                  </div>
                  {!user && (
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-primary px-4 py-1.5 text-[0.78rem] font-bold text-primary-foreground shadow-md active:scale-95 transition-transform"
                    >
                      Sign In
                    </Link>
                  )}
                </div>

                {/* 3.3 Main Navigation Links Group */}
                <div className="py-2">
                  <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#64748b] px-5 pt-3 pb-1">
                    Explore
                  </div>
                  
                  <nav className="space-y-1">
                    {NAV.map((n, idx) => {
                      const isActive = path === n.to;
                      const Icon = n.icon;
                      return (
                        <NavLink
                          key={n.to}
                          to={n.to}
                          end={n.to === "/"}
                          onClick={() => setOpen(false)}
                          className={`mx-3 flex h-[52px] items-center gap-3.5 px-[1.25rem] rounded-xl transition-all duration-200 ${
                            isActive
                              ? "border-l-3 border-primary bg-primary/[0.07] text-[#f1f5f9]"
                              : "text-slate-400 hover:bg-white/[0.05] hover:text-[#f1f5f9]"
                          }`}
                        >
                          <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : "text-[#64748b]"}`} />
                          <span className="text-[0.95rem] font-semibold font-sans">{n.label}</span>
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>

                {/* Subtle Divider */}
                <div className="h-px bg-white/[0.05] mx-5 my-2" />

                {/* 3.4 Account & Portal Links Group */}
                <div className="py-2">
                  <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#64748b] px-5 pt-2 pb-1">
                    My Account
                  </div>

                  <div className="space-y-1">
                    <NavLink
                      to="/my-account"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `mx-3 flex h-[52px] items-center gap-3.5 px-[1.25rem] rounded-xl transition-all duration-200 ${
                          isActive
                            ? "border-l-3 border-primary bg-primary/[0.07] text-[#f1f5f9]"
                            : "text-slate-400 hover:bg-white/[0.05] hover:text-[#f1f5f9]"
                        }`
                      }
                    >
                      <User className="h-5 w-5 text-[#64748b] shrink-0" />
                      <span className="text-[0.95rem] font-semibold font-sans">Account Profile</span>
                    </NavLink>

                    <NavLink
                      to="/track-order"
                      onClick={() => setOpen(false)}
                      className="mx-3 flex h-[52px] items-center gap-3.5 px-[1.25rem] rounded-xl text-slate-400 hover:bg-white/[0.05] hover:text-[#f1f5f9] transition-all duration-200"
                    >
                      <Package className="h-5 w-5 text-[#64748b] shrink-0" />
                      <span className="text-[0.95rem] font-semibold font-sans">Track My Order</span>
                    </NavLink>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div className="h-px bg-white/[0.05] mx-5 my-2" />

                {/* 3.5 Seller / Admin Links Group */}
                <div className="py-2">
                  <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#64748b] px-5 pt-2 pb-1">
                    Seller & Admin
                  </div>

                  <div className="space-y-1">
                    <NavLink
                      to={isVendor ? "/vendor-dashboard" : "/vendor-register"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `mx-3 flex h-[52px] items-center justify-between px-[1.25rem] rounded-xl bg-[#f59e0b]/[0.04] transition-all duration-200 ${
                          isActive
                            ? "border-l-3 border-primary bg-primary/[0.07] text-[#f1f5f9]"
                            : "text-slate-400 hover:bg-white/[0.05] hover:text-[#f1f5f9]"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3.5">
                        <Store className="h-5 w-5 text-[#f59e0b] shrink-0" />
                        <span className="text-[0.95rem] font-semibold font-sans">Sell on Egnaro</span>
                      </div>
                      <span className="text-[0.6rem] font-bold tracking-widest text-[#f59e0b] bg-[#f59e0b]/[0.15] px-2 py-0.5 rounded-full uppercase">
                        Join
                      </span>
                    </NavLink>

                    <NavLink
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `mx-3 flex h-[52px] items-center gap-3.5 px-[1.25rem] rounded-xl bg-[#f59e0b]/[0.04] transition-all duration-200 ${
                          isActive
                            ? "border-l-3 border-primary bg-primary/[0.07] text-[#f1f5f9]"
                            : "text-slate-400 hover:bg-white/[0.05] hover:text-[#f1f5f9]"
                        }`
                      }
                    >
                      <Shield className="h-5 w-5 text-[#f59e0b] shrink-0" />
                      <span className="text-[0.95rem] font-semibold font-sans">Admin Panel</span>
                    </NavLink>
                  </div>
                </div>

                {/* Subtle Divider (for Session controls) */}
                {user && (
                  <>
                    <div className="h-px bg-white/[0.05] mx-5 my-2" />
                    
                    <div className="py-2">
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#64748b] px-5 pt-2 pb-1">
                        Session Management
                      </div>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                        className="mx-3 flex w-[calc(100%-24px)] h-[52px] items-center gap-3.5 px-[1.25rem] rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 cursor-pointer text-left font-sans font-semibold"
                      >
                        <LogOut className="h-5 w-5 text-red-400 shrink-0" />
                        <span className="text-[0.95rem]">Logout</span>
                      </button>
                    </div>
                  </>
                )}

              </div>

              {/* 3.6 Bottom Start Shopping CTA */}
              <div className="p-5 border-t border-white/[0.06] shrink-0">
                <Link
                  to="/products"
                  onClick={() => setOpen(false)}
                  className="w-full h-12 rounded-xl bg-primary flex items-center justify-center gap-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-98 transition-transform font-display animate-none"
                >
                  <span>Start Shopping</span>
                  <span>→</span>
                </Link>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
}