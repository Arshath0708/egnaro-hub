<?php
// get-companies.php — Fetch distinct approved vendor company names
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

try {
    $query = "SELECT DISTINCT company_name
              FROM vendors
              WHERE status = 'approved'
              AND company_name IS NOT NULL
              AND company_name != ''
              ORDER BY company_name ASC";
              
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $companies = [];
    while ($row = $result->fetch_assoc()) {
        $companies[] = $row['company_name'];
    }
    
    echo json_encode($companies);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([]);
}
?>
