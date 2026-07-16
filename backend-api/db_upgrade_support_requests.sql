-- Egnaro Mart - Vendor Support Center Database Migration
-- This script is completely non-destructive: it only creates a new table if it does not exist.
-- It does not alter or delete any existing tables or columns.

CREATE TABLE IF NOT EXISTS `vendor_support_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vendor_id` INT NOT NULL,
    `vendor_name` VARCHAR(255) NOT NULL,
    `request_type` VARCHAR(50) NOT NULL, -- e.g., 'Delivery Date Change', 'Order Issue', 'Inventory Issue', 'Courier Issue', 'General Message'
    `order_id` VARCHAR(100) DEFAULT NULL,
    `current_delivery_date` VARCHAR(100) DEFAULT NULL,
    `requested_delivery_date` VARCHAR(100) DEFAULT NULL,
    `subject` VARCHAR(255) DEFAULT NULL,
    `message` TEXT DEFAULT NULL,
    `admin_note` TEXT DEFAULT NULL,
    `status` VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    `metadata` TEXT DEFAULT NULL,           -- Stores arbitrary JSON/structured data for future request types
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_vendor_status` (`vendor_id`, `status`),
    INDEX `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
