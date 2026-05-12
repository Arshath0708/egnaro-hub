const API_BASE = "https://egnaromart.com/api";

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
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
  return await request("/get-products.php");
}

export async function getPendingProducts() {
  const res = await fetch(
    "https://egnaromart.com/api/get-pending.php"
  );

  if (!res.ok) {
    throw new Error("Failed to fetch pending products");
  }

  return res.json();
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
};

export async function addProduct(form: ProductForm) {
  try {
    const res = await fetch(`${API_BASE}/add-product.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const text = await res.text();

    console.log("RAW RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response from server");
    }

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to add product");
    }

    return data;
  } catch (err: any) {
    console.error("ADD PRODUCT ERROR:", err);

    throw new Error(err.message || "Network error");
  }
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

export async function getAllVendors() {
  return await request("/get-all-vendors.php");
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
  const res = await fetch(`${API_BASE}/get-order.php?order_id=${orderId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, // 🔑 optional
    },
  });

  return res.json();
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

export async function approveVendor(id: number, status: string) {
  return await request("/approve-vendor.php", {
    method: "POST",
    body: JSON.stringify({ id, status }),
  });
}

export async function vendorLogin(data: any) {
  const res = await fetch(`${API_BASE}/vendor-login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return await res.json();
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
  const res = await fetch(`${API_BASE}/register.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  return res.json();
}

export async function loginCustomer(credentials: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
}
