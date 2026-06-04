import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Award,
  ShieldCheck,
  Scale,
  Eye,
  Heart,
  Lightbulb,
  ThumbsUp,
  Briefcase,
  Shield,
  Lock,
  Truck,
  MessageSquare,
  CheckCircle2,
  Store,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";

export default function AboutPage() {

  const coreValues = [
    {
      icon: ShieldCheck,
      title: "Integrity & Trust",
      desc: "We build lasting relationships with our buyers and sellers through absolute truth and honesty in operations.",
      color: "from-blue-500/20 to-blue-600/5 text-blue-400"
    },
    {
      icon: Scale,
      title: "Honesty & Fairness",
      desc: "Ensuring fair market pricing and honest transactions for every consumer, vendor, and partner.",
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400"
    },
    {
      icon: Eye,
      title: "Transparency",
      desc: "No hidden charges, clear specifications, and open communication channels across our marketplace.",
      color: "from-purple-500/20 to-purple-600/5 text-purple-400"
    },
    {
      icon: Heart,
      title: "Customer Commitment",
      desc: "Putting the customer's satisfaction at the center of our catalog selection and delivery network.",
      color: "from-primary/20 to-primary/5 text-primary"
    },
    {
      icon: Award,
      title: "Reliability",
      desc: "Over 25 years of engineering experience backing every delivery, product selection, and support ticket.",
      color: "from-yellow-500/20 to-yellow-600/5 text-yellow-400"
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      desc: "Leveraging technology-driven logistics to bring products straight from the source to your door.",
      color: "from-cyan-500/20 to-cyan-600/5 text-cyan-400"
    },
    {
      icon: ThumbsUp,
      title: "Quality Assurance",
      desc: "Every product listed undergoes seller verification to guarantee premium tier standards.",
      color: "from-pink-500/20 to-pink-600/5 text-pink-400"
    },
    {
      icon: Briefcase,
      title: "Strong Business Ethics",
      desc: "Complying with strict trade laws and fair practice guidelines to elevate corporate standards.",
      color: "from-orange-500/20 to-orange-600/5 text-orange-400"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Verified Products",
      desc: "Sourced directly from verified vendors and sister manufacturers."
    },
    {
      icon: Lock,
      title: "Secure Payments",
      desc: "Encrypted direct UPI transactions, card gateways, and COD safety."
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      desc: "Highly optimized shipping channels operating across major Indian hubs."
    },
    {
      icon: MessageSquare,
      title: "Customer Support",
      desc: "Dedicated support team resolving inquiries promptly."
    },
    {
      icon: CheckCircle2,
      title: "Quality Assurance",
      desc: "Meticulous verification of materials and electronic tolerances."
    },
    {
      icon: Store,
      title: "Trusted Marketplace",
      desc: "Decades of industrial lineage powering a modern e-commerce storefront."
    }
  ];

  return (
    <Shell>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,102,0,0.03),transparent_60%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary blur-[120px] opacity-10 pointer-events-none" />
        
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-widest mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" /> Our Journey
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase leading-[1.1]"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-500">Egnaro Mart</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Connecting smart consumers across India with premium electronics, mobiles, accessories, groceries, fashion, gadgets, and everyday essentials at competitive direct-to-consumer prices.
          </motion.p>
        </div>
      </section>

      {/* 2. WHO WE ARE */}
      <section className="relative py-16 border-t border-white/5 bg-slate-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-primary font-black">Who We Are</div>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase">Decades of Trust, Modernized for Everyone</h2>
              
              <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
                <p>
                  Egnaro Mart was founded as the sibling platform of <strong className="text-white font-extrabold">Ansel Power System</strong>, drawing upon more than <strong className="text-white font-extrabold">25 years</strong> of excellence and industrial manufacturing experience.
                </p>
                <p>
                  Our primary focus is to bypass unnecessary middlemen and traditional supply blocks, conveying high-grade goods directly from the production facility or certified distributors straight to the customer. This ensures unbeatable market pricing without cutting corners on material durability.
                </p>
                <p>
                  Today, Egnaro Mart has expanded into a comprehensive, customer-first marketplace. We integrate certified vendors under a unified technology-driven commerce engine to provide an optimized, transparent, and seamless purchasing experience across India.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 relative"
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-primary/20 to-yellow-500/20 blur-md opacity-30" />
              <div className="relative glass rounded-3xl p-8 border border-white/10 bg-slate-950/40">
                <h4 className="font-bold text-primary uppercase tracking-wider text-xs mb-4">Enterprise Focus Points</h4>
                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-primary" /> Customer-First Marketplace
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-primary" /> Verified Sellers & Original Warranties
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-primary" /> Fast Delivery Infrastructure
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-primary" /> Technology-Driven Commerce Portal
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-primary" /> 100% Quality-Inspected Shipments
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. OUR MISSION */}
      <section className="relative py-20 bg-slate-950/40 border-t border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,102,0,0.02),transparent_50%)] pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-4">The Mission Blueprint</span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase mb-6">Our Mission</h2>
          <blockquote className="relative glass rounded-2xl p-6 sm:p-10 border border-white/5 bg-slate-900/20 shadow-lg">
            <span className="absolute -top-3 left-6 text-5xl font-serif text-primary leading-none opacity-50">“</span>
            <p className="text-base sm:text-xl font-display font-medium text-slate-200 leading-relaxed italic">
              To provide customers across India with a trusted, transparent, and premium shopping experience while delivering quality products at competitive prices.
            </p>
            <span className="absolute -bottom-10 right-6 text-5xl font-serif text-primary leading-none opacity-50">”</span>
          </blockquote>
        </div>
      </section>



      {/* 4. CORE VALUES SECTION */}
      <section className="py-20 bg-slate-950/20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-black mb-3">Our Core Foundation</div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase">Corporate Values</h2>
            <p className="text-slate-500 text-xs mt-2">The fundamental values that drive Egnaro Mart's operations and customer promise.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((v, idx) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:bg-white/[0.02] hover:border-white/10 transition-all duration-300"
              >
                <div>
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${v.color} flex items-center justify-center border border-white/5 mb-4`}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 mb-2">{v.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE EGNARO MART */}
      <section className="py-20 bg-slate-950/40 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-[0.2em] text-primary font-black mb-3">Shop With Confidence</div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase">Why Customers Choose Us</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="glass rounded-2xl p-6 border border-white/5 bg-slate-950/20 hover:border-slate-800 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/25 flex-shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 mb-1.5">{f.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. EGNARO PROMISE SECTION */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-white/5 bg-gradient-to-br from-primary/10 to-transparent p-8 sm:p-10 overflow-hidden shadow-2xl backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase mb-3.5 tracking-wider">The Egnaro Promise</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  We are committed to delivering quality products, transparent pricing, secure transactions, and exceptional customer service. If your order falls short of your standards, our customer success team is here to help resolve it immediately.
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-20 bg-slate-950/50 border-t border-white/5 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,102,0,0.02),transparent_50%)] pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase mb-4 tracking-tight">
            Start Shopping with Confidence
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Discover a curated catalog of electronics, mobiles, accessories, groceries, and premium apparel. Explore original manufacturer products with nationwide delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold tracking-wider text-xs uppercase shadow-glow hover:scale-[1.01] transition-transform select-none"
            >
              Explore Products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact "
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 px-8 py-3.5 rounded-2xl font-bold tracking-wider text-xs uppercase transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
