<?php
// prepare_shipment.php — Books shipment in Shiprocket using custom package metrics (Option B)
ini_set('serialize_precision', -1);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db.php";
include "courier-provider.php";

// ── HELPER: Robust Address Parser ──
function parseAddress($full_address) {
    $pincode = "600001"; // Fallback
    if (preg_match('/\b\d{6}\b/', $full_address, $matches)) {
        $pincode = $matches[0];
    }
    
    // Strip pincode and trailing hyphens/spaces to find city and state
    $clean_addr = preg_replace('/-\s*\d{6}\s*$/', '', $full_address);
    // Remove raw pincode from anywhere in the string to clean it up
    $clean_addr = trim(str_replace($pincode, '', $clean_addr));
    
    // Explode by comma
    $parts = array_filter(array_map('trim', explode(',', $clean_addr)));
    
    $state = "Tamil Nadu"; // Fallback
    $city = "Chennai";     // Fallback
    
    if (count($parts) >= 2) {
        $state = array_pop($parts);
        $city = array_pop($parts);
    } else {
        // Fallback for single-part or comma-less address
        $address_lower = strtolower($clean_addr);
        $found_state = null;
        
        $state_list = [
            "tamil nadu", "tamilnadu", "karnataka", "kerala", "andhra pradesh", "andhrapradesh",
            "telangana", "maharashtra", "delhi", "new delhi", "gujarat", "rajasthan",
            "madhya pradesh", "madhyapradesh", "uttar pradesh", "uttarpradesh", "bihar",
            "west bengal", "westbengal", "punjab", "haryana"
        ];
        
        foreach ($state_list as $st) {
            $pos = strrpos($address_lower, $st);
            if ($pos !== false) {
                $found_state = substr($clean_addr, $pos, strlen($st));
                $clean_addr = trim(substr($clean_addr, 0, $pos));
                break;
            }
        }
        
        if ($found_state !== null) {
            $state = $found_state;
            // Split remaining by space to extract city
            $space_parts = array_filter(explode(' ', $clean_addr));
            if (count($space_parts) >= 1) {
                $city = array_pop($space_parts);
                $clean_addr = implode(' ', $space_parts);
            }
        } else {
            // Ultimate fallback
            if (count($parts) == 1) {
                $city = $parts[0];
                $state = $parts[0];
            }
        }
        
        // Re-calculate parts array from remaining clean_addr
        $parts = array_filter(array_map('trim', explode(',', $clean_addr)));
    }

    // Normalize state name to match Shiprocket strict requirements
    $state_map = [
        "tamilnadu" => "Tamil Nadu",
        "tamil nadu" => "Tamil Nadu",
        "delhi" => "Delhi",
        "new delhi" => "Delhi",
        "maharashtra" => "Maharashtra",
        "karnataka" => "Karnataka",
        "kerala" => "Kerala",
        "andhra pradesh" => "Andhra Pradesh",
        "andhrapradesh" => "Andhra Pradesh",
        "telangana" => "Telangana",
        "uttar pradesh" => "Uttar Pradesh",
        "uttarpradesh" => "Uttar Pradesh",
        "west bengal" => "West Bengal",
        "westbengal" => "West Bengal",
        "gujarat" => "Gujarat",
        "rajasthan" => "Rajasthan",
        "madhya pradesh" => "Madhya Pradesh",
        "madhyapradesh" => "Madhya Pradesh",
        "bihar" => "Bihar",
        "punjab" => "Punjab",
        "haryana" => "Haryana"
    ];
    $state_lower = strtolower(trim($state));
    if (isset($state_map[$state_lower])) {
        $state = $state_map[$state_lower];
    }
    
    // The remaining parts form the street address
    $address_line1 = implode(', ', $parts);
    
    // If the street address is empty or too short (under 6 chars), build a fallback
    if (strlen($address_line1) < 6) {
        $address_line1 = $clean_addr;
    }
    
    // Final check for minimum length (Shiprocket requires min 6 characters)
    if (strlen($address_line1) < 6) {
        $address_line1 = str_pad($address_line1, 6, " ");
    }
    
    $address_line2 = ""; // Optional billing_address_2
    
    return [
        "address" => $address_line1,
        "address_2" => $address_line2,
        "city" => $city,
        "state" => $state,
        "pincode" => $pincode,
        "country" => "India"
    ];
}

