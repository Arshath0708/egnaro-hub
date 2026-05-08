import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Truck, ShieldCheck, Headphones, Award, Sparkles, Store } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Section } from "@/components/Section";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { api } from "@/services/api";
import { CATEGORIES } from "@/data/seed";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Egnaro Mart — Premium Marketplace" }, { name: "description", content: "Shop premium electronics, electricals, hardware, motor pumps & industrial goods at direct-from-factory pricing." }] }),
  component: Home,
});

function Home() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", { approved: true }],
    queryFn: () => api.getProducts({ approvedOnly: true }),
  });
  const featured = products.slice(0, 8);
  const trending = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4);
  const deals = [...products].sort((a, b) => b.discount - a.discount).slice(0, 4);

  return (
    <Shell>
      <Hero />

      <Section eyebrow="Categories" title="Shop by Category" subtitle="Curated collections across every premium category we serve.">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((c, i) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link to="/products" search={{ category: c.id }} className="group block aspect-[4/5] rounded-2xl overflow-hidden relative gradient-card border border-glass-border hover-lift">
                <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="font-display font-semibold text-sm">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{c.description}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Featured" title="Featured Products" subtitle="Hand-picked premium products from verified vendors."
        action={<Link to="/products" className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">View all <ArrowRight className="h-4 w-4" /></Link>}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </Section>

      <Section eyebrow="Trending now" title="What India is buying" subtitle="Best-rated products this week.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {(isLoading ? Array.from({ length: 4 }) : trending).map((p, i) =>
            isLoading ? <ProductCardSkeleton key={i} /> : <ProductCard key={(p as any).id} product={p as any} index={i} />
          )}
        </div>
      </Section>

      <DealsBanner />

      <Section eyebrow="Today's Deals" title="Biggest discounts">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {(isLoading ? Array.from({ length: 4 }) : deals).map((p, i) =>
            isLoading ? <ProductCardSkeleton key={i} /> : <ProductCard key={(p as any).id} product={p as any} index={i} />
          )}
        </div>
      </Section>

      <WhyChooseUs />
      <VendorCTA />
    </Shell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-medium mb-6">
              <Sparkles className="h-3 w-3 text-primary" /> Trusted by 3,000+ customers · 25+ years
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Premium products,<br />
              <span className="text-gradient">direct from</span><br />
              <span className="text-gradient-accent">manufacturers.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              India's premium multi-vendor marketplace for electronics, electricals, hardware, motor pumps, home appliances and industrial goods.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="shimmer inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold shadow-glow hover:shadow-glow-accent transition-shadow">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/vendor-register" className="inline-flex items-center gap-2 glass px-6 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                <Store className="h-4 w-4" /> Become a Vendor
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[["25+", "Years"], ["3K+", "Customers"], ["500+", "Products"]].map(([n, l]) => (
                <div key={l} className="glass rounded-xl px-4 py-3">
                  <div className="font-display text-2xl font-bold text-gradient">{n}</div>
                  <div className="text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative aspect-square max-w-lg ml-auto">
            <div className="absolute inset-8 glass-strong rounded-3xl shadow-elegant overflow-hidden">
              <img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=85" alt="Premium electronics" className="h-full w-full object-cover" />
            </div>
            <div className="absolute top-4 right-4 glass rounded-2xl p-4 w-44 shadow-elegant animate-float">
              <div className="text-xs text-muted-foreground">Today's Deal</div>
              <div className="font-display font-bold text-lg text-gradient">44% OFF</div>
              <div className="text-xs">Premium Audio</div>
            </div>
            <div className="absolute -bottom-2 left-2 glass rounded-2xl p-4 w-52 shadow-elegant animate-float" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /><div className="text-xs font-semibold">100% Authentic</div></div>
              <div className="text-xs text-muted-foreground mt-1">Verified vendors only</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DealsBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden rounded-3xl gradient-accent shadow-glow-accent p-10 md:p-14">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-semibold opacity-80 mb-2">Limited Time</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">Biggest sale of the season</h2>
            <p className="mt-3 opacity-90 max-w-md">Up to 44% off across electronics, hardware & home appliances. Free pan-India shipping.</p>
          </div>
          <div className="md:text-right">
            <Link to="/products" className="inline-flex items-center gap-2 bg-white/95 text-foreground px-6 py-3.5 rounded-xl font-semibold hover:bg-white transition-colors">
              Explore deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  const items = [
    { icon: Truck, title: "Pan-India Delivery", desc: "Fast, tracked delivery to every pincode." },
    { icon: ShieldCheck, title: "100% Authentic", desc: "Direct from manufacturers & verified vendors." },
    { icon: Award, title: "25+ Years Trust", desc: "Sister of Ansel Power System." },
    { icon: Headphones, title: "Expert Support", desc: "Dedicated helpline for every order." },
  ];
  return (
    <Section eyebrow="Why Egnaro" title="Built for premium commerce" subtitle="Every detail engineered for trust, speed and quality.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((it, i) => (
          <motion.div key={it.title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
            className="glass rounded-2xl p-6 hover-lift"
          >
            <div className="h-11 w-11 rounded-xl gradient-primary grid place-items-center mb-4 shadow-glow">
              <it.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-semibold mb-1">{it.title}</div>
            <div className="text-sm text-muted-foreground">{it.desc}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function VendorCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative overflow-hidden rounded-3xl glass-strong border border-glass-border p-10 md:p-14 shadow-elegant">
        <div className="absolute top-0 left-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Vendor Partnership</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold">Sell to all of India.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg">Join 100+ verified vendors on Egnaro Mart. Zero-friction onboarding, transparent payouts, dedicated support.</p>
          </div>
          <div className="flex md:justify-end">
            <Link to="/vendor-register" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3.5 rounded-xl font-semibold shadow-glow shimmer">
              <Store className="h-4 w-4" /> Start Selling
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
