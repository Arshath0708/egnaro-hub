<?php
// get-vendor-stats.php — Premium multi-vendor item-level attribution stats
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

$vendor_id = intval($_GET['vendor_id'] ?? 0);

if (empty($vendor_id)) {
    echo json_encode(["success" => false, "message" => "Vendor ID required"]);
    exit;
}

// 1. Fetch gross revenue and order count via relational query
$vendor_gross = 0.0;
$total_orders = 0;

try {
    $stmt = $conn->prepare("
        SELECT 
            COALESCE(SUM(oi.price * oi.quantity), 0.0) AS gross_revenue, 
            COUNT(DISTINCT oi.order_id) AS total_orders
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = ? AND o.status != 'Cancelled' AND o.status != 'Pending Payment'
    ");
    $stmt->bind_param("i", $vendor_id);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $vendor_gross = floatval($stats['gross_revenue']);
    $total_orders = intval($stats['total_orders']);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to aggregate statistics: " . $e->getMessage()]);
    exit;
}

$vendor_commission = $vendor_gross * ($commission_pct / 100.0);
$vendor_net = $vendor_gross * (1.0 - ($commission_pct / 100.0));

echo json_encode([
    "success"       => true,
    "gross_revenue" => round($vendor_gross, 2),
    "net_revenue"   => round($vendor_net, 2),
    "commission"    => round($vendor_commission, 2),
    "total_orders"  => $total_orders
]);

$conn->close();
?>
