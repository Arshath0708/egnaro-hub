<?php
// update-user.php — Update user profile details including optional B2B GSTIN
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// Token extraction
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = '';
if (!empty($authHeader)) {
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        $token = trim(str_ireplace('bearer', '', $authHeader));
    }
}
if (empty($token)) {
    $token = trim($_GET['token'] ?? '');
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Authorization token required"]);
    exit;
}

// Find user
$stmt = $conn->prepare("SELECT id FROM users WHERE token = ? LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid or expired token"]);
    exit;
}

$userId = intval($user['id']);

$data = json_decode(file_get_contents("php://input"), true);

$fullName   = trim($data['fullName'] ?? '');
$phone      = trim($data['phone'] ?? '');
// Allow passing gst_number for updates
$gst_number = isset($data['gst_number']) ? strtoupper(trim($data['gst_number'])) : '';

if (empty($fullName) || empty($phone)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Full Name and Phone are required"]);
    exit;
}

// Format and validate GSTIN if provided
if (!empty($gst_number)) {
    if (!preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/', $gst_number)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid GSTIN format. Must be a valid 15-character Indian GSTIN."]);
        exit;
    }
} else {
    // If empty string or not set, set to NULL in DB
    $gst_number = null;
}

// Check if phone is already taken by another user
$stmt = $conn->prepare("SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1");
$stmt->bind_param("si", $phone, $userId);
$stmt->execute();
if ($stmt->get_result()->fetch_assoc()) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Another account is already using this phone number"]);
    $stmt->close();
    exit;
}
$stmt->close();

// Update user details
$stmt = $conn->prepare("UPDATE users SET fullName = ?, phone = ?, gst_number = ? WHERE id = ?");
$stmt->bind_param("sssi", $fullName, $phone, $gst_number, $userId);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully",
        "user" => [
            "id" => $userId,
            "name" => $fullName,
            "phone" => $phone,
            "gst_number" => $gst_number
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Profile update failed: " . $conn->error]);
}
$stmt->close();
$conn->close();
?>
