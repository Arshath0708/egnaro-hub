<?php
// update-vendor-gst.php — Update vendor GST number with production-grade validation
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$vendor_id = isset($data['vendor_id']) ? (int)$data['vendor_id'] : 0;
$gst       = isset($data['gst']) ? strtoupper(trim($data['gst'])) : '';

if ($vendor_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Valid Vendor ID is required."]);
    exit;
}

if (empty($gst)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "GSTIN is mandatory."]);
    exit;
}

if (strlen($gst) !== 15) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "GSTIN must contain exactly 15 characters."]);
    exit;
}

if (!preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/', $gst)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid GSTIN format. Please enter a valid GST number."]);
    exit;
}

try {
    // Verify vendor exists
    $check_stmt = $conn->prepare("SELECT id FROM vendors WHERE id = ? LIMIT 1");
    $check_stmt->bind_param("i", $vendor_id);
    $check_stmt->execute();
    if ($check_stmt->get_result()->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Vendor not found."]);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();

    // Update vendor GST (already uppercased and trimmed)
    $stmt = $conn->prepare("UPDATE vendors SET gst = ? WHERE id = ?");
    $stmt->bind_param("si", $gst, $vendor_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "GSTIN updated successfully."
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to update GSTIN."
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

$conn->close();
?>
