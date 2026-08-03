<?php
// add-sub-subcategory.php — Create a new sub-subcategory
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->subcategory_id) && !empty($data->name)) {
    try {
        $subcategory_id = intval($data->subcategory_id);
        $name = trim($data->name);

        // Check if sub-subcategory already exists under this subcategory
        $check = "SELECT id FROM sub_subcategories WHERE subcategory_id = ? AND name = ? LIMIT 1";
        $check_stmt = $conn->prepare($check);
        $check_stmt->bind_param("is", $subcategory_id, $name);
        $check_stmt->execute();
        if ($check_stmt->get_result()->num_rows > 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Sub-subcategory already exists under this subcategory."]);
            exit;
        }

        $query = "INSERT INTO sub_subcategories (subcategory_id, name) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("is", $subcategory_id, $name);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Sub-subcategory added successfully.",
                "id" => $stmt->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to add sub-subcategory."]);
        }
        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete details. subcategory_id and name are required."]);
}
$conn->close();
?>
