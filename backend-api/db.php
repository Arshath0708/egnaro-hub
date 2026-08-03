<?php

$servername = "localhost";
$username = "pnxyadoh_egnaro_admin";
$password = "Kvikw,~BTpLN";
$dbname = "pnxyadoh_egnaro_backend";
define('SHIPROCKET_EMAIL','egnaroapi@gmail.com');
define('SHIPROCKET_PASSWORD','UR$J&&^D0DhDQAfmr#iwPMgW4xih3V^o');
define("SHIPROCKET_WEBHOOK_TOKEN","EGNARO_2026_9kF4Lx8PwQ2MnV7RsJc6TaY1HzUd53Be");

$conn = new mysqli($servername,$username,$password,$dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Load environment variables from .env file
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                putenv("{$key}={$val}");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
    }
}

if (!defined('RAZORPAY_KEY_ID')) {
    define('RAZORPAY_KEY_ID', getenv('RAZORPAY_KEY_ID') ?: 'rzp_live_TEDR3PWl8ajjIC');
}
if (!defined('RAZORPAY_KEY_SECRET')) {
    define('RAZORPAY_KEY_SECRET', getenv('RAZORPAY_KEY_SECRET') ?: 'vzpjzGXNRoC0r5P5vrlvWM5d');
}
?>