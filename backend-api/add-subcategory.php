<?php
// add-subcategory.php — Create a new subcategory
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->category_id) && !empty($data->name)) {
    try {
        $category_id = intval($data->category_id);
        $name = trim($data->name);

        // Check if subcategory already exists under this category
        $check = "SELECT id FROM subcategories WHERE category_id = ? AND name = ? LIMIT 1";
        $check_stmt = $conn->prepare($check);
        $check_stmt->bind_param("is", $category_id, $name);
        $check_stmt->execute();
        if ($check_stmt->get_result()->num_rows > 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Subcategory already exists under this category."]);
            exit;
        }

        $query = "INSERT INTO subcategories (category_id, name) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("is", $category_id, $name);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Subcategory added successfully.",
                "id" => $stmt->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to add subcategory."]);
        }
        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete details. category_id and name are required."]);
}
$conn->close();
?>
