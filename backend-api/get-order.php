<?php
// get-order.php — Enrich order queries with dynamic, split shipments for customer tracking
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

// ── HELPER: parse items JSON and enrich with product image & seller info ──
function enrichItems($conn, $items_json) {
    $items = json_decode($items_json, true);
    if (!is_array($items)) return [];

    foreach ($items as &$item) {
        if (!empty($item['product_id'])) {
            $pid  = intval($item['product_id']);
            $stmt = $conn->prepare("SELECT p.image, p.vendor_id, v.vendor_name, v.company_name, v.gst, v.phone as seller_phone, v.email as seller_email, v.address as seller_address, v.city as seller_city, v.state as seller_state, v.town as seller_town FROM products p LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = ? LIMIT 1");
            $stmt->bind_param("i", $pid);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                if (empty($item['image'])) $item['image'] = $row['image'] ?? '';
                $item['vendor_id'] = $row['vendor_id'] ? intval($row['vendor_id']) : null;
                $item['seller_name'] = $row['vendor_name'] ?: "Egnaro Mart";
                $item['company_name'] = $row['company_name'] ?: "Egnaro Mart Marketplace";
                $item['gst'] = $row['gst'] ?: null;
                $item['seller_phone'] = $row['seller_phone'] ?: "+91 9442581506";
                $item['seller_email'] = $row['seller_email'] ?: "egnaromart@gmail.com";
                $seller_addr_parts = array_filter([$row['seller_address'], $row['seller_town'], $row['seller_city'], $row['seller_state']]);
                $item['seller_address'] = !empty($seller_addr_parts) ? implode(", ", $seller_addr_parts) : "2A, Venkatesh Nagar, Kovilpalayam, Coimbatore, Tamil Nadu - 641107";
            }
            $stmt->close();
        }
    }
    return $items;
}

