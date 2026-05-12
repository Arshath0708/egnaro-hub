const API_BASE = "https://egnaromart.com/api";

async function request(endpoint: string, options?: RequestInit) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });



  const text = await res.text();

  console.log(`API RESPONSE (${endpoint}) =>`, text);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    return text ? JSON.parse(text) : [];
  } catch (err) {
    console.error("JSON Parse Error:", err);
    console.error("RAW RESPONSE:", text);

    throw new Error("Invalid JSON response");
  }
}

/* =========================
   PRODUCTS
========================= */

export async function getProducts() {
  const data = await request("/get-products.php");
  return data.map((p: any) => ({
    ...p,
    id: String(p.id),
    price: Number(p.price),
    original_price: Number(p.original_price || 0),
    discount: Number(p.discount || 0),
    approved: p.approved === 1 || p.approved === "1",
    average_rating: Number(p.average_rating || 0),
    total_reviews: Number(p.total_reviews || 0),
  }));
}



export async function getVendorProducts(vendorId: string) {
  const data = await request(`/get-vendor-products.php?vendor_id=${vendorId}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch vendor products");
  }
  return data.products || [];
}

export async function getVendorStats(vendorId: string) {
  const data = await request(`/get-vendor-stats.php?vendor_id=${vendorId}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch vendor stats");
  }
  return {
    revenue: data.revenue || 0,
    total_orders: data.total_orders || 0,
  };
}

export async function getPendingProducts() {
  return await request("/get-pending.php");
}
export type ProductForm = {
  vendorId: string;
  name: string;
  category: string;
  image: string;
  price: string;
  original_price: string;
  discount: string;
  description: string;
  stock_quantity: string;
  created_by_type: string;
  created_by_id: string;
};

export async function addProduct(form: ProductForm) {
  const data = await request("/add-product.php", {
    method: "POST",
    body: JSON.stringify(form),
  });

  if (!data.success) {
    console.error("ADD PRODUCT FAILED:", data);
    throw new Error(data.error || data.message || "Failed to add product");
  }

  return data;
}

export async function getProductById(productId: number) {
  return await request(`/get-product-by-id.php?product_id=${productId}`);
}

export async function updateProduct(data: any) {
  return await request("/update-product.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateProduct(data: any) {
  return await request("/admin-update-product.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteProduct(productId: number) {
  return await request("/admin-delete-product.php", {
    method: "POST",
    body: JSON.stringify({
      id: Number(productId),
      product_id: Number(productId), // Send both for safety
    }),
  });
}

export async function deleteProduct(productId: number, vendorId: string) {
  return await request("/delete-product.php", {
    method: "POST",
    body: JSON.stringify({
      id: Number(productId),
      product_id: Number(productId),
      vendor_id: vendorId,
      role: 'vendor'
    }),
  });
}

export async function approveProduct(id: number) {
  // ✅ updates status/approved in products
  return await request("/admin-approve.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function rejectProduct(id: number) {
  // ✅ updates status/approved in products
  return await request("/admin-reject.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}



/* =========================
   VENDORS
========================= */

export async function addVendor(data: any) {
  return await request("/add-vendor.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* =========================
   ORDERS
========================= */

export async function createOrder(data: any) {
  return await request("/create-order.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function trackOrder(orderId: string) {
  return await request(`/get-order.php?order_id=${orderId}`);
}

/* =========================
   ADMIN
========================= */

export async function updateOrderStatus(id: number, status: string) {
  return await request("/update-order-status.php", {
    method: "POST",
    body: JSON.stringify({ id, status }),
  });
}

export async function getOrders() {
  return await request("/get-orders.php");
}

export async function getVendors() {
  return await request("/get-vendors.php");
}

export async function getVendorById(vendorId: number) {
  return await request(`/get-vendor-by-id.php?vendor_id=${vendorId}`);
}

export async function approveVendor(id: number, status: string) {
  return await request("/approve-vendor.php", {
    method: "POST",
    body: JSON.stringify({ id, status }),
  });
}

export async function vendorLogin(data: any) {
  return await request("/vendor-login.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrderById(orderId: string) {
  return await request(`/get-order.php?order_id=${orderId}`);
}

/* =========================
   CUSTOMERS
========================= */

export async function registerCustomer(form: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  return await request("/register.php", {
    method: "POST",
    body: JSON.stringify(form),
  });
}

export async function loginCustomer(credentials: {
  email: string;
  password: string;
}) {
  return await request("/login.php", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}



export async function getReviews(productId: number) {
  return await request(`/get-reviews.php?product_id=${productId}`);
}

/* ADD REVIEW */

export async function addReview(data: {
  product_id: number;
  customer_name: string;
  rating: number;
  review: string;
}) {
  return await request("/add-review.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


/* ================= CATEGORIES ================= */

export async function getCategories() {
  return await request("/get-categories.php");
}

export async function addCategory(name: string) {
  return await request("/add-category.php", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateCategory(
  id: number,
  name: string
) {
  return await request("/update-category.php", {
    method: "POST",
    body: JSON.stringify({
      id,
      name,
    }),
  });
}

export async function deleteCategory(id: number) {
  return await request("/delete-category.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}