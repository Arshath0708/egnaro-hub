<?php
// update-category.php — Update a category (optional regional scope)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->name)) {
    try {
        $id = intval($data->id);
        $name = trim($data->name);
        // Location parameters are 100% optional now
        $state = (!empty($data->state) && trim($data->state) !== "all") ? trim($data->state) : null;
        $city = (!empty($data->city) && trim($data->city) !== "all") ? trim($data->city) : null;
        $town = (!empty($data->town) && trim($data->town) !== "all") ? trim($data->town) : null;
        
        // Prevent duplicate category names under the SAME region (excluding the current category being updated)
        if ($state === null) {
            $check_query = "SELECT id FROM categories WHERE name = ? AND state IS NULL AND id != ? LIMIT 1";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param("si", $name, $id);
        } else {
            $check_query = "SELECT id FROM categories WHERE name = ? AND state = ? AND city = ? AND (town = ? OR (town IS NULL AND ? IS NULL)) AND id != ? LIMIT 1";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param("sssssi", $name, $state, $city, $town, $town, $id);
        }
        
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows > 0) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "This category name already exists for the selected regional scope."
            ]);
            exit;
        }

        $query = "UPDATE categories SET name = ?, state = ?, city = ?, town = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ssssi", $name, $state, $city, $town, $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Category updated successfully."
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to update category."
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
        "message" => "Incomplete data. Category ID and Name are required."
    ]);
}
?>
