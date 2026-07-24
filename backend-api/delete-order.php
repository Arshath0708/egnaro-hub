<?php
// delete-order.php — Safely delete an order and all its related details within an atomic transaction
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

// Parse payload parameters
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $conn->begin_transaction();
    try {
        $order_db_id = (int)$data->id;

        // 1. Fetch related shipment IDs
        $shipments = [];
        $stmt_ship_ids = $conn->prepare("SELECT id FROM shipments WHERE order_id = ?");
        if ($stmt_ship_ids) {
            $stmt_ship_ids->bind_param("i", $order_db_id);
            $stmt_ship_ids->execute();
            $result = $stmt_ship_ids->get_result();
            while ($row = $result->fetch_assoc()) {
                $shipments[] = (int)$row['id'];
            }
            $stmt_ship_ids->close();
        }

        // 2. Delete shipment checkpoints if there are shipments
        if (!empty($shipments)) {
            $in_clause = implode(',', $shipments);
            $conn->query("DELETE FROM shipment_tracking_checkpoints WHERE shipment_id IN ($in_clause)");
            $conn->query("DELETE FROM shipment_items WHERE shipment_id IN ($in_clause)");
        }

        // 3. Delete shipments
        $stmt_del_shipments = $conn->prepare("DELETE FROM shipments WHERE order_id = ?");
        if ($stmt_del_shipments) {
            $stmt_del_shipments->bind_param("i", $order_db_id);
            $stmt_del_shipments->execute();
            $stmt_del_shipments->close();
        }

        // 4. Delete order items
        $stmt_del_items = $conn->prepare("DELETE FROM order_items WHERE order_id = ?");
        if ($stmt_del_items) {
            $stmt_del_items->bind_param("i", $order_db_id);
            $stmt_del_items->execute();
            $stmt_del_items->close();
        }

        // 5. Delete order itself
        $stmt_del_order = $conn->prepare("DELETE FROM orders WHERE id = ?");
        if ($stmt_del_order) {
            $stmt_del_order->bind_param("i", $order_db_id);
            if ($stmt_del_order->execute()) {
                $stmt_del_order->close();
                $conn->commit();
                echo json_encode([
                    "success" => true,
                    "message" => "Order and all related shipments/records deleted successfully."
                ]);
            } else {
                $stmt_del_order->close();
                throw new Exception("Failed to delete core order record.");
            }
        } else {
            throw new Exception("Prepare delete orders statement failed.");
        }
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Order deletion aborted: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request. Order database ID is required."
    ]);
}
?>
