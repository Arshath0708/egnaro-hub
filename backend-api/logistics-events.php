<?php
// logistics-events.php — Safe webhook receiver for tracking updates
// Renamed from shiprocket-webhook.php for security obscurity
header("Content-Type: application/json");
include "db.php";

// ── DEFENSIVE FALLBACK: getallheaders() ──
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

// 1. Authenticate the webhook request
$secure_token = defined('SHIPROCKET_WEBHOOK_TOKEN') ? SHIPROCKET_WEBHOOK_TOKEN : 'EGNARO_SECURE_WEBHOOK_KEY';

// Extract x-api-key header (standard for Shiprocket Webhook Security Token)
$client_header_token = '';
$headers = getallheaders();
foreach ($headers as $key => $val) {
    if (strcasecmp($key, 'x-api-key') === 0) {
        $client_header_token = trim($val);
        break;
    }
}
if (empty($client_header_token)) {
    $client_header_token = $_SERVER['HTTP_X_API_KEY'] ?? ($_SERVER['REDIRECT_HTTP_X_API_KEY'] ?? '');
}

$client_query_token = $_GET['token'] ?? '';
$is_authorized = false;

// Validate utilizing constant-time comparison to prevent timing attacks
if (!empty($client_header_token) && hash_equals($secure_token, $client_header_token)) {
    $is_authorized = true;
} elseif (!empty($client_query_token) && hash_equals($secure_token, $client_query_token)) {
    $is_authorized = true;
}

if (!$is_authorized) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized access. Valid x-api-key header or token query parameter required."]);
    exit;
}

// 2. Parse Incoming Payload
$raw_payload = file_get_contents('php://input');
$payload = json_decode($raw_payload, true);
if (!$payload) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
    exit;
}

// Shiprocket tracking webhook payload structure extraction
$shiprocket_shipment_id = intval($payload['shipment_id'] ?? 0);
$awb_code = trim($payload['awb'] ?? '');
$status_code = trim($payload['current_status'] ?? ($payload['status'] ?? ''));

$activity = trim($payload['activity'] ?? '');
$location = trim($payload['location'] ?? '');
$timestamp = trim($payload['timestamp'] ?? '');

// Parse scans array if present in the webhook payload
if (isset($payload['scans']) && is_array($payload['scans']) && count($payload['scans']) > 0) {
    $latest_scan = end($payload['scans']);
    if (empty($activity)) {
        $activity = trim($latest_scan['activity'] ?? '');
    }
    if (empty($location)) {
        $location = trim($latest_scan['location'] ?? '');
    }
    if (empty($timestamp)) {
        $timestamp = trim($latest_scan['date'] ?? '');
    }
}

if (empty($timestamp)) {
    $timestamp = date('Y-m-d H:i:s');
} else {
    // Normalize format to prevent SQL conversion issues in strict mode
    $timestamp = date('Y-m-d H:i:s', strtotime($timestamp));
}

if ($shiprocket_shipment_id === 0 && empty($awb_code)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing shipment identifiers (shipment_id or awb)"]);
    exit;
}

// Begin database transaction for consistent tracking update
$conn->begin_transaction();

