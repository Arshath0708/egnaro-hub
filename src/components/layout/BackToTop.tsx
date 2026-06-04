import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const ticking = useRef(false);

  const springProgress = useSpring(progress, { stiffness: 80, damping: 20 });

  const radius = 30;
  const strokeWidth = 2.5;
  const normalised = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalised;

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const current = total > 0 ? window.scrollY / total : 0;
        setProgress(current);
        setIsVisible(window.scrollY > 200);
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const checkOverlay = () => {
      const isHidden =
        window.getComputedStyle(document.body).overflow === "hidden" ||
        document.body.classList.contains("overflow-hidden") ||
        !!document.querySelector('[data-state="open"]');
      setIsOverlayOpen(isHidden);
    };

    checkOverlay();

    const observer = new MutationObserver(checkOverlay);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dashOffset = useTransform(
    springProgress,
    (v) => circumference - v * circumference
  );

  const rotateAngle = useTransform(
    springProgress,
    (v) => `${v * 360}deg`
  );

  return (
    <AnimatePresence>
      {isVisible && !isOverlayOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-6 right-5 md:bottom-8 md:right-7 z-[999] select-none"
        >
          {/* Outer glow ring — ambient pulse */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: isHovered
                ? [
                  "0 0 0px 0px rgba(255,102,0,0)",
                  "0 0 28px 10px rgba(255,102,0,0.35)",
                  "0 0 0px 0px rgba(255,102,0,0)",
                ]
                : [
                  "0 0 0px 0px rgba(255,102,0,0)",
                  "0 0 18px 6px rgba(255,102,0,0.2)",
                  "0 0 0px 0px rgba(255,102,0,0)",
                ],
            }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />

          <motion.button
            onClick={scrollToTop}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.92 }}
            className="relative w-[54px] h-[54px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center cursor-pointer"
            aria-label="Back to top"
          >

            {/* ── SVG progress ring + orbit ring ── */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 80 80"
            >
              {/* Faint orbit track */}
              <circle
                cx="40" cy="40" r={normalised}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={strokeWidth}
              />

              {/* Animated progress arc */}
              <motion.circle
                cx="40" cy="40" r={normalised}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashOffset }}
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff8a00" />
                  <stop offset="100%" stopColor="#ffd700" />
                </linearGradient>
              </defs>

              {/* Moving dot at arc tip */}
              <motion.circle
                cx="40" cy={40 - normalised}
                r="3.5"
                fill="#ffd700"
                style={{
                  filter: "drop-shadow(0 0 5px rgba(255,215,0,0.9))",
                  rotate: rotateAngle,
                  transformOrigin: "40px 40px",
                }}
              />
            </svg>

            {/* ── Fruit body ── */}
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: "6px",
                background: `radial-gradient(circle at 32% 28%,
                  #ffe0b2 0%,
                  #ffb347 16%,
                  #ff8a00 42%,
                  #ff6200 68%,
                  #c84a00 100%)`,
                boxShadow: `
                  inset 0 -8px 16px rgba(0,0,0,0.28),
                  inset 0 8px 14px rgba(255,255,255,0.14),
                  0 8px 24px rgba(255,102,0,0.45),
                  0 2px 6px rgba(0,0,0,0.3)
                `,
              }}
              animate={{
                scale: isHovered ? [1, 1.04, 1] : [1, 1.015, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: isHovered ? 1.2 : 3.5,
                ease: "easeInOut",
              }}
            >
              {/* Peel texture dots */}
              <div
                className="absolute inset-0 rounded-full opacity-20"
                style={{
                  backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "6px 6px",
                  mixBlendMode: "overlay",
                }}
              />

              {/* Specular highlight */}
              <div
                className="absolute rounded-full blur-sm opacity-40"
                style={{
                  top: "10%",
                  left: "14%",
                  width: "42%",
                  height: "28%",
                  background: "white",
                  transform: "rotate(-15deg)",
                }}
              />

              {/* Secondary micro-highlight */}
              <div
                className="absolute rounded-full blur-[3px] opacity-25"
                style={{
                  top: "20%",
                  left: "20%",
                  width: "22%",
                  height: "14%",
                  background: "white",
                  transform: "rotate(-15deg)",
                }}
              />
            </motion.div>

            {/* ── Leaf ── */}
            <motion.div
              className="absolute z-20"
              style={{ top: "1px", left: "50%", transform: "translateX(-50%)" }}
              animate={{ rotate: isHovered ? [-12, 12, -12] : [-6, 6, -6] }}
              transition={{
                repeat: Infinity,
                duration: isHovered ? 0.8 : 2.5,
                ease: "easeInOut",
              }}
            >
              {/* Leaf shape */}
              <div
                style={{
                  width: "18px",
                  height: "11px",
                  background: "linear-gradient(135deg, #86efac 0%, #16a34a 60%, #14532d 100%)",
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-10deg)",
                  boxShadow: "0 0 8px rgba(34,197,94,0.5), inset 0 1px 3px rgba(255,255,255,0.2)",
                  position: "relative",
                }}
              >
                {/* Leaf vein */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "20%",
                    width: "65%",
                    height: "1px",
                    background: "rgba(255,255,255,0.3)",
                    transform: "translateY(-50%) rotate(-2deg)",
                    borderRadius: "1px",
                  }}
                />
              </div>

              {/* Stem */}
              <div
                style={{
                  width: "2px",
                  height: "5px",
                  background: "linear-gradient(to bottom, #15803d, #166534)",
                  margin: "0 auto",
                  borderRadius: "1px",
                }}
              />
            </motion.div>

            {/* ── Arrow icon ── */}
            <motion.div
              className="relative z-30"
              animate={{ y: isHovered ? [-3, 0, -3] : 0 }}
              transition={{
                repeat: isHovered ? Infinity : 0,
                duration: 0.7,
                ease: "easeInOut",
              }}
            >
              <ArrowUp
                className="w-5 h-5 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                strokeWidth={3}
              />
            </motion.div>

            {/* ── Shine sweep ── */}
            <div className="absolute rounded-full overflow-hidden" style={{ inset: "6px" }}>
              <motion.div
                className="absolute top-0 left-0 h-full blur-md"
                style={{
                  width: "35%",
                  background: "linear-gradient(to right, transparent, rgba(255,255,255,0.22), transparent)",
                  transform: "rotate(20deg)",
                }}
                animate={{ x: ["-150%", "280%"] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "linear", repeatDelay: 1 }}
              />
            </div>

            {/* ── Floating particle sparks on hover ── */}
            <AnimatePresence>
              {isHovered && (
                <>
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-orange-400 z-10"
                      style={{ width: "4px", height: "4px", left: "50%", top: "50%" }}
                      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      animate={{
                        opacity: 0,
                        x: [0, (i % 2 === 0 ? 1 : -1) * (18 + i * 8)],
                        y: [0, -(20 + i * 10)],
                        scale: [1, 0.4],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut", repeat: Infinity, repeatDelay: 0.4 }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

          </motion.button>



          {/* ── Progress % label ── */}
          <motion.div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: progress > 0.02 ? 1 : 0 }}
          >
            <span
              className="text-[10px] font-bold tabular-nums"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                letterSpacing: "0.04em",
              }}
            >
              {Math.round(progress * 100)}%
            </span>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}