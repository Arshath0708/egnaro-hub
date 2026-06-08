import { Shell } from "@/components/layout/Shell";

const SECTIONS = [
  {
    h: "1. Eligibility",
    p: "Most products are eligible for return within 7 days of delivery, provided they are unused, in original packaging and accompanied by the invoice. Some categories like custom-cut wires and bulk industrial orders are non-returnable.",
  },
  {
    h: "2. How to Initiate a Return",
    p: "Contact us via phone (+91 9442581506) or email (egnaromart@gmail.com) within 7 days of delivery. Our team will guide you through pickup or drop-off.",
  },
  {
    h: "3. Refund Timelines",
    p: "Once the returned item passes our quality check, refunds are processed within 5-7 business days to the original payment method. COD refunds are processed via UPI or bank transfer.",
  },
  {
    h: "4. Damaged or Wrong Items",
    p: "If you receive a damaged or wrong item, report it within 48 hours of delivery with photos. We'll arrange a free replacement or full refund.",
  },
  {
    h: "5. Cancellations",
    p: "Orders can be cancelled free of cost before they are shipped. Once shipped, cancellation requests will be treated as returns.",
  },
  {
    h: "6. Non-Refundable Charges",
    p: "Shipping charges (where applicable) and COD convenience fees are non-refundable unless the return is due to our error.",
  },
  {
    h: "7. Contact for Returns",
    p: "For any return-related queries, reach out to egnaromart@gmail.com or WhatsApp +91 9442581506.",
  },
];

export default function Refund() {  
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-6 sm:mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
            Policy
          </div>
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold">Return & Refund</h1>
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
