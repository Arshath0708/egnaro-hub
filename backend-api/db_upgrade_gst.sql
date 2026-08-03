-- ==============================================================================
-- Egnaro Mart - Production-Grade GST Architecture Migration Script
-- ==============================================================================
-- Description: Upgrades the schema for products, vendors, orders, and order_items
-- to support a fully compliant GST architecture (Inclusive pricing, state-based tax routing, financial snapshots).
-- ==============================================================================

-- Helper Procedure for Safe Column Addition (Prevents errors if column already exists)
DELIMITER //
CREATE PROCEDURE AddColumnIfNotExists(
    IN dbName VARCHAR(255),
    IN tableName VARCHAR(255),
    IN colName VARCHAR(255),
    IN colDef TEXT
)
BEGIN
    DECLARE _count INT;
    SET _count = (
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = dbName
          AND TABLE_NAME = tableName
          AND COLUMN_NAME = colName
    );
    IF _count = 0 THEN
        SET @ddl = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', colName, ' ', colDef);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ==============================================================================
-- 1. PRODUCTS TABLE
-- Add GST percentage (DECIMAL to support 5.00, 18.00 etc.) and HSN Code
-- ==============================================================================
CALL AddColumnIfNotExists(DATABASE(), 'products', 'gst_percentage', 'DECIMAL(5,2) NOT NULL DEFAULT 0.00');
CALL AddColumnIfNotExists(DATABASE(), 'products', 'hsn_code', 'VARCHAR(20) NULL');

-- ==============================================================================
-- 2. VENDORS TABLE
-- Add normalized address fields for GST origin matching and future logistics (Shiprocket)
-- (Note: city and state might already exist, the procedure ensures they are added safely)
-- ==============================================================================
CALL AddColumnIfNotExists(DATABASE(), 'vendors', 'city', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'vendors', 'state', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'vendors', 'pincode', 'VARCHAR(10) NULL');

-- ==============================================================================
-- 3. ORDERS TABLE
-- Add billing snapshots and aggregated financial tax values
-- ==============================================================================
CALL AddColumnIfNotExists(DATABASE(), 'orders', 'billing_address', 'TEXT NULL');
CALL AddColumnIfNotExists(DATABASE(), 'orders', 'billing_city', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'orders', 'billing_state', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'orders', 'billing_pincode', 'VARCHAR(10) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'orders', 'total_taxable_amount', 'DECIMAL(10,2) DEFAULT 0.00');
CALL AddColumnIfNotExists(DATABASE(), 'orders', 'total_tax', 'DECIMAL(10,2) DEFAULT 0.00');

-- ==============================================================================
-- 4. ORDER_ITEMS TABLE
-- Snapshot every financial value so historical invoices never change
-- ==============================================================================
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'product_name', 'VARCHAR(255) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'unit_price', 'DECIMAL(10,2) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'gst_percentage', 'DECIMAL(5,2) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'hsn_code', 'VARCHAR(20) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'taxable_value', 'DECIMAL(10,2) DEFAULT 0.00');
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'cgst_amount', 'DECIMAL(10,2) DEFAULT 0.00');
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'sgst_amount', 'DECIMAL(10,2) DEFAULT 0.00');
CALL AddColumnIfNotExists(DATABASE(), 'order_items', 'igst_amount', 'DECIMAL(10,2) DEFAULT 0.00');

-- ==============================================================================
-- CLEANUP
-- Drop the helper procedure
-- ==============================================================================
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
