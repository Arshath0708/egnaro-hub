<?php
// delete-sub-subcategory.php — Delete sub-subcategory
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $id = intval($data->id);

        $query = "DELETE FROM sub_subcategories WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Sub-subcategory deleted successfully."
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to delete sub-subcategory."]);
        }
        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete details. id is required."]);
}
$conn->close();
?>
