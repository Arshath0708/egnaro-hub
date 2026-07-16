<?php
header("Content-Type: application/json");
$log_file = dirname(__FILE__) . '/logs/shiprocket_api.log';
if (file_exists($log_file)) {
    // Read the last 20 lines of the log
    $lines = file($log_file);
    $last_lines = array_slice($lines, -20);
    $logs = array_map(function($line) {
        return json_decode(trim($line), true) ?: $line;
    }, $last_lines);
    echo json_encode(["success" => true, "logs" => $logs], JSON_PRETTY_PRINT);
} else {
    echo json_encode(["success" => false, "message" => "Log file not found"]);
}
?>
