// index.tsx

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";

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
  Globe,
  BadgeCheck,
  MoveRight,
  Package,
} from "lucide-react";

import { Shell } from "@/components/layout/Shell";
import { Section } from "@/components/Section";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { getProducts, getCategories, getHomeContent } from "@/services/api";

const CATEGORY_META: Record<string, { image: string, accent: string }> = {
  "accessories": {
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&h=600&q=80",
    accent: "from-rose-600/20 to-rose-600/5",
  },
  "electronics": {
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&h=600&q=80",
    accent: "from-blue-600/20 to-blue-600/5",
  },
  "fashion": {
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&h=600&q=80",
    accent: "from-amber-600/20 to-amber-600/5",
  },
  "gadgets": {
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&h=600&q=80",
    accent: "from-purple-600/20 to-purple-600/5",
  },
  "groceries": {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&h=600&q=80",
    accent: "from-green-600/20 to-green-600/5",
  },
  "mobiles": {
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&h=600&q=80",
    accent: "from-indigo-600/20 to-indigo-600/5",
  }
};


/* ───────────────────────────────────────────────────────────── */
/* Static Data */
/* ───────────────────────────────────────────────────────────── */



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

/* ───────────────────────────────────────────────────────────── */
/* HOME */
/* ───────────────────────────────────────────────────────────── */

