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

$product_id = intval($_GET['product_id'] ?? 0);

if (empty($product_id)) {
    echo json_encode(["success" => false, "message" => "Product ID required"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT 
        p.*,

        -- Creator name
        CASE 
            WHEN p.created_by_type = 'vendor' THEN IFNULL(v.vendor_name, 'Unknown Vendor')
            WHEN p.created_by_type = 'admin'  THEN 'Egnaro Mart'
            ELSE 'Unknown'
        END AS creator_name,
        
        -- Vendor Metadata
        v.company_name AS vendor_company,
        v.state AS vendor_state,
        v.city AS vendor_city,
        
        -- Subcategory Metadata
        sb.name AS subcategory_name,
        
        -- Sub-subcategory Metadata
        ssb.name AS sub_subcategory_name,

        -- Live rating from reviews table
        IFNULL(ROUND(AVG(r.rating), 1), 0) AS average_rating,
        COUNT(r.id) AS total_reviews

    FROM products p

    LEFT JOIN vendors v
        ON p.created_by_type = 'vendor'
        AND p.created_by_id = v.id

    LEFT JOIN subcategories sb
        ON p.subcategory_id = sb.id

    LEFT JOIN sub_subcategories ssb
        ON p.sub_subcategory_id = ssb.id

    LEFT JOIN reviews r
        ON p.id = r.product_id

    WHERE p.id = ?

    GROUP BY
        p.id, v.id, sb.id, ssb.id
    
    LIMIT 1
");

$stmt->bind_param("i", $product_id);
$stmt->execute();
$product = $stmt->get_result()->fetch_assoc();

if (!$product) {
    echo json_encode(["success" => false, "message" => "Product not found"]);
    exit;
}

// Cast types
$product["id"]             = (int)$product["id"];
$product["price"]          = (float)$product["price"];
$product["original_price"] = (float)($product["original_price"] ?? $product["price"]);
$product["discount"]       = (int)($product["discount"] ?? 0);
$product["approved"]       = (int)$product["approved"];
$product["stock_quantity"] = (int)($product["stock_quantity"] ?? 0);
$product["average_rating"] = (float)$product["average_rating"];
$product["total_reviews"]  = (int)$product["total_reviews"];
$product["subcategory"]    = $product["subcategory_name"] ?? "";
$product["subcategory_id"] = $product["subcategory_id"] ? (int)$product["subcategory_id"] : null;
$product["sub_subcategory"]    = $product["sub_subcategory_name"] ?? "";
$product["sub_subcategory_id"] = $product["sub_subcategory_id"] ? (int)$product["sub_subcategory_id"] : null;
$product["gst_percentage"] = isset($product["gst_percentage"]) ? (float)$product["gst_percentage"] : 0.00;
$product["hsn_code"]       = $product["hsn_code"] ?? null;

// Fallbacks for Admin uploads
$product["vendor_company"] = $product["vendor_company"] ?? "Egnaro Mart";
$product["vendor_state"]   = $product["vendor_state"] ?? "Tamil Nadu";
$product["vendor_city"]    = $product["vendor_city"] ?? "Erode";

// Merge success attribute for compatibility
$product["success"] = true;

echo json_encode($product);

$stmt->close();
$conn->close();
?>