try {
    // 3. Locate Shipment in Database
    $shipment = null;
    if ($shiprocket_shipment_id > 0) {
        $stmt_ship = $conn->prepare("SELECT id, order_id, status FROM shipments WHERE shiprocket_shipment_id = ? LIMIT 1");
        $stmt_ship->bind_param("i", $shiprocket_shipment_id);
    } else {
        $stmt_ship = $conn->prepare("SELECT id, order_id, status FROM shipments WHERE awb_code = ? LIMIT 1");
        $stmt_ship->bind_param("s", $awb_code);
    }
    
    $stmt_ship->execute();
    $shipment = $stmt_ship->get_result()->fetch_assoc();
    $stmt_ship->close();
    
    if (!$shipment) {
        // Return 202 Accepted to prevent redundant webhook retry loops by Shiprocket
        http_response_code(202);
        echo json_encode([
            "success" => false,
            "message" => "Shipment matching ID $shiprocket_shipment_id or AWB $awb_code not found in local records. Ignored."
        ]);
        $conn->rollback();
        $conn->close();
        exit;
    }
    
    $shipment_db_id = intval($shipment['id']);
    $order_db_id = intval($shipment['order_id']);
    
    // 4. Map Shiprocket status string to internal status
    $status_lower = strtolower($status_code);
    $mapped_status = 'pending';
    
    if (str_contains($status_lower, 'pickup') || str_contains($status_lower, 'packed') || str_contains($status_lower, 'ready')) {
        $mapped_status = 'ready_to_ship';
    } elseif (str_contains($status_lower, 'ship') || str_contains($status_lower, 'transit') || str_contains($status_lower, 'in-transit')) {
        $mapped_status = 'shipped';
    } elseif (str_contains($status_lower, 'out for delivery') || str_contains($status_lower, 'out_for_delivery') || str_contains($status_lower, 'delivering')) {
        $mapped_status = 'out_for_delivery';
    } elseif (str_contains($status_lower, 'delivered') || str_contains($status_lower, 'complete')) {
        $mapped_status = 'delivered';
    } elseif (str_contains($status_lower, 'rto') || str_contains($status_lower, 'return') || str_contains($status_lower, 'undelivered')) {
        $mapped_status = 'rto';
    } else {
        $mapped_status = $shipment['status']; // Keep current status if unknown
    }
    
    // Update shipment details
    $stmt_up_ship = $conn->prepare("UPDATE shipments SET status = ?, awb_code = COALESCE(NULLIF(?, ''), awb_code) WHERE id = ?");
    $stmt_up_ship->bind_param("ssi", $mapped_status, $awb_code, $shipment_db_id);
    if (!$stmt_up_ship->execute()) {
        throw new Exception("Failed to update shipment status: " . $stmt_up_ship->error);
    }
    $stmt_up_ship->close();
    
    // 5. Add to Tracking Checkpoints log
    $activity_desc = !empty($activity) ? $activity : "Courier status: " . $status_code;
    $stmt_checkpoint = $conn->prepare("INSERT INTO shipment_tracking_checkpoints (shipment_id, activity, location, status, checkpoint_time) VALUES (?, ?, ?, ?, ?)");
    $stmt_checkpoint->bind_param("issss", $shipment_db_id, $activity_desc, $location, $mapped_status, $timestamp);
    if (!$stmt_checkpoint->execute()) {
        throw new Exception("Failed to log tracking checkpoint: " . $stmt_checkpoint->error);
    }
    $stmt_checkpoint->close();
    
    // 6. Recalculate Consolidated Parent Order Status
    $stmt_all_ships = $conn->prepare("SELECT status FROM shipments WHERE order_id = ?");
    $stmt_all_ships->bind_param("i", $order_db_id);
    $stmt_all_ships->execute();
    $all_ships_res = $stmt_all_ships->get_result();
    
    $shipments_count = 0;
    $delivered_count = 0;
    $shipped_count = 0;
    $rto_count = 0;
    
    while ($sh = $all_ships_res->fetch_assoc()) {
        $shipments_count++;
        if ($sh['status'] === 'delivered') {
            $delivered_count++;
        } elseif ($sh['status'] === 'shipped' || $sh['status'] === 'out_for_delivery') {
            $shipped_count++;
        } elseif ($sh['status'] === 'rto') {
            $rto_count++;
        }
    }
    $stmt_all_ships->close();
    
    // Determine consolidated order status
    $new_order_status = 'Processing';
    if ($delivered_count === $shipments_count) {
        $new_order_status = 'Delivered';
    } elseif ($rto_count === $shipments_count) {
        $new_order_status = 'Returned';
    } elseif (($delivered_count + $shipped_count + $rto_count) > 0) {
        if ($delivered_count > 0 && $delivered_count < $shipments_count) {
            $new_order_status = 'Partially_Delivered';
        } else {
            $new_order_status = 'Shipped';
        }
    }
    
    // Update parent order
    $stmt_up_order = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt_up_order->bind_param("si", $new_order_status, $order_db_id);
    if (!$stmt_up_order->execute()) {
        throw new Exception("Failed to update parent order status: " . $stmt_up_order->error);
    }
    $stmt_up_order->close();
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Tracking checkpoint successfully recorded",
        "details" => [
            "shipment_id" => $shipment_db_id,
            "shipment_status" => $mapped_status,
            "order_status" => $new_order_status
        ]
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>
