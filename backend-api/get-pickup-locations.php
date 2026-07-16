<?php
// get-pickup-locations.php — Retrieve registered Shiprocket pickup hubs for a vendor/admin
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";

$vendor_id_raw = $_GET['vendor_id'] ?? '';
$vendor_id = ($vendor_id_raw === 'admin' || $vendor_id_raw === '') ? null : intval($vendor_id_raw);

if ($vendor_id !== null) {
    $stmt = $conn->prepare("SELECT id, vendor_id, pickup_location_name, contact_name, phone, address_line1, address_line2, city, state, pincode, status FROM vendor_pickup_locations WHERE vendor_id = ? AND status = 1");
    $stmt->bind_param("i", $vendor_id);
} else {
    $stmt = $conn->prepare("SELECT id, vendor_id, pickup_location_name, contact_name, phone, address_line1, address_line2, city, state, pincode, status FROM vendor_pickup_locations WHERE vendor_id IS NULL AND status = 1");
}

$stmt->execute();
$result = $stmt->get_result();

$locations = [];
while ($row = $result->fetch_assoc()) {
    $row['id'] = intval($row['id']);
    $row['vendor_id'] = $row['vendor_id'] !== null ? intval($row['vendor_id']) : null;
    $row['status'] = intval($row['status']);
    $locations[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "locations" => $locations
]);
?>
