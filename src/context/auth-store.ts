import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserData {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
}

interface AdminData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserData | null;
  vendorId: string | null;
  admin: AdminData | null;
  isAdmin: boolean;
  isVendor: boolean;
  isLoggedIn: boolean;

  login: (token: string, user: UserData) => void;
  logout: () => void;
  loginVendor: (vendorId: string) => void;
  logoutVendor: () => void;
  loginAdmin: (admin: AdminData) => void;
  logoutAdmin: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      vendorId: null,
      admin: null,
      isAdmin: false,
      isVendor: false,
      isLoggedIn: false,

      login: (token, user) =>
        set({
          token,
          user,
          isLoggedIn: true,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isLoggedIn: false,
        }),

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