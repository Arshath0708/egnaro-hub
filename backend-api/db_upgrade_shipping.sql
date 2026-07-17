-- Egnaro Mart Enterprise Shipping Schema Upgrade Script
-- This script provisions the new tables and table updates to support split shipments and Shiprocket integration.

ALTER TABLE `orders` ADD COLUMN `subtotal` DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE `orders` ADD COLUMN `discount` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `orders` ADD COLUMN `shipping_charges` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `orders` ADD COLUMN `payment_status` VARCHAR(24) DEFAULT 'pending';

-- 2. Create order_items table to store relational items (replaces JSON items string in orders)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `vendor_id` INT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  INDEX `idx_order_items_order_id` (`order_id`),
  INDEX `idx_order_items_vendor_id` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create vendor_pickup_locations table
CREATE TABLE IF NOT EXISTS `vendor_pickup_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` INT DEFAULT NULL, -- NULL represents Admin warehouse
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create shipments table
CREATE TABLE IF NOT EXISTS `shipments` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create shipment_items table
CREATE TABLE IF NOT EXISTS `shipment_items` (
  `shipment_id` INT NOT NULL,
  `order_item_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`shipment_id`, `order_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create shipment_tracking_checkpoints table
CREATE TABLE IF NOT EXISTS `shipment_tracking_checkpoints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipment_id` INT NOT NULL,
  `activity` VARCHAR(255) NOT NULL,
  `location` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL,
  `checkpoint_time` TIMESTAMP NOT NULL,
  INDEX `idx_stc_shipment_id` (`shipment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
