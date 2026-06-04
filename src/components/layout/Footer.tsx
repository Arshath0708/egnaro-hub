// src/components/layout/Footer.tsx
import { Link } from "react-router-dom";   // ✅ switched to react-router-dom
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { sanitizeInput, validateEmail } from "@/lib/validation";

export function Footer() {
  const [email, setEmail] = useState("");
  return (
    <footer className="mt-20 border-t border-glass-border glass-strong">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            {/* ✅ Clean brand name only, no orange/glow background */}
            <div className="flex items-center gap-2 mb-4">
              <div className="font-display font-bold text-lg">Egnaro Mart</div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              India's trusted multi-vendor marketplace for electronics,
              electricals, hardware, motor pumps, home appliances and industrial
              goods — direct from manufacturers.
            </p>
          </div>

          <div>
            <h4 className="font-display text-[0.9rem] font-bold uppercase tracking-[0.1em] text-slate-200 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 font-sans text-[0.875rem] text-slate-400">
              <li>
                <Link
                  to="/products"
                  className="hover:text-slate-100 transition-colors"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-slate-100 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/track-order"
                  className="hover:text-slate-100 transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  to="/vendor-register"
                  className="hover:text-slate-100 transition-colors"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-slate-100 transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="hover:text-slate-100 transition-colors"
                >
                  Return &amp; Refund
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-[0.9rem] font-bold uppercase tracking-[0.1em] text-slate-200 mb-4">
              Contact
            </h4>
            <ul className="space-y-3 font-sans text-[0.875rem] text-slate-400">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <a
                  href="tel:+919442581506"
                  className="hover:text-slate-100 transition-colors"
                >
                  +91 9442581506
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <a
                  href="mailto:egnaromart@gmail.com"
                  className="hover:text-slate-100 transition-colors"
                >
                  egnaromart@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>
                  No: 2A, Venkatesh, Sarkarsamakulam, Kovilpalayam, Tamil Nadu -
                  641107
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-[0.9rem] font-bold uppercase tracking-[0.1em] text-slate-200 mb-4">
              Newsletter
            </h4>
            <p className="font-sans text-[0.875rem] text-slate-400 mb-3">
              Get exclusive deals & launches.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) return;
                const cleanEmail = sanitizeInput(email);
                if (!validateEmail(cleanEmail)) {
                  toast.error("Please enter a valid email address");
                  return;
                }
                toast.success("Subscribed", {
                  description: "Welcome to Egnaro Mart insiders.",
                });
                setEmail("");
              }}
              className="flex items-center gap-2 glass rounded-xl p-1.5 w-full"
            >
              <div className="flex gap-2 w-full border-none p-0 m-0 min-w-0">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="you@email.com"
                  className="flex-1 bg-transparent px-3 py-2 font-sans text-[0.875rem] text-slate-200 outline-none placeholder:text-slate-500 min-w-0"
                />
                <button
                  type="submit"
                  className="gradient-primary text-primary-foreground p-2 rounded-lg hover:shadow-glow transition-shadow cursor-pointer shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-glass-border flex flex-col sm:flex-row gap-3 items-center justify-between font-sans text-[0.78rem] text-slate-500">
          <div>
            © {new Date().getFullYear()} Egnaro Mart. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
