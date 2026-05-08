import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, Search, Store, Shield, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/cart-store";
import { motion, AnimatePresence } from "framer-motion";

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
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  return (
    <header className={`sticky top-0 z-50 transition-all ${scrolled ? "glass-strong shadow-elegant" : "bg-transparent"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-9 rounded-xl gradient-primary grid place-items-center shadow-glow">
              <span className="text-primary-foreground font-display font-bold text-lg">E</span>
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-lg tracking-tight">Egnaro Mart</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Premium Commerce</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-foreground hover:bg-white/5 transition-colors"
                activeProps={{ className: "px-3 py-2 text-sm font-medium text-foreground bg-white/5 rounded-lg" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/vendor-register" className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <Store className="h-3.5 w-3.5" /> Sell on Egnaro
            </Link>
            <Link to="/admin" className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
            <Link to="/cart" className="relative p-2.5 rounded-xl glass hover:shadow-glow transition-all">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground grid place-items-center"
                >{count}</motion.span>
              )}
            </Link>
            <button onClick={() => setOpen((o) => !o)} className="lg:hidden p-2.5 rounded-xl glass">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="lg:hidden glass-strong border-t border-glass-border"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5">{n.label}</Link>
              ))}
              <div className="border-t border-glass-border my-2" />
              <Link to="/vendor-register" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5">Sell on Egnaro</Link>
              <Link to="/admin" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5">Admin Panel</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
