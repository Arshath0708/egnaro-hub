import type { Product, Vendor, Order, CategoryMeta } from "@/types";

export const CATEGORIES: CategoryMeta[] = [
  { id: "electronics", name: "Electronics", icon: "Cpu", description: "Premium consumer electronics", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" },
  { id: "electricals", name: "Electricals", icon: "Zap", description: "Wiring, switches & accessories", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
  { id: "hardware", name: "Hardware", icon: "Wrench", description: "Tools & fittings", image: "https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=800&q=80" },
  { id: "motor-pumps", name: "Motor Pumps", icon: "Gauge", description: "Industrial-grade pumps", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80" },
  { id: "home-appliances", name: "Home Appliances", icon: "Home", description: "Smart home essentials", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80" },
  { id: "industrial", name: "Industrial", icon: "Factory", description: "Heavy-duty industrial goods", image: "https://images.unsplash.com/photo-1565017228812-3b8b16af589f?w=800&q=80" },
];

const img = (q: string) => `https://images.unsplash.com/${q}?w=800&q=80`;

export const SEED_PRODUCTS: Product[] = [
  { id: "p1", name: "SmartHome Wi-Fi Switch 4-Gang", price: 1299, original: 1899, discount: 32, category: "electricals", image: img("photo-1558002038-1055907df827"), rating: 4.6, reviews: 234, description: "Premium Wi-Fi enabled smart switch with voice control compatibility.", specifications: { Brand: "EgnaroPro", Voltage: "240V", Warranty: "2 years" }, approved: true, vendorId: "v1", stock: 50, createdAt: new Date().toISOString() },
  { id: "p2", name: "Industrial 3-Phase Motor Pump 5HP", price: 18999, original: 24999, discount: 24, category: "motor-pumps", image: img("photo-1581092918056-0c4c3acd3789"), rating: 4.8, reviews: 89, description: "Heavy-duty 3-phase motor pump for industrial water transfer.", specifications: { Power: "5HP", Phase: "3", "Head Max": "60m", Warranty: "3 years" }, approved: true, vendorId: "v1", stock: 12, createdAt: new Date().toISOString() },
  { id: "p3", name: "Premium Cordless Drill Kit", price: 4499, original: 6999, discount: 36, category: "hardware", image: img("photo-1504148455328-c376907d081c"), rating: 4.7, reviews: 412, description: "20V Li-ion cordless drill with 50-piece bit set.", specifications: { Voltage: "20V", "Battery": "Li-ion 4Ah", Warranty: "1 year" }, approved: true, vendorId: "v2", stock: 32, createdAt: new Date().toISOString() },
  { id: "p4", name: "4K Ultra HD Smart LED TV 55\"", price: 38999, original: 54999, discount: 29, category: "electronics", image: img("photo-1593359677879-a4bb92f829d1"), rating: 4.5, reviews: 1024, description: "Cinematic 4K HDR display with built-in streaming apps.", specifications: { Display: "55-inch 4K HDR", OS: "Android TV", Warranty: "2 years" }, approved: true, vendorId: "v2", stock: 8, createdAt: new Date().toISOString() },
  { id: "p5", name: "Inverter Split AC 1.5 Ton 5-Star", price: 36499, original: 49999, discount: 27, category: "home-appliances", image: img("photo-1631545806609-cc3c7e0e0a8e"), rating: 4.6, reviews: 567, description: "Energy-efficient inverter AC with copper condenser.", specifications: { Capacity: "1.5 Ton", Rating: "5-Star", Warranty: "1+10 years" }, approved: true, vendorId: "v1", stock: 20, createdAt: new Date().toISOString() },
  { id: "p6", name: "Heavy-Duty Industrial Generator 7.5kVA", price: 89999, original: 119999, discount: 25, category: "industrial", image: img("photo-1565017228812-3b8b16af589f"), rating: 4.9, reviews: 56, description: "Diesel generator with auto-start and noise-canceling enclosure.", specifications: { Capacity: "7.5kVA", Fuel: "Diesel", Warranty: "2 years" }, approved: true, vendorId: "v3", stock: 5, createdAt: new Date().toISOString() },
  { id: "p7", name: "Premium Copper Wire Bundle 90m", price: 2899, original: 3499, discount: 17, category: "electricals", image: img("photo-1558618666-fcd25c85cd64"), rating: 4.4, reviews: 178, description: "ISI-marked premium copper wire for residential & commercial use.", specifications: { Length: "90m", Gauge: "1.5sqmm", "ISI": "Yes" }, approved: true, vendorId: "v3", stock: 100, createdAt: new Date().toISOString() },
  { id: "p8", name: "Wireless Noise-Cancel Headphones", price: 4999, original: 8999, discount: 44, category: "electronics", image: img("photo-1505740420928-5e560c06d30e"), rating: 4.7, reviews: 892, description: "Studio-grade ANC headphones with 40-hr battery.", specifications: { "Battery": "40hr", ANC: "Active", Warranty: "1 year" }, approved: true, vendorId: "v2", stock: 45, createdAt: new Date().toISOString() },
  { id: "p9", name: "Submersible Water Pump 1HP", price: 8999, original: 12499, discount: 28, category: "motor-pumps", image: img("photo-1622383563227-04401ab4e5ea"), rating: 4.5, reviews: 145, description: "Stainless steel submersible pump for borewell use.", specifications: { Power: "1HP", "Head Max": "45m", Warranty: "2 years" }, approved: true, vendorId: "v1", stock: 18, createdAt: new Date().toISOString() },
  { id: "p10", name: "Industrial Tool Cabinet 7-Drawer", price: 15999, original: 22999, discount: 30, category: "hardware", image: img("photo-1530124566582-a618bc2615dc"), rating: 4.6, reviews: 67, description: "Heavy-duty steel cabinet with ball-bearing drawers.", specifications: { Drawers: "7", Material: "Cold-rolled Steel", Warranty: "5 years" }, approved: true, vendorId: "v3", stock: 10, createdAt: new Date().toISOString() },
  { id: "p11", name: "Smart Refrigerator 320L Frost-Free", price: 32999, original: 42999, discount: 23, category: "home-appliances", image: img("photo-1571175443880-49e1d25b2bc5"), rating: 4.4, reviews: 321, description: "Inverter compressor refrigerator with smart cooling tech.", specifications: { Capacity: "320L", Type: "Frost Free", Warranty: "1+10 years" }, approved: true, vendorId: "v2", stock: 14, createdAt: new Date().toISOString() },
  { id: "p12", name: "MCB Distribution Board 12-Way", price: 3499, original: 4999, discount: 30, category: "electricals", image: img("photo-1610552050890-fe99536c2615"), rating: 4.5, reviews: 98, description: "12-way MCB distribution board with surge protection.", specifications: { Ways: "12", Rating: "63A", "ISI": "Yes" }, approved: true, vendorId: "v1", stock: 40, createdAt: new Date().toISOString() },
];

export const SEED_VENDORS: Vendor[] = [
  { id: "v1", vendorName: "Anand Sharma", companyName: "Sharma Electricals", phone: "9442581500", email: "anand@sharma.in", address: "Coimbatore, TN", gst: "33ABCDE1234F1Z5", status: "approved", createdAt: new Date().toISOString() },
  { id: "v2", vendorName: "Priya Mehta", companyName: "Mehta Electronics", phone: "9442581501", email: "priya@mehta.in", address: "Chennai, TN", gst: "33ABCDE5678G1Z2", status: "approved", createdAt: new Date().toISOString() },
  { id: "v3", vendorName: "Karthik Iyer", companyName: "Iyer Industrials", phone: "9442581502", email: "karthik@iyer.in", address: "Madurai, TN", gst: "33ABCDE9012H1Z9", status: "approved", createdAt: new Date().toISOString() },
];

export const SEED_ORDERS: Order[] = [
  {
    id: "EM240001",
    items: [{ productId: "p1", name: "SmartHome Wi-Fi Switch 4-Gang", price: 1299, quantity: 2, image: img("photo-1558002038-1055907df827") }],
    total: 2598,
    status: "shipped",
    customer: { fullName: "Demo Customer", phone: "9442581506", email: "demo@egnaromart.com", address: "12 MG Road", city: "Coimbatore", state: "Tamil Nadu", pincode: "641107" },
    payment: "upi",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
    history: [
      { status: "processing", at: new Date(Date.now() - 86400000 * 3).toISOString() },
      { status: "confirmed", at: new Date(Date.now() - 86400000 * 2.5).toISOString() },
      { status: "packed", at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { status: "shipped", at: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
];
