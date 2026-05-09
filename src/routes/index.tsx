import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Award,
  Sparkles,
  Store,
  ChevronRight,
  Star,
  Zap,
  BarChart3,
  Globe,
  BadgeCheck,
  MoveRight,
  Package,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { Section } from "@/components/Section";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { getProducts } from "@/services/api";

export const Route = createFileRoute("/")({
  component: Home,
});

/* ─── Static data ─────────────────────────────────────────────────────────── */

const categories = [
  {
    id: "electronics",
    name: "Electronics",
    count: "120+",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200",
    accent: "from-blue-500/20 to-blue-500/5",
  },
  {
    id: "electricals",
    name: "Electricals",
    count: "95+",
    image:
  
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    accent: "from-yellow-500/20 to-yellow-500/5",
  },
  {
    id: "hardware",
    name: "Hardware",
    count: "78+",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200",
    accent: "from-orange-500/20 to-orange-500/5",
  },
  {
    id: "motor-pumps",
    name: "Motor Pumps",
    count: "54+",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200",
    accent: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    id: "home-appliances",
    name: "Home Appliances",
    count: "88+",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200",
    accent: "from-purple-500/20 to-purple-500/5",
  },
  {
    id: "industrial",
    name: "Industrial",
    count: "67+",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1200",
    accent: "from-emerald-500/20 to-emerald-500/5",
  },
];

const stats = [
  { value: "Trusted", label: "Businesses Across India", icon: Star },
  { value: "Secure", label: "Payments & Transactions", icon: Award },
  { value: "Pan India", label: "Fast Delivery", icon: Globe },
  { value: "Premium", label: "Verified Products", icon: Package },
];


const trustBadges = [
  "ISO Certified",
  "Secure Payments",
  "Pan India Delivery",
  "Manufacturer Direct",
  "30-Day Returns",
];

/* ─── Page component ──────────────────────────────────────────────────────── */

function Home() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const featured = products.slice(0, 8);
  const trending = [...products]
    .sort((a: any, b: any) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 4);
  const deals = [...products]
    .sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0))
    .slice(0, 4);

  return (
    <Shell>
      <Hero />
      <TrustBar />
      <StatsStrip />
      <CategoriesSection />

      {/* ── Featured products ── */}
      <Section
        eyebrow="Featured"
        title="Featured Products"
        subtitle="Verified premium products from trusted vendors."
      >
        <ProductGrid isLoading={isLoading} products={featured} skeletons={8} cols={4} />
        <div className="mt-10 flex justify-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 glass px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-glow transition-all duration-300"
          >
            Browse all products
            <MoveRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </Section>

      {/* ── Trending ── */}
      <Section
        eyebrow="Trending"
        title="What India is buying"
        subtitle="Most popular products this week."
      >
        <ProductGrid isLoading={isLoading} products={trending} skeletons={4} cols={4} />
      </Section>

      <DealsBanner />

      {/* ── Deals ── */}
      <Section
        eyebrow="Deals"
        title="Today's Deals"
        subtitle="Best discounts across categories."
      >
        <ProductGrid isLoading={isLoading} products={deals} skeletons={4} cols={4} />
      </Section>

      <WhyChooseUs />
      
      <VendorCTA />
    </Shell>
  );
}

/* ─── Trust bar ───────────────────────────────────────────────────────────── */

