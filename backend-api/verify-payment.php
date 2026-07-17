<?php
// verify-payment.php — Verify Razorpay payment signature and update order status
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

$orderId = trim($data['order_id'] ?? '');
$razorpayPaymentId = trim($data['razorpay_payment_id'] ?? '');
$razorpayOrderId = trim($data['razorpay_order_id'] ?? '');
$razorpaySignature = trim($data['razorpay_signature'] ?? '');

// Validation
if (empty($orderId) || empty($razorpayPaymentId) || empty($razorpayOrderId) || empty($razorpaySignature)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required verification fields"]);
    exit;
}

// Generate expected signature
// Algorithm: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET)
$secret = RAZORPAY_KEY_SECRET;
$generatedSignature = hash_hmac('sha256', $razorpayOrderId . '|' . $razorpayPaymentId, $secret);

// Secure comparison
if (hash_equals($generatedSignature, $razorpaySignature)) {
    // Start MySQL transaction to safely update payment status
    $conn->begin_transaction();

    try {
        // Check if order exists
        $stmt_check = $conn->prepare("SELECT id, payment_status FROM orders WHERE order_id = ? LIMIT 1");
        $stmt_check->bind_param("s", $orderId);
        $stmt_check->execute();
        $order = $stmt_check->get_result()->fetch_assoc();
        $stmt_check->close();

        if (!$order) {
            throw new Exception("Order not found");
        }

        // Update order status to paid and Processing
        $stmt_update = $conn->prepare("UPDATE orders SET payment_status = 'paid', status = 'Processing', payment_reference = ? WHERE order_id = ?");
        $stmt_update->bind_param("ss", $razorpayPaymentId, $orderId);
        
        if (!$stmt_update->execute()) {
            throw new Exception("Failed to update order payment details");
        }
        $stmt_update->close();

        // Commit transaction
        $conn->commit();

        echo json_encode([
            "success" => true,
            "message" => "Payment verified successfully and order updated"
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Order update failed: " . $e->getMessage()
        ]);
    }

} else {
    // Signature mismatch
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Signature verification failed"
    ]);
}

$conn->close();
?>
