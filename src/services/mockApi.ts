import type { Product, Vendor, Order, OrderStatus, CartItem } from "@/types";
import { SEED_PRODUCTS, SEED_VENDORS, SEED_ORDERS } from "@/data/seed";

const KEY = "egnaro:db:v1";

interface DB {
  products: Product[];
  vendors: Vendor[];
  orders: Order[];
}

const isBrowser = typeof window !== "undefined";

function load(): DB {
  if (!isBrowser) return { products: SEED_PRODUCTS, vendors: SEED_VENDORS, orders: SEED_ORDERS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const init: DB = { products: SEED_PRODUCTS, vendors: SEED_VENDORS, orders: SEED_ORDERS };
      localStorage.setItem(KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as DB;
  } catch {
    return { products: SEED_PRODUCTS, vendors: SEED_VENDORS, orders: SEED_ORDERS };
  }
}

function save(db: DB) {
  if (!isBrowser) return;
  localStorage.setItem(KEY, JSON.stringify(db));
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const id = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;

export const api = {
  async getProducts(filter?: { category?: string; approvedOnly?: boolean; vendorId?: string; search?: string }): Promise<Product[]> {
    await delay(200);
    let list = load().products;
    if (filter?.approvedOnly) list = list.filter((p) => p.approved);
    if (filter?.category) list = list.filter((p) => p.category === filter.category);
    if (filter?.vendorId) list = list.filter((p) => p.vendorId === filter.vendorId);
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getProductById(pid: string): Promise<Product | null> {
    await delay(150);
    return load().products.find((p) => p.id === pid) ?? null;
  },

  async submitVendorApplication(input: Omit<Vendor, "id" | "status" | "createdAt">): Promise<Vendor> {
    await delay();
    const db = load();
    const vendor: Vendor = { ...input, id: id("v"), status: "pending", createdAt: new Date().toISOString() };
    db.vendors.push(vendor); save(db);
    return vendor;
  },

  async getVendors(status?: Vendor["status"]): Promise<Vendor[]> {
    await delay();
    const v = load().vendors;
    return status ? v.filter((x) => x.status === status) : v;
  },

  async setVendorStatus(vid: string, status: Vendor["status"]): Promise<void> {
    await delay();
    const db = load();
    const v = db.vendors.find((x) => x.id === vid); if (v) v.status = status;
    save(db);
  },

  async submitVendorProduct(input: Omit<Product, "id" | "approved" | "createdAt" | "rating" | "reviews">): Promise<Product> {
    await delay();
    const db = load();
    const p: Product = { ...input, id: id("p"), approved: false, rating: 0, reviews: 0, createdAt: new Date().toISOString() };
    db.products.push(p); save(db);
    return p;
  },

  async updateProduct(pid: string, patch: Partial<Product>): Promise<void> {
    await delay();
    const db = load();
    const i = db.products.findIndex((p) => p.id === pid);
    if (i >= 0) db.products[i] = { ...db.products[i], ...patch };
    save(db);
  },

  async deleteProduct(pid: string): Promise<void> {
    await delay();
    const db = load();
    db.products = db.products.filter((p) => p.id !== pid);
    save(db);
  },

  async approveProduct(pid: string, approved: boolean): Promise<void> {
    await delay();
    const db = load();
    const p = db.products.find((x) => x.id === pid); if (p) p.approved = approved;
    save(db);
  },

  async createOrder(input: {
    items: CartItem[];
    customer: Order["customer"];
    payment: Order["payment"];
  }): Promise<Order> {
    await delay(400);
    const db = load();
    const orderItems = input.items.map((ci) => {
      const prod = db.products.find((p) => p.id === ci.productId)!;
      return { productId: prod.id, name: prod.name, price: prod.price, quantity: ci.quantity, image: prod.image };
    });
    const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const oid = `EM${Date.now().toString().slice(-7)}`;
    const order: Order = {
      id: oid,
      items: orderItems,
      total,
      status: "processing",
      customer: input.customer,
      payment: input.payment,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 86400000 * 5).toISOString(),
      history: [{ status: "processing", at: new Date().toISOString() }],
    };
    db.orders.push(order); save(db);
    return order;
  },

  async trackOrder(query: string): Promise<Order | null> {
    await delay();
    const q = query.trim();
    const o = load().orders.find((x) => x.id.toLowerCase() === q.toLowerCase() || x.customer.phone === q);
    return o ?? null;
  },

  async getOrders(): Promise<Order[]> {
    await delay();
    return load().orders.slice().reverse();
  },

  async setOrderStatus(oid: string, status: OrderStatus): Promise<void> {
    await delay();
    const db = load();
    const o = db.orders.find((x) => x.id === oid);
    if (o) {
      o.status = status;
      o.history.push({ status, at: new Date().toISOString() });
    }
    save(db);
  },
};

export type Api = typeof api;
