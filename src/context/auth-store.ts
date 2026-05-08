import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  vendorId: string | null;
  isAdmin: boolean;
  loginVendor: (vendorId: string) => void;
  logoutVendor: () => void;
  loginAdmin: (user: string, pass: string) => boolean;
  logoutAdmin: () => void;
}

// Demo credentials only — replace with real auth on backend integration.
const ADMIN_USER = "admin";
const ADMIN_PASS = "egnaro@2025";

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      vendorId: null,
      isAdmin: false,
      loginVendor: (vendorId) => set({ vendorId }),
      logoutVendor: () => set({ vendorId: null }),
      loginAdmin: (user, pass) => {
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
          set({ isAdmin: true });
          return true;
        }
        return false;
      },
      logoutAdmin: () => set({ isAdmin: false }),
    }),
    { name: "egnaro:auth" }
  )
);
