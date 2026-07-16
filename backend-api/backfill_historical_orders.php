<?php
// backfill_historical_orders.php — Asynchronously migrates legacy order data to the new schema
header("Content-Type: application/json");
include "db.php";

// 1. Fetch all vendors to setup their default pickup locations
$vendors_res = $conn->query("SELECT id, vendor_name, company_name, phone, address FROM vendors");
$vendor_pickup_map = [];

// Create default admin pickup location (vendor_id = NULL)
$admin_pincode = "600001"; // Default Chennai Pincode
$admin_city = "Chennai";
$admin_state = "Tamil Nadu";

$stmt_check_admin = $conn->prepare("SELECT id FROM vendor_pickup_locations WHERE vendor_id IS NULL LIMIT 1");
$stmt_check_admin->execute();
$admin_loc_exists = $stmt_check_admin->get_result()->fetch_assoc();

if (!$admin_loc_exists) {
    $stmt_add_admin_loc = $conn->prepare("INSERT INTO vendor_pickup_locations (vendor_id, pickup_location_name, contact_name, phone, address_line1, city, state, pincode, status) VALUES (NULL, 'ADMIN_WH_MAIN', 'Egnaromart Admin', '9876543210', 'Main Admin Warehouse, Adyar', 'Chennai', 'Tamil Nadu', '600020', 1)");
    $stmt_add_admin_loc->execute();
    $admin_pickup_id = $conn->insert_id;
} else {
    $admin_pickup_id = $admin_loc_exists['id'];
}

while ($vendor = $vendors_res->fetch_assoc()) {
    $vid = intval($vendor['id']);
    
    // Check if vendor already has a pickup location
    $stmt_chk = $conn->prepare("SELECT id FROM vendor_pickup_locations WHERE vendor_id = ? LIMIT 1");
    $stmt_chk->bind_param("i", $vid);
    $stmt_chk->execute();
    $loc_exists = $stmt_chk->get_result()->fetch_assoc();
    
    if ($loc_exists) {
        $vendor_pickup_map[$vid] = $loc_exists['id'];
        continue;
    }
    
    // Extract pincode and address components using regex
    $addr = $vendor['address'] ?? '';
    $pincode = "600001"; // Fallback
    if (preg_match('/\b\d{6}\b/', $addr, $matches)) {
        $pincode = $matches[0];
    }
    
    $city = "Chennai"; // Default
    if (preg_match('/(chennai|coimbatore|erode|salem|trichy|madurai)/i', $addr, $city_matches)) {
        $city = ucfirst(strtolower($city_matches[0]));
    }
    
    $state = "Tamil Nadu";
    $pickup_name = "V" . $vid . "_DEFAULT";
    $contact = $vendor['vendor_name'] ?: ($vendor['company_name'] ?: 'Vendor ' . $vid);
    $phone = $vendor['phone'] ?: '9876543210';
    $addr1 = substr(trim($addr), 0, 255) ?: 'Default Vendor Address';
    
    $stmt_ins = $conn->prepare("INSERT INTO vendor_pickup_locations (vendor_id, pickup_location_name, contact_name, phone, address_line1, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)");
    $stmt_ins->bind_param("isssssss", $vid, $pickup_name, $contact, $phone, $addr1, $city, $state, $pincode);
    $stmt_ins->execute();
    $vendor_pickup_map[$vid] = $conn->insert_id;
}

// 2. Fetch all legacy orders
$orders_res = $conn->query("SELECT id, order_id, vendor_id, items, total, status, tracking_number, courier_partner FROM orders");
$orders_processed = 0;
$items_migrated = 0;
$shipments_created = 0;

