<?php
// login.php — Secure user login returning user metadata including B2B GSTIN
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

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and Password are required"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, fullName, email, phone, password, token, gst_number FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid email or password"]);
    exit;
}

// Generate new token if empty or expired
$token = $user['token'];
if (empty($token)) {
    $token = bin2hex(random_bytes(32));
    $stmt = $conn->prepare("UPDATE users SET token = ? WHERE id = ?");
    $stmt->bind_param("si", $token, $user['id']);
    $stmt->execute();
    $stmt->close();
}

echo json_encode([
    "success" => true,
    "message" => "Login successful",
    "token" => $token,
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
