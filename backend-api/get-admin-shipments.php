<?php
// get-admin-shipments.php — Fetch paginated, searched shipments for admins
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";

$status_filter = trim($_GET['status'] ?? '');
$vendor_filter = isset($_GET['vendor_id']) && $_GET['vendor_id'] !== '' ? intval($_GET['vendor_id']) : null;
$search_filter = trim($_GET['search'] ?? '');
$page = max(1, intval($_GET['page'] ?? 1));
$limit = max(1, min(100, intval($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

// --- Build Query Filters ---
$where = "WHERE 1=1";
$params = [];
$types = "";

if ($status_filter !== '') {
    $where .= " AND s.status = ?";
    $params[] = $status_filter;
    $types .= "s";
}

if ($vendor_filter !== null) {
    $where .= " AND s.vendor_id = ?";
    $params[] = $vendor_filter;
    $types .= "i";
}

if ($search_filter !== '') {
    $where .= " AND (s.shipment_id LIKE ? OR o.order_id LIKE ? OR o.customer_name LIKE ? OR o.phone LIKE ? OR v.company_name LIKE ?)";
    $like = "%" . $search_filter . "%";
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $types .= "sssss";
}

// Join orders and vendors
$join = "FROM shipments s
         JOIN orders o ON s.order_id = o.id
         LEFT JOIN vendors v ON s.vendor_id = v.id";

// --- Count total items for pagination ---
$count_sql = "SELECT COUNT(s.id) AS total $join $where";
$count_stmt = $conn->prepare($count_sql);
if (!empty($types)) {
    $count_stmt->bind_param($types, ...$params);
}
$count_stmt->execute();
$total_rows = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

// --- Fetch shipments ---
$sql = "SELECT s.id, s.shipment_id, s.order_id, s.status, s.weight_g, s.length_cm, s.width_cm, s.height_cm,
               s.awb_code, s.courier_name, s.label_url, s.manifest_url, s.created_at, s.vendor_id,
               o.order_id AS parent_order_id, o.customer_name, o.phone, o.email, o.address AS delivery_address, o.payment_method,
               v.vendor_name, v.company_name
        $join 
        $where 
        ORDER BY s.created_at DESC 
        LIMIT ? OFFSET ?";

$params[] = $limit;
$params[] = $offset;
$types .= "ii";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$shipments = [];
while ($row = $result->fetch_assoc()) {
    $shipment_db_id = intval($row['id']);
    
    // Fetch packed items for this shipment package
    $sql_items = "SELECT oi.product_id, oi.price, oi.quantity, p.name, p.image 
                  FROM shipment_items si
                  JOIN order_items oi ON si.order_item_id = oi.id
                  JOIN products p ON oi.product_id = p.id
                  WHERE si.shipment_id = ?";
    $stmt_items = $conn->prepare($sql_items);
    $stmt_items->bind_param("i", $shipment_db_id);
    $stmt_items->execute();
    $items_res = $stmt_items->get_result();
    
    $row_items = [];
    while ($it = $items_res->fetch_assoc()) {
        $it['product_id'] = intval($it['product_id']);
        $it['price'] = floatval($it['price']);
        $it['quantity'] = intval($it['quantity']);
        $row_items[] = $it;
    }
    $stmt_items->close();
    
    // Fetch tracking checkpoints
    $sql_tracks = "SELECT activity, location, status, checkpoint_time FROM shipment_tracking_checkpoints WHERE shipment_id = ? ORDER BY checkpoint_time DESC";
    $stmt_tracks = $conn->prepare($sql_tracks);
    $stmt_tracks->bind_param("i", $shipment_db_id);
    $stmt_tracks->execute();
    $tracks_res = $stmt_tracks->get_result();
    
    $checkpoints = [];
    while ($chk = $tracks_res->fetch_assoc()) {
        $checkpoints[] = $chk;
    }
    $stmt_tracks->close();
    
    $row['id'] = $shipment_db_id;
    $row['weight_g'] = intval($row['weight_g']);
    $row['length_cm'] = intval($row['length_cm']);
    $row['width_cm'] = intval($row['width_cm']);
    $row['height_cm'] = intval($row['height_cm']);
    $row['items'] = $row_items;
    $row['history'] = $checkpoints;
    $row['vendor_name'] = $row['vendor_name'] ?? 'Admin';
    $row['company_name'] = $row['company_name'] ?? 'Egnaromart Main';
    
    $shipments[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "page" => $page,
    "limit" => $limit,
    "total_rows" => intval($total_rows),
    "total_pages" => ceil($total_rows / $limit),
    "shipments" => $shipments
]);
?>
