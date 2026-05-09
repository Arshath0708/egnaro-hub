// src/components/layout/Header.tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, Store, Shield, LogIn, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/cart-store";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpeg";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/track-order", label: "Track Order" },
] as const;

export function Header() {
  const count = useCart((s) => s.count());
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Read auth state from localStorage
  const [user, setUser] = useState<{ name?: string } | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Sync user state whenever path changes (e.g. after login/logout)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
    setOpen(false);
    setUserMenuOpen(false);
  }, [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setUserMenuOpen(false);
  }

  // First name or fallback
  const displayName = user?.name?.split(" ")[0] ?? "Account";

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled ? "glass-strong shadow-elegant" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Egnaro Mart"
              className="h-13 w-auto object-contain"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-foreground hover:bg-white/5 transition-colors"
                activeProps={{
                  className:
                    "px-3 py-2 text-sm font-medium text-foreground bg-white/5 rounded-lg",
                }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/vendor-register"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Store className="h-3.5 w-3.5" /> Sell on Egnaro
            </Link>

            <Link
              to="/admin"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>

            {/* ── Auth button ─────────────────────────────────────── */}
            {user ? (
              /* Logged-in: avatar button + dropdown */
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass text-xs font-semibold hover:shadow-glow transition-all"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                    {displayName[0].toUpperCase()}
                  </span>
                  {displayName}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-44 rounded-2xl glass-strong border border-glass-border shadow-2xl overflow-hidden"
                    >
                      <Link
                        to="/track-order"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-3.5 w-3.5" /> My Orders
                      </Link>
                      <div className="border-t border-glass-border" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Logged-out: Login button */
              <Link
                to="/login"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-primary text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 hover:-translate-y-px hover:shadow-lg hover:shadow-primary/35 transition-all duration-200"
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Link>
            )}
            {/* ── /Auth button ─────────────────────────────────────── */}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl glass hover:shadow-glow transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground grid place-items-center"
                >
                  {count}
                </motion.span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden p-2.5 rounded-xl glass"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden glass-strong border-t border-glass-border"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5"
                >
                  {n.label}
                </Link>
              ))}
              <div className="border-t border-glass-border my-2" />
              <Link
                to="/vendor-register"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5"
              >
                Sell on Egnaro
              </Link>
              <Link
                to="/admin"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5"
              >
                Admin Panel
              </Link>
              <div className="border-t border-glass-border my-2" />
              {/* Mobile auth */}
              {user ? (
                <>
                  <Link
                    to="/track-order"
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-white/5"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-primary"
                >
                  <LogIn className="h-4 w-4" /> Login / Register
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}