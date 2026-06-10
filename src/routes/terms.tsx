import { Shell } from "@/components/layout/Shell";
import { useDocumentMetadata } from "@/hooks/useDocumentMetadata";

const SECTIONS = [
  {
    h: "1. Acceptance of Terms",
    p: "By accessing and using Egnaro Mart, you accept and agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.",
  },
  {
    h: "2. Use of the Platform",
    p: "Egnaro Mart provides a marketplace for purchasing electronics, electricals, hardware, motor pumps, home appliances and industrial goods. You agree to use the platform only for lawful purposes.",
  },
  {
    h: "3. Account Registration",
    p: "Customers and vendors must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.",
  },
  {
    h: "4. Vendor Responsibilities",
    p: "Vendors are responsible for the accuracy of product listings, fulfillment, and applicable taxes. Egnaro Mart reserves the right to approve, reject or remove listings at its sole discretion.",
  },
  {
    h: "5. Pricing & Payment",
    p: "All prices are listed in INR and inclusive of applicable taxes unless stated otherwise. We accept Cash on Delivery, UPI and Card payments through our partners.",
  },
  {
    h: "6. Shipping & Delivery",
    p: "Estimated delivery times are indicative. Egnaro Mart and its logistics partners will make reasonable efforts to deliver within the estimated timeframe.",
  },
  {
    h: "7. Returns & Refunds",
    p: "Please refer to our Return & Refund Policy page for details on eligible products, timelines and procedures.",
  },
  {
    h: "8. Intellectual Property",
    p: "All content on Egnaro Mart, including logos, images and text, is the property of Egnaro Mart or its licensors and may not be reproduced without written permission.",
  },
  {
    h: "9. Limitation of Liability",
    p: "Egnaro Mart shall not be liable for any indirect, incidental or consequential damages arising from the use or inability to use the platform.",
  },
  {
    h: "10. Governing Law",
    p: "These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Coimbatore, Tamil Nadu.",
  },
];

export default function Terms() {
  useDocumentMetadata("Terms & Conditions", "Review the legal terms, conditions, pricing policies, and intellectual property terms of Egnaro Mart.");

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-6 sm:mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
            Legal
          </div>
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold">Terms & Conditions</h1>
          <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-5 sm:p-8 shadow-elegant space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-xl font-bold mb-2">{s.h}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.p}
              </p>
            </section>
          ))}
        </div>
      </div>
    </Shell>
  );
}
