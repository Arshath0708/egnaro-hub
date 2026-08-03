<?php
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
    echo json_encode(["success" => false, "message" => "Vendor ID is required"]);
    exit;
}

$page   = max(1, intval($_GET['page']  ?? 1));
$limit  = max(1, min(100, intval($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

// Optional filters (using table prefix to prevent column ambiguity)
$status_filter   = trim($_GET['status']   ?? '');   
$category_filter = trim($_GET['category'] ?? '');   
$subcategory_id_filter = intval($_GET['subcategory_id'] ?? 0);
$sub_subcategory_id_filter = intval($_GET['sub_subcategory_id'] ?? 0);
$search          = trim($_GET['search']   ?? '');   

$where  = "WHERE p.vendor_id = ?";
$params = [$vendor_id];
$types  = "i";

if ($status_filter !== '') {
    $where   .= " AND p.status = ?";
    $params[] = $status_filter;
    $types   .= "s";
}

if ($category_filter !== '') {
    $where   .= " AND p.category = ?";
    $params[] = $category_filter;
    $types   .= "s";
}

if ($subcategory_id_filter > 0) {
    $where   .= " AND p.subcategory_id = ?";
    $params[] = $subcategory_id_filter;
    $types   .= "i";
}

if ($sub_subcategory_id_filter > 0) {
    $where   .= " AND p.sub_subcategory_id = ?";
    $params[] = $sub_subcategory_id_filter;
    $types   .= "i";
}

if ($search !== '') {
    $like     = "%$search%";
    $where   .= " AND (p.name LIKE ? OR p.description LIKE ?)";
    $params[] = $like;
    $params[] = $like;
    $types   .= "ss";
}

// Total count (using prefix)
$count_stmt = $conn->prepare("SELECT COUNT(*) AS total FROM products p $where");
$count_stmt->bind_param($types, ...$params);
$count_stmt->execute();
$total_rows = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

// Paginated fetch (joining vendors and computing dynamic rating aggregates)
$params[] = $limit;
$params[] = $offset;
$types   .= "ii";

$stmt = $conn->prepare("
    SELECT 
        p.*,
        v.company_name AS vendor_company,
        sb.name AS subcategory_name,
        ssb.name AS sub_subcategory_name,
        COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0) AS average_rating,
        COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id), 0) AS total_reviews
    FROM products p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN subcategories sb ON p.subcategory_id = sb.id
    LEFT JOIN sub_subcategories ssb ON p.sub_subcategory_id = ssb.id
    $where
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
");
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = [
        "id"             => intval($row['id']),
        "name"           => $row['name'],
        "description"    => $row['description'],
        "price"          => floatval($row['price']),
        "original_price" => floatval($row['original_price'] ?? $row['price']),
        "discount"       => intval($row['discount'] ?? 0),
        "image"          => $row['image'],
        "category"       => $row['category'],
        "subcategory"    => $row['subcategory_name'] ?? "",
        "subcategory_id" => $row['subcategory_id'] ? intval($row['subcategory_id']) : null,
        "sub_subcategory"    => $row['sub_subcategory_name'] ?? "",
        "sub_subcategory_id" => $row['sub_subcategory_id'] ? intval($row['sub_subcategory_id']) : null,
        "stock_quantity" => intval($row['stock_quantity'] ?? 0),
        "average_rating" => floatval($row['average_rating'] ?? 0),
        "total_reviews"  => intval($row['total_reviews'] ?? 0),
        "approved"       => intval($row['approved'] ?? 0),
        "status"         => $row['status'] ?? 'pending',
        "vendor_company" => $row['vendor_company'] ?? 'Egnaro Mart',
        "gst_percentage" => isset($row['gst_percentage']) ? (float)$row['gst_percentage'] : 0.00,
        "hsn_code"       => $row['hsn_code'] ?? null,
        "created_at"     => $row['created_at']
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    "success"     => true,
    "vendor_id"   => $vendor_id,
    "page"        => $page,
    "limit"       => $limit,
    "total_rows"  => intval($total_rows),
    "total_pages" => (int)ceil($total_rows / $limit),
    "has_next"    => $page < ceil($total_rows / $limit),
    "has_prev"    => $page > 1,
    "products"    => $products
]);
?>
