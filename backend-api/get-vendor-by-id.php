<?php
// get-vendor-by-id.php — Get detailed vendor profile and performance stats
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

if (!empty($_GET['id'])) {
    try {
        $id = (int)$_GET['id'];
        
        // Fetch detailed profile fields (now including town)
        $query = "SELECT id, vendor_name, company_name, phone, email, address, state, city, town, status, created_at FROM vendors WHERE id = ? LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $vendor_result = $stmt->get_result();
        
        if ($vendor_result->num_rows > 0) {
            $vendor = $vendor_result->fetch_assoc();
            
            // Fetch associated products performance metrics
            $prod_query = "SELECT COUNT(*) as total, SUM(CASE WHEN status='approved' OR approved=1 THEN 1 ELSE 0 END) as approved FROM products WHERE vendor_id = ?";
            $prod_stmt = $conn->prepare($prod_query);
            $prod_stmt->bind_param("i", $id);
            $prod_stmt->execute();
            $prod_stats = $prod_stmt->get_result()->fetch_assoc();
            
            // Fetch associated orders performance metrics
            $order_query = "SELECT COUNT(*) as total, IFNULL(SUM(total), 0) as total_revenue FROM orders WHERE vendor_id = ?";
            $order_stmt = $conn->prepare($order_query);
            $order_stmt->bind_param("i", $id);
            $order_stmt->execute();
            $order_stats = $order_stmt->get_result()->fetch_assoc();
            
            echo json_encode([
                "success" => true,
                "vendor" => [
                    "details" => [
                        "id" => (int)$vendor['id'],
                        "vendor_name" => $vendor['vendor_name'],
                        "company_name" => $vendor['company_name'],
                        "phone" => $vendor['phone'],
                        "email" => $vendor['email'],
                        "address" => $vendor['address'],
                        "state" => $vendor['state'],
                        "city" => $vendor['city'],
                        "town" => $vendor['town'], // Return town parameter
                        "status" => $vendor['status'],
                        "created_at" => $vendor['created_at']
                    ],
                    "stats" => [
                        "products" => [
                            "total" => (int)$prod_stats['total'],
                            "approved" => (int)$prod_stats['approved']
                        ],
                        "orders" => [
                            "total" => (int)$order_stats['total'],
                            "total_revenue" => (float)$order_stats['total_revenue']
                        ]
                    ]
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Vendor not found."
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Vendor ID parameter is required."
    ]);
}
?>
