<?php
// run_shipping_migration.php — Idempotent, production-grade schema migration runner
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Disable raw PHP/mysqli fatal error exception throwing to guarantee JSON responses
mysqli_report(MYSQLI_REPORT_OFF);

include "db.php";

$executed = 0;
$skipped = 0;
$failed = 0;
$details = [];

// Helper function to log details
function log_step(&$details, &$executed, &$skipped, &$failed, $description, $status, $query = "", $message = "") {
    if ($status === "executed") $executed++;
    elseif ($status === "skipped") $skipped++;
    elseif ($status === "failed") $failed++;
    
    $details[] = [
        "description" => $description,
        "query" => substr($query, 0, 150) . (strlen($query) > 150 ? "..." : ""),
        "status" => $status,
        "message" => $message
    ];
}

// Helper to check if table exists
function table_exists($conn, $table_name) {
    $stmt = $conn->prepare("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1");
    $stmt->bind_param("s", $table_name);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return !empty($res);
}

// Helper to check if column exists
function column_exists($conn, $table_name, $column_name) {
    $stmt = $conn->prepare("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1");
    $stmt->bind_param("ss", $table_name, $column_name);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return !empty($res);
}

// Helper to execute query safely in isolated try-catch
function run_query($conn, $query) {
    try {
        $res = $conn->query($query);
        if (!$res) {
            return ["success" => false, "error" => $conn->error, "errno" => $conn->errno];
        }
        return ["success" => true];
    } catch (Exception $e) {
        return ["success" => false, "error" => $e->getMessage(), "errno" => $e->getCode()];
    }
}

// --- MIGRATION STEPS DEFINITION ---

