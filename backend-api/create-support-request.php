<?php
// create-support-request.php — Submit a structured support request (vendor only)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$vendor_id = intval($data['vendor_id'] ?? 0);
$request_type = trim($data['request_type'] ?? '');
$order_id = isset($data['order_id']) ? trim($data['order_id']) : null;
$current_delivery_date = isset($data['current_delivery_date']) ? trim($data['current_delivery_date']) : null;
$requested_delivery_date = isset($data['requested_delivery_date']) ? trim($data['requested_delivery_date']) : null;
$subject = isset($data['subject']) ? trim($data['subject']) : null;
$message = isset($data['message']) ? trim($data['message']) : null;
$metadata_payload = isset($data['metadata']) ? $data['metadata'] : null;

// Validation
if ($vendor_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Valid Vendor ID is required."]);
    exit;
}

if (empty($request_type)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Request type is required."]);
    exit;
}

$allowed_types = ['Delivery Date Change', 'Order Issue', 'Inventory Issue', 'Courier Issue', 'General Message'];
if (!in_array($request_type, $allowed_types)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request type."]);
    exit;
}

// 1. Verify Vendor Exists and Fetch Name (Never trust frontend name)
$v_stmt = $conn->prepare("SELECT id, vendor_name FROM vendors WHERE id = ? LIMIT 1");
$v_stmt->bind_param("i", $vendor_id);
$v_stmt->execute();
$vendor = $v_stmt->get_result()->fetch_assoc();
$v_stmt->close();

if (!$vendor) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Vendor account not found."]);
    exit;
}
$vendor_name = $vendor['vendor_name'];

// 2. Validate Order ID & Ownership if supplied
if (!empty($order_id)) {
    $o_stmt = $conn->prepare("SELECT vendor_id, estimated_days FROM orders WHERE order_id = ? LIMIT 1");
    $o_stmt->bind_param("s", $order_id);
    $o_stmt->execute();
    $order = $o_stmt->get_result()->fetch_assoc();
    $o_stmt->close();

    if (!$order) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Order ID not found."]);
        exit;
    }

    // Ownership Enforcement
    if (intval($order['vendor_id']) !== $vendor_id) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: This order does not belong to your store."]);
        exit;
    }

    // For Delivery Date Change, auto-validate current delivery date
    if ($request_type === 'Delivery Date Change') {
        if (empty($requested_delivery_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Requested delivery date is required."]);
            exit;
        }
        $current_delivery_date = $order['estimated_days'];
    }
} else {
    // If delivery date change, order ID is mandatory
    if ($request_type === 'Delivery Date Change') {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Order ID is required for delivery date change."]);
        exit;
    }
}

// Serialize metadata if any (for future-proofing future request types)
$metadata_str = null;
if ($metadata_payload !== null) {
    $metadata_str = json_encode($metadata_payload);
}

// 3. Insert Request
$stmt = $conn->prepare("
    INSERT INTO vendor_support_requests 
    (vendor_id, vendor_name, request_type, order_id, current_delivery_date, requested_delivery_date, subject, message, status, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
");
$stmt->bind_param("issssssss", $vendor_id, $vendor_name, $request_type, $order_id, $current_delivery_date, $requested_delivery_date, $subject, $message, $metadata_str);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Support request submitted successfully.",
        "request_id" => $stmt->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
