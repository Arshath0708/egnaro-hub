import { motion } from "framer-motion";

export function Section({
  eyebrow, title, subtitle, children, action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-end justify-between gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          {eyebrow && <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">{eyebrow}</div>}
          <h2 className="font-display text-3xl md:text-4xl font-bold">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
        </motion.div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-20 glass rounded-2xl">
      <div className="text-2xl font-display font-bold mb-2">{title}</div>
      {description && <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>}
      {action}
    </div>
  );
}
