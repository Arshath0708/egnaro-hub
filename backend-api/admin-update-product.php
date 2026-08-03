<?php
// admin-update-product.php — Admin Update product details
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

$product_id = !empty($data->product_id) ? intval($data->product_id) : (!empty($data->id) ? intval($data->id) : 0);

if ($product_id > 0) {
    try {
        $updates = [];
        $params = [];
        $types = "";

        if (isset($data->name)) {
            $updates[] = "name = ?";
            $params[] = trim($data->name);
            $types .= "s";
        }
        if (isset($data->description)) {
            $updates[] = "description = ?";
            $params[] = trim($data->description);
            $types .= "s";
        }
        if (isset($data->price)) {
            $updates[] = "price = ?";
            $params[] = floatval($data->price);
            $types .= "d";
        }
        if (isset($data->original_price)) {
            $updates[] = "original_price = ?";
            $params[] = floatval($data->original_price);
            $types .= "d";
        }
        if (isset($data->discount)) {
            $updates[] = "discount = ?";
            $params[] = intval($data->discount);
            $types .= "i";
        }
        if (isset($data->image)) {
            $updates[] = "image = ?";
            $params[] = trim($data->image);
            $types .= "s";
        }
        if (isset($data->category)) {
            $updates[] = "category = ?";
            $params[] = trim($data->category);
            $types .= "s";
        }
        if (property_exists($data, 'subcategory_id')) {
            $updates[] = "subcategory_id = ?";
            $params[] = !empty($data->subcategory_id) ? intval($data->subcategory_id) : null;
            $types .= "i";
        }
        if (property_exists($data, 'sub_subcategory_id')) {
            $updates[] = "sub_subcategory_id = ?";
            $params[] = !empty($data->sub_subcategory_id) ? intval($data->sub_subcategory_id) : null;
            $types .= "i";
        }
        if (isset($data->stock_quantity)) {
            $updates[] = "stock_quantity = ?";
            $params[] = intval($data->stock_quantity);
            $types .= "i";
        }
        if (isset($data->gst_percentage)) {
            $updates[] = "gst_percentage = ?";
            $params[] = floatval($data->gst_percentage);
            $types .= "d";
        }
        if (property_exists($data, 'hsn_code')) {
            $updates[] = "hsn_code = ?";
            $params[] = !empty($data->hsn_code) ? trim($data->hsn_code) : null;
            $types .= "s";
        }
        if (isset($data->approved)) {
            $updates[] = "approved = ?";
            $params[] = intval($data->approved);
            $types .= "i";
        }
        if (isset($data->status)) {
            $updates[] = "status = ?";
            $params[] = trim($data->status);
            $types .= "s";
        }

        if (empty($updates)) {
            echo json_encode(["success" => true, "message" => "No changes detected."]);
            exit;
        }

        $query = "UPDATE products SET " . implode(", ", $updates) . " WHERE id = ?";
        $params[] = $product_id;
        $types .= "i";

        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Product updated successfully by Admin."
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to update product: " . $stmt->error
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
        "message" => "Product ID is required."
    ]);
}
$conn->close();
?>
