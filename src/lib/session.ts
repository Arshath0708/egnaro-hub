import { useAuth } from "@/context/auth-store";
import { useCart } from "@/context/cart-store";
import { QueryClient } from "@tanstack/react-query";

/**
 * Performs a complete teardown of the user's session state.
 * This is a critical security function to prevent cross-session data leakage.
 * 
 * It clears:
 * 1. Global Auth State (Zustand)
 * 2. Cart State (Zustand)
 * 3. React Query Cache (In-Memory fetched data)
 * 4. Specific localStorage variables tied to a session
 */
export function clearUserSession(queryClient?: QueryClient) {
  // 1. Clear all authentication tokens and identities
  useAuth.getState().logoutAll();
  
  // 2. Wipe the shopping cart to prevent inheriting items
  useCart.getState().clear();
  
  // 3. Purge the React Query cache to prevent stale data flashing
  if (queryClient) {
    queryClient.clear();
  }
  
  // 4. Wipe specific dangling local/session storage keys
  localStorage.removeItem("egnaro_coupon");
  localStorage.removeItem("checkout_state");
  
  // Any reset keys stored by admin/vendor
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith("reset_") || key.startsWith("admin_reset_"))) {
      sessionStorage.removeItem(key);
    }
  }
}
