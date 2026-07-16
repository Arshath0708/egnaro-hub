<?php
// get-support-requests.php — Fetch requests for Vendor Dashboard or Admin Panel
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include "db.php";

$vendor_id = isset($_GET['vendor_id']) ? intval($_GET['vendor_id']) : 0;
$status = isset($_GET['status']) ? trim($_GET['status']) : '';
$request_type = isset($_GET['request_type']) ? trim($_GET['request_type']) : '';

$where = "WHERE 1=1";
$params = [];
$types = "";

// Vendor scope security: if vendor_id is specified, strictly filter by it (no cross-vendor access)
if ($vendor_id > 0) {
    $where .= " AND vsr.vendor_id = ?";
    $params[] = $vendor_id;
    $types .= "i";
}

if ($status !== '') {
    $where .= " AND vsr.status = ?";
    $params[] = $status;
    $types .= "s";
}

if ($request_type !== '') {
    $where .= " AND vsr.request_type = ?";
    $params[] = $request_type;
    $types .= "s";
}

$sql = "SELECT vsr.id, vsr.vendor_id, vsr.vendor_name, vsr.request_type, vsr.order_id, vsr.current_delivery_date, vsr.requested_delivery_date, vsr.subject, vsr.message, vsr.admin_note, vsr.status, vsr.metadata, vsr.created_at, vsr.updated_at, v.company_name as vendor_company_name 
        FROM vendor_support_requests vsr
        LEFT JOIN vendors v ON vsr.vendor_id = v.id
        $where 
        ORDER BY vsr.id DESC";

$stmt = $conn->prepare($sql);
if ($types !== '') {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$requests = [];
while ($row = $result->fetch_assoc()) {
    $row['id'] = intval($row['id']);
    $row['vendor_id'] = intval($row['vendor_id']);
    $row['metadata'] = $row['metadata'] ? json_decode($row['metadata'], true) : null;
    $requests[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "requests" => $requests
]);
?>
