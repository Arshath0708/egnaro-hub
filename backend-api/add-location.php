<?php
// add-location.php — Add a new cascading location
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

// Retrieve and parse POST request payload
$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->state) &&
    !empty($data->city) &&
    !empty($data->town)
) {
    try {
        $state = trim($data->state);
        $city = trim($data->city);
        $town = trim($data->town);
        
        // Prevent duplicate entries
        $check_query = "SELECT id FROM locations WHERE state = ? AND city = ? AND town = ? LIMIT 1";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bind_param("sss", $state, $city, $town);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows > 0) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "This location link already exists."
            ]);
            exit;
        }

        $query = "INSERT INTO locations (state, city, town) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("sss", $state, $city, $town);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Location added successfully."
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to add location."
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
        "message" => "Incomplete data. State, City, and Town/Area are required."
    ]);
}
?>
