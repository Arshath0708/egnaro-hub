<?php
// handle-support-request.php — Approve or Reject a support request (Admin only)
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

$request_id = intval($data['request_id'] ?? 0);
$action = trim($data['action'] ?? '');
$admin_note = isset($data['admin_note']) ? trim($data['admin_note']) : null;

if ($request_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Valid Request ID is required."]);
    exit;
}

if ($action !== 'approve' && $action !== 'reject') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid action. Must be 'approve' or 'reject'."]);
    exit;
}

// 1. Fetch support request details
$stmt = $conn->prepare("SELECT id, request_type, order_id, requested_delivery_date, status FROM vendor_support_requests WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $request_id);
$stmt->execute();
$request = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$request) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Support request not found."]);
    exit;
}

if ($request['status'] !== 'Pending') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "This support request has already been processed (Status: " . $request['status'] . ")."]);
    exit;
}

// Begin transaction to ensure database integrity
$conn->begin_transaction();

try {
    $new_status = ($action === 'approve') ? 'Approved' : 'Rejected';
    
    // 2. If action is Approve and type is Delivery Date Change, update the Orders table
    if ($action === 'approve' && $request['request_type'] === 'Delivery Date Change') {
        $order_id = $request['order_id'];
        $new_date = $request['requested_delivery_date'];
        
        if (empty($order_id) || empty($new_date)) {
            throw new Exception("Order ID or requested delivery date is missing in the request record.");
        }
        
        // Update orders table
        $o_stmt = $conn->prepare("UPDATE orders SET estimated_days = ? WHERE order_id = ?");
        $o_stmt->bind_param("ss", $new_date, $order_id);
        if (!$o_stmt->execute()) {
            throw new Exception("Failed to update order estimated delivery: " . $o_stmt->error);
        }
        $o_stmt->close();
    }
    
    // 3. Update support request status and note
    $u_stmt = $conn->prepare("UPDATE vendor_support_requests SET status = ?, admin_note = ? WHERE id = ?");
    $u_stmt->bind_param("ssi", $new_status, $admin_note, $request_id);
    if (!$u_stmt->execute()) {
        throw new Exception("Failed to update support request: " . $u_stmt->error);
    }
    $u_stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Support request has been " . strtolower($new_status) . " successfully."
    ]);
    
} catch (Exception $e) {
    // Rollback on any failure
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Execution failed: " . $e->getMessage()]);
}

$conn->close();
?>