// STEP 1: Add subtotal to orders
if (column_exists($conn, 'orders', 'subtotal')) {
    log_step($details, $executed, $skipped, $failed, "Add subtotal to orders table", "skipped", "", "Column already exists");
} else {
    $q = "ALTER TABLE `orders` ADD COLUMN `subtotal` DECIMAL(10,2) DEFAULT NULL";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Add subtotal to orders table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Add subtotal to orders table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 2: Add discount to orders
if (column_exists($conn, 'orders', 'discount')) {
    log_step($details, $executed, $skipped, $failed, "Add discount to orders table", "skipped", "", "Column already exists");
} else {
    $q = "ALTER TABLE `orders` ADD COLUMN `discount` DECIMAL(10,2) DEFAULT 0.00";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Add discount to orders table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Add discount to orders table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 3: Add shipping_charges to orders
if (column_exists($conn, 'orders', 'shipping_charges')) {
    log_step($details, $executed, $skipped, $failed, "Add shipping_charges to orders table", "skipped", "", "Column already exists");
} else {
    $q = "ALTER TABLE `orders` ADD COLUMN `shipping_charges` DECIMAL(10,2) DEFAULT 0.00";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Add shipping_charges to orders table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Add shipping_charges to orders table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 4: Add payment_status to orders
if (column_exists($conn, 'orders', 'payment_status')) {
    log_step($details, $executed, $skipped, $failed, "Add payment_status to orders table", "skipped", "", "Column already exists");
} else {
    $q = "ALTER TABLE `orders` ADD COLUMN `payment_status` VARCHAR(24) DEFAULT 'pending'";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Add payment_status to orders table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Add payment_status to orders table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 5: Create order_items table
if (table_exists($conn, 'order_items')) {
    log_step($details, $executed, $skipped, $failed, "Create order_items table", "skipped", "", "Table already exists");
} else {
    $q = "CREATE TABLE `order_items` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `order_id` INT NOT NULL,
      `product_id` INT NOT NULL,
      `vendor_id` INT DEFAULT NULL,
      `price` DECIMAL(10,2) NOT NULL,
      `quantity` INT NOT NULL DEFAULT 1,
      INDEX `idx_order_items_order_id` (`order_id`),
      INDEX `idx_order_items_vendor_id` (`vendor_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Create order_items table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Create order_items table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 5b: Ensure vendor_id exists in order_items if table was already created
if (table_exists($conn, 'order_items')) {
    if (column_exists($conn, 'order_items', 'vendor_id')) {
        log_step($details, $executed, $skipped, $failed, "Ensure vendor_id in order_items", "skipped", "", "Column already exists");
    } else {
        $q = "ALTER TABLE `order_items` ADD COLUMN `vendor_id` INT DEFAULT NULL";
        $res = run_query($conn, $q);
        if ($res['success']) {
            log_step($details, $executed, $skipped, $failed, "Ensure vendor_id in order_items", "executed", $q, "Successfully executed");
        } else {
            log_step($details, $executed, $skipped, $failed, "Ensure vendor_id in order_items", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
        }
    }
}

// STEP 6: Create vendor_pickup_locations table
if (table_exists($conn, 'vendor_pickup_locations')) {
    log_step($details, $executed, $skipped, $failed, "Create vendor_pickup_locations table", "skipped", "", "Table already exists");
} else {
    $q = "CREATE TABLE `vendor_pickup_locations` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `vendor_id` INT DEFAULT NULL,
      `pickup_location_name` VARCHAR(50) NOT NULL,
      `contact_name` VARCHAR(100) NOT NULL,
      `phone` VARCHAR(15) NOT NULL,
      `address_line1` VARCHAR(255) NOT NULL,
      `address_line2` VARCHAR(255) DEFAULT NULL,
      `city` VARCHAR(100) NOT NULL,
      `state` VARCHAR(100) NOT NULL,
      `pincode` VARCHAR(6) NOT NULL,
      `status` TINYINT(1) DEFAULT 1,
      UNIQUE KEY `unique_pickup_location_name` (`pickup_location_name`),
      INDEX `idx_vpl_vendor_id` (`vendor_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Create vendor_pickup_locations table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Create vendor_pickup_locations table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 7: Create shipments table
if (table_exists($conn, 'shipments')) {
    log_step($details, $executed, $skipped, $failed, "Create shipments table", "skipped", "", "Table already exists");
    
    // Safety Audit: check shipments columns in case of partial setup
    $cols = ['weight_g' => "INT NOT NULL DEFAULT 0", 'length_cm' => "INT NOT NULL DEFAULT 10", 'width_cm' => "INT NOT NULL DEFAULT 10", 'height_cm' => "INT NOT NULL DEFAULT 10", 'label_url' => "VARCHAR(512) DEFAULT NULL", 'manifest_url' => "VARCHAR(512) DEFAULT NULL"];
    foreach ($cols as $col_name => $col_def) {
        if (column_exists($conn, 'shipments', $col_name)) {
            log_step($details, $executed, $skipped, $failed, "Ensure shipments.$col_name column", "skipped", "", "Column already exists");
        } else {
            $q = "ALTER TABLE `shipments` ADD COLUMN `$col_name` $col_def";
            $res = run_query($conn, $q);
            if ($res['success']) {
                log_step($details, $executed, $skipped, $failed, "Ensure shipments.$col_name column", "executed", $q, "Successfully executed");
            } else {
                log_step($details, $executed, $skipped, $failed, "Ensure shipments.$col_name column", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
            }
        }
    }
} else {
    $q = "CREATE TABLE `shipments` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `shipment_id` VARCHAR(64) NOT NULL,
      `order_id` INT NOT NULL,
      `vendor_id` INT DEFAULT NULL,
      `pickup_location_id` INT NOT NULL,
      `shiprocket_order_id` BIGINT DEFAULT NULL,
      `shiprocket_shipment_id` BIGINT DEFAULT NULL,
      `awb_code` VARCHAR(64) DEFAULT NULL,
      `courier_name` VARCHAR(100) DEFAULT NULL,
      `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
      `weight_g` INT NOT NULL DEFAULT 0,
      `length_cm` INT NOT NULL DEFAULT 10,
      `width_cm` INT NOT NULL DEFAULT 10,
      `height_cm` INT NOT NULL DEFAULT 10,
      `label_url` VARCHAR(512) DEFAULT NULL,
      `manifest_url` VARCHAR(512) DEFAULT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY `unique_shipment_id` (`shipment_id`),
      INDEX `idx_shipments_order_id` (`order_id`),
      INDEX `idx_shipments_vendor_id` (`vendor_id`),
      INDEX `idx_shipments_awb_code` (`awb_code`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Create shipments table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Create shipments table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 8: Create shipment_items table
if (table_exists($conn, 'shipment_items')) {
    log_step($details, $executed, $skipped, $failed, "Create shipment_items table", "skipped", "", "Table already exists");
} else {
    $q = "CREATE TABLE `shipment_items` (
      `shipment_id` INT NOT NULL,
      `order_item_id` INT NOT NULL,
      `quantity` INT NOT NULL DEFAULT 1,
      PRIMARY KEY (`shipment_id`, `order_item_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Create shipment_items table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Create shipment_items table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 9: Create shipment_tracking_checkpoints table
if (table_exists($conn, 'shipment_tracking_checkpoints')) {
    log_step($details, $executed, $skipped, $failed, "Create shipment_tracking_checkpoints table", "skipped", "", "Table already exists");
} else {
    $q = "CREATE TABLE `shipment_tracking_checkpoints` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `shipment_id` INT NOT NULL,
      `activity` VARCHAR(255) NOT NULL,
      `location` VARCHAR(100) DEFAULT NULL,
      `status` VARCHAR(32) NOT NULL,
      `checkpoint_time` TIMESTAMP NOT NULL,
      INDEX `idx_stc_shipment_id` (`shipment_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Create shipment_tracking_checkpoints table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Create shipment_tracking_checkpoints table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

// STEP 10: Add payment_reference column to orders
if (column_exists($conn, 'orders', 'payment_reference')) {
    log_step($details, $executed, $skipped, $failed, "Add payment_reference to orders table", "skipped", "", "Column already exists");
} else {
    $q = "ALTER TABLE `orders` ADD COLUMN `payment_reference` VARCHAR(64) DEFAULT NULL";
    $res = run_query($conn, $q);
    if ($res['success']) {
        log_step($details, $executed, $skipped, $failed, "Add payment_reference to orders table", "executed", $q, "Successfully executed");
    } else {
        log_step($details, $executed, $skipped, $failed, "Add payment_reference to orders table", "failed", $q, "Error " . $res['errno'] . ": " . $res['error']);
    }
}

$conn->close();

$success = ($failed === 0);

echo json_encode([
    "success" => $success,
    "summary" => [
        "executed" => $executed,
        "skipped" => $skipped,
        "failed" => $failed
    ],
    "details" => $details
], JSON_PRETTY_PRINT);
?>