// ── HELPER: Payload Validator ──
function validatePayload($payload) {
    $errors = [];
    
    // Check required strings
    $required_keys = [
        "order_id" => "Order ID",
        "order_date" => "Order Date",
        "pickup_location" => "Pickup Location",
        "billing_customer_name" => "Billing Customer Name",
        "billing_address" => "Billing Address",
        "billing_city" => "Billing City",
        "billing_state" => "Billing State",
        "billing_pincode" => "Billing Pincode",
        "billing_phone" => "Billing Phone",
        "shipping_customer_name" => "Shipping Customer Name",
        "shipping_address" => "Shipping Address",
        "shipping_city" => "Shipping City",
        "shipping_state" => "Shipping State",
        "shipping_pincode" => "Shipping Pincode",
        "shipping_phone" => "Shipping Phone"
    ];

    foreach ($required_keys as $key => $label) {
        if (empty($payload[$key])) {
            $errors[] = "$label is required and cannot be empty";
        }
    }

    // Check address length (Shiprocket requires min 6 chars)
    if (isset($payload['billing_address']) && strlen($payload['billing_address']) < 6) {
        $errors[] = "Billing Address must be at least 6 characters long";
    }
    if (isset($payload['shipping_address']) && strlen($payload['shipping_address']) < 6) {
        $errors[] = "Shipping Address must be at least 6 characters long";
    }

    // Validate phone number (must be 10 digits for India)
    if (isset($payload['billing_phone'])) {
        $clean_phone = preg_replace('/\D/', '', $payload['billing_phone']);
        // Strip country code if present
        if (str_starts_with($clean_phone, '91') && strlen($clean_phone) > 10) {
            $clean_phone = substr($clean_phone, 2);
        }
        if (strlen($clean_phone) !== 10) {
            $errors[] = "Billing Phone must be a valid 10-digit number";
        }
    }
    if (isset($payload['shipping_phone'])) {
        $clean_phone = preg_replace('/\D/', '', $payload['shipping_phone']);
        // Strip country code if present
        if (str_starts_with($clean_phone, '91') && strlen($clean_phone) > 10) {
            $clean_phone = substr($clean_phone, 2);
        }
        if (strlen($clean_phone) !== 10) {
            $errors[] = "Shipping Phone must be a valid 10-digit number";
        }
    }

    // Validate weight and dimensions
    if (empty($payload['weight']) || floatval($payload['weight']) <= 0) {
        $errors[] = "Weight must be greater than 0 kg";
    }
    if (empty($payload['length']) || intval($payload['length']) <= 0) {
        $errors[] = "Length must be greater than 0 cm";
    }
    if (empty($payload['breadth']) || intval($payload['breadth']) <= 0) {
        $errors[] = "Breadth must be greater than 0 cm";
    }
    if (empty($payload['height']) || intval($payload['height']) <= 0) {
        $errors[] = "Height must be greater than 0 cm";
    }

    // Validate items
    if (empty($payload['order_items']) || !is_array($payload['order_items'])) {
        $errors[] = "Order Items list is empty or invalid";
    } else {
        foreach ($payload['order_items'] as $index => $item) {
            if (empty($item['name'])) {
                $errors[] = "Item at index $index is missing a name";
            }
            if (empty($item['sku'])) {
                $errors[] = "Item at index $index is missing a SKU";
            }
            if (empty($item['units']) || intval($item['units']) <= 0) {
                $errors[] = "Item at index $index must have a quantity of 1 or more";
            }
        }
    }

    return $errors;
}

