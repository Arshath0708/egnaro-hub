//seed.ts
import type { Product, Vendor, Order, CategoryMeta } from "@/types";

export const CATEGORIES: CategoryMeta[] = [
  { id: "electronics", name: "Electronics", icon: "Cpu", description: "Premium consumer electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80" },
  { id: "mobiles", name: "Mobiles", icon: "Smartphone", description: "Latest smartphones & gadgets", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80" },
  { id: "electricals", name: "Electricals", icon: "Zap", description: "Wiring, switches & accessories", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80" },
  { id: "hardware", name: "Hardware", icon: "Wrench", description: "Tools & fittings", image: "https://images.unsplash.com/photo-1530124566582-a618bc2615ad?w=800&q=80" },
  { id: "motor-pumps", name: "Motor Pumps", icon: "Gauge", description: "Industrial-grade pumps", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80" },
  { id: "home-appliances", name: "Home Appliances", icon: "Home", description: "Smart home essentials", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80" },
  { id: "industrial", name: "Industrial", icon: "Factory", description: "Heavy-duty industrial goods", image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&q=80" },
  { id: "groceries", name: "Groceries", icon: "ShoppingBasket", description: "Fresh daily essentials", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" },
  { id: "accessories", name: "Accessories", icon: "Watch", description: "Tech & fashion add-ons", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80" },
];

// ✅ Empty arrays — no fake products/vendors/orders
export const SEED_PRODUCTS: Product[] = [];
export const SEED_VENDORS: Vendor[] = [];
export const SEED_ORDERS: Order[] = [];
