<?php
// test-shiprocket.php — Verify live Shiprocket API connectivity with detailed OAuth auditing
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include "db.php";
include "courier-provider.php";

try {
    $client = new CourierProvider();
    
    // Test serviceability check with dummy data to verify auth & connectivity
    // Pickup: 110001, Delivery: 110001, Weight: 500g (0.5kg)
    $response = $client->checkServiceability('110001', '110001', 500);
    $token_cached = false;
    $cache_file = dirname(__FILE__) . '/.courier_token_cache';
    if (file_exists($cache_file)) {
        $token_cached = true;
    }
    
    echo json_encode([
        "success" => true,
        "authenticated" => true,
        "token_cached" => $token_cached,
        "debug_trace" => $client->debug_info,
        "shiprocket_response" => $response
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Attempt to extract raw response body and code if it failed during OAuth authenticate()
    $msg = $e->getMessage();
    $extracted_code = 500;
    
    if (preg_match('/HTTP (\d+)/', $msg, $code_match)) {
        $extracted_code = intval($code_match[1]);
    }
    
    http_response_code($extracted_code);
    echo json_encode([
        "success" => false,
        "error" => $msg,
        "http_code" => $extracted_code,
        "debug_trace" => isset($client) ? $client->debug_info : null
    ], JSON_PRETTY_PRINT);
}
?>