while ($order = $orders_res->fetch_assoc()) {
    $order_db_id = intval($order['id']);
    $order_id = $order['order_id'];
    $root_vendor_id = intval($order['vendor_id'] ?? 0);
    $items_json = $order['items'];
    $status = $order['status'] ?: 'Processing';
    $tracking_num = $order['tracking_number'] ?? '';
    $courier = $order['courier_partner'] ?? '';
    $order_total = floatval($order['total']);
    
    // Check if order items are already migrated to prevent duplicates
    $stmt_check_items = $conn->prepare("SELECT COUNT(*) AS count FROM order_items WHERE order_id = ?");
    $stmt_check_items->bind_param("i", $order_db_id);
    $stmt_check_items->execute();
    $items_exist = $stmt_check_items->get_result()->fetch_assoc()['count'] > 0;
    
    if ($items_exist) {
        continue;
    }
    
    $items = json_decode($items_json, true);
    if (!is_array($items)) {
        continue;
    }
    
    $order_items_ids = [];
    $subtotal = 0;
    
    // Group items by vendor
    $vendor_groups = [];
    
    foreach ($items as $item) {
        // Find product details
        $pid = intval($item['id'] ?? ($item['product_id'] ?? 0));
        if ($pid === 0) continue;
        
        $price = floatval($item['price'] ?? 0);
        $qty = intval($item['quantity'] ?? 1);
        
        // Fetch product's real vendor_id
        $stmt_prod = $conn->prepare("SELECT vendor_id, price FROM products WHERE id = ? LIMIT 1");
        $stmt_prod->bind_param("i", $pid);
        $stmt_prod->execute();
        $prod_res = $stmt_prod->get_result()->fetch_assoc();
        
        $item_vendor_id = NULL;
        if ($prod_res) {
            $raw_vendor_id = $prod_res['vendor_id'];
            if (!empty($raw_vendor_id) && $raw_vendor_id !== "0") {
                $item_vendor_id = intval($raw_vendor_id);
            }
            if ($price === 0.0) {
                $price = floatval($prod_res['price']);
            }
        }
        
        // Relational Item Insertion
        $stmt_ins_item = $conn->prepare("INSERT INTO order_items (order_id, product_id, vendor_id, price, quantity) VALUES (?, ?, ?, ?, ?)");
        $stmt_ins_item->bind_param("iiidi", $order_db_id, $pid, $item_vendor_id, $price, $qty);
        $stmt_ins_item->execute();
        $order_item_db_id = $conn->insert_id;
        
        $subtotal += ($price * $qty);
        
        // Track vendor items grouping
        $group_key = $item_vendor_id === NULL ? 'admin' : $item_vendor_id;
        if (!isset($vendor_groups[$group_key])) {
            $vendor_groups[$group_key] = [];
        }
        $vendor_groups[$group_key][] = [
            'order_item_id' => $order_item_db_id,
            'quantity' => $qty,
            'weight' => 200 * $qty // placeholder weight 200g
        ];
        
        $items_migrated++;
    }
    
    // Update order billing metrics
    $discount = 0.00;
    $shipping = 0.00;
    if ($subtotal > 0) {
        if ($order_total > $subtotal) {
            $shipping = $order_total - $subtotal;
        } elseif ($subtotal > $order_total) {
            $discount = $subtotal - $order_total;
        }
    }
    
    $stmt_up_order = $conn->prepare("UPDATE orders SET subtotal = ?, discount = ?, shipping_charges = ?, payment_status = 'captured' WHERE id = ?");
    $stmt_up_order->bind_param("dddi", $subtotal, $discount, $shipping, $order_db_id);
    $stmt_up_order->execute();
    
    // Create shipments for each vendor group
    $group_idx = 1;
    foreach ($vendor_groups as $vkey => $group_items) {
        $vendor_id = $vkey === 'admin' ? NULL : intval($vkey);
        $shipment_id = $order_id . "-S" . $group_idx;
        
        // Find pickup location ID
        $pickup_loc_id = $admin_pickup_id;
        if ($vendor_id !== NULL && isset($vendor_pickup_map[$vendor_id])) {
            $pickup_loc_id = $vendor_pickup_map[$vendor_id];
        }
        
        $total_weight = 0;
        foreach ($group_items as $gi) {
            $total_weight += $gi['weight'];
        }
        
        // Mapped courier/tracking info if it is the first group and legacy info was present
        $ship_awb = ($group_idx === 1 && !empty($tracking_num)) ? $tracking_num : NULL;
        $ship_courier = ($group_idx === 1 && !empty($courier)) ? $courier : NULL;
        $ship_status = strtolower($status);
        
        // Insert shipment
        $stmt_ins_ship = $conn->prepare("INSERT INTO shipments (shipment_id, order_id, vendor_id, pickup_location_id, awb_code, courier_name, status, weight_g) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt_ins_ship->bind_param("siiisssi", $shipment_id, $order_db_id, $vendor_id, $pickup_loc_id, $ship_awb, $ship_courier, $ship_status, $total_weight);
        $stmt_ins_ship->execute();
        $shipment_db_id = $conn->insert_id;
        
        // Insert shipment items
        foreach ($group_items as $gi) {
            $stmt_ins_sitem = $conn->prepare("INSERT INTO shipment_items (shipment_id, order_item_id, quantity) VALUES (?, ?, ?)");
            $stmt_ins_sitem->bind_param("iii", $shipment_db_id, $gi['order_item_id'], $gi['quantity']);
            $stmt_ins_sitem->execute();
        }
        
        $shipments_created++;
        $group_idx++;
    }
    
    $orders_processed++;
}

// 3. RUN MIGRATION VALIDATION CHECKS
$validation = [
    "integrity_checks_passed" => true,
    "mismatched_totals_count" => 0,
    "orphaned_shipments_count" => 0,
    "unmapped_items_count" => 0,
    "errors" => []
];

// Check 1: Mismatched Totals (Order subtotal vs sum of order_items)
$res_check1 = $conn->query("
    SELECT o.id, o.order_id, o.subtotal, SUM(oi.price * oi.quantity) AS calculated_subtotal
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    HAVING ABS(o.subtotal - calculated_subtotal) > 0.05
");
if ($res_check1) {
    while ($row = $res_check1->fetch_assoc()) {
        $validation["integrity_checks_passed"] = false;
        $validation["mismatched_totals_count"]++;
        $validation["errors"][] = "Order #" . $row['order_id'] . " has subtotal mismatch: DB subtotal is " . $row['subtotal'] . ", calculated is " . $row['calculated_subtotal'];
    }
}

// Check 2: Orphaned Shipments (Shipments with no items)
$res_check2 = $conn->query("
    SELECT s.id, s.shipment_id
    FROM shipments s
    LEFT JOIN shipment_items si ON s.id = si.shipment_id
    WHERE si.shipment_id IS NULL
");
if ($res_check2) {
    while ($row = $res_check2->fetch_assoc()) {
        $validation["integrity_checks_passed"] = false;
        $validation["orphaned_shipments_count"]++;
        $validation["errors"][] = "Shipment #" . $row['shipment_id'] . " contains no items";
    }
}

// Check 3: Unmapped Order Items (Order items not linked to any shipment)
$res_check3 = $conn->query("
    SELECT oi.id, oi.order_id
    FROM order_items oi
    LEFT JOIN shipment_items si ON oi.id = si.order_item_id
    WHERE si.order_item_id IS NULL
");
if ($res_check3) {
    while ($row = $res_check3->fetch_assoc()) {
        $validation["integrity_checks_passed"] = false;
        $validation["unmapped_items_count"]++;
        $validation["errors"][] = "Order Item ID " . $row['id'] . " on Order ID " . $row['order_id'] . " is not allocated to any shipment package";
    }
}

echo json_encode([
    "success" => true,
    "message" => "Historical data backfill completed",
    "details" => [
        "orders_processed" => $orders_processed,
        "items_migrated" => $items_migrated,
        "shipments_created" => $shipments_created
    ],
    "validation_report" => $validation
]);

$conn->close();
?>
