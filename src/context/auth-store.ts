import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserData {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  gst_number?: string;
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

  login: (token: string, user: UserData) => void;
  logout: () => void;
  loginVendor: (vendorId: string) => void;
  logoutVendor: () => void;
  loginAdmin: (admin: AdminData) => void;
  logoutAdmin: () => void;
  logoutAll: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      vendorId: null,
      admin: null,

      login: (token, user) =>
        set({
          token,
          user,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          vendorId: null,
          admin: null,
        }),

      loginVendor: (vendorId) =>
        set({
          vendorId,
        }),

      logoutVendor: () =>
        set({
          token: null,
          user: null,
          vendorId: null,
          admin: null,
        }),

      loginAdmin: (admin) =>
        set({
          admin,
        }),

      logoutAdmin: () =>
        set({
          token: null,
          user: null,
          vendorId: null,
          admin: null,
        }),

      logoutAll: () =>
        set({
          token: null,
          user: null,
          vendorId: null,
          admin: null,
        }),
    }),

    {
      name: "egnaro-auth",
    }
  )
);

export const selectIsLoggedIn = (s: AuthState) => !!s.token && !!s.user;
export const selectIsVendor   = (s: AuthState) => !!s.vendorId;
export const selectIsAdmin    = (s: AuthState) => !!s.admin;