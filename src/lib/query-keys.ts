export const QUERY_KEYS = {
  // Storefront & General Catalog
  PRODUCTS: "products",
  CATEGORIES: "categories",
  LOCATIONS: "locations",
  PRODUCT: "product",
  REVIEWS: "reviews",
  HOME_CONTENT: "home-content",

  // Customer Account
  USER_PROFILE: "user-profile",
  USER_ORDERS: "user-orders",
  TRACK_ORDER: "track-order",

  // Admin Dashboard
  ADMIN_PRODUCTS: "admin-products",
  ADMIN_ORDERS: "admin-orders",
  ADMIN_VENDORS: "admin-vendors",
  ADMIN_USERS: "admin-users",
  ADMIN_STATS: "admin-stats",
  ADMIN_CATEGORIES: "admin-categories",
  PENDING_VENDORS: "pending-vendors",
  PENDING_PRODUCTS: "pending-products",
  ADMIN_SUPPORT_REQUESTS: "admin-support-requests",
  VENDOR_RESET_REQUESTS: "vendor-reset-requests",
  PENDING_BANK_REQUESTS: "pending-bank-requests",

  // Vendor Dashboard
  VENDOR_PRODUCTS_ALL: "vendor-products-all",
  VENDOR_PRODUCTS_PAGINATED: "vendor-products-paginated",
  VENDOR_STATS: "vendor-stats",
  VENDOR_ORDERS: "vendor-orders",
  VENDOR_SUPPORT_REQUESTS: "vendor-support-requests",
  VENDOR_SHIPMENTS: "vendor-shipments",
  ADMIN_SHIPMENTS: "admin-shipments",
  PICKUP_LOCATIONS: "pickup-locations",
} as const;

// Key builders for queries with dynamic arguments to guarantee structure consistency
export const queryKeys = {
  // Catalog
  products: () => [QUERY_KEYS.PRODUCTS] as const,
  categories: () => [QUERY_KEYS.CATEGORIES] as const,
  locations: () => [QUERY_KEYS.LOCATIONS] as const,
  product: (id: string | number) => [QUERY_KEYS.PRODUCT, String(id)] as const,
  reviews: (id: string | number) => [QUERY_KEYS.REVIEWS, String(id)] as const,
  homeContent: () => [QUERY_KEYS.HOME_CONTENT] as const,

  // User
  userProfile: (token: string) => [QUERY_KEYS.USER_PROFILE, token] as const,
  userOrders: (token: string, page?: number) => {
    if (page !== undefined) {
      return [QUERY_KEYS.USER_ORDERS, token, page] as const;
    }
    return [QUERY_KEYS.USER_ORDERS, token] as const;
  },
  trackOrder: (orderId: string, token?: string) => [QUERY_KEYS.TRACK_ORDER, orderId, token || ""] as const,

  // Admin
  adminProducts: (page: number, category: string, search: string) => 
    [QUERY_KEYS.ADMIN_PRODUCTS, page, category, search] as const,
  adminOrders: (page: number, status: string, search: string, dateFrom?: string, dateTo?: string) => 
    [QUERY_KEYS.ADMIN_ORDERS, page, status, search, dateFrom || "", dateTo || ""] as const,
  adminVendors: (page: number, search: string) => 
    [QUERY_KEYS.ADMIN_VENDORS, page, search] as const,
  adminUsers: (page: number, search: string, status: string, sortBy: string, sortOrder: string) => 
    [QUERY_KEYS.ADMIN_USERS, page, search, status, sortBy, sortOrder] as const,
  adminStats: () => [QUERY_KEYS.ADMIN_STATS] as const,
  adminCategories: () => [QUERY_KEYS.ADMIN_CATEGORIES] as const,
  pendingVendors: () => [QUERY_KEYS.PENDING_VENDORS] as const,
  pendingProducts: () => [QUERY_KEYS.PENDING_PRODUCTS] as const,
  adminSupportRequests: () => [QUERY_KEYS.ADMIN_SUPPORT_REQUESTS] as const,
  vendorResetRequests: () => [QUERY_KEYS.VENDOR_RESET_REQUESTS] as const,
  pendingBankRequests: () => [QUERY_KEYS.PENDING_BANK_REQUESTS] as const,

  // Vendor
  vendorProductsAll: (vendorId: string | number) => [QUERY_KEYS.VENDOR_PRODUCTS_ALL, String(vendorId)] as const,
  vendorProductsPaginated: (vendorId: string | number, page: number, search: string, status: string, category: string) => 
    [QUERY_KEYS.VENDOR_PRODUCTS_PAGINATED, String(vendorId), page, search, status, category] as const,
  vendorStats: (vendorId: string | number) => [QUERY_KEYS.VENDOR_STATS, String(vendorId)] as const,
  vendorOrders: (vendorId: string | number, page: number, status: string, search: string) => 
    [QUERY_KEYS.VENDOR_ORDERS, String(vendorId), page, status, search] as const,
  vendorSupportRequests: (vendorId: string | number) => [QUERY_KEYS.VENDOR_SUPPORT_REQUESTS, String(vendorId)] as const,
  vendorShipments: (vendorId: string | number, page: number, status: string, search: string) => 
    [QUERY_KEYS.VENDOR_SHIPMENTS, String(vendorId), page, status, search] as const,
  adminShipments: (page: number, status: string, vendorId: string | number, search: string) => 
    [QUERY_KEYS.ADMIN_SHIPMENTS, page, status, String(vendorId), search] as const,
  pickupLocations: (vendorId?: string | number) => [QUERY_KEYS.PICKUP_LOCATIONS, vendorId ? String(vendorId) : "admin"] as const,
};
