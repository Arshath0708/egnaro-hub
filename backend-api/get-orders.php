<?php
// get-orders.php — Paginated orders with vendor name, search, status & date range filters
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$page   = max(1, intval($_GET['page']  ?? 1));
$limit  = max(1, min(100, intval($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

// --- Filters ---
$status_filter = trim($_GET['status']     ?? '');
$search        = trim($_GET['search']     ?? '');  // order_id, customer_name, phone, vendor name
$date_from     = trim($_GET['date_from']  ?? '');  // YYYY-MM-DD
$date_to       = trim($_GET['date_to']    ?? '');  // YYYY-MM-DD

$where  = "WHERE 1=1";
$params = [];
$types  = "";

if ($status_filter !== '') {
    $where   .= " AND o.status = ?";
    $params[] = $status_filter;
    $types   .= "s";
}

if ($search !== '') {
    $like         = "%$search%";
    $search_lower = strtolower($search);

    // "admin" / "egnaromart" keywords → match orders with no vendor (direct/admin products)
    $is_admin_search = str_contains($search_lower, 'admin') ||
                       str_contains($search_lower, 'egnaro mart') ||
                       str_contains($search_lower, 'direct');

    if ($is_admin_search) {
        $where   .= " AND (
                        o.vendor_id = 0  OR
                        o.vendor_id IS NULL OR
                        o.order_id       LIKE ? OR
                        o.customer_name  LIKE ? OR
                        o.phone          LIKE ? OR
                        o.items          LIKE ?
                      )";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types   .= "ssss";
    } else {
        // Normal search: order fields + vendor name + product name inside items JSON
        $where   .= " AND (
                        o.order_id       LIKE ? OR
                        o.customer_name  LIKE ? OR
                        o.phone          LIKE ? OR
                        v.vendor_name    LIKE ? OR
                        v.company_name   LIKE ? OR
                        o.items          LIKE ?
                      )";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types   .= "ssssss";
    }
}

// date_from: start of that day (00:00:00)
if ($date_from !== '') {
    $where   .= " AND DATE(o.created_at) >= ?";
    $params[] = $date_from;
    $types   .= "s";
}

// date_to: end of that day (23:59:59)
if ($date_to !== '') {
    $where   .= " AND DATE(o.created_at) <= ?";
    $params[] = $date_to;
    $types   .= "s";
}

// Base JOIN — LEFT JOIN vendors so orders without a vendor_id still show up
$from_join = "FROM orders o
              LEFT JOIN vendors v ON o.vendor_id = v.id";

// --- Total count ---
$count_stmt = $conn->prepare("SELECT COUNT(*) AS total $from_join $where");
if ($types) $count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total_rows = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

// --- Paginated fetch ---
$params[] = $limit;
$params[] = $offset;
$types   .= "ii";

$sql = "SELECT 
            o.*,
            v.vendor_name   AS vendor_name,
            v.company_name  AS vendor_company,
            v.phone         AS vendor_phone,
            v.email         AS vendor_email
        $from_join
        $where
        ORDER BY o.id DESC
        LIMIT ? OFFSET ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = [
        // Order core fields
        "id"             => intval($row['id']),
        "order_id"       => $row['order_id'],
        "user_id"        => intval($row['user_id']),
        "customer_name"  => $row['customer_name'],
        "phone"          => $row['phone'],
        "email"          => $row['email'],
        "address"        => $row['address'],
        "items"          => json_decode($row['items'], true) ?? [],
        "total"          => floatval($row['total']),
        "payment_method" => $row['payment_method'],
        "status"         => $row['status'],
        "estimated_days" => $row['estimated_days'],
        "created_at"     => $row['created_at'],
        "tracking_number" => $row['tracking_number'] ?? null,
        "courier_partner" => $row['courier_partner'] ?? null,
        "buyer_gst"       => $row['buyer_gst'] ?? null,

        // Vendor attribution
        "vendor_id"      => $row['vendor_id'] ? intval($row['vendor_id']) : null,
        "vendor_name"    => $row['vendor_name']    ?? null,
        "vendor_company" => $row['vendor_company'] ?? null,
        "vendor_phone"   => $row['vendor_phone']   ?? null,
        "vendor_email"   => $row['vendor_email']   ?? null,
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success"      => true,
    "page"         => $page,
    "limit"        => $limit,
    "total_rows"   => intval($total_rows),
    "total_pages"  => (int)ceil($total_rows / $limit),
    "has_next"     => $page < ceil($total_rows / $limit),
    "has_prev"     => $page > 1,
    "filters"      => [                          // echo back active filters for frontend convenience
        "status"    => $status_filter ?: null,
        "search"    => $search        ?: null,
        "date_from" => $date_from     ?: null,
        "date_to"   => $date_to       ?: null,
    ],
    "orders"       => $orders
]);
?>
