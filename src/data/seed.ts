//seed.ts
import type { Product, Vendor, Order, CategoryMeta } from "@/types";

export const CATEGORIES: CategoryMeta[] = [
  { id: "electronics", name: "Electronics", icon: "Cpu", description: "Premium consumer electronics", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" },
  { id: "electricals", name: "Electricals", icon: "Zap", description: "Wiring, switches & accessories", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
  { id: "hardware", name: "Hardware", icon: "Wrench", description: "Tools & fittings", image: "https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=800&q=80" },
  { id: "motor-pumps", name: "Motor Pumps", icon: "Gauge", description: "Industrial-grade pumps", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80" },
  { id: "home-appliances", name: "Home Appliances", icon: "Home", description: "Smart home essentials", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80" },
  { id: "industrial", name: "Industrial", icon: "Factory", description: "Heavy-duty industrial goods", image: "https://images.unsplash.com/photo-1565017228812-3b8b16af589f?w=800&q=80" },
];

// ✅ Empty arrays — no fake products/vendors/orders
export const SEED_PRODUCTS: Product[] = [];
export const SEED_VENDORS: Vendor[] = [];
export const SEED_ORDERS: Order[] = [];