// ── HELPER: File Logger ──
function logShiprocketTransaction($order_id, $shipment_id, $vendor_id, $action, $request, $response, $http_code, $error = null) {
    $log_dir = dirname(__FILE__) . '/logs';
    if (!file_exists($log_dir)) {
        @mkdir($log_dir, 0755, true);
    }
    $log_file = $log_dir . '/shiprocket_api.log';
    
    $log_entry = [
        "timestamp" => date('Y-m-d H:i:s'),
        "order_id" => $order_id,
        "shipment_id" => $shipment_id,
        "vendor_id" => $vendor_id,
        "action" => $action,
        "http_code" => $http_code,
        "request" => $request,
        "response" => $response,
        "error" => $error
    ];
    
    @file_put_contents($log_file, json_encode($log_entry) . "\n", FILE_APPEND);
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
    exit;
}

$shipment_id = trim($data['shipment_id'] ?? '');
$action = $data['action'] ?? 'prepare';
$role = $data['role'] ?? 'vendor';
$vendor_id_auth = isset($data['vendor_id']) ? intval($data['vendor_id']) : null;

if (empty($shipment_id)) {
    echo json_encode(["success" => false, "message" => "Missing shipment details"]);
    exit;
}

// Begin transactional update
$conn->begin_transaction();

