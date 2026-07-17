<?php
// create-order.php — Safe transactional order placement with multi-vendor splitting
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
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

// 1. Resolve Delivery Details
if (isset($data['customer'])) {
    $customerName = trim($data['customer']['fullName'] ?? '');
    $phone        = trim($data['customer']['phone']    ?? '');
    $email        = trim($data['customer']['email']    ?? '');
    $address      = trim($data['customer']['address']  ?? '');
} else {
    $customerName = trim($data['customer_name'] ?? '');
    $phone        = trim($data['phone']         ?? '');
    $email        = trim($data['email']         ?? '');
    $address      = trim($data['address']       ?? '');
}

$payment   = trim($data['payment_method'] ?? ($data['payment'] ?? 'COD'));
$user_id   = intval($data['user_id']          ?? 0);
$items     = $data['items']                   ?? ($data['order_items'] ?? []);
$total     = floatval($data['total']          ?? 0);

if (!$customerName || !$phone || !$email || !$address || empty($items) || $total <= 0) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

// Begin MySQL Transaction
$conn->begin_transaction();

try {
    // 2. Fetch and sanitize all products, matching vendor IDs and calculating subtotal
    $sanitized_items = [];
    $vendor_groups = [];
    $subtotal = 0;
    
    foreach ($items as $item) {
        $pid = intval($item['product_id'] ?? ($item['id'] ?? 0));
        $qty = intval($item['quantity'] ?? 1);
        if ($pid === 0 || $qty <= 0) continue;
        
        $stmt_prod = $conn->prepare("SELECT id, name, price, image, vendor_id, stock_quantity FROM products WHERE id = ? LIMIT 1");
        $stmt_prod->bind_param("i", $pid);
        $stmt_prod->execute();
        $prod = $stmt_prod->get_result()->fetch_assoc();
        
        if (!$prod) {
            throw new Exception("Product ID $pid not found in database catalog");
        }

        $stock_qty = isset($prod['stock_quantity']) ? intval($prod['stock_quantity']) : 0;
        if ($qty > $stock_qty) {
            throw new Exception("Product '" . $prod['name'] . "' is out of stock or has insufficient quantity (Available: $stock_qty, Requested: $qty)");
        }
        
        $price = floatval($prod['price']);
        $weight = 100; // Default weight since products schema is not modified (Option B)
        $raw_vendor_id = $prod['vendor_id'];
        
        $vendor_id = NULL;
        if (!empty($raw_vendor_id) && $raw_vendor_id !== "0") {
            $vendor_id = intval($raw_vendor_id);
        }
        
        $subtotal += ($price * $qty);
        
        $sanitized_item = [
            'product_id' => $prod['id'],
            'name' => $prod['name'],
            'price' => $price,
            'image' => $prod['image'] ?? '',
            'quantity' => $qty,
            'vendor_id' => $vendor_id,
            'weight_g' => $weight
        ];
        
        $sanitized_items[] = $sanitized_item;
        
        // Group items for splitting shipments
        $vkey = ($vendor_id === NULL) ? 'admin' : $vendor_id;
        if (!isset($vendor_groups[$vkey])) {
            $vendor_groups[$vkey] = [];
        }
        $vendor_groups[$vkey][] = $sanitized_item;
    }
    
    // Calculate discounts and shipping charges
    $discount = 0.00;
    $shipping_charges = 0.00;
    if ($total > $subtotal) {
        $shipping_charges = $total - $subtotal;
    } elseif ($subtotal > $total) {
        $discount = $subtotal - $total;
    }
    
    // Generate unique Order ID
    $orderId = "EGN" . strtoupper(substr(uniqid(), -5)) . rand(10, 99);
    $estimated_delivery = date('d M Y', strtotime('+7 days'));
    
    // Legacy dual-write: items stored as JSON text blob
    $legacy_items_json = json_encode($sanitized_items);
    
    // Root vendor_id for legacy index (picks the first item vendor)
    $first_item_vendor = $sanitized_items[0]['vendor_id'] ?? 0;
    
    $initial_status = 'Processing';
    $payment_status = 'pending';
    $payment_ref = (isset($data['payment_reference']) && trim($data['payment_reference']) !== '') ? trim($data['payment_reference']) : NULL;

    if (strtolower($payment) === 'upi' || strtolower($payment) === 'razorpay') {
        $initial_status = 'Pending Payment';
    } elseif (strtolower($payment) === 'cod') {
        $initial_status = 'Processing';
    } else {
        $initial_status = 'Processing';
    }

    // Insert Parent Order Row
    $sql_order = "INSERT INTO orders 
    (order_id, vendor_id, user_id, customer_name, phone, email, address, items, total, payment_method, status, estimated_days, subtotal, discount, shipping_charges, payment_status, payment_reference) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt_order = $conn->prepare($sql_order);
    if (!$stmt_order) {
        throw new Exception("Order preparation query error: " . $conn->error);
    }
    
    $stmt_order->bind_param(
        "siisssssdsssdddds", 
        $orderId, 
        $first_item_vendor, 
        $user_id, 
        $customerName, 
        $phone, 
        $email, 
        $address, 
        $legacy_items_json, 
        $total, 
        $payment, 
        $initial_status,
        $estimated_delivery,
        $subtotal,
        $discount,
        $shipping_charges,
        $payment_status,
        $payment_ref
    );
    
    if (!$stmt_order->execute()) {
        throw new Exception("Order insertion database write failed: " . $stmt_order->error);
    }
    
    $order_db_id = $conn->insert_id;
    $stmt_order->close();
    
    // 3. Insert Relational Order Items
    $order_item_ids_map = []; // Maps product_id -> order_item_db_id
    
    $sql_item = "INSERT INTO order_items (order_id, product_id, vendor_id, price, quantity) VALUES (?, ?, ?, ?, ?)";
    $stmt_item = $conn->prepare($sql_item);
    
    foreach ($sanitized_items as $si) {
        $stmt_item->bind_param("iiidi", $order_db_id, $si['product_id'], $si['vendor_id'], $si['price'], $si['quantity']);
        if (!$stmt_item->execute()) {
            throw new Exception("Item insertion failed: " . $stmt_item->error);
        }
        $order_item_ids_map[$si['product_id']] = $conn->insert_id;
    }
    $stmt_item->close();

    // Update product stock
    $stmt_up_stock = $conn->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");
    if (!$stmt_up_stock) {
        throw new Exception("Stock update query preparation failed: " . $conn->error);
    }
    foreach ($sanitized_items as $si) {
        $stmt_up_stock->bind_param("ii", $si['quantity'], $si['product_id']);
        if (!$stmt_up_stock->execute()) {
            throw new Exception("Failed to update stock quantity for Product ID " . $si['product_id']);
        }
    }
    $stmt_up_stock->close();
    
    // 4. Create Shipments (Splits order items by Vendor)
    $shipments_summary = [];
    $group_index = 1;
    
    foreach ($vendor_groups as $vkey => $group_items) {
        $vendor_id = ($vkey === 'admin') ? NULL : intval($vkey);
        $shipment_id = $orderId . "-S" . $group_index;
        
        // Resolve Pickup Location ID
        $pickup_loc_id = 0;
        if ($vendor_id === NULL) {
            // Find Admin Warehouse pickup address
            $res_wh = $conn->query("SELECT id FROM vendor_pickup_locations WHERE pickup_location_name = 'ADMIN_WH_MAIN' LIMIT 1");
            $loc = $res_wh->fetch_assoc();
            if ($loc) {
                $pickup_loc_id = intval($loc['id']);
                // Ensure it is active
                $conn->query("UPDATE vendor_pickup_locations SET status = 1 WHERE id = $pickup_loc_id");
            } else {
                // Provision a default main warehouse location for admin fallback
                $conn->query("INSERT INTO vendor_pickup_locations (vendor_id, pickup_location_name, contact_name, phone, address_line1, city, state, pincode, status) VALUES (NULL, 'ADMIN_WH_MAIN', 'Egnaro Admin', '9876543210', 'Egnaromart Warehouse, Area 5', 'Chennai', 'Tamil Nadu', '600001', 1)");
                $pickup_loc_id = $conn->insert_id;
            }
        } else {
            // Find Vendor physical pickup location
            $stmt_loc = $conn->prepare("SELECT id FROM vendor_pickup_locations WHERE vendor_id = ? AND status = 1 LIMIT 1");
            $stmt_loc->bind_param("i", $vendor_id);
            $stmt_loc->execute();
            $loc = $stmt_loc->get_result()->fetch_assoc();
            $stmt_loc->close();
            
            if ($loc) {
                $pickup_loc_id = intval($loc['id']);
            } else {
                // Provision default location fallback for this vendor using their dashboard metadata
                $stmt_vend = $conn->prepare("SELECT vendor_name, phone, address FROM vendors WHERE id = ? LIMIT 1");
                $stmt_vend->bind_param("i", $vendor_id);
                $stmt_vend->execute();
                $vdata = $stmt_vend->get_result()->fetch_assoc();
                $stmt_vend->close();
                
                $vname = $vdata['vendor_name'] ?? 'Vendor ' . $vendor_id;
                $vphone = $vdata['phone'] ?? '9876543210';
                $vaddr = $vdata['address'] ?? 'Default Address';
                $vpincode = "600001";
                if (preg_match('/\b\d{6}\b/', $vaddr, $matches)) {
                    $vpincode = $matches[0];
                }
                
                // Parse city and state from vendor's address block instead of hardcoding
                $vstate = "Tamil Nadu"; // fallback
                $vcity = "Chennai";     // fallback
                
                $clean_vaddr = preg_replace('/-\s*\d{6}\s*$/', '', $vaddr);
                $vaddr_parts = array_map('trim', explode(',', $clean_vaddr));
                
                if (count($vaddr_parts) >= 2) {
                    $vstate = array_pop($vaddr_parts);
                    $vcity = array_pop($vaddr_parts);
                } elseif (count($vaddr_parts) == 1) {
                    $vcity = $vaddr_parts[0];
                    $vstate = $vaddr_parts[0];
                }
                
                $pname = "V" . $vendor_id . "_DEFAULT";
                
                // Check if the pickup location already exists by name
                $stmt_check_loc = $conn->prepare("SELECT id FROM vendor_pickup_locations WHERE pickup_location_name = ? LIMIT 1");
                $stmt_check_loc->bind_param("s", $pname);
                $stmt_check_loc->execute();
                $existing_loc = $stmt_check_loc->get_result()->fetch_assoc();
                $stmt_check_loc->close();
                
                if ($existing_loc) {
                    $pickup_loc_id = intval($existing_loc['id']);
                    // Enable location and update details
                    $stmt_en = $conn->prepare("UPDATE vendor_pickup_locations SET status = 1, city = ?, state = ?, address_line1 = ? WHERE id = ?");
                    $stmt_en->bind_param("sssi", $vcity, $vstate, $vaddr, $pickup_loc_id);
                    $stmt_en->execute();
                    $stmt_en->close();
                } else {
                    $stmt_c_loc = $conn->prepare("INSERT INTO vendor_pickup_locations (vendor_id, pickup_location_name, contact_name, phone, address_line1, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)");
                    $stmt_c_loc->bind_param("isssssss", $vendor_id, $pname, $vname, $vphone, $vaddr, $vcity, $vstate, $vpincode);
                    $stmt_c_loc->execute();
                    $pickup_loc_id = $conn->insert_id;
                    $stmt_c_loc->close();
                }
            }
        }
        
        // Calculate weight & pack shipment items
        $shipment_weight = 0;
        foreach ($group_items as $gi) {
            $shipment_weight += ($gi['weight_g'] * $gi['quantity']);
        }
        
        // Insert Shipment
        $ship_initial_status = (strtolower($payment) === 'upi') ? 'payment_pending' : 'pending';
        $stmt_ship = $conn->prepare("INSERT INTO shipments (shipment_id, order_id, vendor_id, pickup_location_id, status, weight_g) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt_ship->bind_param("siiisi", $shipment_id, $order_db_id, $vendor_id, $pickup_loc_id, $ship_initial_status, $shipment_weight);
        if (!$stmt_ship->execute()) {
            throw new Exception("Shipment insertion error: " . $stmt_ship->error);
        }
        $shipment_db_id = $conn->insert_id;
        $stmt_ship->close();
        
        // Insert Shipment Items mapping
        $stmt_sitem = $conn->prepare("INSERT INTO shipment_items (shipment_id, order_item_id, quantity) VALUES (?, ?, ?)");
        foreach ($group_items as $gi) {
            $item_db_id = $order_item_ids_map[$gi['product_id']];
            $stmt_sitem->bind_param("iii", $shipment_db_id, $item_db_id, $gi['quantity']);
            if (!$stmt_sitem->execute()) {
                throw new Exception("Shipment item mapping failed: " . $stmt_sitem->error);
            }
        }
        $stmt_sitem->close();
        
        $shipments_summary[] = [
            "shipment_id" => $shipment_id,
            "vendor_id" => $vendor_id,
            "weight_g" => $shipment_weight
        ];
        
        $group_index++;
    }
    
    $razorpay_order_id = null;
    $amount_in_paise = 0;
    if (strtolower($payment) === 'razorpay') {
        $amount_in_paise = round($total * 100);
        if ($amount_in_paise < 100) {
            throw new Exception("Minimum order amount for online payment is ₹1.00 (100 paise)");
        }

        // Call Razorpay API to create order
        $razorpay_url = 'https://api.razorpay.com/v1/orders';
        $post_fields = json_encode([
            'amount' => $amount_in_paise,
            'currency' => 'INR',
            'receipt' => $orderId
        ]);

        $ch = curl_init($razorpay_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_USERPWD, RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET);

        $response_body = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        if ($http_code === 401) {
            http_response_code(401);
            throw new Exception("Razorpay authentication failed: Invalid API credentials");
        } elseif ($http_code !== 200 && $http_code !== 201) {
            http_response_code(500);
            $err_msg = "Razorpay API error (HTTP $http_code)";
            if ($response_body) {
                $rz_err = json_decode($response_body, true);
                if (isset($rz_err['error']['description'])) {
                    $err_msg = $rz_err['error']['description'];
                }
            }
            throw new Exception($err_msg);
        }

        $rz_data = json_decode($response_body, true);
        if (isset($rz_data['id'])) {
            $razorpay_order_id = $rz_data['id'];
        } else {
            throw new Exception("Invalid response from Razorpay API");
        }
    }

    // Commit transaction on success
    $conn->commit();
    
    $response_data = [
        "success" => true,
        "message" => "Order placed successfully",
        "order_id" => $orderId
    ];

    if ($razorpay_order_id !== null) {
        $response_data["razorpay_order_id"] = $razorpay_order_id;
        $response_data["amount"] = $amount_in_paise;
        $response_data["currency"] = "INR";
        $response_data["key"] = RAZORPAY_KEY_ID;
    }

    $response_data["order"] = [
        "order_id" => $orderId,
        "customer_name" => $customerName,
        "phone" => $phone,
        "email" => $email,
        "address" => $address,
        "items" => $sanitized_items,
        "total" => $total,
        "payment_method" => $payment,
        "status" => $initial_status,
        "estimated_days" => $estimated_delivery,
        "shipments" => $shipments_summary
    ];

    echo json_encode($response_data);
    
} catch (Exception $e) {
    // Revert all database changes if any write fails
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Order failed: " . $e->getMessage()
    ]);
}

$conn->close();
?>
