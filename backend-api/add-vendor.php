<?php
// add-vendor.php — Register vendor application
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->vendor_name) &&
    !empty($data->company_name) &&
    !empty($data->phone) &&
    !empty($data->email) &&
    !empty($data->password) &&
    !empty($data->address) &&
    !empty($data->state) &&
    !empty($data->city) &&
    !empty($data->town) // Added town parameter support
) {
    try {
        // Prevent duplicate account email
        $check = "SELECT id FROM vendors WHERE email = ? LIMIT 1";
        $check_stmt = $conn->prepare($check);
        $check_stmt->bind_param("s", $data->email);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows > 0) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "A vendor with this email is already registered."
            ]);
            exit;
        }

        // Validate GST number (Mandatory, 15 characters, uppercase, and valid Indian GSTIN regex)
        $gst = isset($data->gst) ? strtoupper(trim($data->gst)) : '';

        if (empty($gst)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "GSTIN is mandatory."
            ]);
            exit;
        }

        if (strlen($gst) !== 15) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "GSTIN must contain exactly 15 characters."
            ]);
            exit;
        }

        if (!preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/', $gst)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Invalid GSTIN format. Please enter a valid GST number."
            ]);
            exit;
        }

        // Insert new vendor application in pending state
        $query = "INSERT INTO vendors
            (vendor_name, company_name, gst, phone, email, password, address, state, city, town, status, created_at)
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())";

        $stmt = $conn->prepare($query);

        // Secure password hashing
        $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);

        $stmt->bind_param(
            "ssssssssss",
            $data->vendor_name,
            $data->company_name,
            $gst,
            $data->phone,
            $data->email,
            $hashed_password,
            $data->address,
            $data->state,
            $data->city,
            $data->town
        );
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Vendor application submitted successfully. Please wait for Admin approval."
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to submit vendor application."
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Incomplete application details. All fields are required."
    ]);
}
?>
