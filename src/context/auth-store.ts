import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  vendorId: string | null;

  admin: AdminData | null;

  isAdmin: boolean;

  isVendor: boolean;

  loginVendor: (vendorId: string) => void;

  logoutVendor: () => void;

  loginAdmin: (admin: AdminData) => void;

  logoutAdmin: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      vendorId: null,

      admin: null,

      isAdmin: false,

      isVendor: false,

      loginVendor: (vendorId) =>
        set({
          vendorId,
          isVendor: true,
        }),

      logoutVendor: () =>
        set({
          vendorId: null,
          isVendor: false,
        }),

      loginAdmin: (admin) =>
        set({
          admin,
          isAdmin: true,
        }),

      logoutAdmin: () =>
        set({
          admin: null,
          isAdmin: false,
        }),
    }),

    {
      name: "egnaro-auth",
    }
  )
);