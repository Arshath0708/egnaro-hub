import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";

export default function Contact() {   
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const inp =
    "w-full bg-secondary/60 border border-glass-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring transition";

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
            Contact
          </div>
          <h1 className="font-display text-5xl font-bold">Let's talk</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            For orders, bulk pricing, vendor onboarding or support — we respond
            within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            {[
              {
                icon: Phone,
                label: "Phone",
                value: "+91 9442581506",
                href: "tel:+919442581506",
              },
              {
                icon: Mail,
                label: "Email",
                value: "egnaromart@gmail.com",
                href: "mailto:egnaromart@gmail.com",
              },
              {
                icon: MessageCircle,
                label: "WhatsApp",
                value: "+91 9442581506",
                href: "https://wa.me/919442581506",
              },
              {
                icon: MapPin,
                label: "Address",
                value:
                  "No: 2A, Venkatesh, Sarkarsamakulam, Kovilpalayam, Tamil Nadu - 641107",
              },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href?.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="block glass rounded-2xl p-5 hover-lift"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl gradient-primary grid place-items-center shadow-glow">
                    <c.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {c.label}
                    </div>
                    <div className="font-medium mt-1">{c.value}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Contact Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Message sent", {
                description: "We'll get back to you shortly.",
              });
              setForm({ name: "", email: "", message: "" });
            }}
            className="glass-strong rounded-2xl p-6 shadow-elegant"
          >
            <h3 className="font-display text-2xl font-bold mb-5">
              Send a message
            </h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Name
                </span>
                <input
                  required
                  className={inp}
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email
                </span>
                <input
                  type="email"
                  required
                  className={inp}
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Message
                </span>
                <textarea
                  rows={5}
                  required
                  className={inp}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />
              </label>
            </div>
            <button className="mt-5 inline-flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-glow shimmer">
              <Send className="h-4 w-4" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