function TrustBar() {
  return (
    <div className="border-y border-glass-border bg-white/[0.02] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-6 py-3 overflow-x-auto scrollbar-none">
          {trustBadges.map((badge, i) => (
            <div
              key={badge}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground whitespace-nowrap flex-shrink-0"
            >
              <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              {badge}
              {i < trustBadges.length - 1 && (
                <span className="ml-4 h-3 w-px bg-glass-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Stats strip ─────────────────────────────────────────────────────────── */

function StatsStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="glass rounded-2xl p-6 flex flex-col gap-3"
          >
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Categories section ──────────────────────────────────────────────────── */

function CategoriesSection() {
  return (
    <Section
      eyebrow="Categories"
      title="Shop by Category"
      subtitle="Premium collections across all industrial sectors."
    >
      {/* Large hero categories — first 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {categories.slice(0, 2).map((c, i) => (
          <CategoryCardLarge key={c.id} category={c} index={i} />
        ))}
      </div>
      {/* Smaller grid — remaining 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(2).map((c, i) => (
          <CategoryCardSmall key={c.id} category={c} index={i + 2} />
        ))}
      </div>
    </Section>
  );
}

function CategoryCardLarge({
  category,
  index,
}: {
  category: (typeof categories)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to="/products"
        search={{ category: category.id }}
        className="group relative block rounded-2xl overflow-hidden border border-glass-border h-56 gradient-card hover-lift"
      >
        <img
          src={category.image}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div
          className={`absolute inset-0 bg-gradient-to-br ${category.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />
        <div className="absolute inset-0 p-7 flex flex-col justify-end">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
            {category.count}
          </div>
          <div className="font-display text-2xl font-bold">{category.name}</div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
            Shop now <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CategoryCardSmall({
  category,
  index,
}: {
  category: (typeof categories)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to="/products"
        search={{ category: category.id }}
        className="group relative block rounded-2xl overflow-hidden border border-glass-border aspect-[4/3] gradient-card hover-lift"
      >
        <img
          src={category.image}
          alt={category.name}
          className="absolute inset-0 h-full w-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${category.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />
        <div className="absolute bottom-0 left-0 p-4">
          <div className="font-display font-semibold text-sm">{category.name}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{category.count}</div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Product grid helper ─────────────────────────────────────────────────── */

function ProductGrid({
  isLoading,
  products,
  skeletons,
  cols,
}: {
  isLoading: boolean;
  products: any[];
  skeletons: number;
  cols: 4;
}) {
  if (products.length === 0 && !isLoading) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
        No products available yet.
      </div>
    );
  }

  return (
    <div
      className={`grid gap-5 grid-cols-2 ${
        cols === 4 ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-4"
      }`}
    >
      {isLoading
        ? Array.from({ length: skeletons }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        : products.map((p: any, i: number) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */

/* ─── Hero (Premium Sliding Banner - Truthful Content) ─────────────────── */

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const slides = [
    {
      eyebrow: "Trusted by businesses across India",
      title1: "Premium products",
      title2: "direct from",
      title3: "manufacturers.",
      description:
        "India's premium B2B marketplace for electronics, hardware, electricals and industrial products.",
      accent: "from-primary via-violet-400 to-cyan-400",
      stats: "Verified Products",
      icon: Package,
    },
    {
      eyebrow: "Verified suppliers only",
      title1: "Secure sourcing",
      title2: "for every",
      title3: "business.",
      description:
        "Source genuine products from trusted manufacturers with transparent pricing and fast delivery.",
      accent: "from-emerald-400 via-cyan-400 to-blue-500",
      stats: "Trusted Vendors",
      icon: ShieldCheck,
    },
    {
      eyebrow: "Fast delivery across India",
      title1: "Reliable logistics",
      title2: "with tracked",
      title3: "shipping.",
      description:
        "Pan-India delivery network with secure payments and real-time order tracking.",
      accent: "from-orange-400 via-yellow-400 to-red-500",
      stats: "Pan India Delivery",
      icon: Truck,
    },
  ];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  // Auto slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[active];
  const SlideIcon = slide.icon;

  return (
    <section ref={ref} className="relative overflow-hidden py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(var(--primary-rgb),0.12),transparent)]" />

      {/* Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <motion.div
        style={{ y: textY }}
        className="relative mx-auto max-w-7xl px-4"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* LEFT CONTENT */}
          <div>
            <motion.div
              key={`eyebrow-${active}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {slide.eyebrow}
            </motion.div>

            <motion.h1
              key={`title-${active}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-5xl font-black leading-[1.08] tracking-tight lg:text-[4.5rem]"
            >
              {slide.title1}
              <br />
              <span
                className={`bg-gradient-to-r ${slide.accent} bg-clip-text text-transparent`}
              >
                {slide.title2}
              </span>
              <br />
              {slide.title3}
            </motion.h1>

            <motion.p
              key={`description-${active}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground"
            >
              {slide.description}
            </motion.p>

            {/* CTA BUTTONS */}
            <motion.div
              key={`buttons-${active}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-bold gradient-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/vendor-register"
                className="group inline-flex items-center gap-2 rounded-xl glass px-7 py-3.5 font-bold transition-all duration-200 hover:shadow-glow"
              >
                <Store className="h-4 w-4" />
                Become a Vendor
              </Link>
            </motion.div>

            {/* SOCIAL PROOF */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {[
                  "bg-blue-400",
                  "bg-violet-400",
                  "bg-cyan-400",
                  "bg-emerald-400",
                ].map((color, index) => (
                  <div
                    key={index}
                    className={`h-8 w-8 rounded-full border-2 border-background ${color}`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Customer Trusted
                </span>{" "}
                across India
              </div>
            </motion.div>

            {/* SLIDE INDICATORS */}
            <div className="mt-10 flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active === index
                      ? "w-10 bg-primary"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT PREMIUM CARD */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-r from-primary/20 via-violet-500/10 to-cyan-500/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl lg:p-10">
              {/* Icon */}
              <motion.div
                key={`icon-${active}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex h-24 w-24 items-center justify-center rounded-3xl gradient-primary shadow-xl shadow-primary/20"
              >
                <SlideIcon className="h-10 w-10 text-white" />
              </motion.div>

              {/* Main Stats */}
              <motion.div
                key={`stats-${active}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  {slide.stats}
                </div>

                <div className="mt-4 text-4xl font-black">
                  Reliable Growth
                </div>

                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Secure payments, verified manufacturers, and fast delivery
                  across India.
                </p>
              </motion.div>

              {/* Progress Bar */}
              <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  key={`progress-${active}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-primary via-violet-400 to-cyan-400"
                />
              </div>

              {/* Bottom Feature Cards */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black text-primary">
                    Verified
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Products
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-black text-primary">
                    Secure
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Payments
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Deals Banner ─────────────────────────────────────────────────────── */

function DealsBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Countdown target: 24 hours from component mount
    const target = new Date().getTime() + 24 * 60 * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      );

      const seconds = Math.floor(
        (difference % (1000 * 60)) / 1000
      );

      setTimeLeft({
        hours,
        minutes,
        seconds,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const countdownItems = [
    {
      value: String(timeLeft.hours).padStart(2, "0"),
      label: "HRS",
    },
    {
      value: String(timeLeft.minutes).padStart(2, "0"),
      label: "MIN",
    },
    {
      value: String(timeLeft.seconds).padStart(2, "0"),
      label: "SEC",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl gradient-accent p-10 text-white"
      >
        {/* Background Decoration */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="absolute right-16 top-8 h-40 w-40 rounded-full border border-white/40" />
          <div className="absolute right-24 top-16 h-24 w-24 rounded-full border border-white/30" />
          <div className="absolute right-8 bottom-8 h-56 w-56 rounded-full border border-white/20" />
        </div>

        <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Content */}
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
              Limited Time Offer
            </div>

            <h2 className="font-display text-4xl font-black leading-tight lg:text-5xl">
              Biggest Sale
              <br />
              of the Season
            </h2>

            <p className="mt-3 text-lg text-white/70">
              Up to <span className="font-bold text-white">44% off</span> across
              all categories.
            </p>
          </div>

          {/* Right Countdown Section */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            {/* Live Countdown */}
            <div className="flex gap-3">
              {countdownItems.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 font-display text-2xl font-black backdrop-blur-sm">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[10px] text-white/50">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              to="/products"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Explore Deals
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
/* ─── Why choose us ───────────────────────────────────────────────────────── */

function WhyChooseUs() {
  const items = [
    {
      icon: Truck,
      title: "Fast Delivery",
      desc: "Pan India tracked shipping with real-time updates and guaranteed delivery windows.",
      stat: "2-5 days",
    },
    {
      icon: ShieldCheck,
      title: "Authentic Products",
      desc: "Every product sourced directly from verified manufacturers — zero counterfeits.",
      stat: "100% verified",
    },
    {
      icon: Award,
      title: "25+ Years Trust",
      desc: "Powered by Ansel Power System, a legacy of quality service since 1998.",
      stat: "Since 1998",
    },
    {
      icon: Headphones,
      title: "Premium Support",
      desc: "Dedicated B2B customer support with account managers for bulk orders.",
      stat: "24/7 support",
    },
  ];

  return (
    <Section
      eyebrow="Why Choose Us"
      title="Built for premium commerce"
      subtitle="Enterprise-grade buying experience for every business."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="group glass rounded-2xl p-6 hover-lift border border-glass-border hover:border-primary/20 transition-colors duration-300"
          >
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
              <it.icon className="h-5 w-5 text-white" />
            </div>

            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary mb-2">
              {it.stat}
            </div>
            <div className="font-display font-bold text-base">{it.title}</div>
            <div className="text-sm text-muted-foreground mt-2 leading-relaxed">{it.desc}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ─── Testimonials ────────────────────────────────────────────────────────── */

const testimonials = [
  {
    name: "Arjun Mehta",
    role: "Procurement Manager, Tata Projects",
    text: "Egnaro Mart cut our procurement time by 60%. The product quality and delivery speed is unmatched in the B2B space.",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "Owner, Nair Electricals",
    text: "We've been sourcing from Egnaro for 2 years now. Prices are competitive and the vendor support is genuinely helpful.",
    rating: 5,
  },
  {
    name: "Suresh Babu",
    role: "Site Engineer, L&T Construction",
    text: "The range of industrial goods is massive. I always find exactly what I need without compromising on quality.",
    rating: 5,
  },
];


/* ─── Vendor CTA ──────────────────────────────────────────────────────────── */

function VendorCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative glass-strong rounded-3xl overflow-hidden p-12 text-center border border-glass-border"
      >
        {/* Decorative radial */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-32 w-64 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
            <Sparkles className="h-3 w-3 text-primary" />
            Vendor Partnership Program
          </div>

          <h2 className="font-display text-4xl lg:text-5xl font-black leading-tight">
            Sell across India
            <br />
            with Egnaro Mart
          </h2>

          <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Join our premium marketplace and reach thousands of verified business customers.
            Zero listing fees. Instant payouts. Dedicated support.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/vendor-register"
              className="group gradient-primary text-primary-foreground px-7 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 transition-all duration-200"
            >
              <Store className="h-4 w-4" />
              Start Selling Today
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/about"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Learn more <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mini stats */}
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {[
              { val: "₹0", label: "Listing fee" },
              { val: "24h", label: "Onboarding" },
              
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-xl font-black text-primary">{s.val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}