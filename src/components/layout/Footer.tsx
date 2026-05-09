// src/components/layout/Footer.tsx
import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
              India's trusted multi-vendor marketplace for electronics, electricals, hardware, motor pumps, home appliances and industrial goods — direct from manufacturers.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 tracking-wide uppercase text-foreground/90">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-foreground transition-colors">Shop All</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/track-order" className="hover:text-foreground transition-colors">Track Order</Link></li>
              <li><Link to="/vendor-register" className="hover:text-foreground transition-colors">Become a Vendor</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Return &amp; Refund</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 tracking-wide uppercase text-foreground/90">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary" /><a href="tel:+919442581506" className="hover:text-foreground">+91 9442581506</a></li>
              <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 text-primary" /><a href="mailto:egnaromart@gmail.com" className="hover:text-foreground">egnaromart@gmail.com</a></li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary" /><span>No: 2A, Venkatesh, Sarkarsamakulam, Kovilpalayam, Tamil Nadu - 641107</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 tracking-wide uppercase text-foreground/90">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-3">Get exclusive deals & launches.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) return;
                toast.success("Subscribed", { description: "Welcome to Egnaro Mart insiders." });
                setEmail("");
              }}
              className="flex items-center gap-2 glass rounded-xl p-1.5"
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@email.com"
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="gradient-primary text-primary-foreground p-2 rounded-lg hover:shadow-glow transition-shadow"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-glass-border flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Egnaro Mart. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
