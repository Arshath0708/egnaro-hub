<?php
// register.php — Secure user registration with optional B2B GSTIN validation
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

$fullName   = trim($data['fullName'] ?? '');
$email      = trim($data['email'] ?? '');
$phone      = trim($data['phone'] ?? '');
$password   = $data['password'] ?? '';
$gst_number = isset($data['gst_number']) ? strtoupper(trim($data['gst_number'])) : null;

if (empty($fullName) || empty($email) || empty($phone) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields are required (Name, Email, Phone, Password)"]);
    exit;
}

// Format & validate GST number if present
if (!empty($gst_number)) {
    if (!preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/', $gst_number)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid GSTIN format. Must be a valid 15-character alphanumeric GSTIN."]);
        exit;
    }
} else {
    $gst_number = null;
}

// Check if user already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1");
$stmt->bind_param("ss", $email, $phone);
$stmt->execute();
if ($stmt->get_result()->fetch_assoc()) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User already exists with this email or phone number"]);
    $stmt->close();
    exit;
}
$stmt->close();

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Generate unique session token
$token = bin2hex(random_bytes(32));

// Insert user
$stmt = $conn->prepare("INSERT INTO users (fullName, email, phone, password, token, gst_number) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $fullName, $email, $phone, $hashed_password, $token, $gst_number);

if ($stmt->execute()) {
    $userId = $stmt->insert_id;
    echo json_encode([
        "success" => true,
        "message" => "Registration successful",
        "token" => $token,
        "user" => [
            "id" => $userId,
            "name" => $fullName,
            "email" => $email,
            "phone" => $phone,
            "gst_number" => $gst_number
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Registration failed: " . $conn->error]);
}
$stmt->close();
$conn->close();
?>
