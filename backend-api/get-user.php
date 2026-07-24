<?php
// get-user.php — Retrieve user profile info including B2B GSTIN via Authorization Token
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$stmt = $conn->prepare("SELECT id, fullName, email, phone, gst_number FROM users WHERE token = ? LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid or expired token"]);
    exit;
}

echo json_encode([
    "success" => true,
    "user" => [
        "id" => $user['id'],
        "name" => $user['fullName'],
        "email" => $user['email'],
        "phone" => $user['phone'],
        "gst_number" => $user['gst_number']
    ]
]);

$conn->close();
?>