export default function Home() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: apiCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const categories = useMemo(() => {
    const featuredNames = ["accessories", "electronics", "fashion", "gadgets", "groceries", "mobiles"];
    return featuredNames
      .map((name) => apiCategories.find((cat: any) => cat.name.toLowerCase() === name))
      .filter((cat): cat is any => !!cat)
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        image: CATEGORY_META[cat.name.toLowerCase()]?.image || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200",
        accent: CATEGORY_META[cat.name.toLowerCase()]?.accent || "from-gray-500/20 to-gray-500/5",
      }));
  }, [apiCategories]);


  const approvedProducts = useMemo(() => {
    return products.filter(
      (p: any) => p && p.status !== "rejected" && p.status !== "deleted" && (p.approved === true || Number(p.approved) === 1 || p.status === "approved")
    );
  }, [products]);

  const featured = approvedProducts.slice(0, 4);
  const hasMoreFeatured = approvedProducts.length > 4;

  const trendingAll = useMemo(() => 
    [...approvedProducts].sort((a: any, b: any) => (b.total_reviews || 0) - (a.total_reviews || 0)),
  [approvedProducts]);
  const trending = trendingAll.slice(0, 4);
  const hasMoreTrending = trendingAll.length > 4;

  const dealsAll = useMemo(() => 
    [...approvedProducts].sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0)),
  [approvedProducts]);
  const deals = dealsAll.slice(0, 4);
  const hasMoreDeals = dealsAll.length > 4;

  return (
    <Shell>
      <Hero />

      <TrustBar />

      <StatsStrip />

      <CategoriesSection categories={categories} />

      {/* Featured */}
      <Section
        eyebrow="Featured"
        title="Featured Products"
        subtitle="Verified premium products from trusted vendors."
      >
        <ProductGrid
          isLoading={isLoading}
          products={featured}
          skeletons={4}
          cols={4}
        />

        {hasMoreFeatured && (
          <div className="mt-12 flex justify-center">
            <Link
              to="/products"
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-bold transition-all hover:bg-white/10 hover:shadow-glow"
            >
              View More Featured
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </Section>

      {/* Trending */}
      <Section
        eyebrow="Trending"
        title="What India is buying"
        subtitle="Most popular products this week."
      >
        <ProductGrid
          isLoading={isLoading}
          products={trending}
          skeletons={4}
          cols={4}
        />

        {hasMoreTrending && (
          <div className="mt-12 flex justify-center">
            <Link
              to="/products"
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-bold transition-all hover:bg-white/10 hover:shadow-glow"
            >
              View More Trending
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </Section>

      <DealsBanner />

      {/* Deals */}
      <Section
        eyebrow="Deals"
        title="Today's Deals"
        subtitle="Best discounts across categories."
      >
        <ProductGrid
          isLoading={isLoading}
          products={deals}
          skeletons={4}
          cols={4}
        />

        {hasMoreDeals && (
          <div className="mt-12 flex justify-center">
            <Link
              to="/products?sort=discount"
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-bold transition-all hover:bg-white/10 hover:shadow-glow"
            >
              View More Deals
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </Section>

      <WhyChooseUs />

      <VendorCTA />
    </Shell>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* TRUST BAR */
/* ───────────────────────────────────────────────────────────── */

function TrustBar() {
  return (
    <div className="border-y border-glass-border bg-white/[0.02] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-6 py-3 overflow-x-auto scrollbar-none">
          {trustBadges.map((badge, i) => (
            <div
              key={badge}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200 whitespace-nowrap flex-shrink-0"
            >
              <svg className="h-4 w-4 text-emerald-400 drop-shadow-[0_2px_6px_rgba(52,211,153,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(52,211,153,0.15)"/>
                <path d="m9 11 2 2 4-4"/>
              </svg>

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

/* ───────────────────────────────────────────────────────────── */
/* STATS */
/* ───────────────────────────────────────────────────────────── */

function StatsStrip() {
  const statsMedallions = [
    {
      value: "Trusted",
      label: "Businesses Across India",
      medallion: (
        <svg className="h-5 w-5 text-yellow-500 drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(234,179,8,0.1)"/>
        </svg>
      )
    },
    {
      value: "Secure",
      label: "Payments & Transactions",
      medallion: (
        <svg className="h-5 w-5 text-primary drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor" fillOpacity="0.1"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      )
    },
    {
      value: "Pan India",
      label: "Fast Delivery",
      medallion: (
        <svg className="h-5 w-5 text-cyan-400 drop-shadow-[0_2px_8px_rgba(34,211,238,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" fill="rgba(34,211,238,0.1)"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      )
    },
    {
      value: "Premium",
      label: "Verified Products",
      medallion: (
        <svg className="h-5 w-5 text-purple-400 drop-shadow-[0_2px_8px_rgba(192,132,252,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(192,132,252,0.1)"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      )
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsMedallions.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="glass rounded-2xl p-6 flex flex-col gap-4 transform-gpu transition-all hover:scale-[1.02]"
          >
            <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              {s.medallion}
            </div>

            <div>
              <div className="font-display text-2xl font-bold tracking-tight text-white">
                {s.value}
              </div>

              <div className="text-xs text-slate-400 mt-0.5">
                {s.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* CATEGORIES */
/* ───────────────────────────────────────────────────────────── */

function CategoriesSection({ categories }: { categories: any[] }) {
  return (
    <Section
      eyebrow="Categories"
      title="Shop by Category"
      subtitle="Premium collections across all industrial sectors."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {categories.slice(0, 2).map((c, i) => (
          <CategoryCardLarge key={c.id} category={c} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(2).map((c, i) => (
          <CategoryCardSmall key={c.id} category={c} index={i + 2} />
        ))}
      </div>
    </Section>
  );
}

type Category = {
  id: number | string;
  name: string;
  image: string;
  accent: string;
};

function CategoryCardLarge({
  category,
  index,
}: {
  category: Category;
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
        to={`/products?category=${category.name}`}
        className="group relative block rounded-3xl overflow-hidden border border-glass-border h-64 gradient-card hover-lift shadow-2xl"
      >
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-70 transition-[transform,opacity] duration-1000 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />

        <div
          className={`absolute inset-0 bg-gradient-to-br ${category.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        />

        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="font-display text-2xl font-black tracking-tight text-white">
            {category.name}
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0">
            DISCOVER COLLECTION
            <ChevronRight className="h-4 w-4" />
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
  category: Category;
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
        to={`/products?category=${category.name}`}
        className="group relative block rounded-2xl overflow-hidden border border-glass-border aspect-square gradient-card hover-lift shadow-lg"
      >
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-70 transition-[transform,opacity] duration-1000 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div
          className={`absolute inset-0 bg-gradient-to-t ${category.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        />

        <div className="absolute bottom-0 left-0 p-5 w-full">
          <div className="font-display font-bold text-base text-white">
            {category.name}
          </div>

          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0">
            EXPLORE
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* PRODUCT GRID */
/* ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────── */
/* HERO */
/* ─────────────────────────────────────────────────────────────── */

const SLIDE_DEFAULTS = [
  {
    slide_number: 1,
    left_title: "Premium products direct from manufacturers.",
    left_subtext: "India's premium B2B marketplace for electronics, hardware, electricals and industrial products.",
    left_image: "",
    right_title: "Trusted by businesses across India",
    right_subtext: "Verified products from trusted suppliers with transparent pricing and secure delivery.",
    accent: "from-primary via-violet-400 to-cyan-400",
    icon: Package,
  },
  {
    slide_number: 2,
    left_title: "Secure sourcing for every business.",
    left_subtext: "Source genuine products from trusted manufacturers with transparent pricing and fast delivery.",
    left_image: "",
    right_title: "Verified suppliers only",
    right_subtext: "Every vendor is manually verified. Guaranteed quality and authenticity on every order.",
    accent: "from-emerald-400 via-cyan-400 to-blue-500",
    icon: ShieldCheck,
  },
  {
    slide_number: 3,
    left_title: "Reliable logistics with tracked shipping.",
    left_subtext: "Pan-India delivery network with secure payments and real-time order tracking.",
    left_image: "",
    right_title: "Fast delivery across India",
    right_subtext: "Pan-India delivery network with real-time tracking and secure payment gateway.",
    accent: "from-orange-400 via-yellow-400 to-red-500",
    icon: Truck,
  },
];

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  // Fetch dynamic content from admin CMS with 10 mins cache
  const { data: homeContentRes } = useQuery({
    queryKey: ["home-content"],
    queryFn: getHomeContent,
    staleTime: 1000 * 60 * 10,
  });

  const slides = useMemo(() => {
    if (homeContentRes?.success && Array.isArray(homeContentRes.slides) && homeContentRes.slides.length > 0) {
      return SLIDE_DEFAULTS.map((def) => {
        const api = homeContentRes.slides.find((s: any) => Number(s.slide_number) === def.slide_number);
        if (!api) return def;
        return {
          ...def,
          left_title:   api.left_title   || def.left_title,
          left_subtext: api.left_subtext || def.left_subtext,
          left_image:   api.left_image   || def.left_image,
          right_title:  api.right_title  || def.right_title,
          right_subtext: api.right_subtext || def.right_subtext,
        };
      });
    }
    return SLIDE_DEFAULTS;
  }, [homeContentRes]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  // Auto-advance
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
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(var(--primary-rgb),0.12),transparent)]" />

      <motion.div
        style={{ y: textY }}
        className="relative mx-auto max-w-7xl px-4"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* ── LEFT ── */}
          <div>
            {/* Eyebrow / badge */}
            <motion.div
              key={`eyebrow-${active}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-300"
            >
              <SlideIcon className="h-3.5 w-3.5 text-primary" />
              {slide.right_title}
            </motion.div>

            {/* Left title — supports multiline from DB */}
            <motion.h1
              key={`title-${active}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-glow-hero font-display text-4xl sm:text-[3.2rem] lg:text-[4rem] font-black leading-[1.0] tracking-[-0.04em]"
            >
              <span
                className={`bg-gradient-to-r ${slide.accent} bg-clip-text text-transparent`}
              >
                {slide.left_title}
              </span>
            </motion.h1>

            {/* Left subtext */}
            <motion.p
              key={`desc-${active}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-6 max-w-[55ch] font-sans text-[1.1rem] leading-[1.75] text-slate-400"
            >
              {slide.left_subtext}
            </motion.p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-sans font-bold text-[0.9rem] uppercase tracking-[0.05em] gradient-primary text-primary-foreground transition-all duration-300 hover:shadow-glow"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/vendor-register"
                className="group inline-flex items-center gap-2 rounded-xl glass px-7 py-3.5 font-sans font-bold text-[0.9rem] uppercase tracking-[0.05em] hover:bg-white/10 transition-colors duration-200"
              >
                <Store className="h-4 w-4" />
                Become a Vendor
              </Link>
            </div>

            {/* Slide dots */}
            <div className="mt-10 flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active === index ? "w-10 bg-primary" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <motion.div
            key={`right-${active}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-r from-primary/20 via-violet-500/10 to-cyan-500/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-2xl">
              {/* Hero image — shown if provided in CMS */}
              {slide.left_image ? (
                <div className="relative h-56 w-full overflow-hidden lg:h-72">
                  <img
                    src={slide.left_image}
                    alt={slide.left_title}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              ) : (
                /* Fallback icon card when no image is set */
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-primary/10 to-transparent lg:h-72">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl gradient-primary shadow-2xl animate-pulse-glow">
                    <SlideIcon className="h-10 w-10 text-white" />
                  </div>
                </div>
              )}

              {/* Right text block */}
              <div className="p-8 lg:p-10">
                <div className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-primary">
                  {slide.right_title}
                </div>

                <div className="mt-3 font-display text-2xl font-black leading-[1.1] tracking-[-0.02em] text-white">
                  {slide.left_title}
                </div>

                <p className="mt-3 font-sans text-sm leading-[1.65] text-slate-400">
                  {slide.right_subtext}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* DEALS */
/* ───────────────────────────────────────────────────────────── */

function DealsBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl gradient-accent p-10 text-white"
      >
        <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
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
              Up to <span className="font-bold text-white">44% off</span>
            </p>
          </div>

          <Link
            to="/products"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-black"
          >
            Explore Deals

            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* WHY CHOOSE US */
/* ───────────────────────────────────────────────────────────── */

function WhyChooseUs() {
  const chooseUsItems = [
    {
      medallion: (
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-cyan-500/10 blur-sm opacity-50 pointer-events-none" />
          <svg className="relative h-6 w-6 text-cyan-400 drop-shadow-[0_4px_10px_rgba(34,211,238,0.25)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" ry="2" fill="rgba(34,211,238,0.05)"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
      ),
      title: "Fast Delivery",
      desc: "Pan India tracked shipping.",
      stat: "2-5 days",
    },
    {
      medallion: (
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-green-500/10 blur-sm opacity-50 pointer-events-none" />
          <svg className="relative h-6 w-6 text-green-400 drop-shadow-[0_4px_10px_rgba(74,222,128,0.25)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(74,222,128,0.05)"/>
            <path d="m9 11 2 2 4-4"/>
          </svg>
        </div>
      ),
      title: "Authentic Products",
      desc: "Direct from verified manufacturers.",
      stat: "100% verified",
    },
    {
      medallion: (
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-primary/10 blur-sm opacity-50 pointer-events-none" />
          <svg className="relative h-6 w-6 text-primary drop-shadow-[0_4px_10px_rgba(249,115,22,0.25)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" fill="currentColor" fillOpacity="0.05"/>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
          </svg>
        </div>
      ),
      title: "25+ Years Trust",
      desc: "Powered by Ansel Power System.",
      stat: "Since 1998",
    },
    {
      medallion: (
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-purple-500/10 blur-sm opacity-50 pointer-events-none" />
          <svg className="relative h-6 w-6 text-purple-400 drop-shadow-[0_4px_10px_rgba(192,132,252,0.25)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" fill="rgba(192,132,252,0.05)"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
        </div>
      ),
      title: "Premium Support",
      desc: "Dedicated B2B support team.",
      stat: "24/7 support",
    },
  ];

  return (
    <Section
      eyebrow="Why Choose Us"
      title="Built for premium commerce"
      subtitle="Enterprise-grade buying experience."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {chooseUsItems.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group glass rounded-3xl p-6 border border-glass-border transform-gpu transition-all hover:scale-[1.02] hover:-translate-y-0.5 duration-300"
          >
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
              {it.medallion}
            </div>

            <div className="font-mono text-[0.68rem] font-black uppercase tracking-[0.12em] text-primary mb-2">
              {it.stat}
            </div>

            <div className="font-display font-black text-base text-slate-200">
              {it.title}
            </div>

            <div className="font-sans text-sm text-slate-400 mt-2 leading-relaxed">
              {it.desc}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* CTA */
/* ───────────────────────────────────────────────────────────── */

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
            Join our premium marketplace and reach thousands of verified
            business customers.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/vendor-register"
              className="group gradient-primary text-primary-foreground px-7 py-3.5 rounded-xl font-bold inline-flex items-center gap-2"
            >
              <Store className="h-4 w-4" />

              Start Selling Today

              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/about"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Learn more

              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}