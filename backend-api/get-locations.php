<?php
// get-locations.php — Fetch all registered cascading locations
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Adjust relative path to include the project's central database connector if needed
require_once 'db.php';

try {
    $query = "SELECT id, state, city, town FROM locations ORDER BY state ASC, city ASC, town ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $locations = [];
    while ($row = $result->fetch_assoc()) {
        $locations[] = [
            "id" => (int)$row['id'],
            "state" => $row['state'],
            "city" => $row['city'],
            "town" => $row['town']
        ];
    }
    
    echo json_encode($locations);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>
