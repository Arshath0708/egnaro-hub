import { useAuth } from "@/context/auth-store";
const API_BASE = import.meta.env.VITE_API_URL || "/api";

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

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  vendor_id?: number;
  search?: string;
} | any) {
  let actualParams = params;
  if (params && (params.queryKey || params.signal)) {
    actualParams = undefined;
  }

  const queryParts = [];
  
  // Defensive high default limit for client-side search catalogs when limit is not specified
  const limitValue = actualParams?.limit !== undefined ? actualParams.limit : 10000;
  queryParts.push(`limit=${limitValue}`);

  if (actualParams) {
    if (actualParams.page !== undefined) queryParts.push(`page=${actualParams.page}`);
    if (actualParams.category) queryParts.push(`category=${encodeURIComponent(actualParams.category)}`);
    if (actualParams.status) queryParts.push(`status=${encodeURIComponent(actualParams.status)}`);
    if (actualParams.vendor_id !== undefined) queryParts.push(`vendor_id=${actualParams.vendor_id}`);
    if (actualParams.search) queryParts.push(`search=${encodeURIComponent(actualParams.search)}`);
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const data = await request(`/get-products.php${queryString}`);
  
  const productsList = Array.isArray(data) ? data : (data.products || []);

  const mapped = productsList.map((p: any) => ({
    ...p,
    id: String(p.id),
    price: Number(p.price),
    original_price: Number(p.original_price || 0),
    discount: Number(p.discount || 0),
    approved: p.approved === 1 || p.approved === "1",
    average_rating: Number(p.average_rating || 0),
    total_reviews: Number(p.total_reviews || 0),
    stock_quantity: Number(p.stock_quantity || 0),
    creator_name: p.created_by_type === "admin"
      ? "Admin"
      : p.vendor_name
        ? (p.vendor_company && p.vendor_company !== p.vendor_name
            ? `${p.vendor_name} (${p.vendor_company})`
            : p.vendor_name)
        : (p.vendor_company || "Vendor"),
  }));

  const validProducts = mapped.filter((p: any) => p.status !== "rejected" && p.status !== "deleted");

  if (actualParams) {
    return {
      ...data,
      products: validProducts
    };
  }
  return validProducts;
}



export async function getVendorProducts(
  vendorId: string | number,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  } | any
) {
  let actualParams = params;
  if (params && (params.queryKey || params.signal)) {
    actualParams = undefined;
  }

  const queryParts = [`vendor_id=${vendorId}`];
  if (actualParams) {
    if (actualParams.page !== undefined) queryParts.push(`page=${actualParams.page}`);
    if (actualParams.limit !== undefined) queryParts.push(`limit=${actualParams.limit}`);
    if (actualParams.status) queryParts.push(`status=${encodeURIComponent(actualParams.status)}`);
    if (actualParams.category) queryParts.push(`category=${encodeURIComponent(actualParams.category)}`);
    if (actualParams.search) queryParts.push(`search=${encodeURIComponent(actualParams.search)}`);
  } else {
    queryParts.push("limit=10000");
  }

  const queryString = `?${queryParts.join("&")}`;
  const data = await request(`/get-vendor-products.php${queryString}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch vendor products");
  }

  const vendorProducts = data.products || [];
  const validProducts = vendorProducts.filter((p: any) => p.status !== "rejected" && p.status !== "deleted");

  if (actualParams) {
    return {
      ...data,
      products: validProducts
    };
  }
  return validProducts;
}

export async function getVendorStats(vendorId: string) {
  const data = await request(`/get-vendor-stats.php?vendor_id=${vendorId}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch vendor stats");
  }
  return {
    gross_revenue: Number(data.gross_revenue || 0),
    net_revenue: Number(data.net_revenue || 0),
    commission: Number(data.commission || 0),
    total_orders: Number(data.total_orders || 0),
  };
}

export async function getVendorOrders(vendorId: string, page: number = 1, status: string = "", limit: number = 10, search: string = "") {
  const query = `vendor_id=${vendorId}&page=${page}&limit=${limit}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
  const data = await request(`/get-vendor-orders.php?${query}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch vendor orders");
  }
  return data;
}

