/**
 * cart-store.ts
 * FIX: count() removed from store state.
 * Previously: useCart((s) => s.count()) called s.count() INSIDE the selector.
 * Zustand runs the selector on every store update. count() called get().items.reduce()
 * every single time anything in the store changed — AND because it's a function call
 * returning a number, Zustand couldn't properly memoize it, causing Header to re-render
 * on every cart mutation even when the count didn't change.
 *
 * FIX: Remove count() from the store entirely.
 * Use a standalone selector: useCart(cartCount) — Zustand diffs the returned number
 * correctly and only re-renders when count actually changes.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  mismatchDetails: {
    productId: string;
    quantity: number;
    vendorId: number;
    name: string;
  } | null;
  add: (productId: string, quantity?: number, vendorId?: number, name?: string) => boolean;
  confirmAdd: () => void;
  clearMismatch: () => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear:  () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      mismatchDetails: null,

      add: (productId, quantity = 1, vendorId, name = "") => {
        let added = true;
        set((s) => {
          // Identify if the cart already has a product from a different seller
          const firstVendorItem = s.items.find((i) => i.vendorId !== undefined && i.vendorId !== 0);
          const currentSellerId = firstVendorItem ? firstVendorItem.vendorId : null;

          if (
            currentSellerId !== null &&
            vendorId !== undefined &&
            vendorId !== 0 &&
            currentSellerId !== vendorId
          ) {
            // Mismatch detected! Save to mismatchDetails and open confirmation modal
            added = false;
            return {
              mismatchDetails: {
                productId,
                quantity,
                vendorId,
                name,
              },
            };
          }

          // Otherwise, normal add logic
          const ex = s.items.find((i) => i.productId === productId);
          if (ex) {
            return {
              items: s.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + quantity, vendorId: vendorId ?? i.vendorId }
                  : i
              ),
            };
          }
          return { items: [...s.items, { productId, quantity, vendorId }] };
        });
        return added;
      },

      confirmAdd: () =>
        set((s) => {
          if (!s.mismatchDetails) return {};
          const { productId, quantity, vendorId } = s.mismatchDetails;
          return {
            items: [{ productId, quantity, vendorId }],
            mismatchDetails: null,
          };
        }),

      clearMismatch: () => set({ mismatchDetails: null }),

      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      setQty: (productId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity: qty } : i
                ),
        })),

      clear: () => set({ items: [], mismatchDetails: null }),
    }),
    { name: "egnaro:cart" }
  )
);

/**
 * Standalone selector — use this everywhere instead of s.count()
 * useCart(cartCount)  →  re-renders ONLY when count number changes
 * useCart(cartItems)  →  re-renders ONLY when items array reference changes
 */
export const cartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const cartItems = (s: CartState) => s.items;