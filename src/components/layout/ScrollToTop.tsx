import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - Production-grade smooth scroll restorer
 * Sets manual scroll restoration and handles smooth scrolls on route transitions,
 * with animation frame & microtask fallbacks to guarantee high-fidelity smooth transitions.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Force browser to let the app control scroll positioning
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // 1. Smooth scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    // 2. Next animation frame fallback (handles React state updates / DOM commitments)
    const rafId = requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    });

    // 3. Short timeout fallback (covers Framer Motion layout animations / CMS async items)
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }, 45);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  return null;
}
