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
  add:    (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear:  () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (productId, quantity = 1) =>
        set((s) => {
          const ex = s.items.find((i) => i.productId === productId);
          if (ex) {
            return {
              items: s.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...s.items, { productId, quantity }] };
        }),

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

      clear: () => set({ items: [] }),
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