import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * BackToTop - Futuristic Ultra-Premium HUD Widget (Minimalist Edition)
 * Features a glowing neon gradient progress track, space-grade HUD dashed ticks,
 * and springy interactive propulsion micro-animations.
 */
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const scrolled = window.scrollY / totalHeight;
        setScrollPercentage(scrolled);
      } else {
        setScrollPercentage(0);
      }
      // Visible after scrolling 250px
      setIsVisible(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center justify-end select-none pointer-events-none">
          {/* Futuristic Reticle Circular Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={scrollToTop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#070b14]/90 text-white backdrop-blur-xl shadow-elegant shadow-[#000]/60 transition-all hover:border-[#FF6600]/50 hover:shadow-glow hover:shadow-[#FF6600]/25 active:scale-95 cursor-pointer pointer-events-auto group"
            aria-label="Back to Top"
          >
            {/* HUD Reticle SVG Container */}
            <svg className="absolute inset-0 h-14 w-14 p-0.5 select-none pointer-events-none">
              {/* Definition of glowing neon gradient */}
              <defs>
                <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6600" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Dotted HUD Ticks outer circle */}
              <circle
                cx="27"
                cy="27"
                r="24"
                className="stroke-white/10 fill-none"
                strokeWidth="1.5"
                strokeDasharray="3, 4"
              />

              {/* Active neon gradient progress path */}
              <motion.circle
                cx="27"
                cy="27"
                r="24"
                className="fill-none"
                stroke="url(#neonGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                  pathLength: scrollPercentage,
                }}
              />
            </svg>

            {/* Inner Futuristic Target Lines */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none">
              <div className="absolute w-[18px] h-[1px] bg-white" />
              <div className="absolute w-[1px] h-[18px] bg-white" />
            </div>

            {/* Propulsion Arrow Animation */}
            <div className="relative overflow-hidden h-6 w-6 flex items-center justify-center">
              <motion.div
                animate={
                  isHovered 
                    ? { y: [0, -4, 0] } 
                    : { y: 0 }
                }
                transition={
                  isHovered 
                    ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } 
                    : {}
                }
                className="flex flex-col items-center"
              >
                <ArrowUp className="h-5 w-5 text-white group-hover:text-[#FF6600] transition-colors duration-300" />
              </motion.div>
            </div>
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
