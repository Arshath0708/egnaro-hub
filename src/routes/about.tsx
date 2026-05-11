import { motion } from "framer-motion";
import { Award, Users, Package, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/layout/Shell";

export default function About() {
  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">About Us</div>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight">About <span className="text-gradient">Egnaro Mart</span></h1>
          <p className="mt-5 text-lg text-muted-foreground">Your trusted partner for quality electronics & hardware.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-strong rounded-3xl p-10 shadow-elegant">
          <p className="text-lg leading-relaxed text-foreground/90">
            We have been running a company called <strong className="text-gradient">Ansel Power System</strong> for over 25 years.
            We opened Egnaro Mart as a sister company to carry all products directly from manufacturer to consumer at the lowest possible price.
            Through this platform customers can buy electronics, electricals, hardware, motor pumps, and industrial goods with premium quality assurance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 text-center hover-lift">
              <s.icon className="h-7 w-7 text-primary mx-auto mb-3" />
              <div className="font-display text-3xl font-bold text-gradient">{s.n}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">Testimonials</div>
          <h2 className="font-display text-4xl font-bold">What customers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover-lift">
              <div className="text-4xl text-primary leading-none mb-3 font-display">"</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
              <div className="mt-4 font-semibold">{t.name}</div>
            </motion.div>
          ))}
        </div>
      </section>
      
    </Shell>
  );
}

const STATS = [
  { icon: Award, n: "25+", l: "Years Experience" },
  { icon: Users, n: "3,000+", l: "Happy Customers" },
  { icon: Package, n: "500+", l: "Products" },
  { icon: ShieldCheck, n: "100%", l: "Quality Assured" },
];

const TESTIMONIALS = [
  { name: "Mr. Prem Kumar", text: "Excellent quality and delivery. Egnaro Mart has been our go-to for industrial supplies." },
  { name: "Mr. Raghual", text: "Pricing is unbeatable and the team is highly responsive. Truly direct from manufacturer." },
  { name: "Mr. Suresh", text: "Bought a motor pump and I'm impressed with after-sales support. Recommended." },
];
