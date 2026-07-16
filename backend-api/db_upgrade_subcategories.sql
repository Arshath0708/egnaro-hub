-- Egnaro Mart Subcategories Schema Upgrade
-- Run this on your MySQL database to support subcategories and link them to products.

CREATE TABLE IF NOT EXISTS `subcategories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_subcat_per_cat` (`category_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add subcategory_id column to products if not exists
SET @dbname = DATABASE();
SET @tablename = 'products';
SET @columnname = 'subcategory_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = @tablename
     AND table_schema = @dbname
     AND column_name = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE `products` ADD COLUMN `subcategory_id` INT DEFAULT NULL AFTER `category`'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if not exists
SET @constraintname = 'fk_product_subcategory';
SET @preparedStatement2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
   WHERE table_name = @tablename
     AND table_schema = @dbname
     AND constraint_name = @constraintname) > 0,
  'SELECT 1',
  'ALTER TABLE `products` ADD CONSTRAINT `fk_product_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL'
));
PREPARE stmt2 FROM @preparedStatement2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
