<?php
// get-products.php — Fetch all products joined with vendor location metadata
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

try {
    // Select products fields and LEFT JOIN on vendors to extract vendor state, city, and town.
    // Gracefully handles fallbacks for products uploaded directly by admin (no vendor_id, created_by_type='admin').
    // Computes average rating and reviews count dynamically from reviews table.
    $query = "SELECT 
        p.*, 
        v.vendor_name AS vendor_name,
        v.company_name AS vendor_company, 
        v.state AS vendor_state, 
        v.city AS vendor_city, 
        v.town AS vendor_town,
        sb.name AS subcategory_name,
        ssb.name AS sub_subcategory_name,
        COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0) AS average_rating,
        COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id), 0) AS total_reviews
        FROM products p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN subcategories sb ON p.subcategory_id = sb.id
        LEFT JOIN sub_subcategories ssb ON p.sub_subcategory_id = ssb.id
        ORDER BY p.id DESC";
        
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = [
            "id" => (int)$row['id'],
            "name" => $row['name'],
            "description" => $row['description'],
            "price" => (float)$row['price'],
            "original_price" => (float)($row['original_price'] ?? $row['price']),
            "discount" => (int)($row['discount'] ?? 0),
            "image" => $row['image'],
            "category" => $row['category'],
            "subcategory" => $row['subcategory_name'] ?? "",
            "subcategory_id" => $row['subcategory_id'] ? (int)$row['subcategory_id'] : null,
            "sub_subcategory" => $row['sub_subcategory_name'] ?? "",
            "sub_subcategory_id" => $row['sub_subcategory_id'] ? (int)$row['sub_subcategory_id'] : null,
            "vendor_id" => $row['vendor_id'] ? (int)$row['vendor_id'] : null,
            "created_by_type" => $row['created_by_type'],
            "created_by_id" => isset($row['created_by_id']) ? (int)$row['created_by_id'] : null,
            "stock_quantity" => isset($row['stock_quantity']) ? (int)$row['stock_quantity'] : 0,
            "average_rating" => isset($row['average_rating']) ? (float)$row['average_rating'] : 0.0,
            "total_reviews" => isset($row['total_reviews']) ? (int)$row['total_reviews'] : 0,
            "approved" => (int)($row['approved'] ?? 0),
            "status" => $row['status'] ?? ($row['approved'] ? "approved" : "pending"),
            "vendor_name" => $row['vendor_name'] ?? null,
            "vendor_company" => $row['vendor_company'] ?? "Egnaro Hub",
            "vendor_state" => $row['vendor_state'] ?? "Tamil Nadu",
            "vendor_city" => $row['vendor_city'] ?? "Erode",
            "vendor_town" => $row['vendor_town'] ?? "Perundurai",
            "gst_percentage" => isset($row['gst_percentage']) ? (float)$row['gst_percentage'] : 0.00,
            "hsn_code" => $row['hsn_code'] ?? null,
            "created_at" => $row['created_at']
        ];
    }
    
    echo json_encode($products);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
