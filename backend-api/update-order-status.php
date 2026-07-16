<?php
// update-order-status.php — Support updating either legacy orders or split shipments
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
$id_input = trim($data['order_id'] ?? '');
$status = trim($data['status'] ?? '');
$estimated_days = trim($data['estimated_days'] ?? '');
$tracking_number = trim($data['tracking_number'] ?? '');
$courier_partner = trim($data['courier_partner'] ?? '');
$vendor_id = intval($data['vendor_id'] ?? 0);

if (!$id_input || !$status) {
    echo json_encode(["success" => false, "message" => "order_id/shipment_id and status are required"]);
    exit;
}

// Normalize Shiprocket statuses to human readable options for manual admin overrides
$allowed_statuses = [
    'Processing', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled',
    'pending', 'ready_to_ship', 'rto', 'delivered', 'shipped'
];

if (strpos($id_input, '-') !== false) {
    // --- SHIPMENT MODE ---
    $conn->begin_transaction();
    try {
        $check = $conn->prepare("SELECT id, order_id, vendor_id, status, awb_code, courier_name FROM shipments WHERE shipment_id = ? LIMIT 1");
        $check->bind_param("s", $id_input);
        $check->execute();
        $shipment_check = $check->get_result()->fetch_assoc();
        $check->close();

        if (!$shipment_check) {
            throw new Exception("Shipment not found");
        }

        if ($vendor_id > 0 && intval($shipment_check['vendor_id']) !== $vendor_id) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Forbidden: Shipment belongs to another vendor."]);
            $conn->rollback();
            exit;
        }

        // Merge parameters
        $awb_code = (isset($data['tracking_number']) && trim($data['tracking_number']) !== '') ? trim($data['tracking_number']) : $shipment_check['awb_code'];
        $courier_name = (isset($data['courier_partner']) && trim($data['courier_partner']) !== '') ? trim($data['courier_partner']) : $shipment_check['courier_name'];

        // Map status nicely to database structure
        $mapped_status = strtolower(str_replace(' ', '_', $status));

        $stmt = $conn->prepare("UPDATE shipments SET status = ?, awb_code = ?, courier_name = ? WHERE shipment_id = ?");
        $stmt->bind_param("ssss", $mapped_status, $awb_code, $courier_name, $id_input);
        
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();
        
        // Dynamic Parent Sync: Recalculate consolidated status of the parent order
        $parent_db_id = intval($shipment_check['order_id']);
        
        // Count statuses of sibling shipments
        $siblings_stmt = $conn->prepare("SELECT status FROM shipments WHERE order_id = ?");
        $siblings_stmt->bind_param("i", $parent_db_id);
        $siblings_stmt->execute();
        $siblings_res = $siblings_stmt->get_result();
        
        $all_statuses = [];
        while ($sibling = $siblings_res->fetch_assoc()) {
            $all_statuses[] = $sibling['status'];
        }
        $siblings_stmt->close();
        
        // Consolidated logic:
        $consolidated = 'Processing';
        if (in_array('shipped', $all_statuses) || in_array('ready_to_ship', $all_statuses)) {
            $consolidated = 'Shipped';
        }
        if (in_array('delivered', $all_statuses)) {
            $consolidated = 'Delivered';
            foreach ($all_statuses as $st) {
                if ($st !== 'delivered' && $st !== 'cancelled' && $st !== 'rto') {
                    // Not fully delivered
                    $consolidated = 'Shipped';
                    break;
                }
            }
        }
        if (count(array_unique($all_statuses)) === 1 && $all_statuses[0] === 'cancelled') {
            $consolidated = 'Cancelled';
        }
        
        // Update parent order
        $up_parent = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $up_parent->bind_param("si", $consolidated, $parent_db_id);
        if (!$up_parent->execute()) {
            throw new Exception($up_parent->error);
        }
        $up_parent->close();

        // Log tracking checkpoint for manual update
        $act_desc = "Shipment status updated manually to " . $status;
        if (!empty($awb_code)) {
            $act_desc .= " (AWB: " . $awb_code . ")";
        }
        $stmt_chk = $conn->prepare("INSERT INTO shipment_tracking_checkpoints (shipment_id, activity, status, checkpoint_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)");
        $stmt_chk->bind_param("iss", $shipment_check['id'], $act_desc, $mapped_status);
        $stmt_chk->execute();
        $stmt_chk->close();

        $conn->commit();

        echo json_encode([
            "success" => true,
            "message" => "Shipment status updated successfully",
            "order_id" => $id_input,
            "status" => $mapped_status,
            "estimated_days" => "Consolidated",
            "tracking_number" => $awb_code,
            "courier_partner" => $courier_name
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} else {
    // --- LEGACY ORDER MODE ---
    $conn->begin_transaction();
    try {
        $check = $conn->prepare("SELECT id, vendor_id, tracking_number, courier_partner, estimated_days, payment_status, status FROM orders WHERE order_id = ? LIMIT 1");
        $check->bind_param("s", $id_input);
        $check->execute();
        $order_check = $check->get_result()->fetch_assoc();
        $check->close();

        if (!$order_check) {
            throw new Exception("Order not found");
        }

        $tracking_number = (isset($data['tracking_number']) && trim($data['tracking_number']) !== '') ? trim($data['tracking_number']) : $order_check['tracking_number'];
        $courier_partner = (isset($data['courier_partner']) && trim($data['courier_partner']) !== '') ? trim($data['courier_partner']) : $order_check['courier_partner'];

        if (empty($estimated_days)) {
            switch ($status) {
                case 'Confirmed': $estimated_days = date('d M Y', strtotime('+6 days')); break;
                case 'Packed': $estimated_days = date('d M Y', strtotime('+5 days')); break;
                case 'Shipped': $estimated_days = date('d M Y', strtotime('+3 days')); break;
                case 'Out for Delivery': $estimated_days = date('d M Y', strtotime('+1.5 days')); break;
                case 'Delivered': $estimated_days = date('d M Y'); break;
                case 'Cancelled': $estimated_days = 'Cancelled'; break;
                default: $estimated_days = $order_check['estimated_days'];
            }
        }

        // If status changes to an active one, check if we need to auto-approve payment
        $payment_status = $order_check['payment_status'];
        if (in_array(strtolower($status), ['processing', 'confirmed', 'packed', 'shipped', 'out for delivery', 'delivered']) && 
            (strtolower($order_check['status']) === 'pending payment' || strtolower($order_check['payment_status']) === 'pending')) {
            $payment_status = 'paid';
            
            // Release shipments held due to payment verification
            $stmt_up_ships = $conn->prepare("UPDATE shipments SET status = 'pending' WHERE order_id = ? AND status = 'payment_pending'");
            $stmt_up_ships->bind_param("i", $order_check['id']);
            $stmt_up_ships->execute();
            $stmt_up_ships->close();
        }

        $stmt = $conn->prepare("UPDATE orders SET status = ?, estimated_days = ?, tracking_number = ?, courier_partner = ?, payment_status = ? WHERE order_id = ?");
        $stmt->bind_param("ssssss", $status, $estimated_days, $tracking_number, $courier_partner, $payment_status, $id_input);

        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();
        
        $conn->commit();

        echo json_encode([
            "success" => true,
            "message" => "Order updated successfully",
            "order_id" => $id_input,
            "status" => $status,
            "estimated_days" => $estimated_days,
            "tracking_number" => $tracking_number,
            "courier_partner" => $courier_partner,
            "payment_status" => $payment_status
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

$conn->close();
?>
