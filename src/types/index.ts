//index.ts
export interface Category {
  id: string;
  name: string;
}


export interface Product {
  id: string;

  name: string;

  price: number;

  original_price: number;

  discount: number;

  category: string;

  image: string;

  description: string;

  specifications?: Record<string, string>;

  approved: boolean | number;

  status?: string;

  vendorId?: string;

  stock?: number;

  createdAt?: string;

  average_rating: number;

  total_reviews: number;
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
  address: string;
  id: string;                // internal DB id
  order_id: string;          // <-- added to match backend JSON
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
  trackingNumber?: string;
  courierPartner?: string;
}

export interface CategoryMeta {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
}
