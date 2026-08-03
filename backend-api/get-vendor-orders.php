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
$sql = "SELECT id, order_id, user_id, customer_name, phone, email, address, items, total, payment_method, status, estimated_days, created_at, tracking_number, courier_partner, buyer_gst FROM orders $where ORDER BY created_at DESC LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;
$types .= "ii";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$orders = [];
while ($row = $result->fetch_assoc()) {
    // Cast numeric fields
    $row['id'] = intval($row['id']);
    $row['total'] = floatval($row['total']);

    // Fetch from order_items table first. Fallback to items JSON.
    $row['items'] = getOrderItemsFromRelationalTable($conn, $row['id']) ?: (json_decode($row['items'], true) ?? []);
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

// ── HELPER: retrieve items from relational order_items table as primary ──
function getOrderItemsFromRelationalTable($conn, $order_id) {
    $stmt = $conn->prepare("SELECT id, product_id, vendor_id, product_name AS name, price, quantity, gst_percentage, hsn_code, taxable_value, cgst_amount, sgst_amount, igst_amount FROM order_items WHERE order_id = ?");
    if (!$stmt) return null;
    
    $stmt->bind_param("i", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = intval($row['id']);
        $row['product_id'] = intval($row['product_id']);
        $row['vendor_id'] = $row['vendor_id'] ? intval($row['vendor_id']) : null;
        $row['price'] = floatval($row['price']);
        $row['quantity'] = intval($row['quantity']);
        $row['gst_percentage'] = floatval($row['gst_percentage'] ?? 0);
        $row['taxable_value'] = floatval($row['taxable_value'] ?? 0);
        $row['cgst_amount'] = floatval($row['cgst_amount'] ?? 0);
        $row['sgst_amount'] = floatval($row['sgst_amount'] ?? 0);
        $row['igst_amount'] = floatval($row['igst_amount'] ?? 0);
        $items[] = $row;
    }
    $stmt->close();
    
    if (empty($items)) {
        return null;
    }
    
    // Enrich each item with product image and vendor details
    foreach ($items as &$item) {
        $pid = $item['product_id'];
        $stmt_p = $conn->prepare("SELECT p.image, p.vendor_id, v.vendor_name, v.company_name, v.gst, v.phone as seller_phone, v.email as seller_email, v.address as seller_address, v.city as seller_city, v.state as seller_state, v.town as seller_town FROM products p LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = ? LIMIT 1");
        if ($stmt_p) {
            $stmt_p->bind_param("i", $pid);
            $stmt_p->execute();
            $row_p = $stmt_p->get_result()->fetch_assoc();
            if ($row_p) {
                $item['image'] = $row_p['image'] ?? '';
                if (empty($item['vendor_id'])) $item['vendor_id'] = $row_p['vendor_id'] ? intval($row_p['vendor_id']) : null;
                $item['seller_name'] = $row_p['vendor_name'] ?: "Egnaro Mart";
                $item['company_name'] = $row_p['company_name'] ?: "Egnaro Mart Marketplace";
                $item['gst'] = $row_p['gst'] ?: null;
                $item['seller_phone'] = $row_p['seller_phone'] ?: "+91 9442581506";
                $item['seller_email'] = $row_p['seller_email'] ?: "egnaromart@gmail.com";
                $seller_addr_parts = array_filter([$row_p['seller_address'], $row_p['seller_town'], $row_p['seller_city'], $row_p['seller_state']]);
                $item['seller_address'] = !empty($seller_addr_parts) ? implode(", ", $seller_addr_parts) : "2A, Venkatesh Nagar, Kovilpalayam, Coimbatore, Tamil Nadu - 641107";
            }
            $stmt_p->close();
        }
    }
    return $items;
}
?>
