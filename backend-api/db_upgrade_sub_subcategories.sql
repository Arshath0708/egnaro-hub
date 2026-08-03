-- Egnaro Mart Sub-subcategories Schema Upgrade
-- Run this on your MySQL database to support level-3 subcategories.

CREATE TABLE IF NOT EXISTS `sub_subcategories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `subcategory_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_subsubcat_per_subcat` (`subcategory_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add sub_subcategory_id column to products if not exists
SET @dbname = DATABASE();
SET @tablename = 'products';
SET @columnname = 'sub_subcategory_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = @tablename
     AND table_schema = @dbname
     AND column_name = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE `products` ADD COLUMN `sub_subcategory_id` INT DEFAULT NULL AFTER `subcategory_id`'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if not exists for products(sub_subcategory_id)
SET @constraintname = 'fk_product_sub_subcategory';
SET @preparedStatement2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
   WHERE table_name = @tablename
     AND table_schema = @dbname
     AND constraint_name = @constraintname) > 0,
  'SELECT 1',
  'ALTER TABLE `products` ADD CONSTRAINT `fk_product_sub_subcategory` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories`(`id`) ON DELETE SET NULL'
));
PREPARE stmt2 FROM @preparedStatement2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
