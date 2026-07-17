<?php
// get-vendor-orders.php — Fetch paginated and searched orders for a particular vendor
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";

$vendor_id = intval($_GET['vendor_id'] ?? 0);
if (empty($vendor_id)) {
    echo json_encode(["success" => false, "message" => "Vendor ID required"]);
    exit;
}

// Optional filters & search
$status_filter = trim($_GET['status'] ?? ''); // e.g. ?status=Processing
$search_filter = trim($_GET['search'] ?? ''); // e.g. ?search=productName or customerName

$page = max(1, intval($_GET['page'] ?? 1));
$limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

// --- Build WHERE clause ---
$where = "WHERE vendor_id = ?";
$params = [$vendor_id];
$types = "i";

if ($status_filter !== '') {
    $where .= " AND status = ?";
    $params[] = $status_filter;
    $types .= "s";
}

if ($search_filter !== '') {
    // Searches order ID, customer name, phone, or any product name inside the JSON items array
    $where .= " AND (order_id LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR items LIKE ?)";
    $like_val = "%" . $search_filter . "%";
    $params[] = $like_val;
    $params[] = $like_val;
    $params[] = $like_val;
    $params[] = $like_val;
    $types .= "ssss";
}

// --- Total count for pagination ---
$count_sql = "SELECT COUNT(*) AS total FROM orders $where";
$count_stmt = $conn->prepare($count_sql);
$count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total_rows = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

// --- Fetch paginated orders ---
$sql = "SELECT id, order_id, user_id, customer_name, phone, email, address, items, total, payment_method, status, estimated_days, created_at, tracking_number, courier_partner FROM orders $where ORDER BY created_at DESC LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;
$types .= "ii";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$orders = [];
while ($row = $result->fetch_assoc()) {
    // Decode items JSON array
    $row['items'] = json_decode($row['items'], true) ?? [];
    
    // Cast numeric fields
    $row['id'] = intval($row['id']);
    $row['total'] = floatval($row['total']);
    $orders[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "vendor_id" => $vendor_id,
    "page" => $page,
    "limit" => $limit,
    "total_rows" => intval($total_rows),
    "total_pages" => ceil($total_rows / $limit),
    "orders" => $orders
]);
?>
