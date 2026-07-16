<?php
header("Content-Type: application/json");
include "db.php";

$vendor_id = 52;
$pickup_location_name = "V52_DEFAULT";
$contact_name = "ARSHATH ABDULLA A";
$phone = "8428858856";
$address_line1 = "No. 33A, Kaveri 5th Street";
$address_line2 = "Parasakthi Nagar, Avaniyapuram";
$city = "Madurai";
$state = "Tamil Nadu";
$pincode = "625012";

// Update the database record
$stmt = $conn->prepare("UPDATE vendor_pickup_locations SET 
    contact_name = ?, 
    phone = ?, 
    address_line1 = ?, 
    address_line2 = ?, 
    city = ?, 
    state = ?, 
    pincode = ? 
    WHERE vendor_id = ? AND pickup_location_name = ?");

if ($stmt) {
    $stmt->bind_param("sssssssis", $contact_name, $phone, $address_line1, $address_line2, $city, $state, $pincode, $vendor_id, $pickup_location_name);
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Pickup location for vendor 52 updated successfully!",
            "details" => [
                "city" => $city,
                "state" => $state,
                "pincode" => $pincode
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Database execution failed: " . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Prepare statement failed: " . $conn->error]);
}

$conn->close();
?>
