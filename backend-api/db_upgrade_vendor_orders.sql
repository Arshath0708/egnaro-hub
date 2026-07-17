-- Egnaro Mart Vendor Order Management Database Migration
-- Run this on your MySQL database to support tracking details on orders.

ALTER TABLE `orders` 
ADD COLUMN `tracking_number` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `courier_partner` VARCHAR(100) DEFAULT NULL;
