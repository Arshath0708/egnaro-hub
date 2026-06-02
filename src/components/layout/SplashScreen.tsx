import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpeg";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Elegant incremental progress simulation for the loading line
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate loading feel towards the end
        const step = prev < 40 ? 1.5 : prev < 75 ? 2.5 : 4;
        return Math.min(prev + step, 100);
      });
    }, 25);

    // Keep active for exactly 1.8 seconds, then fade out
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#020617] overflow-hidden select-none"
        >
          {/* Subtle ambient glowing orb behind the logo card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse" />

          {/* Luxury Card Container */}
          <div className="relative flex flex-col items-center max-w-xs px-8 text-center">
            
            {/* Clean scaled-up logo container with zero borders, frames, or boxes */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-8 select-none pointer-events-none"
            >
              <img
                src={logo}
                alt="Egnaro Mart Logo"
                className="h-20 w-auto object-contain rounded-xl select-none pointer-events-none"
              />
            </motion.div>

            {/* Premium Gold-Shine Brand Text */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-display text-base font-black tracking-[0.25em] uppercase text-white mb-2"
            >
              EGNARO MART
            </motion.h2>

            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-sans text-[9px] font-bold tracking-[0.3em] uppercase text-slate-500 mb-8"
            >
              Premium Marketplace
            </motion.p>

            {/* Premium, ultra-thin progress bar container */}
            <motion.div
              initial={{ scaleX: 0.8, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative w-48 h-[2px] bg-white/5 rounded-full overflow-hidden shadow-inner mb-3"
            >
              {/* Active glow streak */}
              <div
                className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-[30ms] ease-out shadow-[0_0_10px_rgba(255,102,0,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </motion.div>

            {/* Compact Secure Seal indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-1.5 text-[8px] font-bold tracking-widest text-slate-500 uppercase"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure Connection</span>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
