<?php
// add-pickup-location.php — Add a new Shiprocket pickup hub location
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
    echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
    exit;
}

$vendor_id_raw = $data['vendor_id'] ?? '';
$vendor_id = ($vendor_id_raw === 'admin' || $vendor_id_raw === '' || $vendor_id_raw === 0) ? null : intval($vendor_id_raw);

$pickup_location_name = trim($data['pickup_location_name'] ?? '');
$contact_name = trim($data['contact_name'] ?? '');
$phone = trim($data['phone'] ?? '');
$address_line1 = trim($data['address_line1'] ?? '');
$address_line2 = trim($data['address_line2'] ?? '');
$city = trim($data['city'] ?? '');
$state = trim($data['state'] ?? '');
$pincode = trim($data['pincode'] ?? '');

if (empty($pickup_location_name) || empty($contact_name) || empty($phone) || empty($address_line1) || empty($city) || empty($state) || empty($pincode)) {
    echo json_encode(["success" => false, "message" => "Missing required address fields"]);
    exit;
}

// Alphanumeric constraint for Shiprocket location code
$pickup_location_name = preg_replace('/[^a-zA-Z0-9_-]/', '', $pickup_location_name);

include "courier-provider.php";

$stmt = $conn->prepare("INSERT INTO vendor_pickup_locations (vendor_id, pickup_location_name, contact_name, phone, address_line1, address_line2, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
$stmt->bind_param("issssssss", $vendor_id, $pickup_location_name, $contact_name, $phone, $address_line1, $address_line2, $city, $state, $pincode);

if ($stmt->execute()) {
    $loc_id = $conn->insert_id;
    
    // Auto-register in Shiprocket systems
    try {
        $sr = new CourierProvider();
        $sr->registerPickupLocation([
            "pickup_location" => $pickup_location_name,
            "name" => $contact_name,
            "email" => "egnaroapi@gmail.com",
            "phone" => intval(preg_replace('/\D/', '', $phone)),
            "address" => $address_line1,
            "address_2" => $address_line2,
            "city" => $city,
            "state" => $state,
            "country" => "India",
            "pin_code" => intval($pincode),
            "lat" => 9.9252,
            "long" => 78.1198
        ]);
    } catch (Exception $ex) {
        // Proceed even if Shiprocket registration fails (e.g. duplicate nickname warning)
    }

    echo json_encode([
        "success" => true,
        "message" => "Pickup location registered successfully",
        "location_id" => $loc_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to add location: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