// ── HELPER: format single order and attach shipments & seller ──
function formatOrder($conn, $order) {
    $order['id']      = intval($order['id'] ?? 0);
    $order['total']   = floatval($order['total'] ?? 0);
    $order['subtotal'] = floatval($order['subtotal'] ?? 0);
    $order['discount'] = floatval($order['discount'] ?? 0);
    $order['shipping_charges'] = floatval($order['shipping_charges'] ?? 0);
    $order['user_id'] = intval($order['user_id'] ?? 0);

    // Dynamic fallback for legacy orders or testing: if buyer_gst is empty, fetch from users table
    if (empty($order['buyer_gst']) && $order['user_id'] > 0) {
        $u_stmt = $conn->prepare("SELECT gst_number FROM users WHERE id = ? LIMIT 1");
        if ($u_stmt) {
            $u_stmt->bind_param("i", $order['user_id']);
            $u_stmt->execute();
            $u_row = $u_stmt->get_result()->fetch_assoc();
            $u_stmt->close();
            if ($u_row && !empty($u_row['gst_number'])) {
                $order['buyer_gst'] = strtoupper(trim($u_row['gst_number']));
            }
        }
    }
    $order['items']   = enrichItems($conn, $order['items'] ?? '[]');

    // Attach top-level seller details
    $first_item = !empty($order['items']) ? $order['items'][0] : null;
    $order_vendor_id = !empty($order['vendor_id']) ? intval($order['vendor_id']) : ($first_item ? ($first_item['vendor_id'] ?? null) : null);
    
    if ($order_vendor_id) {
        $v_stmt = $conn->prepare("SELECT vendor_name, company_name, gst, phone, email, address, town, city, state FROM vendors WHERE id = ? LIMIT 1");
        $v_stmt->bind_param("i", $order_vendor_id);
        $v_stmt->execute();
        $v_row = $v_stmt->get_result()->fetch_assoc();
        $v_stmt->close();
        if ($v_row) {
            $addr_parts = array_filter([$v_row['address'], $v_row['town'], $v_row['city'], $v_row['state']]);
            $order['seller'] = [
                'name' => $v_row['vendor_name'] ?: "Egnaro Mart",
                'company_name' => $v_row['company_name'] ?: "Egnaro Mart Marketplace",
                'gst' => $v_row['gst'] ?: null,
                'phone' => $v_row['phone'] ?: "+91 9442581506",
                'email' => $v_row['email'] ?: "egnaromart@gmail.com",
                'address' => !empty($addr_parts) ? implode(", ", $addr_parts) : "2A, Venkatesh Nagar, Kovilpalayam, Coimbatore, Tamil Nadu - 641107"
            ];
        }
    }
    
    if (empty($order['seller'])) {
        $order['seller'] = [
            'name' => $first_item['seller_name'] ?? "Egnaro Mart",
            'company_name' => $first_item['company_name'] ?? "Egnaro Mart Marketplace",
            'gst' => $first_item['gst'] ?? null,
            'phone' => $first_item['seller_phone'] ?? "+91 9442581506",
            'email' => $first_item['seller_email'] ?? "egnaromart@gmail.com",
            'address' => $first_item['seller_address'] ?? "2A, Venkatesh Nagar, Kovilpalayam, Coimbatore, Tamil Nadu - 641107"
        ];
    }
    
    // Fetch split shipments for this order if ID exists
    if ($order['id'] > 0) {
        $ship_stmt = $conn->prepare("SELECT id, shipment_id, status, awb_code, courier_name, created_at, label_url, manifest_url FROM shipments WHERE order_id = ?");
        $ship_stmt->bind_param("i", $order['id']);
        $ship_stmt->execute();
        $ship_res = $ship_stmt->get_result();
        
        $shipments = [];
        while ($ship_row = $ship_res->fetch_assoc()) {
            $ship_db_id = intval($ship_row['id']);
            
            // Fetch shipment items
            $item_stmt = $conn->prepare("SELECT oi.product_id, oi.price, oi.quantity, p.name, p.image 
                                         FROM shipment_items si
                                         JOIN order_items oi ON si.order_item_id = oi.id
                                         JOIN products p ON oi.product_id = p.id
                                         WHERE si.shipment_id = ?");
            $item_stmt->bind_param("i", $ship_db_id);
            $item_stmt->execute();
            $item_res = $item_stmt->get_result();
            
            $ship_items = [];
            while ($it = $item_res->fetch_assoc()) {
                $it['product_id'] = intval($it['product_id']);
                $it['price'] = floatval($it['price']);
                $it['quantity'] = intval($it['quantity']);
                $ship_items[] = $it;
            }
            $item_stmt->close();
            
            // Fetch checkpoints
            $track_stmt = $conn->prepare("SELECT activity, location, status, checkpoint_time FROM shipment_tracking_checkpoints WHERE shipment_id = ? ORDER BY checkpoint_time DESC");
            $track_stmt->bind_param("i", $ship_db_id);
            $track_stmt->execute();
            $track_res = $track_stmt->get_result();
            
            $checkpoints = [];
            while ($chk = $track_res->fetch_assoc()) {
                $checkpoints[] = $chk;
            }
            $track_stmt->close();
            
            $ship_row['items'] = $ship_items;
            $ship_row['history'] = $checkpoints;
            $shipments[] = $ship_row;
        }
        $ship_stmt->close();
        $order['shipments'] = $shipments;
    } else {
        $order['shipments'] = [];
    }
    
    return $order;
}

// ── PAGINATION PARAMS ──
$page   = max(1, intval($_GET['page']  ?? 1));
$limit  = max(1, min(100, intval($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

$orderId = $_GET['order_id'] ?? null;
$phone   = $_GET['phone']    ?? null;

// ── TOKEN EXTRACTION ──
$authHeader = '';
$headers = getallheaders();
foreach ($headers as $key => $val) {
    if (strcasecmp($key, 'Authorization') === 0) {
        $authHeader = trim($val);
        break;
    }
}
if (empty($authHeader)) {
    if (isset($_SERVER['HTTP_AUTHORIZATION']))          $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
    elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $authHeader = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
}
$token = '';
if (!empty($authHeader)) {
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        $token = trim(str_ireplace('bearer', '', $authHeader));
    }
}
if (empty($token) || strlen($token) < 5) {
    $token = trim($_GET['token'] ?? '');
}

// ── CASE 1: Get ALL orders for logged-in user (paginated) ──
if (!$orderId && !$phone) {
    if (empty($token)) {
        echo json_encode(["success" => false, "message" => "Token or order ID required"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, email, phone FROM users WHERE token = ? LIMIT 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        echo json_encode(["success" => false, "message" => "Invalid or expired token"]);
        exit;
    }

    $user_id  = intval($user['id']);
    $email    = trim($user['email'] ?? '');
    $uphone   = trim($user['phone'] ?? '');

    $phone_variant1 = $uphone;
    $phone_variant2 = str_replace("+91", "", $uphone);
    $phone_variant3 = "+91" . $phone_variant2;

    $where  = "WHERE (user_id = ?
                   OR (email != '' AND email = ?)
                   OR (phone != '' AND (phone = ? OR phone = ? OR phone = ?)))";
    $types  = "issss";
    $params = [$user_id, $email, $phone_variant1, $phone_variant2, $phone_variant3];

    // Total count
    $count_stmt = $conn->prepare("SELECT COUNT(*) AS total FROM orders $where");
    $count_stmt->bind_param($types, ...$params);
    $count_stmt->execute();
    $total_rows = $count_stmt->get_result()->fetch_assoc()['total'];
    $count_stmt->close();

    // Paginated fetch
    $params[] = $limit;
    $params[] = $offset;
    $types   .= "ii";

    $stmt = $conn->prepare("
        SELECT id, order_id, customer_name, phone, address, total,
               payment_method, status, items, estimated_days, created_at, user_id,
               tracking_number, courier_partner, buyer_gst
        FROM orders
        $where
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = formatOrder($conn, $row);
    }

    echo json_encode([
        "success"     => true,
        "page"        => $page,
        "limit"       => $limit,
        "total_rows"  => intval($total_rows),
        "total_pages" => (int)ceil($total_rows / $limit),
        "has_next"    => $page < ceil($total_rows / $limit),
        "has_prev"    => $page > 1,
        "orders"      => $orders,
        "count"       => count($orders)
    ]);
    exit;
}

// ── CASE 2: Get single order by order_id ──
if ($orderId) {
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Authorization token required"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, email, phone FROM users WHERE token = ? LIMIT 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid or expired token"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM orders WHERE order_id = ? LIMIT 1");
    $stmt->bind_param("s", $orderId);
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$order) {
        echo json_encode(["success" => false, "message" => "Order not found"]);
        exit;
    }

    // Check ownership
    $userId = intval($user['id']);
    $userEmail = trim($user['email']);
    $userPhone = trim($user['phone']);

    $orderUserId = intval($order['user_id']);
    $orderEmail = trim($order['email']);
    $orderPhone = trim($order['phone']);

    $cleanUserPhone = str_replace("+91", "", $userPhone);
    $cleanOrderPhone = str_replace("+91", "", $orderPhone);

    if ($orderUserId !== $userId && 
        strcasecmp($orderEmail, $userEmail) !== 0 && 
        strcasecmp($cleanOrderPhone, $cleanUserPhone) !== 0) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: You do not own this order."]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "order"   => formatOrder($conn, $order)
    ]);
    exit;
}

// ── CASE 3: Get orders by phone number (paginated) ──
if ($phone) {
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Authorization token required"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, email, phone FROM users WHERE token = ? LIMIT 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid or expired token"]);
        exit;
    }

    $cleanUserPhone = str_replace("+91", "", trim($user['phone']));
    $cleanQueryPhone = str_replace("+91", "", trim($phone));

    if (strcasecmp($cleanUserPhone, $cleanQueryPhone) !== 0) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden: You can only query orders matching your phone number."]);
        exit;
    }

    $where  = "WHERE phone = ?";
    $params = [$phone];
    $types  = "s";

    // Total count
    $count_stmt = $conn->prepare("SELECT COUNT(*) AS total FROM orders $where");
    $count_stmt->bind_param($types, ...$params);
    $count_stmt->execute();
    $total_rows = $count_stmt->get_result()->fetch_assoc()['total'];
    $count_stmt->close();

    // Paginated fetch
    $params[] = $limit;
    $params[] = $offset;
    $types   .= "ii";

    $stmt = $conn->prepare("
        SELECT id, order_id, customer_name, phone, address, total,
               payment_method, status, items, estimated_days, created_at,
               tracking_number, courier_partner, buyer_gst
        FROM orders
        $where
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = formatOrder($conn, $row);
    }

    if (count($orders) === 0 && $page === 1) {
        echo json_encode(["success" => false, "message" => "No orders found for this phone number"]);
        exit;
    }

    echo json_encode([
        "success"     => true,
        "page"        => $page,
        "limit"       => $limit,
        "total_rows"  => intval($total_rows),
        "total_pages" => (int)ceil($total_rows / $limit),
        "has_next"    => $page < ceil($total_rows / $limit),
        "has_prev"    => $page > 1,
        "orders"      => $orders,
        "count"       => count($orders)
    ]);
    exit;
}

$conn->close();
?>
