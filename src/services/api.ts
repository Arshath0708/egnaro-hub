const API_BASE = "https://egnaromart.com/api";

async function request(
  endpoint: string,
  options?: RequestInit
) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const text = await res.text();

    try {
      return text ? JSON.parse(text) : [];
    } catch {
      console.error("Invalid JSON response:", text);
      return [];
    }
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

/* =========================
   PRODUCTS
========================= */

export async function getProducts() {
  return await request("/get-products.php");
}

export async function getPendingProducts() {
  return await request("/get-pending.php");
}

export async function addProduct(data: any) {
  return await request("/add-product.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approveProduct(id: number) {
  return await request("/admin-approve.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function rejectProduct(id: number) {
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
  const res = await fetch(`https://egnaromart.com/api/get-order.php?order_id=${orderId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, // 🔑 add token here
    },
  });

  return res.json();
}


/* =========================
   ADMIN
========================= */

export async function updateOrderStatus(
  id: number,
  status: string
) {
  return await request("/update-order-status.php", {
    method: "POST",
    body: JSON.stringify({
      id,
      status,
    }),
  });
}

export async function getOrders() {
  return await request("/get-orders.php");
}
export async function getVendors() {
  return await request("/get-vendors.php");
}

export async function approveVendor(
  id: number,
  status: string
) {
  return await request("/approve-vendor.php", {
    method: "POST",
    body: JSON.stringify({
      id,
      status,
    }),
  });
}
export async function vendorLogin(data:any) {
  const res = await fetch(
    "https://egnaromart.com/api/vendor-login.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return await res.json();
}

export async function getOrderById(
  orderId: string
) {
  return await request(
    `/get-order.php?order_id=${orderId}`
  );
}
// src/services/api.ts

// Customer Registration
export async function registerCustomer(form: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const res = await fetch("https://egnaromart.com/api/register.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  return res.json();
}

// Customer Login
export async function loginCustomer(credentials: {
  email: string;
  password: string;
}) {
  const res = await fetch("https://egnaromart.com/api/login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
}
