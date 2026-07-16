<?php
// get-users.php — Fetch all marketplace users with comprehensive dynamic insights
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

try {
    // 1. Fetch all orders to build a high-performance in-memory stats mapper
    $order_map = [];
    $order_res = $conn->query("SELECT user_id, total FROM orders WHERE user_id IS NOT NULL AND user_id > 0");
    if ($order_res) {
        while ($o = $order_res->fetch_assoc()) {
            $uid = intval($o['user_id']);
            if (!isset($order_map[$uid])) {
                $order_map[$uid] = ['count' => 0, 'spent' => 0.0];
            }
            $order_map[$uid]['count']++;
            $order_map[$uid]['spent'] += floatval($o['total'] ?? 0.0);
        }
    }

    // 2. Fetch all users from database (only safe columns)
    $query = "SELECT id, fullName, email, phone, created_at, addresses FROM users";
    $result = $conn->query($query);
    
    $raw_users = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $uid = intval($row['id']);
            $fullName = $row['fullName'] ?? '';
            $email = $row['email'] ?? '';
            $phone = $row['phone'] ?? '';
            $created_at = $row['created_at'] ?? '';
            
            // Dynamic Address Counting
            $addr_arr = json_decode($row['addresses'] ?? '[]', true);
            $address_count = is_array($addr_arr) ? count($addr_arr) : 0;
            
            // Fetch calculations from map
            $total_orders = isset($order_map[$uid]) ? $order_map[$uid]['count'] : 0;
            $total_spent = isset($order_map[$uid]) ? $order_map[$uid]['spent'] : 0.0;
            
            // Dynamic Status Classification
            $status = "New Customer";
            if ($total_spent >= 2500 || $total_orders >= 8) {
                $status = "Premium Customer";
            } elseif ($total_orders >= 3) {
                $status = "Frequent Buyer";
            } elseif ($total_orders == 0) {
                $joined_time = strtotime($created_at);
                $thirty_days_ago = time() - (30 * 86400);
                if ($joined_time < $thirty_days_ago) {
                    $status = "Inactive User";
                } else {
                    $status = "New Customer";
                }
            } else {
                $status = "New Customer";
            }
            
            $raw_users[] = [
                "id" => $uid,
                "fullName" => $fullName,
                "email" => $email,
                "phone" => $phone,
                "joined_date" => $created_at,
                "address_count" => $address_count,
                "addresses" => is_array($addr_arr) ? $addr_arr : [],
                "total_orders" => $total_orders,
                "total_spent" => round($total_spent, 2),
                "status" => $status
            ];
        }
    }
    
    // 3. Apply Search Filter
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    if ($search !== '') {
        $search_lc = strtolower($search);
        $raw_users = array_filter($raw_users, function($u) use ($search_lc) {
            return (strpos(strtolower($u['fullName']), $search_lc) !== false) ||
                   (strpos(strtolower($u['email']), $search_lc) !== false) ||
                   (strpos(strtolower($u['phone']), $search_lc) !== false) ||
                   (strpos(strtolower((string)$u['id']), $search_lc) !== false);
        });
    }

    // 4. Apply Status Classification Filter
    $status_filter = isset($_GET['status']) ? trim($_GET['status']) : '';
    if ($status_filter !== '') {
        $raw_users = array_filter($raw_users, function($u) use ($status_filter) {
            return strtolower($u['status']) === strtolower($status_filter);
        });
    }

    // 5. Apply Sorting
    $sortBy = isset($_GET['sortBy']) ? trim($_GET['sortBy']) : 'id';
    $sortOrder = isset($_GET['sortOrder']) && strtoupper($_GET['sortOrder']) === 'ASC' ? 'ASC' : 'DESC';
    
    usort($raw_users, function($a, $b) use ($sortBy, $sortOrder) {
        $valA = $a[$sortBy] ?? '';
        $valB = $b[$sortBy] ?? '';
        
        if (is_numeric($valA) && is_numeric($valB)) {
            $diff = $valA - $valB;
            return $sortOrder === 'ASC' ? ($diff > 0 ? 1 : ($diff < 0 ? -1 : 0)) : ($diff < 0 ? 1 : ($diff > 0 ? -1 : 0));
        } else {
            $cmp = strcasecmp((string)$valA, (string)$valB);
            return $sortOrder === 'ASC' ? $cmp : -$cmp;
        }
    });

    // 6. Apply Pagination
    $total_rows = count($raw_users);
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    if ($page < 1) $page = 1;
    if ($limit < 1) $limit = 10;
    
    $offset = ($page - 1) * $limit;
    $paginated_users = array_slice(array_values($raw_users), $offset, $limit);
    
    // 7. Structured Response
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "users" => $paginated_users,
        "total_rows" => $total_rows,
        "page" => $page,
        "limit" => $limit
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
