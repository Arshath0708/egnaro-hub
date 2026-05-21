import {
  Link,
  NavLink,
  useLocation,
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
} from "lucide-react";

import {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  useCart,
  cartCount,
} from "@/context/cart-store";
import { useAuth, selectIsVendor } from "@/context/auth-store";

import logo from "@/assets/logo.jpeg";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/track-order", label: "My Account" },
] as const;

export function Header() {
  const count = useCart(cartCount);
  const isVendor = useAuth(selectIsVendor);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [open, setOpen] = useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  // ✅ React Router replacement
  const location = useLocation();

  const path = location.pathname;

  // Sync auth on route change
  useEffect(() => {
    setOpen(false);
    setUserMenuOpen(false);
  }, [path]);

  // Scroll listener
  useEffect(() => {
    const onScroll = () =>
      setScrolled(window.scrollY > 8);

    onScroll();

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, []);

  // Outside click
  useEffect(() => {
    if (!userMenuOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          e.target as Node
        )
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, [userMenuOpen]);

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
  }

  const displayName =
    user?.name?.split(" ")[0] ??
    "Account";

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        scrolled
          ? "border-b border-border bg-background/95 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center"
          >
            <img
              src={logo}
              alt="Egnaro Mart"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            <Link
              to={isVendor ? "/vendor-dashboard" : "/vendor-register"}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
            >
              <Store className="h-3.5 w-3.5" />
              {isVendor ? "Vendor Dashboard" : "Sell on Egnaro"}
            </Link>

            <Link
              to="/admin"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>

            {/* Auth */}
            {user ? (
              <div
                className="relative hidden md:block"
                ref={dropdownRef}
              >
                <button
                  onClick={() =>
                    setUserMenuOpen((o) => !o)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {displayName[0].toUpperCase()}
                  </span>

                  {displayName}
                </button>

                <div
                  className={`absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-150 ${
                    userMenuOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  }`}
                >
                  <Link
                    to="/track-order"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() =>
                      setUserMenuOpen(false)
                    }
                  >
                    <User className="h-3.5 w-3.5" />
                    My Account
                  </Link>

                  <div className="border-t border-border" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 md:inline-flex"
              >
                <LogIn className="h-3.5 w-3.5" />
                Login
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative rounded-lg p-2.5 transition-colors hover:bg-accent"
            >
              <ShoppingCart className="h-4 w-4" />

              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() =>
                setOpen((o) => !o)
              }
              className="rounded-lg p-2.5 transition-colors hover:bg-accent lg:hidden"
            >
              {open ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden border-t border-border bg-background transition-all duration-200 lg:hidden ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="space-y-1 px-4 py-4">

          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {n.label}
            </Link>
          ))}

          <div className="my-2 border-t border-border" />

          <Link
            to={isVendor ? "/vendor-dashboard" : "/vendor-register"}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            {isVendor ? "Vendor Dashboard" : "Sell on Egnaro"}
          </Link>

          <Link
            to="/admin"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Admin Panel
          </Link>

          <div className="my-2 border-t border-border" />

          {user ? (
            <>
              <Link
                to="/track-order"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                My Account
              </Link>

              <button
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-accent"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-accent"
            >
              <LogIn className="h-4 w-4" />
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}