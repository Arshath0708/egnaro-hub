<?php
// get-categories.php — Fetch all categories with optional regional scopes
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

try {
    // Fetch all categories
    $query = "SELECT id, name, state, city, town FROM categories ORDER BY name ASC";
    $result = $conn->query($query);
    
    // Fetch all subcategories to map them to categories
    $sub_query = "SELECT id, category_id, name FROM subcategories ORDER BY name ASC";
    $sub_result = $conn->query($sub_query);
    
    $subcategories = [];
    if ($sub_result) {
        while ($sub_row = $sub_result->fetch_assoc()) {
            $subcategories[] = [
                "id" => intval($sub_row['id']),
                "category_id" => intval($sub_row['category_id']),
                "name" => $sub_row['name']
            ];
        }
    }
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $cat_id = intval($row['id']);
        $cat_subs = [];
        foreach ($subcategories as $sub) {
            if ($sub['category_id'] === $cat_id) {
                $cat_subs[] = [
                    "id" => $sub['id'],
                    "name" => $sub['name']
                ];
            }
        }
        
        $categories[] = [
            "id" => $cat_id,
            "name" => $row['name'],
            "state" => $row['state'] !== null ? $row['state'] : "",
            "city" => $row['city'] !== null ? $row['city'] : "",
            "town" => $row['town'] !== null ? $row['town'] : "",
            "subcategories" => $cat_subs
        ];
    }
    
    http_response_code(200);
    echo json_encode($categories);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
