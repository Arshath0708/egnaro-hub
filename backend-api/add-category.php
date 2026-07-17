<?php
// add-category.php — Add a new category (optional regional scope)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name)) {
    try {
        $name = trim($data->name);
        // Location parameters are 100% optional now
        $state = (!empty($data->state) && trim($data->state) !== "all") ? trim($data->state) : null;
        $city = (!empty($data->city) && trim($data->city) !== "all") ? trim($data->city) : null;
        $town = (!empty($data->town) && trim($data->town) !== "all") ? trim($data->town) : null;
        
        // Prevent duplicate category names under the SAME region (or global)
        if ($state === null) {
            $check_query = "SELECT id FROM categories WHERE name = ? AND state IS NULL LIMIT 1";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param("s", $name);
        } else {
            // Check matching regional constraints
            $check_query = "SELECT id FROM categories WHERE name = ? AND state = ? AND city = ? AND (town = ? OR (town IS NULL AND ? IS NULL)) LIMIT 1";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param("sssss", $name, $state, $city, $town, $town);
        }
        
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows > 0) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "This category already exists for the selected regional scope."
            ]);
            exit;
        }

        $query = "INSERT INTO categories (name, state, city, town) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ssss", $name, $state, $city, $town);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Category added successfully."
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to add category."
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
        "message" => "Incomplete data. Category Name is required."
    ]);
}
?>
