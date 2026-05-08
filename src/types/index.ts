export type Category =
  | "electronics"
  | "electricals"
  | "hardware"
  | "motor-pumps"
  | "home-appliances"
  | "industrial";

export interface Product {
  id: string;
  name: string;
  price: number;
  original: number;
  discount: number;
  category: Category;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  specifications: Record<string, string>;
  approved: boolean;
  vendorId: string;
  stock: number;
  createdAt: string;
}

export interface Vendor {
  id: string;
  vendorName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  gst: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type OrderStatus =
  | "processing"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out-for-delivery"
  | "delivered";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gst?: string;
    notes?: string;
  };
  payment: "cod" | "upi" | "card";
  createdAt: string;
  estimatedDelivery: string;
  history: { status: OrderStatus; at: string }[];
}

export interface CategoryMeta {
  id: Category;
  name: string;
  icon: string;
  description: string;
  image: string;
}
