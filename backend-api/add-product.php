<?php
// add-product.php — Add a new product (vendor or admin)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && isset($data->price)) {
    try {
        $name = trim($data->name);
        $category = trim($data->category ?? "");
        $subcategory_id = !empty($data->subcategory_id) ? intval($data->subcategory_id) : null;
        $image = trim($data->image ?? "");
        $price = floatval($data->price);
        $original_price = isset($data->original_price) ? floatval($data->original_price) : $price;
        $discount = isset($data->discount) ? intval($data->discount) : 0;
        $description = trim($data->description ?? "");
        $stock_quantity = isset($data->stock_quantity) ? intval($data->stock_quantity) : 0;
        
        $vendor_id = !empty($data->vendorId) ? intval($data->vendorId) : (!empty($data->vendor_id) ? intval($data->vendor_id) : null);
        $created_by_type = trim($data->created_by_type ?? "vendor");
        $created_by_id = isset($data->created_by_id) ? intval($data->created_by_id) : $vendor_id;
        
        $approved = isset($data->approved) ? intval($data->approved) : 0;
        $status = trim($data->status ?? "pending");

        $query = "INSERT INTO products 
            (name, description, price, original_price, discount, image, category, subcategory_id, vendor_id, created_by_type, created_by_id, approved, status, stock_quantity) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
        $stmt = $conn->prepare($query);
        $stmt->bind_param(
            "ssddissiiisiis", 
            $name, 
            $description, 
            $price, 
            $original_price, 
            $discount, 
            $image, 
            $category, 
            $subcategory_id, 
            $vendor_id, 
            $created_by_type, 
            $created_by_id, 
            $approved, 
            $status, 
            $stock_quantity
        );
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Product added successfully.",
                "id" => $stmt->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to add product: " . $stmt->error
            ]);
        }
        $stmt->close();
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
        "message" => "Incomplete details. Product name and price are required."
    ]);
}
$conn->close();
?>