try {
    // 1. Fetch shipment details from DB
    $stmt_ship = $conn->prepare("SELECT id, order_id, vendor_id, pickup_location_id, shiprocket_order_id, shiprocket_shipment_id, awb_code, courier_name, label_url, manifest_url, status FROM shipments WHERE shipment_id = ? LIMIT 1");
    $stmt_ship->bind_param("s", $shipment_id);
    $stmt_ship->execute();
    $shipment = $stmt_ship->get_result()->fetch_assoc();
    $stmt_ship->close();

    if (!$shipment) {
        throw new Exception("Shipment $shipment_id not found in records");
    }

    $shipment_db_id = intval($shipment['id']);
    $order_db_id = intval($shipment['order_id']);
    $shipment_vendor_id = $shipment['vendor_id'] !== null ? intval($shipment['vendor_id']) : null;
    $pickup_location_id = intval($shipment['pickup_location_id']);

    $sr_order_id = $shipment['shiprocket_order_id'] !== null && intval($shipment['shiprocket_order_id']) > 0 ? intval($shipment['shiprocket_order_id']) : null;
    $sr_shipment_id = $shipment['shiprocket_shipment_id'] !== null && intval($shipment['shiprocket_shipment_id']) > 0 ? intval($shipment['shiprocket_shipment_id']) : null;
    $awb_code = $shipment['awb_code'] ?? '';
    $courier_name = $shipment['courier_name'] ?? '';
    $label_url = $shipment['label_url'] ?? '';
    $manifest_url = $shipment['manifest_url'] ?? '';
    $current_status = $shipment['status'] ?? 'pending';

    // Tenant / Security Check: Isolated tenant control
    if ($role === 'vendor') {
        if ($vendor_id_auth === null || $shipment_vendor_id !== $vendor_id_auth) {
            throw new Exception("Unauthorized: You do not own this consignment package");
        }
    } else if ($role !== 'admin') {
        // Fallback backward-compatibility support if role is omitted
        if ($vendor_id_auth !== null && $shipment_vendor_id !== $vendor_id_auth) {
            throw new Exception("Unauthorized: You do not own this consignment package");
        }
    }

    $sr = new CourierProvider();

    if ($action === 'prepare') {
        $weight_g = intval($data['weight_g'] ?? 0);
        $length_cm = intval($data['length_cm'] ?? 10);
        $width_cm = intval($data['width_cm'] ?? 10);
        $height_cm = intval($data['height_cm'] ?? 10);

        if ($weight_g <= 0 || $length_cm <= 0 || $width_cm <= 0 || $height_cm <= 0) {
            throw new Exception("Package dimension and weight specifications must be greater than zero");
        }

        // Update local shipment records with custom metrics
        $stmt_up = $conn->prepare("UPDATE shipments SET weight_g = ?, length_cm = ?, width_cm = ?, height_cm = ?, status = 'processing' WHERE id = ?");
        $stmt_up->bind_param("iiiii", $weight_g, $length_cm, $width_cm, $height_cm, $shipment_db_id);
        if (!$stmt_up->execute()) {
            throw new Exception("Failed to update package metrics locally: " . $stmt_up->error);
        }
        $stmt_up->close();

        // Step 1: Book Order in Shiprocket
        if ($sr_order_id === null) {
            $stmt_order = $conn->prepare("SELECT customer_name, phone, email, address, payment_method, created_at FROM orders WHERE id = ? LIMIT 1");
            $stmt_order->bind_param("i", $order_db_id);
            $stmt_order->execute();
            $order = $stmt_order->get_result()->fetch_assoc();
            $stmt_order->close();

            if (!$order) {
                throw new Exception("Parent Order ID $order_db_id not found");
            }

            $parsed_addr = parseAddress($order['address']);

            // Fetch pickup location details
            $stmt_pick = $conn->prepare("SELECT * FROM vendor_pickup_locations WHERE id = ? LIMIT 1");
            $stmt_pick->bind_param("i", $pickup_location_id);
            $stmt_pick->execute();
            $pickup = $stmt_pick->get_result()->fetch_assoc();
            $stmt_pick->close();

            if (!$pickup) {
                throw new Exception("Warehouse pickup location ID $pickup_location_id not configured");
            }
            $pickup_location_name = $pickup['pickup_location_name'];

            // Dynamically register/verify the warehouse location in Shiprocket's remote settings
            try {
                $clean_pick_phone = preg_replace('/\D/', '', $pickup['phone']);
                if (str_starts_with($clean_pick_phone, '91') && strlen($clean_pick_phone) > 10) {
                    $clean_pick_phone = substr($clean_pick_phone, 2);
                }
                
                $sr->registerPickupLocation([
                    "pickup_location" => $pickup['pickup_location_name'],
                    "name" => $pickup['contact_name'],
                    "email" => "egnaroapi@gmail.com",
                    "phone" => $clean_pick_phone,
                    "address" => $pickup['address_line1'],
                    "address_2" => $pickup['address_line2'] ?? '',
                    "city" => $pickup['city'],
                    "state" => $pickup['state'],
                    "country" => "India",
                    "pin_code" => intval($pickup['pincode'])
                ]);
            } catch (Exception $ex_reg) {
                // If it fails (e.g. duplicate nickname), log warning but continue
                error_log("Warehouse location registration sync warning: " . $ex_reg->getMessage());
            }

            // Fetch order items
            $sql_items = "SELECT oi.product_id, oi.price, oi.quantity, p.name 
                          FROM shipment_items si
                          JOIN order_items oi ON si.order_item_id = oi.id
                          JOIN products p ON oi.product_id = p.id
                          WHERE si.shipment_id = ?";
            $stmt_items = $conn->prepare($sql_items);
            $stmt_items->bind_param("i", $shipment_db_id);
            $stmt_items->execute();
            $items_res = $stmt_items->get_result();
            
            $ship_items = [];
            $ship_subtotal = 0;
            while ($it = $items_res->fetch_assoc()) {
                $ship_items[] = [
                    "name" => $it['name'],
                    "sku" => "PROD-" . $it['product_id'],
                    "units" => intval($it['quantity']),
                    "selling_price" => floatval($it['price'])
                ];
                $ship_subtotal += (floatval($it['price']) * intval($it['quantity']));
            }
            $stmt_items->close();

            if (empty($ship_items)) {
                throw new Exception("No items found packed in shipment $shipment_id");
            }

            $split_name = explode(" ", $order['customer_name'], 2);
            $first_name = $split_name[0];
            $last_name = $split_name[1] ?? 'MartCustomer';
            
            $order_date = date('Y-m-d H:i', strtotime($order['created_at']));
            $payment_method = strcasecmp($order['payment_method'], 'cod') === 0 ? 'COD' : 'Prepaid';
            $weight_kg = (string)round(floatval($weight_g) / 1000.0, 3);

            $clean_phone = preg_replace('/\D/', '', $order['phone']);
            if (str_starts_with($clean_phone, '91') && strlen($clean_phone) > 10) {
                $clean_phone = substr($clean_phone, 2);
            }

            $order_payload = [
                "order_id" => $shipment_id,
                "order_date" => $order_date,
                "pickup_location" => $pickup_location_name,
                "billing_customer_name" => $first_name,
                "billing_last_name" => $last_name,
                "billing_address" => $parsed_addr['address'],
                "billing_city" => $parsed_addr['city'],
                "billing_pincode" => $parsed_addr['pincode'],
                "billing_state" => $parsed_addr['state'],
                "billing_country" => $parsed_addr['country'],
                "billing_email" => $order['email'],
                "billing_phone" => $clean_phone,
                "shipping_is_billing" => true,
                "shipping_customer_name" => $first_name,
                "shipping_last_name" => $last_name,
                "shipping_address" => $parsed_addr['address'],
                "shipping_city" => $parsed_addr['city'],
                "shipping_pincode" => $parsed_addr['pincode'],
                "shipping_state" => $parsed_addr['state'],
                "shipping_country" => $parsed_addr['country'],
                "shipping_email" => $order['email'],
                "shipping_phone" => $clean_phone,
                "order_items" => $ship_items,
                "payment_method" => $payment_method,
                "sub_total" => $ship_subtotal,
                "length" => $length_cm,
                "breadth" => $width_cm,
                "height" => $height_cm,
                "weight" => $weight_kg
            ];

            $validation_errors = validatePayload($order_payload);
            if (!empty($validation_errors)) {
                throw new Exception("Payload validation failed: " . implode("; ", $validation_errors));
            }

            try {
                $sr_order = $sr->createOrder($order_payload);
            } catch (Exception $e_create) {
                if (strpos(strtolower($e_create->getMessage()), 'taken') !== false || strpos(strtolower($e_create->getMessage()), 'already') !== false) {
                    $order_payload['order_id'] = $shipment_id . "-R" . rand(1, 99);
                    $sr_order = $sr->createOrder($order_payload);
                } else {
                    throw $e_create;
                }
            }
            $sr_order_id = intval($sr_order['order_id']);
            $sr_shipment_id = intval($sr_order['shipment_id']);

            $stmt_save_ids = $conn->prepare("UPDATE shipments SET shiprocket_order_id = ?, shiprocket_shipment_id = ?, status = 'processing' WHERE id = ?");
            $stmt_save_ids->bind_param("iii", $sr_order_id, $sr_shipment_id, $shipment_db_id);
            if (!$stmt_save_ids->execute()) {
                throw new Exception("Failed to save initial Shiprocket references: " . $stmt_save_ids->error);
            }
            $stmt_save_ids->close();

            $conn->commit();
            $conn->begin_transaction();
        }

        // Step 2: Assign AWB tracking code if not already assigned
        if (empty($awb_code)) {
            // Find cheapest serviceable courier to explicitly assign and prevent auto-allocation failure
            $courier_company_id = null;
            $cheapest = null;
            try {
                // Fetch shipping details to query serviceability
                $stmt_order = $conn->prepare("SELECT address FROM orders WHERE id = ? LIMIT 1");
                $stmt_order->bind_param("i", $order_db_id);
                $stmt_order->execute();
                $order_data = $stmt_order->get_result()->fetch_assoc();
                $stmt_order->close();
                
                if ($order_data) {
                    $parsed_addr = parseAddress($order_data['address']);
                    $delivery_pincode = $parsed_addr['pincode'];
                    
                    // Fetch pickup pincode
                    $stmt_pick = $conn->prepare("SELECT pincode FROM vendor_pickup_locations WHERE id = ? LIMIT 1");
                    $stmt_pick->bind_param("i", $pickup_location_id);
                    $stmt_pick->execute();
                    $pickup_data = $stmt_pick->get_result()->fetch_assoc();
                    $stmt_pick->close();
                    
                    $pickup_pincode = $pickup_data['pincode'] ?? '600001';
                    
                    $srv = $sr->checkServiceability($pickup_pincode, $delivery_pincode, $weight_g);
                    if (isset($srv['data']['available_courier_companies']) && is_array($srv['data']['available_courier_companies'])) {
                        $couriers = $srv['data']['available_courier_companies'];
                        if (!empty($couriers)) {
                            // Sort by cost ascending
                            usort($couriers, function($a, $b) {
                                $cost_a = floatval($a['rate'] ?? ($a['freight_charge'] ?? 999999));
                                $cost_b = floatval($b['rate'] ?? ($b['freight_charge'] ?? 999999));
                                return $cost_a <=> $cost_b;
                            });
                            $cheapest = $couriers[0];
                            $courier_company_id = intval($cheapest['courier_company_id'] ?? ($cheapest['id'] ?? null));
                        }
                    }
                }
            } catch (Exception $ex_srv) {
                error_log("Serviceability pre-check warning: " . $ex_srv->getMessage());
            }

            $sr_awb = $sr->assignAWB($sr_shipment_id, $courier_company_id);
            $awb_code = $sr_awb['response']['data']['awb_code'] ?? '';
            $courier_name = $sr_awb['response']['data']['courier_name'] 
                ?? ($cheapest['courier_name'] 
                ?? ("Courier ID #" . ($sr_awb['response']['data']['courier_company_id'] ?? $courier_company_id)));

            if (empty($awb_code)) {
                $msg = $sr_awb['response']['data']['awb_assign_error'] 
                    ?? ($sr_awb['response']['data']['message'] 
                    ?? ($sr_awb['message'] 
                    ?? 'Unknown courier allocation failure'));
                throw new Exception("Logistics AWB Assignment succeeded but returned empty AWB code. Courier response: " . $msg);
            }

            $stmt_save_awb = $conn->prepare("UPDATE shipments SET awb_code = ?, courier_name = ?, status = 'ready_to_ship' WHERE id = ?");
            $stmt_save_awb->bind_param("ssi", $awb_code, $courier_name, $shipment_db_id);
            if (!$stmt_save_awb->execute()) {
                throw new Exception("Failed to update AWB tracking code locally: " . $stmt_save_awb->error);
            }
            $stmt_save_awb->close();

            $act_desc = "AWB assigned: " . $awb_code . " via " . $courier_name;
            $stmt_chk = $conn->prepare("INSERT INTO shipment_tracking_checkpoints (shipment_id, activity, status, checkpoint_time) VALUES (?, ?, 'ready_to_ship', CURRENT_TIMESTAMP)");
            $stmt_chk->bind_param("is", $shipment_db_id, $act_desc);
            $stmt_chk->execute();
            $stmt_chk->close();

            $conn->commit();
            $conn->begin_transaction();
        }

        // Step 3: Retrieve Shipping label URL if not already done
        if (empty($label_url)) {
            try {
                $sr_label = $sr->generateLabel($sr_shipment_id);
                $label_url = $sr_label['label_url'] ?? '';
            } catch (Exception $e_label) {
                error_log("Label generation failed: " . $e_label->getMessage());
            }
        }

        // Step 4: Retrieve Manifest sheet PDF URL if not already done
        if (empty($manifest_url)) {
            try {
                $sr_manifest = $sr->generateManifest($sr_shipment_id);
                $manifest_url = $sr_manifest['manifest_url'] ?? '';
            } catch (Exception $e_man) {
                error_log("Manifest generation failed: " . $e_man->getMessage());
            }
        }

        $stmt_save_docs = $conn->prepare("UPDATE shipments SET label_url = ?, manifest_url = ?, status = 'ready_to_ship' WHERE id = ?");
        $stmt_save_docs->bind_param("ssi", $label_url, $manifest_url, $shipment_db_id);
        if (!$stmt_save_docs->execute()) {
            throw new Exception("Failed to finalize Shipment documents: " . $stmt_save_docs->error);
        }
        $stmt_save_docs->close();

        $conn->commit();

        echo json_encode([
            "success" => true,
            "message" => "Shipment registered and booked successfully via Shiprocket",
            "details" => [
                "shipment_id" => $shipment_id,
                "shiprocket_order_id" => $sr_order_id,
                "shiprocket_shipment_id" => $sr_shipment_id,
                "awb_code" => $awb_code,
                "courier_name" => $courier_name,
                "label_url" => $label_url,
                "manifest_url" => $manifest_url
            ]
        ]);

    } elseif ($action === 'request_pickup') {
        if ($sr_shipment_id === null) {
            throw new Exception("Shipment must be booked and have a valid Shiprocket Shipment ID before requesting pickup");
        }

        $res_pickup = $sr->requestPickup($sr_shipment_id);
        $pickup_date = $res_pickup['pickup_date'] ?? date('Y-m-d H:i:s');

        $new_st = 'ready_to_ship';
        $stmt_pickup = $conn->prepare("UPDATE shipments SET status = ? WHERE id = ?");
        $stmt_pickup->bind_param("si", $new_st, $shipment_db_id);
        $stmt_pickup->execute();
        $stmt_pickup->close();

        $act_desc = "Courier pickup scheduled for " . $pickup_date;
        $stmt_chk = $conn->prepare("INSERT INTO shipment_tracking_checkpoints (shipment_id, activity, status, checkpoint_time) VALUES (?, ?, 'ready_to_ship', CURRENT_TIMESTAMP)");
        $stmt_chk->bind_param("is", $shipment_db_id, $act_desc);
        $stmt_chk->execute();
        $stmt_chk->close();

        $conn->commit();
        echo json_encode([
            "success" => true,
            "message" => "Courier pickup requested successfully",
            "pickup_details" => $res_pickup
        ]);

    } elseif ($action === 'cancel') {
        if ($sr_order_id === null) {
            throw new Exception("Shipment is not yet registered in Shiprocket. No order to cancel.");
        }

        $res_cancel = $sr->cancelOrder($sr_order_id);

        $new_st = 'cancelled';
        $stmt_cancel = $conn->prepare("UPDATE shipments SET status = ? WHERE id = ?");
        $stmt_cancel->bind_param("si", $new_st, $shipment_db_id);
        $stmt_cancel->execute();
        $stmt_cancel->close();

        $act_desc = "Shipment cancelled by admin/vendor";
        $stmt_chk = $conn->prepare("INSERT INTO shipment_tracking_checkpoints (shipment_id, activity, status, checkpoint_time) VALUES (?, ?, 'cancelled', CURRENT_TIMESTAMP)");
        $stmt_chk->bind_param("is", $shipment_db_id, $act_desc);
        $stmt_chk->execute();
        $stmt_chk->close();

        $conn->commit();
        echo json_encode([
            "success" => true,
            "message" => "Shipment cancelled successfully",
            "cancel_details" => $res_cancel
        ]);

    } elseif ($action === 'refresh_tracking') {
        if (empty($awb_code)) {
            throw new Exception("No AWB code has been assigned to this shipment yet");
        }

        $res_track = $sr->trackAWB($awb_code);
        $track_info = $res_track['tracking_data'] ?? null;
        
        if (!$track_info) {
            throw new Exception("No tracking data returned by Shiprocket");
        }

        $shipment_track = $track_info['shipment_track'] ?? [];
        $activities = $track_info['shipment_track_activities'] ?? [];

        $latest_status = $current_status;
        if (!empty($shipment_track)) {
            $track_line = is_array($shipment_track) ? reset($shipment_track) : $shipment_track;
            $status_code = $track_line['current_status_code'] ?? ($track_line['status'] ?? '');
            
            $status_lower = strtolower($status_code);
            if (str_contains($status_lower, 'pickup') || str_contains($status_lower, 'packed') || str_contains($status_lower, 'ready')) {
                $latest_status = 'ready_to_ship';
            } elseif (str_contains($status_lower, 'ship') || str_contains($status_lower, 'transit') || str_contains($status_lower, 'in-transit')) {
                $latest_status = 'shipped';
            } elseif (str_contains($status_lower, 'out for delivery') || str_contains($status_lower, 'out_for_delivery') || str_contains($status_lower, 'delivering')) {
                $latest_status = 'out_for_delivery';
            } elseif (str_contains($status_lower, 'delivered') || str_contains($status_lower, 'complete')) {
                $latest_status = 'delivered';
            } elseif (str_contains($status_lower, 'rto') || str_contains($status_lower, 'return') || str_contains($status_lower, 'undelivered')) {
                $latest_status = 'rto';
            }
        }

        if (is_array($activities)) {
            foreach ($activities as $act) {
                $act_time = date('Y-m-d H:i:s', strtotime($act['date']));
                $activity_desc = trim($act['activity'] ?? '');
                $location = trim($act['location'] ?? '');
                
                $stmt_chk_exist = $conn->prepare("SELECT 1 FROM shipment_tracking_checkpoints WHERE shipment_id = ? AND activity = ? AND checkpoint_time = ? LIMIT 1");
                $stmt_chk_exist->bind_param("iss", $shipment_db_id, $activity_desc, $act_time);
                $stmt_chk_exist->execute();
                $exists = $stmt_chk_exist->get_result()->fetch_assoc();
                $stmt_chk_exist->close();

                if (!$exists) {
                    $stmt_ins = $conn->prepare("INSERT INTO shipment_tracking_checkpoints (shipment_id, activity, location, status, checkpoint_time) VALUES (?, ?, ?, ?, ?)");
                    $stmt_ins->bind_param("issss", $shipment_db_id, $activity_desc, $location, $latest_status, $act_time);
                    $stmt_ins->execute();
                    $stmt_ins->close();
                }
            }
        }

        if ($latest_status !== $current_status) {
            $stmt_status = $conn->prepare("UPDATE shipments SET status = ? WHERE id = ?");
            $stmt_status->bind_param("si", $latest_status, $shipment_db_id);
            $stmt_status->execute();
            $stmt_status->close();
        }

        $conn->commit();
        echo json_encode([
            "success" => true,
            "message" => "Tracking checkpoints synced successfully",
            "status" => $latest_status
        ]);
    } else {
        throw new Exception("Unknown shipment action: " . $action);
    }

} catch (Exception $e) {
    $conn->rollback();
    
    $last_req = (isset($sr) && $sr instanceof CourierProvider) ? ($sr->debug_info['last_request'] ?? []) : [];
    logShiprocketTransaction(
        $order_db_id ?? null,
        $shipment_id ?? null,
        $shipment_vendor_id ?? null,
        "action_" . $action,
        $data,
        $last_req['raw_response'] ?? null,
        $last_req['http_code'] ?? 500,
        $e->getMessage()
    );

    echo json_encode([
        "success" => false,
        "message" => "Logistics Action failed: " . $e->getMessage()
    ]);
}

$conn->close();
?>
