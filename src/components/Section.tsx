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
  // Automatically identify the last word of a section heading to wrap it in a premium gradient span
  const renderTitle = (text: string) => {
    const words = text.split(" ");
    if (words.length <= 1) return text;
    const lastWord = words.pop();
    return (
      <>
        {words.join(" ")}{" "}
        <span className="text-gradient font-black">
          {lastWord}
        </span>
      </>
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      <div className="flex items-end justify-between gap-6 mb-5 sm:mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          {eyebrow && (
            <div className="font-mono text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-[0.1em] text-primary mb-1.5 sm:mb-2">
              {eyebrow}
            </div>
          )}
          <h2 className="font-display font-extrabold text-xl sm:text-3xl lg:text-[2.2rem] leading-[1.05] tracking-[-0.03em] text-slate-100">
            {renderTitle(title)}
          </h2>
          {subtitle && (
            <p className="font-sans text-xs sm:text-[0.95rem] leading-[1.65] text-slate-400 mt-1.5 sm:mt-2 max-w-2xl">
              {subtitle}
            </p>
          )}
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
