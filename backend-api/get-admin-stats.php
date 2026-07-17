<?php
// get-admin-stats.php — High-fidelity marketplace revenue and performance metrics
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";

// Centralized Commission Configuration (10% platform commission fee)
$commission_pct = 10.0;

// 1. Total vendors (all registered)
$r = $conn->query("SELECT COUNT(*) as total FROM vendors");
$total_vendors = $r ? intval($r->fetch_assoc()['total']) : 0;

// 2. Active vendors (approved)
$r = $conn->query("SELECT COUNT(*) as total FROM vendors WHERE status = 'active'");
$active_vendors = $r ? intval($r->fetch_assoc()['total']) : 0;

// 3. Pending vendors (waiting for approval)
$r = $conn->query("SELECT COUNT(*) as total FROM vendors WHERE status = 'pending'");
$pending_vendors = $r ? intval($r->fetch_assoc()['total']) : 0;

// 4. Total orders
$r = $conn->query("SELECT COUNT(*) as total FROM orders");
$total_orders = $r ? intval($r->fetch_assoc()['total']) : 0;

// 5. Total products (all)
$r = $conn->query("SELECT COUNT(*) as total FROM products");
$total_products = $r ? intval($r->fetch_assoc()['total']) : 0;

// 6. Products created by vendors
$r = $conn->query("SELECT COUNT(*) as total FROM products WHERE created_by_type = 'vendor'");
$vendor_products = $r ? intval($r->fetch_assoc()['total']) : 0;

// 7. Products created by admin
$r = $conn->query("SELECT COUNT(*) as total FROM products WHERE created_by_type = 'admin'");
$admin_products = $r ? intval($r->fetch_assoc()['total']) : 0;

// 8. Approved products
$r = $conn->query("SELECT COUNT(*) as total FROM products WHERE approved = 1 AND status = 'approved'");
$approved_products = $r ? intval($r->fetch_assoc()['total']) : 0;

// 9. Pending products (waiting for approval)
$r = $conn->query("SELECT COUNT(*) as total FROM products WHERE approved = 0 AND status = 'pending'");
$pending_products = $r ? intval($r->fetch_assoc()['total']) : 0;

// 10. Orders by status breakdown
$r = $conn->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
$order_status = [];
if ($r) {
    while ($row = $r->fetch_assoc()) {
        $order_status[$row['status']] = intval($row['count']);
    }
}

// 11. Fetch non-cancelled orders to attribute item-level earnings
$query = "
    SELECT 
        COALESCE(oi.vendor_id, 0) AS vendor_id, 
        SUM(oi.price * oi.quantity) AS item_total
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'Cancelled'
    GROUP BY COALESCE(oi.vendor_id, 0)
";
$order_res = $conn->query($query);

$gmv = 0.0;                  // Gross Marketplace Value (Overall GMV)
$platform_revenue = 0.0;     // Admin Earning (Admin Products + 10% commission on vendor products)
$vendor_revenue = 0.0;       // Vendor Earning (90% of vendor products)
$admin_owned_revenue = 0.0;  // 100% Admin Products
$vendor_commission = 0.0;     // 10% Vendor Commission portion

if ($order_res) {
    while ($row = $order_res->fetch_assoc()) {
        $owner_id = intval($row['vendor_id']);
        $item_total = floatval($row['item_total']);
        
        $gmv += $item_total;
        
        if ($owner_id > 0) {
            // Item belongs to a Vendor
            $comm = $item_total * ($commission_pct / 100.0);
            $vend_earn = $item_total * (1.0 - ($commission_pct / 100.0));
            
            $vendor_commission += $comm;
            $vendor_revenue += $vend_earn;
            $platform_revenue += $comm;
        } else {
            // Item belongs to Admin
            $admin_owned_revenue += $item_total;
            $platform_revenue += $item_total;
        }
    }
}

echo json_encode([
    "success" => true,
    "stats" => [
        "vendors" => [
            "total"   => $total_vendors,
            "active"  => $active_vendors,
            "pending" => $pending_vendors
        ],
        "orders" => [
            "total"     => $total_orders,
            "by_status" => $order_status,
            "revenue"   => [
                "overall" => round($gmv, 2),
                "vendor"  => round($vendor_revenue, 2),
                "admin"   => round($platform_revenue, 2),
                "details" => [
                    "marketplace_gmv"     => round($gmv, 2),
                    "platform_revenue"    => round($platform_revenue, 2),
                    "vendors_earning"     => round($vendor_revenue, 2),
                    "admin_owned_sales"   => round($admin_owned_revenue, 2),
                    "vendors_commission"  => round($vendor_commission, 2)
                ]
            ]
        ],
        "products" => [
            "total"            => $total_products,
            "by_vendor"        => $vendor_products,
            "by_admin"         => $admin_products,
            "approved"         => $approved_products,
            "pending_approval" => $pending_products
        ]
    ]
]);

$conn->close();
?>