export async function getPendingProducts() {
  const data = await getProducts({ limit: 10000, status: "pending" });
  const products = Array.isArray(data) ? data : (data.products || []);
  return products.filter((p: any) => Number(p.approved) === 0 || p.status === "pending");
}
export type ProductForm = {
  vendorId: string;
  name: string;
  category: string;
  subcategory_id?: number;
  subcategory?: string;
  sub_subcategory_id?: number;
  sub_subcategory?: string;
  image: string;
  price: string;
  original_price: string;
  discount: string;
  description: string;
  stock_quantity: string;
  created_by_type: string;
  created_by_id: string;
  approved?: number;
  status?: string;
  gst_percentage?: string | number;
  hsn_code?: string;
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

export async function deleteProduct(productId: number, vendorId: string, isAdmin?: boolean) {
  return await request("/delete-product.php", {
    method: "POST",
    body: JSON.stringify({
      id: Number(productId),
      product_id: Number(productId),
      vendor_id: vendorId,
      role: isAdmin ? 'admin' : 'vendor'
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

export async function updateVendorGst(vendorId: number, gst: string) {
  return await request("/update-vendor-gst.php", {
    method: "POST",
    body: JSON.stringify({ vendor_id: vendorId, gst }),
  });
}

export async function updateBankDetails(data: {
  vendor_id: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
}) {
  return await request("/update-bank-details.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPendingBankRequests(status: string = "pending") {
  return await request(`/get-pending-bank-requests.php?status=${status}`);
}

export async function adminApproveBank(vendorId: number, action: "approve" | "reject") {
  return await request("/admin-approve-bank.php", {
    method: "POST",
    body: JSON.stringify({ vendor_id: vendorId, action }),
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

export async function trackOrder(orderId: string, token?: string) {
  // If orderId is provided, we fetch a single order. If it's a phone number, get-order.php handles it.
  const query = orderId.match(/^\d{10}$/) ? `phone=${orderId}` : `order_id=${orderId}`;
  return await request(`/get-order.php?${query}`, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {}
  });
}

export async function getUserOrders(
  token: string,
  params?: {
    page?: number;
    limit?: number;
  } | any
) {
  let actualParams = params;
  if (params && (params.queryKey || params.signal)) {
    actualParams = undefined;
  }

  // Backend bug: It ignores user_id and returns all global orders.
  // We MUST fetch limit=10000 and filter on the frontend.
  const queryString = `?token=${encodeURIComponent(token)}&limit=10000`;
  const data = await request(`/get-order.php${queryString}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!data || !data.success) return data;

  const user = useAuth.getState().user;
  if (!user) return { success: true, orders: [], total_rows: 0, total_pages: 0 };

  const allOrders = Array.isArray(data.orders) ? data.orders : [];
  const userOrders = allOrders.filter((o: any) => String(o.user_id) === String(user.id));

  if (actualParams && actualParams.page && actualParams.limit) {
    const page = Number(actualParams.page);
    const limit = Number(actualParams.limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedOrders = userOrders.slice(start, end);
    
    return {
      success: true,
      orders: paginatedOrders,
      total_rows: userOrders.length,
      total_pages: Math.ceil(userOrders.length / limit) || 1,
      page,
      limit
    };
  }

  return {
    ...data,
    orders: userOrders,
    total_rows: userOrders.length,
    total_pages: 1
  };
}

/* =========================
   SHIPMENTS & LOGISTICS
========================= */

export async function getVendorShipments(vendorId: string | number, params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const queryParts = [`vendor_id=${vendorId}`];
  if (params) {
    if (params.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }
  const queryString = `?${queryParts.join("&")}`;
  const data = await request(`/get-vendor-shipments.php${queryString}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch vendor shipments");
  }
  return data;
}

export async function getAdminShipments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  vendor_id?: number | string;
  search?: string;
}) {
  const queryParts = [];
  if (params) {
    if (params.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.vendor_id !== undefined && params.vendor_id !== '') queryParts.push(`vendor_id=${params.vendor_id}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const data = await request(`/get-admin-shipments.php${queryString}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch admin shipments");
  }
  return data;
}

export async function prepareShipment(data: {
  shipment_id: string;
  weight_g?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  vendor_id?: number | string;
  action?: string;
  role?: string;
}) {
  return await request("/prepare_shipment.php", {
    method: "POST",
    body: JSON.stringify({
      action: "prepare",
      role: "vendor",
      ...data
    })
  });
}

export async function requestCourierPickup(shipmentId: string, role: string, vendorId?: number | string) {
  return await request("/prepare_shipment.php", {
    method: "POST",
    body: JSON.stringify({
      action: "request_pickup",
      shipment_id: shipmentId,
      role,
      vendor_id: vendorId ? Number(vendorId) : undefined
    })
  });
}

export async function cancelCourierShipment(shipmentId: string, role: string, vendorId?: number | string) {
  return await request("/prepare_shipment.php", {
    method: "POST",
    body: JSON.stringify({
      action: "cancel",
      shipment_id: shipmentId,
      role,
      vendor_id: vendorId ? Number(vendorId) : undefined
    })
  });
}

export async function refreshCourierTracking(shipmentId: string, role: string, vendorId?: number | string) {
  return await request("/prepare_shipment.php", {
    method: "POST",
    body: JSON.stringify({
      action: "refresh_tracking",
      shipment_id: shipmentId,
      role,
      vendor_id: vendorId ? Number(vendorId) : undefined
    })
  });
}

export async function getPickupLocations(vendorId?: string | number) {
  const param = vendorId !== undefined ? `?vendor_id=${vendorId}` : "";
  const data = await request(`/get-pickup-locations.php${param}`);
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch pickup locations");
  }
  return data.locations || [];
}

export async function addPickupLocation(data: {
  vendor_id?: string | number;
  pickup_location_name: string;
  contact_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}) {
  return await request("/add-pickup-location.php", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

/* =========================
   ADMIN
========================= */

export async function updateOrderStatus(
  order_id: string,
  status: string,
  estimated_days?: string,
  vendor_id?: number,
  tracking_number?: string,
  courier_partner?: string
) {
  return await request("/update-order-status.php", {
    method: "POST",
    body: JSON.stringify({
      order_id,
      status,
      estimated_days,
      vendor_id,
      tracking_number,
      courier_partner
    }),
  });
}

export async function getAdminStats() {
  const data = await request("/get-admin-stats.php");
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch admin stats");
  }
  return data.stats;
}

export async function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
} | any) {
  let actualParams = params;
  if (params && (params.queryKey || params.signal)) {
    actualParams = undefined;
  }

  const queryParts = [];
  if (actualParams) {
    if (actualParams.page !== undefined) queryParts.push(`page=${actualParams.page}`);
    if (actualParams.limit !== undefined) queryParts.push(`limit=${actualParams.limit}`);
    if (actualParams.status) queryParts.push(`status=${encodeURIComponent(actualParams.status)}`);
    if (actualParams.search) queryParts.push(`search=${encodeURIComponent(actualParams.search)}`);
    if (actualParams.date_from) queryParts.push(`date_from=${encodeURIComponent(actualParams.date_from)}`);
    if (actualParams.date_to) queryParts.push(`date_to=${encodeURIComponent(actualParams.date_to)}`);
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const data = await request(`/get-orders.php${queryString}`);
  
  const ordersList = Array.isArray(data) ? data : (data.orders || []);
  
  if (actualParams) {
    return {
      ...data,
      orders: ordersList
    };
  }
  return ordersList;
}

export async function getVendors(params?: {
  page?: number;
  limit?: number;
  approved?: string | number;
  status?: string;
  search?: string;
} | any) {
  let actualParams = params;
  if (params && (params.queryKey || params.signal)) {
    actualParams = undefined;
  }

  const queryParts = [];
  if (actualParams) {
    if (actualParams.page !== undefined) queryParts.push(`page=${actualParams.page}`);
    if (actualParams.limit !== undefined) queryParts.push(`limit=${actualParams.limit}`);
    if (actualParams.approved !== undefined && actualParams.approved !== null) queryParts.push(`approved=${encodeURIComponent(actualParams.approved)}`);
    if (actualParams.status) queryParts.push(`status=${encodeURIComponent(actualParams.status)}`);
    if (actualParams.search) queryParts.push(`search=${encodeURIComponent(actualParams.search)}`);
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const data = await request(`/get-vendors.php${queryString}`);
  
  const vendorsList = Array.isArray(data) ? data : (data.vendors || []);
  
  if (actualParams) {
    return {
      ...data,
      vendors: vendorsList
    };
  }
  return vendorsList;
}

export async function getPendingVendors() {
  const data = await getVendors({ limit: 10000, approved: "0", status: "pending" });
  const vendors = Array.isArray(data) ? data : (data.vendors || []);
  return vendors.filter((v: any) => Number(v.approved) === 0 || v.status === "pending");
}

export async function getVendorById(vendorId: number) {
  return await request(`/get-vendor-by-id.php?id=${vendorId}`);
}

export async function getHomeContent() {
  return await request("/get-home-content.php");
}

export async function updateHomeContent(data: {
  slide_number: number;
  left_title: string;
  left_subtext: string;
  left_image: string;
  right_title: string;
  right_subtext: string;
}) {
  return await request("/update-home-content.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/upload-image.php`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (data.success && (data.url || data.image)) {
    return data.url || data.image;
  }
  throw new Error(data.message || "Image upload failed");
}

export async function approveVendor(id: number, status: string) {
  return await request("/approve-vendor.php", {
    method: "POST",
    body: JSON.stringify({ id, status }),
  });
}

export async function haltVendor(vendorId: number, action: "halt" | "unhalt") {
  return await request("/halt-vendor.php", {
    method: "POST",
    body: JSON.stringify({ vendor_id: vendorId, action }),
  });
}

export async function deleteVendor(vendorId: number, force: boolean = false) {
  return await request("/delete-vendor.php", {
    method: "POST",
    body: JSON.stringify({ vendor_id: vendorId, force }),
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
  gst_number?: string;
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

export async function getUser(token: string) {
  return await request("/get-user.php", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateProfile(token: string, fullName: string, phone: string, gst_number?: string) {
  return await request("/update-user.php", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fullName, phone, gst_number }),
  });
}

export async function manageAddress(token: string, action: string, data: any = {}) {
  return await request("/manage-address.php", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...data }),
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

export async function addCategory(name: string, state: string, city: string, town?: string) {
  return await request("/add-category.php", {
    method: "POST",
    body: JSON.stringify({ name, state, city, town }),
  });
}

export async function updateCategory(
  id: number,
  name: string,
  state: string,
  city: string,
  town?: string
) {
  return await request("/update-category.php", {
    method: "POST",
    body: JSON.stringify({
      id,
      name,
      state,
      city,
      town,
    }),
  });
}

export async function deleteCategory(id: number) {
  return await request("/delete-category.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function addSubcategory(categoryId: number, name: string) {
  return await request("/add-subcategory.php", {
    method: "POST",
    body: JSON.stringify({ category_id: categoryId, name }),
  });
}

export async function updateSubcategory(id: number, name: string) {
  return await request("/update-subcategory.php", {
    method: "POST",
    body: JSON.stringify({ id, name }),
  });
}

export async function deleteSubcategory(id: number) {
  return await request("/delete-subcategory.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function addSubSubcategory(subcategoryId: number, name: string) {
  return await request("/add-sub-subcategory.php", {
    method: "POST",
    body: JSON.stringify({ subcategory_id: subcategoryId, name }),
  });
}

export async function updateSubSubcategory(id: number, name: string) {
  return await request("/update-sub-subcategory.php", {
    method: "POST",
    body: JSON.stringify({ id, name }),
  });
}

export async function deleteSubSubcategory(id: number) {
  return await request("/delete-sub-subcategory.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

/* ================= LOCATIONS ================= */

export async function getLocations() {
  return await request("/get-locations.php");
}

/* ================= COMPANIES ================= */

export async function getCompanies(): Promise<string[]> {
  try {
    const res = await request("/get-companies.php");
    if (Array.isArray(res)) return res;
    return ["ABC Electronics", "Tech World", "Smart Gadgets Pvt Ltd"];
  } catch (err) {
    console.warn("Using mock company data because backend endpoint is not deployed yet:", err);
    return ["ABC Electronics", "Tech World", "Smart Gadgets Pvt Ltd"];
  }
}

export async function addLocation(state: string, city: string, town: string) {
  return await request("/add-location.php", {
    method: "POST",
    body: JSON.stringify({ state, city, town }),
  });
}

export async function deleteLocation(id: number) {
  return await request("/delete-location.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function deleteOrder(id: number) {
  return await request("/delete-order.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

/* ================= USERS ================= */

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
}) {
  const queryParts = [];
  if (params) {
    if (params.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
    if (params.sortOrder) queryParts.push(`sortOrder=${encodeURIComponent(params.sortOrder)}`);
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  return await request(`/get-users.php${queryString}`);
}

export async function deleteUser(id: number) {
  return await request("/delete-user.php", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}


/* ================= VENDOR SUPPORT ================= */

export async function createSupportRequest(data: {
  vendor_id: number;
  request_type: string;
  order_id?: string;
  current_delivery_date?: string;
  requested_delivery_date?: string;
  subject?: string;
  message?: string;
  metadata?: any;
}) {
  return await request("/create-support-request.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSupportRequests(params?: {
  vendor_id?: number;
  status?: string;
  request_type?: string;
}) {
  const queryParts = [];
  if (params) {
    if (params.vendor_id !== undefined) queryParts.push(`vendor_id=${params.vendor_id}`);
    if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params.request_type) queryParts.push(`request_type=${encodeURIComponent(params.request_type)}`);
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  return await request(`/get-support-requests.php${queryString}`);
}

export async function handleSupportRequest(data: {
  request_id: number;
  action: "approve" | "reject";
  admin_note?: string;
}) {
  return await request("/handle-support-request.php", {
    method: "POST",
    body: JSON.stringify(data),
  });
}



