<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "db.php";

// Check for auth token using multiple fallback methods
$authHeader = '';
$headers = getallheaders();

// 1. Try to find Authorization header in getallheaders() case-insensitively
foreach ($headers as $key => $val) {
    if (strcasecmp($key, 'Authorization') === 0) {
        $authHeader = trim($val);
        break;
    }
}

// 2. Try SERVER variables if not found in headers
if (empty($authHeader)) {
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }
}

$token = '';
if (!empty($authHeader)) {
    // Matches "Bearer <token>" case-insensitively with any number of spaces
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        // Fallback case-insensitive replace of the word bearer
        $token = trim(str_ireplace('bearer', '', $authHeader));
    }
}

// 3. Pro-active fallback: check URL query parameter
if (empty($token) || strlen($token) < 5) {
    $token = trim($_GET['token'] ?? '');
}

if (empty($token)) {
    echo json_encode([
        "status" => "error",
        "message" => "Authorization Bearer Token is required. You can also pass it in the URL e.g. ?token=YOUR_TOKEN"
    ]);
    exit;
}

// 1. Get logged-in user profile
$stmt = $conn->prepare("SELECT id, fullName, email, phone FROM users WHERE token = ? LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user) {
    echo json_encode([
        "status" => "error",
        "message" => "No user found with the provided token. Please verify if the token matches the one in your localStorage 'auth-store'!"
    ]);
    exit;
}

$user_id = intval($user['id']);
$email   = trim($user['email'] ?? '');
$uphone  = trim($user['phone'] ?? '');

$phone_variant1 = $uphone;
$phone_variant2 = str_replace("+91", "", $uphone);
$phone_variant3 = "+91" . $phone_variant2;

// 2. Count total orders in the database for sanity check
$total_orders = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM orders");
if ($res) {
    $row = $res->fetch_assoc();
    $total_orders = intval($row['cnt']);
}

// 3. Find orders matching user_id
$stmt = $conn->prepare("SELECT order_id, customer_name, phone, email, total, status, user_id FROM orders WHERE user_id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$orders_by_id = [];
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) { $orders_by_id[] = $row; }

// 4. Find orders matching email
$orders_by_email = [];
if (!empty($email)) {
    $stmt = $conn->prepare("SELECT order_id, customer_name, phone, email, total, status, user_id FROM orders WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) { $orders_by_email[] = $row; }
}

// 5. Find orders matching phone variants
$orders_by_phone = [];
if (!empty($uphone)) {
    $stmt = $conn->prepare("SELECT order_id, customer_name, phone, email, total, status, user_id FROM orders WHERE phone = ? OR phone = ? OR phone = ?");
    $stmt->bind_param("sss", $phone_variant1, $phone_variant2, $phone_variant3);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) { $orders_by_phone[] = $row; }
}

echo json_encode([
    "status" => "success",
    "diagnostics" => [
        "logged_in_user" => [
            "id" => $user_id,
            "name" => $user['fullName'],
            "email" => $email,
            "phone" => $uphone,
            "phone_variants" => [$phone_variant1, $phone_variant2, $phone_variant3]
        ],
        "database_stats" => [
            "total_orders_in_system" => $total_orders
        ],
        "matching_results" => [
            "orders_matching_user_id_count" => count($orders_by_id),
            "orders_matching_user_id" => $orders_by_id,
            
            "orders_matching_email_count" => count($orders_by_email),
            "orders_matching_email" => $orders_by_email,
            
            "orders_matching_phone_count" => count($orders_by_phone),
            "orders_matching_phone" => $orders_by_phone
        ]
    ]
], JSON_PRETTY_PRINT);

$conn->close();
?>
